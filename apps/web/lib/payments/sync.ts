import type Stripe from "stripe";
import type { Tier } from "@audio-rpg/shared";
import { prisma } from "@/lib/db";
import { getStripe, STRIPE_PRICES, tierForPriceKey, type PriceKey } from "@/lib/payments/stripe";

// Subscription statuses that should grant paid access.
const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export function tierForSubscription(sub: Pick<Stripe.Subscription, "status" | "items">): Tier | null {
  if (!ENTITLED_STATUSES.has(sub.status)) return null;
  const priceId = sub.items.data[0]?.price.id ?? "";
  if (!priceId) return null;
  const priceKey = Object.entries(STRIPE_PRICES).find(([, v]) => v === priceId)?.[0] as PriceKey | undefined;
  if (!priceKey) {
    console.error("Stripe subscription price does not match any configured STRIPE_PRICE_* env var", { priceId });
    return null;
  }
  const tier = tierForPriceKey(priceKey);
  return tier === "free" ? null : tier;
}

/**
 * Find the app user for a Stripe customer. Stripe does not guarantee event
 * order, so `customer.subscription.created` often arrives before
 * `checkout.session.completed` has stored the customer id. Fall back to the
 * userId we put in subscription metadata, then to the customer's email, and
 * link the customer id when found that way.
 */
export async function resolveUserForCustomer(
  customerId: string,
  hints: { userId?: string | null; email?: string | null } = {},
) {
  const byCustomer = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (byCustomer) return byCustomer;

  let user = hints.userId ? await prisma.user.findUnique({ where: { id: hints.userId } }) : null;

  let email = hints.email ?? null;
  if (!user && !email) {
    const customer = await getStripe().customers.retrieve(customerId);
    if (!("deleted" in customer && customer.deleted)) email = customer.email ?? null;
  }
  if (!user && email) {
    user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  }

  if (user && !user.stripeCustomerId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }
  return user;
}

/**
 * Pull the user's current subscriptions straight from Stripe and set their
 * tier accordingly. Used by the admin "Sync Stripe" button to repair accounts
 * whose webhook was missed.
 */
export async function syncUserTierFromStripe(userId: string): Promise<{ tier: Tier; customerId: string | null }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");

  const stripe = getStripe();
  const customerIds = new Set<string>();
  if (user.stripeCustomerId) customerIds.add(user.stripeCustomerId);
  const byEmail = await stripe.customers.list({ email: user.email, limit: 10 });
  for (const c of byEmail.data) customerIds.add(c.id);

  let best: { tier: Tier; customerId: string } | null = null;
  for (const customerId of customerIds) {
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
    for (const sub of subs.data) {
      const tier = tierForSubscription(sub);
      if (!tier) continue;
      if (!best || (tier === "creator" && best.tier !== "creator")) best = { tier, customerId };
    }
  }

  const tier: Tier = best?.tier ?? "free";
  await prisma.user.update({
    where: { id: userId },
    data: { tier, ...(best ? { stripeCustomerId: best.customerId } : {}) },
  });
  return { tier, customerId: best?.customerId ?? user.stripeCustomerId };
}
