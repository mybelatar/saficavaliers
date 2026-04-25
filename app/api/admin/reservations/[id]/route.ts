import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../../../lib/prisma';
import { notificationHub } from '../../../../../lib/notifications';

const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const;
type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

function isReservationStatus(value: string): value is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

function parseReservationDate(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      customerName?: string;
      phone?: string;
      partySize?: string | number;
      reservedAt?: string;
      notes?: string;
      status?: string;
    };

    const data: Prisma.ReservationUpdateInput = {};

    if (body.customerName !== undefined) {
      const customerName = body.customerName.trim();
      if (!customerName) {
        return NextResponse.json({ error: 'customerName cannot be empty' }, { status: 400 });
      }
      data.customerName = customerName;
    }

    if (body.phone !== undefined) {
      data.phone = body.phone.trim() || null;
    }

    if (body.notes !== undefined) {
      data.notes = body.notes.trim() || null;
    }

    if (body.partySize !== undefined) {
      const partySize = Number(body.partySize);
      if (!Number.isInteger(partySize) || partySize <= 0) {
        return NextResponse.json({ error: 'partySize must be a positive integer' }, { status: 400 });
      }
      data.partySize = partySize;
    }

    if (body.reservedAt !== undefined) {
      const reservedAt = parseReservationDate(body.reservedAt);
      if (!reservedAt) {
        return NextResponse.json({ error: 'reservedAt must be a valid date' }, { status: 400 });
      }
      data.reservedAt = reservedAt;
    }

    if (body.status !== undefined) {
      const status = body.status.trim().toUpperCase();
      if (!isReservationStatus(status)) {
        return NextResponse.json({ error: 'Invalid reservation status' }, { status: 400 });
      }
      data.status = status;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data
    });

    notificationHub.publish({
      type: 'RESERVATION_UPDATE',
      message: `Reservation ${reservation.customerName}: ${reservation.status}`,
      reservationId: reservation.id,
      reservationStatus: reservation.status,
      targetRoles: ['MANAGER', 'SERVER']
    });

    return NextResponse.json(reservation);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    console.error('Error updating reservation:', error);
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.reservation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
  }
}
