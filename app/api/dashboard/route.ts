import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getStockLevelStatus } from '../../../lib/stock';

type Trend = 'up' | 'down' | 'neutral';
function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function toTrend(change: number): Trend {
  if (change > 0) {
    return 'up';
  }

  if (change < 0) {
    return 'down';
  }

  return 'neutral';
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
    const todayStart = startOfDay(now);
    const yesterdayStart = addDays(todayStart, -1);
    const tomorrowStart = addDays(todayStart, 1);

    const weekStart = addDays(todayStart, -6);
    const previousWeekStart = addDays(weekStart, -7);

    const monthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    const [
      todayOrders,
      yesterdayOrders,
      weekOrders,
      previousWeekOrders,
      monthOrders,
      previousMonthOrders,
      lastSevenDaysOrders,
      stockItems,
      popularOrderItems
    ] = await Promise.all([
      prisma.order.findMany({
        where: { placedAt: { gte: todayStart, lt: tomorrowStart } },
        select: { total: true, status: true, placedAt: true, settlementStatus: true }
      }),
      prisma.order.findMany({
        where: { placedAt: { gte: yesterdayStart, lt: todayStart } },
        select: { total: true, status: true, placedAt: true, settlementStatus: true }
      }),
      prisma.order.findMany({
        where: { placedAt: { gte: weekStart, lt: tomorrowStart } },
        select: { total: true, settlementStatus: true }
      }),
      prisma.order.findMany({
        where: { placedAt: { gte: previousWeekStart, lt: weekStart } },
        select: { total: true, settlementStatus: true }
      }),
      prisma.order.findMany({
        where: { placedAt: { gte: monthStart, lt: tomorrowStart } },
        select: { total: true, status: true, settlementStatus: true }
      }),
      prisma.order.findMany({
        where: { placedAt: { gte: previousMonthStart, lt: monthStart } },
        select: { total: true, settlementStatus: true }
      }),
      prisma.order.findMany({
        where: { placedAt: { gte: weekStart, lt: tomorrowStart } },
        select: { total: true, placedAt: true, settlementStatus: true }
      }),
      prisma.stockItem.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          quantity: true,
          minQuantity: true,
          unit: true
        }
      }),
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            placedAt: {
              gte: monthStart,
              lt: tomorrowStart
            }
          }
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      })
    ]);

    const todayOrderCount = todayOrders.length;
    const yesterdayOrderCount = yesterdayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const todayPaidRevenue = todayOrders
      .filter((order) => order.settlementStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);
    const yesterdayPaidRevenue = yesterdayOrders
      .filter((order) => order.settlementStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);
    const todayPaidOrderCount = todayOrders.filter((order) => order.settlementStatus === 'PAID').length;
    const yesterdayPaidOrderCount = yesterdayOrders.filter((order) => order.settlementStatus === 'PAID').length;

    const todayOpenOrderDates = todayOrders
      .filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELED')
      .map((order) => order.placedAt);
    const yesterdayOpenOrderDates = yesterdayOrders
      .filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELED')
      .map((order) => order.placedAt);

    const todayAvgOpenMinutes = averageOpenMinutes(todayOpenOrderDates, now);
    const yesterdayAvgOpenMinutes = averageOpenMinutes(yesterdayOpenOrderDates, todayStart);

    const ordersChange = percentageChange(todayOrderCount, yesterdayOrderCount);
    const revenueChange = percentageChange(todayPaidRevenue, yesterdayPaidRevenue);
    const customersChange = ordersChange;
    const avgTimeChange =
      yesterdayAvgOpenMinutes === 0
        ? todayAvgOpenMinutes === 0
          ? 0
          : -100
        : Math.round(((yesterdayAvgOpenMinutes - todayAvgOpenMinutes) / yesterdayAvgOpenMinutes) * 100);

    const weekRevenue = weekOrders
      .filter((order) => order.settlementStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);
    const previousWeekRevenue = previousWeekOrders
      .filter((order) => order.settlementStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);
    const monthRevenue = monthOrders
      .filter((order) => order.settlementStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);
    const previousMonthRevenue = previousMonthOrders
      .filter((order) => order.settlementStatus === 'PAID')
      .reduce((sum, order) => sum + order.total, 0);
    const monthComplimentary = monthOrders
      .filter((order) => order.settlementStatus === 'WAIVED')
      .reduce((sum, order) => sum + order.total, 0);
    const monthCredits = monthOrders
      .filter((order) => order.settlementStatus === 'CREDIT')
      .reduce((sum, order) => sum + order.total, 0);
    const monthPending = monthOrders
      .filter((order) => order.settlementStatus === 'PENDING')
      .reduce((sum, order) => sum + order.total, 0);

    const todayAverageTicket = todayPaidOrderCount > 0 ? todayPaidRevenue / todayPaidOrderCount : 0;
    const yesterdayAverageTicket =
      yesterdayPaidOrderCount > 0 ? yesterdayPaidRevenue / yesterdayPaidOrderCount : 0;

    const monthOrdersCount = monthOrders.length;
    const monthCompletedOrders = monthOrders.filter((order) => order.status === 'COMPLETED').length;

    const dayRevenueChange = percentageChange(todayPaidRevenue, yesterdayPaidRevenue);
    const weekRevenueChange = percentageChange(weekRevenue, previousWeekRevenue);
    const monthRevenueChange = percentageChange(monthRevenue, previousMonthRevenue);
    const avgTicketChange = percentageChange(todayAverageTicket, yesterdayAverageTicket);

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const salesByDay = new Map<string, number>();
    for (const order of lastSevenDaysOrders) {
      const key = dayKey(order.placedAt);
      if (order.settlementStatus === 'PAID') {
        salesByDay.set(key, (salesByDay.get(key) ?? 0) + order.total);
      }
    }

    const salesChart = lastSevenDays.map((date) => ({
      label: date.toLocaleDateString('fr-MA', { weekday: 'short' }),
      value: Math.round(salesByDay.get(dayKey(date)) ?? 0),
      color: 'bg-blue-500'
    }));

    const topMenuItemIds = popularOrderItems.map((row) => row.menuItemId);
    const topMenuItems = topMenuItemIds.length
      ? await prisma.menuItem.findMany({
          where: { id: { in: topMenuItemIds } },
          select: { id: true, name: true }
        })
      : [];
    const menuNameById = new Map(topMenuItems.map((item) => [item.id, item.name]));

    const popularItems = popularOrderItems.map((row) => ({
      label: menuNameById.get(row.menuItemId) ?? 'Article',
      value: row._sum.quantity ?? 0,
      color: 'bg-emerald-500'
    }));

    const stock = stockItems.map((item) => ({
      name: item.name,
      currentStock: item.quantity,
      minStock: item.minQuantity,
      unit: item.unit,
      status: getStockLevelStatus(item.quantity, item.minQuantity)
    }));

    return NextResponse.json({
      stats: [
        {
          title: 'Commandes aujourd hui',
          value: todayOrderCount,
          change: ordersChange,
          icon: 'O',
          color: 'bg-blue-500'
        },
        {
          title: 'Encaisse aujourd hui',
          value: `${Math.round(todayPaidRevenue)} MAD`,
          change: revenueChange,
          icon: '$',
          color: 'bg-emerald-500'
        },
        {
          title: 'Clients servis',
          value: todayOrderCount,
          change: customersChange,
          icon: 'C',
          color: 'bg-purple-500'
        },
        {
          title: 'Temps moyen',
          value: `${todayAvgOpenMinutes} min`,
          change: avgTimeChange,
          icon: 'T',
          color: 'bg-orange-500'
        }
      ],
      accounting: [
        {
          title: 'Ventes du jour',
          amount: Math.round(todayRevenue),
          subtitle: 'Brut aujourd hui',
          trend: toTrend(dayRevenueChange)
        },
        {
          title: 'Encaisse du jour',
          amount: Math.round(todayPaidRevenue),
          subtitle: 'Paiements confirmes',
          trend: toTrend(dayRevenueChange)
        },
        {
          title: 'Ventes de la semaine',
          amount: Math.round(weekRevenue),
          subtitle: '7 jours (encaisse)',
          trend: toTrend(weekRevenueChange)
        },
        {
          title: 'Ventes du mois',
          amount: Math.round(monthRevenue),
          subtitle: 'Mois (encaisse)',
          trend: toTrend(monthRevenueChange)
        },
        {
          title: 'Offert / interne',
          amount: Math.round(monthComplimentary),
          subtitle: 'Mois en cours'
        },
        {
          title: 'Credits en cours',
          amount: Math.round(monthCredits),
          subtitle: 'Mois en cours'
        },
        {
          title: 'Non regle (attente)',
          amount: Math.round(monthPending),
          subtitle: 'Mois en cours'
        },
        {
          title: 'Ticket moyen',
          amount: Math.round(todayAverageTicket),
          subtitle: 'Aujourd hui',
          trend: toTrend(avgTicketChange)
        }
      ],
      stock,
      salesChart,
      popularItems,
      summary: {
        monthRevenue: Math.round(monthRevenue),
        monthOrders: monthOrdersCount,
        monthCompletedOrders,
        averageOrderValue:
          monthOrdersCount > 0 ? Math.round((monthRevenue / monthOrdersCount) * 100) / 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
