import { prisma } from "@/lib/db";
import type { Tier } from "@audio-rpg/shared";

export async function ensureGuestUser(guestId: string) {
  return prisma.user.upsert({
    where: { id: guestId },
    create: {
      id: guestId,
      email: `guest-${guestId}@echoquest.local`,
      name: "Guest Adventurer",
    },
    update: {},
  });
}

export async function createDbCharacter(
  userId: string,
  data: {
    id: string;
    name: string;
    class: string;
    backstory: string;
    stats: Record<string, unknown>;
    inventory: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      quantity: number;
      properties: Record<string, unknown>;
    }>;
  }
) {
  return prisma.character.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      userId,
      name: data.name,
      class: data.class,
      backstory: data.backstory,
      stats: JSON.stringify(data.stats),
      inventory: {
        create: data.inventory.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          properties: JSON.stringify(item.properties),
        })),
      },
    },
    update: {
      name: data.name,
      backstory: data.backstory,
    },
  });
}

export async function getUserTier(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
  return user?.tier ?? "free";
}

export async function updateUserTier(userId: string, tier: Tier) {
  return prisma.user.update({
    where: { id: userId },
    data: { tier },
  });
}

export async function setStripeCustomerId(userId: string, customerId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  });
}

export async function findUserByStripeCustomerId(customerId: string) {
  return prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
}
