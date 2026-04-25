import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { resolveRestaurantId } from '../../../../lib/restaurant';
import { notificationHub } from '../../../../lib/notifications';
import { formatStockAlertMessage, getStockLevelStatus } from '../../../../lib/stock';

function maybePublishStockAlert(stockItem: {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}) {
  const level = getStockLevelStatus(stockItem.quantity, stockItem.minQuantity);
  if (level === 'good') {
    return;
  }

  notificationHub.publish({
    type: 'STOCK_ALERT',
    message: formatStockAlertMessage(
      stockItem.name,
      stockItem.quantity,
      stockItem.minQuantity,
      stockItem.unit
    ),
    stockItemId: stockItem.id,
    stockQuantity: stockItem.quantity,
    minQuantity: stockItem.minQuantity,
    targetRoles: ['MANAGER', 'SERVER']
  });
}

export async function GET(request: NextRequest) {
  try {
    const restaurantIdParam = new URL(request.url).searchParams.get('restaurantId');
    const restaurantId = await resolveRestaurantId(restaurantIdParam);

    if (!restaurantId) {
      return NextResponse.json([]);
    }

    const stockItems = await prisma.stockItem.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(stockItems);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    return NextResponse.json({ error: 'Failed to fetch stock items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      restaurantId?: string;
      name?: string;
      quantity?: number | string;
      minQuantity?: number | string;
      unit?: string;
    };

    const name = (body.name ?? '').trim();
    const unit = (body.unit ?? '').trim();
    const quantity = Number(body.quantity);
    const minQuantity = Number(body.minQuantity ?? 0);

    if (
      !name ||
      !unit ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isFinite(minQuantity) ||
      minQuantity < 0
    ) {
      return NextResponse.json(
        { error: 'name, unit, quantity and minQuantity must be valid non-negative values' },
        { status: 400 }
      );
    }

    const restaurantId = await resolveRestaurantId(body.restaurantId);
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant is required. Create restaurant information first.' },
        { status: 400 }
      );
    }

    const stockItem = await prisma.stockItem.create({
      data: {
        name,
        quantity: Math.round(quantity),
        minQuantity: Math.round(minQuantity),
        unit,
        restaurantId
      }
    });

    maybePublishStockAlert(stockItem);

    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Failed to create stock item' }, { status: 500 });
  }
}
