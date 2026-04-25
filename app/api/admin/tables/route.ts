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

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    return NextResponse.json(
      tables.map((table) => ({
        id: table.id,
        number: table.number,
        seats: table.seats,
        restaurantId: table.restaurantId,
        orderCount: table._count.orders
      }))
    );
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      restaurantId?: string;
      number?: number | string;
      seats?: number | string;
    };

    const number = Number(body.number);
    const seats = Number(body.seats);

    if (!Number.isInteger(number) || number <= 0 || !Number.isInteger(seats) || seats <= 0) {
      return NextResponse.json(
        { error: 'number and seats must be positive integers' },
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

    const existingTable = await prisma.table.findFirst({
      where: {
        restaurantId,
        number
      },
      select: {
        id: true
      }
    });

    if (existingTable) {
      return NextResponse.json({ error: 'Table number already exists' }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        number,
        seats,
        restaurantId
      }
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
