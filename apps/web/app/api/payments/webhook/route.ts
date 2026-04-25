export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/payments/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") ?? "";

    const event = await constructWebhookEvent(body, sig);

    switch (event.type) {
      case "checkout.session.completed":
        // TODO: update user tier in DB
        console.log("TODO: update user tier in DB", event.data.object);
        return NextResponse.json({ received: true });

      case "customer.subscription.deleted":
        // TODO: downgrade user to free in DB
        console.log("TODO: downgrade user to free in DB", event.data.object);
        return NextResponse.json({ received: true });

      default:
        return NextResponse.json({ received: true });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
