import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { resolveRestaurantId } from '../../../../lib/restaurant';

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

export async function GET(request: NextRequest) {
  try {
    const restaurantIdParam = new URL(request.url).searchParams.get('restaurantId');
    const restaurantId = await resolveRestaurantId(restaurantIdParam);

    if (!restaurantId) {
      return NextResponse.json([]);
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
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

    return NextResponse.json(menuItems.map(mapMenuItem));
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      restaurantId?: string;
      name?: string;
      description?: string | null;
      price?: number | string;
      imageUrl?: string | null;
      available?: boolean;
      categoryId?: string;
      variants?: unknown;
    };

    const name = (body.name ?? '').trim();
    const categoryId = (body.categoryId ?? '').trim();
    const description = (body.description ?? '').trim() || null;
    const imageUrl = (body.imageUrl ?? '').trim() || null;
    const available = body.available ?? true;
    const normalizedPrice = parseOptionalNumber(body.price);
    const normalizedVariants = normalizeVariants(body.variants);

    if (normalizedVariants.error) {
      return NextResponse.json({ error: normalizedVariants.error }, { status: 400 });
    }
    const variants = normalizedVariants.variants ?? [];

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'name and categoryId are required' },
        { status: 400 }
      );
    }

    if (
      (normalizedPrice === null && variants.length === 0) ||
      (normalizedPrice !== null && normalizedPrice < 0)
    ) {
      return NextResponse.json(
        { error: 'A valid non-negative price is required when no variants are provided' },
        { status: 400 }
      );
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

    const resolvedRestaurantId = await resolveRestaurantId(body.restaurantId);
    if (resolvedRestaurantId && resolvedRestaurantId !== category.restaurantId) {
      return NextResponse.json(
        { error: 'Category does not belong to selected restaurant' },
        { status: 400 }
      );
    }

    const basePrice =
      normalizedPrice ?? variants.reduce((min, variant) => Math.min(min, variant.price), variants[0].price);

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: basePrice,
        imageUrl,
        available: Boolean(available),
        categoryId: category.id,
        restaurantId: category.restaurantId,
        variants:
          variants.length > 0
            ? {
                createMany: {
                  data: variants.map((variant, index) => ({
                    name: variant.name,
                    price: variant.price,
                    available: variant.available,
                    sortOrder: variant.sortOrder ?? index
                  }))
                }
              }
            : undefined
      },
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

    return NextResponse.json(mapMenuItem(menuItem), { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
