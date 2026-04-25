import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface VariantInput {
  name?: string;
  price?: number | string;
  available?: boolean;
  sortOrder?: number | string;
}

interface NormalizedVariantInput {
  name: string;
  price: number;
  available: boolean;
  sortOrder: number;
}

type MenuItemUpdateBody = {
  name?: string;
  description?: string | null;
  price?: string | number;
  imageUrl?: string | null;
  available?: boolean;
  categoryId?: string;
  variants?: unknown;
};

function parseOptionalNumber(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function normalizeVariants(rawVariants: unknown) {
  if (rawVariants === undefined) {
    return { variants: undefined as NormalizedVariantInput[] | undefined };
  }

  if (!Array.isArray(rawVariants)) {
    return { error: 'variants must be an array' };
  }

  const variants: NormalizedVariantInput[] = [];

  for (const [index, rawVariant] of rawVariants.entries()) {
    if (typeof rawVariant !== 'object' || rawVariant === null) {
      return { error: `Invalid variant payload at index ${index}` };
    }

    const variantInput = rawVariant as VariantInput;
    const name = (variantInput.name ?? '').trim();
    const price = parseOptionalNumber(variantInput.price);
    const sortOrderValue = parseOptionalNumber(variantInput.sortOrder);

    if (!name) {
      return { error: `Variant name is required at index ${index}` };
    }

    if (price === null || price < 0) {
      return { error: `Variant price must be a valid non-negative number at index ${index}` };
    }

    variants.push({
      name,
      price,
      available: variantInput.available ?? true,
      sortOrder: sortOrderValue === null ? index : Math.floor(sortOrderValue)
    });
  }

  return { variants };
}

function mapMenuItem(item: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
  restaurantId: string;
  category: {
    id: string;
    name: string;
  };
  variants: Array<{
    id: string;
    name: string;
    price: number;
    available: boolean;
    sortOrder: number;
  }>;
}) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    available: item.available,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    restaurantId: item.restaurantId,
    variants: item.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      available: variant.available,
      sortOrder: variant.sortOrder
    }))
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as MenuItemUpdateBody;

    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      select: {
        id: true,
        restaurantId: true
      }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    const data: Prisma.MenuItemUpdateInput = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: 'Menu item name cannot be empty' }, { status: 400 });
      }
      data.name = name;
    }

    if (body.description !== undefined) {
      data.description = (body.description ?? '').trim() || null;
    }

    if (body.imageUrl !== undefined) {
      data.imageUrl = (body.imageUrl ?? '').trim() || null;
    }

    if (body.price !== undefined) {
      const price = parseOptionalNumber(body.price);
      if (price === null || price < 0) {
        return NextResponse.json({ error: 'Price must be a valid non-negative number' }, { status: 400 });
      }
      data.price = price;
    }

    if (body.available !== undefined) {
      data.available = Boolean(body.available);
    }

    if (body.categoryId !== undefined) {
      const categoryId = body.categoryId.trim();
      if (!categoryId) {
        return NextResponse.json({ error: 'categoryId cannot be empty' }, { status: 400 });
      }

      const category = await prisma.menuCategory.findUnique({
        where: { id: categoryId },
        select: {
          id: true,
          restaurantId: true
        }
      });

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      if (category.restaurantId !== existingItem.restaurantId) {
        return NextResponse.json(
          { error: 'Category belongs to a different restaurant' },
          { status: 400 }
        );
      }

      data.category = { connect: { id: category.id } };
    }

    const normalizedVariants = normalizeVariants(body.variants);
    if (normalizedVariants.error) {
      return NextResponse.json({ error: normalizedVariants.error }, { status: 400 });
    }

    const variants = normalizedVariants.variants;
    if (variants && body.price === undefined && variants.length > 0) {
      data.price = variants.reduce((min, variant) => Math.min(min, variant.price), variants[0].price);
    }

    const updatedMenuItem = await prisma.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id },
        data
      });

      if (variants !== undefined) {
        await tx.menuItemVariant.deleteMany({
          where: { menuItemId: id }
        });

        if (variants.length > 0) {
          await tx.menuItemVariant.createMany({
            data: variants.map((variant, index) => ({
              menuItemId: id,
              name: variant.name,
              price: variant.price,
              available: variant.available,
              sortOrder: variant.sortOrder ?? index
            }))
          });
        }
      }

      return tx.menuItem.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          variants: {
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
          }
        }
      });
    });

    if (!updatedMenuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(mapMenuItem(updatedMenuItem));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.menuItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
      }

      if (error.code === 'P2003') {
        const deactivatedItem = await prisma.menuItem.update({
          where: { id: (await context.params).id },
          data: { available: false }
        });

        return NextResponse.json({
          success: true,
          deleted: false,
          deactivated: true,
          menuItem: deactivatedItem
        });
      }
    }

    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}
