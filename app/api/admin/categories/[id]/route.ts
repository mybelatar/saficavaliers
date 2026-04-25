import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { name?: string };
    const name = (body.name ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const updatedCategory = await prisma.menuCategory.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const menuItemCount = await prisma.menuItem.count({
      where: { categoryId: id }
    });

    if (menuItemCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with menu items. Reassign or delete menu items first.' },
        { status: 400 }
      );
    }

    await prisma.menuCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
