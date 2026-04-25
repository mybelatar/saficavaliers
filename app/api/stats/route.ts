import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function averageOpenMinutes(orderDates: Date[], endDate: Date) {
  if (orderDates.length === 0) {
    return 0;
  }

  const totalMinutes = orderDates.reduce((sum, placedAt) => {
    const elapsedMs = Math.max(0, endDate.getTime() - placedAt.getTime());
    return sum + elapsedMs / 60000;
  }, 0);

  return Math.round(totalMinutes / orderDates.length);
}

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const yesterday = addDays(today, -1);

    const [todayOrders, yesterdayOrders] = await Promise.all([
      prisma.order.findMany({
        where: { placedAt: { gte: today, lt: tomorrow } },
        select: { total: true, status: true, placedAt: true }
      }),
      prisma.order.findMany({
        where: { placedAt: { gte: yesterday, lt: today } },
        select: { total: true, status: true, placedAt: true }
      })
    ]);

    const todayOrderCount = todayOrders.length;
    const yesterdayOrderCount = yesterdayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + order.total, 0);

    const orderChange = percentageChange(todayOrderCount, yesterdayOrderCount);
    const revenueChange = percentageChange(todayRevenue, yesterdayRevenue);

    const todayOpenOrderDates = todayOrders
      .filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELED')
      .map((order) => order.placedAt);
    const yesterdayOpenOrderDates = yesterdayOrders
      .filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELED')
      .map((order) => order.placedAt);

    const avgOrderTime = averageOpenMinutes(todayOpenOrderDates, now);
    const yesterdayAvgOrderTime = averageOpenMinutes(yesterdayOpenOrderDates, today);
    const avgOrderTimeChange =
      yesterdayAvgOrderTime === 0
        ? avgOrderTime === 0
          ? 0
          : -100
        : Math.round(((yesterdayAvgOrderTime - avgOrderTime) / yesterdayAvgOrderTime) * 100);

    const stats = [
      {
        title: 'Commandes aujourd hui',
        value: todayOrderCount,
        change: orderChange,
        icon: 'O',
        color: 'bg-blue-500'
      },
      {
        title: 'Chiffre affaires',
        value: `${Math.round(todayRevenue)} MAD`,
        change: revenueChange,
        icon: '$',
        color: 'bg-emerald-500'
      },
      {
        title: 'Clients servis',
        value: todayOrderCount,
        change: orderChange,
        icon: 'C',
        color: 'bg-purple-500'
      },
      {
        title: 'Temps moyen',
        value: `${avgOrderTime} min`,
        change: avgOrderTimeChange,
        icon: 'T',
        color: 'bg-orange-500'
      }
    ];

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
