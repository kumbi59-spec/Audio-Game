import Stripe from "stripe";
import type { Tier } from "@audio-rpg/shared";

// Stripe client — lazy-initialised so the module is importable server-side only
function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

export const STRIPE_PRICES = {
  storyteller_monthly: process.env["STRIPE_PRICE_STORYTELLER_MONTHLY"] ?? "",
  storyteller_annual:  process.env["STRIPE_PRICE_STORYTELLER_ANNUAL"]  ?? "",
  creator_monthly:     process.env["STRIPE_PRICE_CREATOR_MONTHLY"]     ?? "",
  creator_annual:      process.env["STRIPE_PRICE_CREATOR_ANNUAL"]      ?? "",
} as const;

export type PriceKey = keyof typeof STRIPE_PRICES;

export function tierForPriceKey(priceKey: PriceKey): Tier {
  if (priceKey.startsWith("creator")) return "creator";
  if (priceKey.startsWith("storyteller")) return "storyteller";
  return "free";
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export async function createCheckoutSession(
  priceKey: PriceKey,
  opts: {
    successUrl: string;
    cancelUrl: string;
    userId?: string;
    userEmail?: string;
    customerId?: string;
  },
): Promise<CheckoutSessionResult> {
  const stripe = getStripe();
  const priceId = STRIPE_PRICES[priceKey];
  if (!priceId) throw new Error(`Price ID not configured for ${priceKey}. Set STRIPE_PRICE_${priceKey.toUpperCase()} in environment.`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    ...(opts.customerId ? { customer: opts.customerId } : {}),
    ...(opts.userEmail && !opts.customerId ? { customer_email: opts.userEmail } : {}),
    metadata: { ...(opts.userId ? { userId: opts.userId } : {}) },
    subscription_data: {
      metadata: { ...(opts.userId ? { userId: opts.userId } : {}) },
    },
  });

  return { url: session.url!, sessionId: session.id };
}

export async function constructWebhookEvent(
  body: string,
  sig: string,
): Promise<Stripe.Event> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  return getStripe().webhooks.constructEvent(body, sig, secret);
}
