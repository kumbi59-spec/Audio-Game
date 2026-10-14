import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPublicOrigin, isSameSiteOrigin } from "@/lib/site-url";
import { createCheckoutSession, STRIPE_PRICES, isPackPriceKey, type PriceKey } from "@/lib/payments/stripe";

async function buildCheckoutResult(priceKey: PriceKey, origin: string, userId?: string, userEmail?: string, customerId?: string) {
  const isPack = isPackPriceKey(priceKey);
  return createCheckoutSession(priceKey, {
    successUrl: isPack ? `${origin}/account?pack_purchased=true` : `${origin}/?upgraded=true`,
    cancelUrl: isPack ? `${origin}/account` : `${origin}/`,
    userId,
    userEmail,
    customerId,
  });
}

// GET — used by landing page <Link href="/api/payments/checkout?tier=storyteller_monthly">
export async function GET(req: NextRequest) {
  const tier = req.nextUrl.searchParams.get("tier") ?? "";
  const origin = getPublicOrigin(req);

  if (!tier || !Object.keys(STRIPE_PRICES).includes(tier)) {
    return NextResponse.redirect(`${origin}/#pricing`);
  }

  try {
    const session = await auth();
    // A purchase has to belong to an account (a pack bought signed out has
    // no user to credit), so sign in first and come back to this checkout.
    if (!session?.user?.id) {
      const callbackUrl = `/api/payments/checkout?tier=${encodeURIComponent(tier)}`;
      return NextResponse.redirect(`${origin}/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true },
    });

    const result = await buildCheckoutResult(
      tier as PriceKey,
      origin,
      session.user.id,
      session.user.email ?? undefined,
      user?.stripeCustomerId ?? undefined,
    );
    return NextResponse.redirect(result.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.redirect(`${origin}/?checkout_error=${encodeURIComponent(message)}`);
  }
}

// POST — used by account page pack purchase buttons
export async function POST(req: NextRequest) {
  // CSRF defence in depth: browsers always send Origin on POST, and it must
  // be our own site.
  if (!isSameSiteOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  try {
    const body = await req.json() as { priceKey?: string };
    const { priceKey } = body;

    if (!priceKey || !Object.keys(STRIPE_PRICES).includes(priceKey)) {
      return NextResponse.json({ error: "Invalid priceKey." }, { status: 400 });
    }

    const origin = getPublicOrigin(req);
    const session = await auth();
    // Pack minutes are credited to the signed-in user; without one there is
    // nobody to credit.
    if (!session?.user?.id && isPackPriceKey(priceKey)) {
      return NextResponse.json({ error: "Sign in to buy AI minutes." }, { status: 401 });
    }
    const user = session?.user?.id
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { stripeCustomerId: true, email: true } })
      : null;

    const result = await buildCheckoutResult(
      priceKey as PriceKey,
      origin,
      session?.user?.id,
      session?.user?.email ?? undefined,
      user?.stripeCustomerId ?? undefined,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
