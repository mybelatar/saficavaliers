import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { resolveRestaurantId } from '../../../../lib/restaurant';

export async function GET(request: NextRequest) {
  try {
    const restaurantIdParam = new URL(request.url).searchParams.get('restaurantId');
    const restaurantId = await resolveRestaurantId(restaurantIdParam);

    if (!restaurantId) {
      return NextResponse.json([]);
    }

    const categories = await prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    return NextResponse.json(
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        restaurantId: category.restaurantId,
        menuItemCount: category._count.items
      }))
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      restaurantId?: string;
      name?: string;
    };

    const name = (body.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const restaurantId = await resolveRestaurantId(body.restaurantId);
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant is required. Create restaurant information first.' },
        { status: 400 }
      );
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        restaurantId
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
