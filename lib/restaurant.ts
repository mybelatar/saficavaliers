import { prisma } from './prisma';

export async function resolveRestaurantId(preferredId?: string | null) {
  if (preferredId?.trim()) {
    return preferredId.trim();
  }

  const restaurant = await prisma.restaurant.findFirst({
    orderBy: { name: 'asc' },
    select: { id: true }
  });

  return restaurant?.id ?? null;
}
