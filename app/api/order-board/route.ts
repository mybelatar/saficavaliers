import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BoardOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED';

function mapBoardOrder(order: {
  id: string;
  status: string;
  placedAt: Date;
  updatedAt: Date;
  total: number;
  table: { number: number } | null;
  items: Array<{
    id: string;
    quantity: number;
    variantName: string | null;
    menuItem: { name: string };
  }>;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: order.id,
    code: order.id.slice(-6).toUpperCase(),
    tableNumber: order.table?.number ?? 0,
    status: order.status as BoardOrderStatus,
    placedAt: order.placedAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    total: order.total,
    itemCount,
    summaryItems: order.items.map((item) => ({
      id: item.id,
      name: item.menuItem.name,
      quantity: item.quantity,
      variantName: item.variantName
    }))
  };
}

export async function GET() {
  try {
    const completedCutoff = new Date(Date.now() - 30 * 60 * 1000);

    const [activeOrders, completedOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS', 'READY']
          }
        },
        include: {
          table: {
            select: {
              number: true
            }
          },
          items: {
            orderBy: {
              id: 'asc'
            },
            select: {
              id: true,
              quantity: true,
              variantName: true,
              menuItem: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [{ status: 'asc' }, { placedAt: 'asc' }],
        take: 48
      }),
      prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: completedCutoff
          }
        },
        include: {
          table: {
            select: {
              number: true
            }
          },
          items: {
            orderBy: {
              id: 'asc'
            },
            select: {
              id: true,
              quantity: true,
              variantName: true,
              menuItem: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: [{ updatedAt: 'desc' }, { placedAt: 'desc' }],
        take: 16
      })
    ]);

    const orders = [...activeOrders, ...completedOrders].map(mapBoardOrder);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      orders
    });
  } catch (error) {
    console.error('Error fetching order board data:', error);
    return NextResponse.json({ error: 'Failed to fetch order board data' }, { status: 500 });
  }
}
