import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, STRIPE_PRICES, type PriceKey } from "@/lib/payments/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      priceKey?: unknown;
      successUrl?: string;
      cancelUrl?: string;
    };

    const { priceKey, successUrl, cancelUrl } = body;

    if (typeof priceKey !== "string" || !(priceKey in STRIPE_PRICES)) {
      return NextResponse.json(
        { error: `Invalid priceKey. Must be one of: ${Object.keys(STRIPE_PRICES).join(", ")}` },
        { status: 400 },
      );
    }

    const result = await createCheckoutSession(priceKey as PriceKey, {
      successUrl: successUrl ?? `${req.nextUrl.origin}/billing/success`,
      cancelUrl: cancelUrl ?? `${req.nextUrl.origin}/billing/cancel`,
    });

    return NextResponse.json({ url: result.url, sessionId: result.sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
