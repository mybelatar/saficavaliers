import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { notificationHub } from '../../../../../lib/notifications';
import { formatStockAlertMessage, getStockLevelStatus } from '../../../../../lib/stock';

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      quantity?: number | string;
      minQuantity?: number | string;
      unit?: string;
    };

    const data: Prisma.StockItemUpdateInput = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
      }
      data.name = name;
    }

    if (body.unit !== undefined) {
      const unit = body.unit.trim();
      if (!unit) {
        return NextResponse.json({ error: 'unit cannot be empty' }, { status: 400 });
      }
      data.unit = unit;
    }

    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity);
      if (!Number.isFinite(quantity) || quantity < 0) {
        return NextResponse.json({ error: 'quantity must be a non-negative number' }, { status: 400 });
      }
      data.quantity = Math.round(quantity);
    }

    if (body.minQuantity !== undefined) {
      const minQuantity = Number(body.minQuantity);
      if (!Number.isFinite(minQuantity) || minQuantity < 0) {
        return NextResponse.json({ error: 'minQuantity must be a non-negative number' }, { status: 400 });
      }
      data.minQuantity = Math.round(minQuantity);
    }

    const updatedStockItem = await prisma.stockItem.update({
      where: { id },
      data
    });

    maybePublishStockAlert(updatedStockItem);

    return NextResponse.json(updatedStockItem);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    console.error('Error updating stock item:', error);
    return NextResponse.json({ error: 'Failed to update stock item' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.stockItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Stock item not found' }, { status: 404 });
    }

    console.error('Error deleting stock item:', error);
    return NextResponse.json({ error: 'Failed to delete stock item' }, { status: 500 });
  }
}
