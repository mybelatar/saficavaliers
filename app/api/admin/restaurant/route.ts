import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { resolveRestaurantId } from '../../../../lib/restaurant';

export async function GET(request: NextRequest) {
  try {
    const restaurantIdParam = new URL(request.url).searchParams.get('restaurantId');
    const restaurantId = await resolveRestaurantId(restaurantIdParam);

    if (!restaurantId) {
      return NextResponse.json({ restaurant: null });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      restaurantId?: string;
      name?: string;
    };

    const name = (body.name ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    const resolvedRestaurantId = await resolveRestaurantId(body.restaurantId);

    const restaurant = resolvedRestaurantId
      ? await prisma.restaurant.update({
          where: { id: resolvedRestaurantId },
          data: { name },
          select: {
            id: true,
            name: true
          }
        })
      : await prisma.restaurant.create({
          data: { name },
          select: {
            id: true,
            name: true
          }
        });

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}
