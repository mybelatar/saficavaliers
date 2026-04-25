import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { notificationHub } from '../../../lib/notifications';

type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELED';
type SettlementStatus = 'PENDING' | 'PAID' | 'WAIVED' | 'CREDIT';
type SettlementCategory = 'CUSTOMER' | 'STAFF' | 'FAMILY' | 'FRIEND' | 'OTHER';

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'IN_PROGRESS', 'READY'];
const ALL_STATUSES: readonly OrderStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'READY',
  'COMPLETED',
  'CANCELED'
] as const;
const ALL_SETTLEMENT_STATUSES: readonly SettlementStatus[] = ['PENDING', 'PAID', 'WAIVED', 'CREDIT'] as const;
const ALL_SETTLEMENT_CATEGORIES: readonly SettlementCategory[] = [
  'CUSTOMER',
  'STAFF',
  'FAMILY',
  'FRIEND',
  'OTHER'
] as const;

const orderInclude = {
  items: {
    include: {
      menuItem: true,
      menuItemVariant: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  table: true
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

interface CreateOrderItemInput {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  note?: string;
}

function transformOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    tableId: order.tableId,
    tableNumber: order.table?.number ?? 0,
    status: order.status,
    settlementStatus: order.settlementStatus,
    settlementCategory: order.settlementCategory,
    settlementReference: order.settlementReference,
    settlementNote: order.settlementNote,
    creditDueAt: order.creditDueAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    total: order.total,
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.menuItem.name,
      imageUrl: item.menuItem.imageUrl ?? undefined,
      variantName: item.variantName ?? item.menuItemVariant?.name ?? undefined,
      quantity: item.quantity,
      note: item.note
    })),
    placedAt: order.placedAt.toISOString()
  };
}

function statusMessage(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return 'Nouvelle commande';
    case 'IN_PROGRESS':
      return 'Commande en preparation';
    case 'READY':
      return 'Commande prete';
    case 'COMPLETED':
      return 'Commande terminee';
    case 'CANCELED':
      return 'Commande annulee';
    default:
      return 'Mise a jour commande';
  }
}

function isOrderStatus(status: string): status is OrderStatus {
  return (ALL_STATUSES as readonly string[]).includes(status);
}

function isSettlementStatus(status: string): status is SettlementStatus {
  return (ALL_SETTLEMENT_STATUSES as readonly string[]).includes(status);
}

function isSettlementCategory(category: string): category is SettlementCategory {
  return (ALL_SETTLEMENT_CATEGORIES as readonly string[]).includes(category);
}

function normalizeOrderItems(items: unknown): CreateOrderItemInput[] | null {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const mergedItems = new Map<string, CreateOrderItemInput>();

  for (const rawItem of items) {
    if (typeof rawItem !== 'object' || rawItem === null) {
      return null;
    }

    const menuItemId = String((rawItem as { menuItemId?: unknown }).menuItemId ?? '').trim();
    const variantIdValue = (rawItem as { variantId?: unknown }).variantId;
    const variantId =
      typeof variantIdValue === 'string' && variantIdValue.trim() ? variantIdValue.trim() : undefined;
    const quantity = Number((rawItem as { quantity?: unknown }).quantity);
    const noteRaw = (rawItem as { note?: unknown }).note;
    const note = typeof noteRaw === 'string' ? noteRaw.trim() : '';

    if (!menuItemId || !Number.isFinite(quantity) || quantity <= 0) {
      return null;
    }

    const normalizedQuantity = Math.floor(quantity);
    if (normalizedQuantity <= 0) {
      return null;
    }

    const mergeKey = `${menuItemId}::${variantId ?? 'base'}`;
    const existing = mergedItems.get(mergeKey);
    if (existing) {
      existing.quantity += normalizedQuantity;
      if (note) {
        existing.note = note;
      }
    } else {
      mergedItems.set(mergeKey, {
        menuItemId,
        variantId,
        quantity: normalizedQuantity,
        note: note || undefined
      });
    }
  }

  return [...mergedItems.values()];
}

export async function GET(request: NextRequest) {
  try {
    const includeClosed = new URL(request.url).searchParams.get('includeClosed') === 'true';

    const orders = await prisma.order.findMany({
      where: includeClosed
        ? undefined
        : {
            status: {
              in: ACTIVE_STATUSES
            }
          },
      include: orderInclude,
      orderBy: {
        placedAt: 'desc'
      }
    });

    return NextResponse.json(orders.map(transformOrder));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      tableId?: unknown;
      items?: unknown;
    };

    const tableId = typeof body.tableId === 'string' ? body.tableId.trim() : '';
    const normalizedItems = normalizeOrderItems(body.items);

    if (!tableId || !normalizedItems) {
      return NextResponse.json(
        { error: 'tableId and a non-empty items array are required' },
        { status: 400 }
      );
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        number: true,
        restaurantId: true
      }
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    const menuItemIds = [...new Set(normalizedItems.map((item) => item.menuItemId))];
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: table.restaurantId,
        available: true
      },
      select: {
        id: true,
        price: true,
        variants: {
          where: {
            available: true
          },
          select: {
            id: true
          }
        }
      }
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: 'One or more menu items are invalid or unavailable' },
        { status: 400 }
      );
    }

    const variantIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.variantId)
          .filter((variantId): variantId is string => Boolean(variantId))
      )
    ];

    const variants = variantIds.length
      ? await prisma.menuItemVariant.findMany({
          where: {
            id: { in: variantIds },
            available: true,
            menuItem: {
              restaurantId: table.restaurantId,
              available: true
            }
          },
          select: {
            id: true,
            menuItemId: true,
            name: true,
            price: true
          }
        })
      : [];

    if (variants.length !== variantIds.length) {
      return NextResponse.json(
        { error: 'One or more variants are invalid or unavailable' },
        { status: 400 }
      );
    }

    const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    const orderItems: Array<{
      menuItemId: string;
      menuItemVariantId: string | null;
      variantName: string | null;
      quantity: number;
      note: string | null;
      price: number;
    }> = [];

    for (const item of normalizedItems) {
      const menuItem = menuItemById.get(item.menuItemId);
      if (!menuItem) {
        return NextResponse.json({ error: 'Invalid menu item in order' }, { status: 400 });
      }

      const hasAvailableVariants = menuItem.variants.length > 0;
      const variant = item.variantId ? variantById.get(item.variantId) : undefined;

      if (hasAvailableVariants && !variant) {
        return NextResponse.json(
          { error: `Variant is required for menu item ${item.menuItemId}` },
          { status: 400 }
        );
      }

      if (variant && variant.menuItemId !== item.menuItemId) {
        return NextResponse.json({ error: 'Variant does not belong to selected menu item' }, { status: 400 });
      }

      orderItems.push({
        menuItemId: item.menuItemId,
        menuItemVariantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        quantity: item.quantity,
        note: item.note || null,
        price: variant?.price ?? menuItem.price
      });
    }

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const createdOrder = await prisma.order.create({
      data: {
        tableId: table.id,
        restaurantId: table.restaurantId,
        status: 'PENDING',
        total,
        items: {
          create: orderItems
        }
      },
      include: orderInclude
    });

    notificationHub.publish({
      type: 'NEW_ORDER',
      message: `Nouvelle commande table ${createdOrder.table?.number ?? table.number}`,
      orderId: createdOrder.id,
      tableNumber: createdOrder.table?.number ?? table.number,
      status: createdOrder.status,
      targetRoles: ['SERVER', 'KITCHEN', 'DISPLAY']
    });

    return NextResponse.json(transformOrder(createdOrder), { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      orderId?: unknown;
      status?: unknown;
      settlementStatus?: unknown;
      settlementCategory?: unknown;
      settlementReference?: unknown;
      settlementNote?: unknown;
      creditDueAt?: unknown;
    };
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    const settlementStatusRaw =
      typeof body.settlementStatus === 'string' ? body.settlementStatus.trim() : '';
    const settlementCategoryRaw =
      typeof body.settlementCategory === 'string' ? body.settlementCategory.trim() : '';
    const settlementReferenceRaw =
      typeof body.settlementReference === 'string' ? body.settlementReference.trim() : '';
    const settlementNoteRaw = typeof body.settlementNote === 'string' ? body.settlementNote.trim() : '';
    const hasCreditDueAtField = body.creditDueAt !== undefined;

    const hasStatusUpdate = status.length > 0;
    const hasSettlementUpdate =
      settlementStatusRaw.length > 0 ||
      settlementCategoryRaw.length > 0 ||
      body.settlementReference !== undefined ||
      body.settlementNote !== undefined ||
      hasCreditDueAtField;

    if (!orderId || (!hasStatusUpdate && !hasSettlementUpdate)) {
      return NextResponse.json(
        {
          error:
            'orderId and at least one update field are required (status, settlementStatus, settlementCategory, settlementReference, settlementNote, creditDueAt)'
        },
        { status: 400 }
      );
    }

    if (hasStatusUpdate && !isOrderStatus(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }
    const nextOrderStatus: OrderStatus | undefined = hasStatusUpdate ? (status as OrderStatus) : undefined;

    if (settlementStatusRaw && !isSettlementStatus(settlementStatusRaw)) {
      return NextResponse.json({ error: 'Invalid settlementStatus' }, { status: 400 });
    }

    if (settlementCategoryRaw && !isSettlementCategory(settlementCategoryRaw)) {
      return NextResponse.json({ error: 'Invalid settlementCategory' }, { status: 400 });
    }

    let creditDueAtValue: Date | null | undefined;
    if (hasCreditDueAtField) {
      if (body.creditDueAt === null || body.creditDueAt === '') {
        creditDueAtValue = null;
      } else if (typeof body.creditDueAt === 'string') {
        const parsedDate = new Date(body.creditDueAt);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: 'Invalid creditDueAt date' }, { status: 400 });
        }
        creditDueAtValue = parsedDate;
      } else {
        return NextResponse.json({ error: 'Invalid creditDueAt date' }, { status: 400 });
      }
    }

    const updateData: Prisma.OrderUpdateInput = {};

    if (hasStatusUpdate) {
      updateData.status = nextOrderStatus;
    }

    if (settlementStatusRaw) {
      updateData.settlementStatus = settlementStatusRaw;
      if (settlementStatusRaw === 'PAID') {
        updateData.paidAt = new Date();
      } else {
        updateData.paidAt = null;
      }
      if (settlementStatusRaw !== 'CREDIT') {
        updateData.creditDueAt = null;
      }
    }

    if (settlementCategoryRaw) {
      updateData.settlementCategory = settlementCategoryRaw;
    }

    if (body.settlementReference !== undefined) {
      updateData.settlementReference = settlementReferenceRaw || null;
    }

    if (body.settlementNote !== undefined) {
      updateData.settlementNote = settlementNoteRaw || null;
    }

    if (hasCreditDueAtField) {
      const effectiveSettlementStatus = settlementStatusRaw || undefined;
      if (effectiveSettlementStatus && effectiveSettlementStatus !== 'CREDIT' && creditDueAtValue) {
        return NextResponse.json(
          { error: 'creditDueAt can only be set when settlementStatus is CREDIT' },
          { status: 400 }
        );
      }

      if (creditDueAtValue && settlementStatusRaw !== 'CREDIT') {
        updateData.settlementStatus = 'CREDIT';
        updateData.paidAt = null;
      }

      updateData.creditDueAt = creditDueAtValue ?? null;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: orderInclude
    });

    if (nextOrderStatus) {
      notificationHub.publish({
        type: 'ORDER_STATUS',
        message: `${statusMessage(nextOrderStatus)} table ${updatedOrder.table?.number ?? 0}`,
        orderId: updatedOrder.id,
        tableNumber: updatedOrder.table?.number ?? 0,
        status: nextOrderStatus,
        targetRoles: ['SERVER', 'KITCHEN', 'DISPLAY']
      });
    }

    return NextResponse.json(transformOrder(updatedOrder));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
