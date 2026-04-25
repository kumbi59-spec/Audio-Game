// TODO: npm install stripe  →  import Stripe from "stripe"
// TODO: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-11-20" });

export const STRIPE_PRICES = {
  storyteller_monthly: process.env["STRIPE_PRICE_STORYTELLER_MONTHLY"] ?? "price_storyteller_monthly",
  storyteller_annual:  process.env["STRIPE_PRICE_STORYTELLER_ANNUAL"]  ?? "price_storyteller_annual",
  creator_monthly:     process.env["STRIPE_PRICE_CREATOR_MONTHLY"]     ?? "price_creator_monthly",
  creator_annual:      process.env["STRIPE_PRICE_CREATOR_ANNUAL"]      ?? "price_creator_annual",
} as const;

export type PriceKey = keyof typeof STRIPE_PRICES;

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export async function createCheckoutSession(
  priceKey: PriceKey,
  opts: { successUrl: string; cancelUrl: string; customerId?: string },
): Promise<CheckoutSessionResult> {
  // TODO: replace with real Stripe call:
  // const session = await stripe.checkout.sessions.create({ ... });
  // return { url: session.url!, sessionId: session.id };
  return {
    url: `${opts.successUrl}?stub=true&price=${priceKey}`,
    sessionId: `cs_stub_${priceKey}_${Date.now()}`,
  };
}

export async function constructWebhookEvent(body: string, sig: string) {
  // TODO: return stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  void sig;
  return JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } };
}
