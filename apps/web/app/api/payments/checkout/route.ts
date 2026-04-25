import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, STRIPE_PRICES, type PriceKey } from "@/lib/payments/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { priceKey?: string; successUrl?: string; cancelUrl?: string };
    const { priceKey, successUrl, cancelUrl } = body;

    if (!priceKey || !Object.keys(STRIPE_PRICES).includes(priceKey)) {
      return NextResponse.json({ error: "Invalid priceKey." }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    // auth() will be wired up once the auth module is available
    const session: null = null;

    const result = await createCheckoutSession(priceKey as PriceKey, {
      successUrl: successUrl ?? `${origin}/?upgraded=true`,
      cancelUrl: cancelUrl ?? `${origin}/`,
      userId: (session as null | { user?: { id?: string } })?.user?.id,
      userEmail: (session as null | { user?: { email?: string | null } })?.user?.email ?? undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
