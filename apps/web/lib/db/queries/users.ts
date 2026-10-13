import { prisma } from "@/lib/db";
import type { Tier } from "@audio-rpg/shared";
import { effectiveTierForUser } from "@/lib/admin";

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

export async function getUserTier(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, email: true, emailVerified: true },
  });
  if (!user) return "free";
  return effectiveTierForUser(user, user.tier);
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

export async function addAiMinutes(userId: string, minutes: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { aiMinutesRemaining: { increment: minutes } },
  });
}

export async function markStripeEventProcessed(eventId: string): Promise<boolean> {
  const rows = await prisma.$executeRaw`
    INSERT INTO "ProcessedStripeEvent" ("id")
    VALUES (${eventId})
    ON CONFLICT ("id") DO NOTHING
  `;

  return rows > 0;
}

/**
 * Forgets that an event was processed, after its handler failed partway, so
 * Stripe's retry of the same event is handled instead of skipped as a
 * duplicate.
 */
export async function unmarkStripeEventProcessed(eventId: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "ProcessedStripeEvent" WHERE "id" = ${eventId}`;
}

const FREE_DAILY_AI_MINUTES = 60;

export async function resetDailyMinutesIfNeeded(userId: string, tier: string): Promise<void> {
  if (tier !== "free") return;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Conditional updates rather than read-then-write: once one request has
  // moved aiMinutesResetAt into today, a concurrent one no longer matches, so
  // the daily top-up can't be applied twice or overwrite a minute just spent.
  // Purchased credits above the free daily cap are preserved — only top up
  // when below it.
  await prisma.user.updateMany({
    where: {
      id: userId,
      aiMinutesResetAt: { lt: startOfToday },
      aiMinutesRemaining: { lt: FREE_DAILY_AI_MINUTES },
    },
    data: { aiMinutesRemaining: FREE_DAILY_AI_MINUTES, aiMinutesResetAt: new Date() },
  });
  await prisma.user.updateMany({
    where: { id: userId, aiMinutesResetAt: { lt: startOfToday } },
    data: { aiMinutesResetAt: new Date() },
  });
}

export async function recordTtsChars(userId: string, chars: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ttsCharsResetAt: true },
  });
  if (!user) return;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  if (user.ttsCharsResetAt < startOfMonth) {
    // New billing month — reset counter and record this usage
    await prisma.user.update({
      where: { id: userId },
      data: { ttsCharsUsedThisMonth: chars, ttsCharsResetAt: new Date() },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { ttsCharsUsedThisMonth: { increment: chars } },
    });
  }
}


export async function consumeFreeAiMinute(userId: string): Promise<boolean> {
  const result = await prisma.user.updateMany({
    where: { id: userId, tier: "free", aiMinutesRemaining: { gt: 0 } },
    data: { aiMinutesRemaining: { decrement: 1 } },
  });

  return result.count > 0;
}
