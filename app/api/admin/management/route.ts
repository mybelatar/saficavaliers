import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { resolveRestaurantId } from '../../../../lib/restaurant';

export async function GET(request: NextRequest) {
  try {
    const restaurantIdParam = new URL(request.url).searchParams.get('restaurantId');
    const restaurantId = await resolveRestaurantId(restaurantIdParam);

    if (!restaurantId) {
      return NextResponse.json({
        restaurant: null,
        categories: [],
        menuItems: [],
        stockItems: [],
        reservations: [],
        tables: [],
        orders: []
      });
    }

    const [restaurant, categories, menuItems, stockItems, reservations, tables, orders] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          id: true,
          name: true
        }
      }),
      prisma.menuCategory.findMany({
        where: { restaurantId },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              items: true
            }
          }
        }
      }),
      prisma.menuItem.findMany({
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
      }),
      prisma.stockItem.findMany({
        where: { restaurantId },
        orderBy: { name: 'asc' }
      }),
      prisma.reservation.findMany({
        where: { restaurantId },
        orderBy: [{ reservedAt: 'asc' }, { createdAt: 'desc' }]
      }),
      prisma.table.findMany({
        where: { restaurantId },
        orderBy: { number: 'asc' },
        include: {
          _count: {
            select: {
              orders: true
            }
          }
        }
      }),
      prisma.order.findMany({
        where: { restaurantId },
        orderBy: { placedAt: 'desc' },
        take: 120,
        include: {
          table: {
            select: {
              id: true,
              number: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      restaurant,
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        menuItemCount: category._count.items
      })),
      menuItems: menuItems.map((item) => ({
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
      })),
      stockItems: stockItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        unit: item.unit,
        restaurantId: item.restaurantId
      })),
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        customerName: reservation.customerName,
        phone: reservation.phone,
        partySize: reservation.partySize,
        reservedAt: reservation.reservedAt.toISOString(),
        status: reservation.status,
        notes: reservation.notes,
        createdAt: reservation.createdAt.toISOString(),
        restaurantId: reservation.restaurantId
      })),
      tables: tables.map((table) => ({
        id: table.id,
        number: table.number,
        seats: table.seats,
        orderCount: table._count.orders,
        restaurantId: table.restaurantId
      })),
      orders: orders.map((order) => ({
        id: order.id,
        tableId: order.tableId,
        tableNumber: order.table?.number ?? null,
        status: order.status,
        settlementStatus: order.settlementStatus,
        settlementCategory: order.settlementCategory,
        settlementReference: order.settlementReference,
        settlementNote: order.settlementNote,
        creditDueAt: order.creditDueAt?.toISOString() ?? null,
        paidAt: order.paidAt?.toISOString() ?? null,
        total: order.total,
        placedAt: order.placedAt.toISOString(),
        itemCount: order._count.items
      }))
    });
  } catch (error) {
    console.error('Error fetching management data:', error);
    return NextResponse.json({ error: 'Failed to fetch management data' }, { status: 500 });
  }
}
