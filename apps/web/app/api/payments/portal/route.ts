import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return NextResponse.json({ error: "Billing not configured." }, { status: 503 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found. Subscribe first." }, { status: 400 });
  }

  const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  const origin = new URL(req.url).origin;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/account`,
  });

  return NextResponse.json({ url: portalSession.url });
}
