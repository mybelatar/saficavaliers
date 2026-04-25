import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { resolveRestaurantId } from '../../../../lib/restaurant';
import { notificationHub } from '../../../../lib/notifications';

const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const;
type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

function isReservationStatus(value: string): value is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

function parseReservationDate(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const restaurantId = await resolveRestaurantId(searchParams.get('restaurantId'));
    if (!restaurantId) {
      return NextResponse.json([]);
    }

    const dateFrom = parseReservationDate(searchParams.get('dateFrom'));
    const dateTo = parseReservationDate(searchParams.get('dateTo'));

    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId,
        reservedAt: {
          gte: dateFrom ?? undefined,
          lte: dateTo ?? undefined
        }
      },
      orderBy: [{ reservedAt: 'asc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      restaurantId?: string;
      customerName?: string;
      phone?: string;
      partySize?: string | number;
      reservedAt?: string;
      notes?: string;
      status?: string;
    };

    const restaurantId = await resolveRestaurantId(body.restaurantId);
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant is required. Create restaurant information first.' },
        { status: 400 }
      );
    }

    const customerName = (body.customerName ?? '').trim();
    const phone = (body.phone ?? '').trim() || null;
    const notes = (body.notes ?? '').trim() || null;
    const partySize = Number(body.partySize);
    const reservedAt = parseReservationDate(body.reservedAt);
    const statusRaw = (body.status ?? 'PENDING').trim().toUpperCase();

    if (!customerName || !Number.isInteger(partySize) || partySize <= 0 || !reservedAt) {
      return NextResponse.json(
        { error: 'customerName, partySize and reservedAt are required' },
        { status: 400 }
      );
    }

    const status = isReservationStatus(statusRaw) ? statusRaw : 'PENDING';

    const reservation = await prisma.reservation.create({
      data: {
        customerName,
        phone,
        partySize,
        reservedAt,
        notes,
        status,
        restaurantId
      }
    });

    notificationHub.publish({
      type: 'RESERVATION_UPDATE',
      message: `Nouvelle reservation: ${reservation.customerName} (${reservation.partySize} pers.)`,
      reservationId: reservation.id,
      reservationStatus: reservation.status,
      targetRoles: ['MANAGER', 'SERVER']
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}
