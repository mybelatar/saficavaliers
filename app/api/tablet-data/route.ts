import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const restaurantIdParam = new URL(request.url).searchParams.get('restaurantId')?.trim();

    let restaurantId = restaurantIdParam;
    if (!restaurantId) {
      const restaurant = await prisma.restaurant.findFirst({
        orderBy: { name: 'asc' },
        select: { id: true }
      });

      if (!restaurant) {
        return NextResponse.json({
          restaurantId: null,
          categories: [],
          menuItems: [],
          tables: []
        });
      }

      restaurantId = restaurant.id;
    }

    const [categories, menuItems, tables] = await Promise.all([
      prisma.menuCategory.findMany({
        where: { restaurantId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true
        }
      }),
      prisma.menuItem.findMany({
        where: {
          restaurantId,
          available: true
        },
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          available: true,
          categoryId: true,
          variants: {
            where: {
              available: true
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              price: true,
              available: true,
              sortOrder: true
            }
          }
        }
      }),
      prisma.table.findMany({
        where: { restaurantId },
        orderBy: { number: 'asc' },
        select: {
          id: true,
          number: true,
          seats: true
        }
      })
    ]);

    return NextResponse.json({
      restaurantId,
      categories,
      menuItems,
      tables
    });
  } catch (error) {
    console.error('Error fetching tablet data:', error);
    return NextResponse.json({ error: 'Failed to fetch tablet data' }, { status: 500 });
  }
}
