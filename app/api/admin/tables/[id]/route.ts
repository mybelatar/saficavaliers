import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      number?: number | string;
      seats?: number | string;
    };

    const currentTable = await prisma.table.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        seats: true,
        restaurantId: true
      }
    });

    if (!currentTable) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const data: Prisma.TableUpdateInput = {};

    if (body.number !== undefined) {
      const number = Number(body.number);
      if (!Number.isInteger(number) || number <= 0) {
        return NextResponse.json({ error: 'number must be a positive integer' }, { status: 400 });
      }

      const duplicate = await prisma.table.findFirst({
        where: {
          restaurantId: currentTable.restaurantId,
          number,
          id: { not: currentTable.id }
        },
        select: {
          id: true
        }
      });

      if (duplicate) {
        return NextResponse.json({ error: 'Table number already exists' }, { status: 400 });
      }

      data.number = number;
    }

    if (body.seats !== undefined) {
      const seats = Number(body.seats);
      if (!Number.isInteger(seats) || seats <= 0) {
        return NextResponse.json({ error: 'seats must be a positive integer' }, { status: 400 });
      }
      data.seats = seats;
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    console.error('Error updating table:', error);
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const tableWithOrders = await prisma.table.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!tableWithOrders) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    if (tableWithOrders._count.orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a table with linked orders' },
        { status: 400 }
      );
    }

    await prisma.table.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    console.error('Error deleting table:', error);
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
