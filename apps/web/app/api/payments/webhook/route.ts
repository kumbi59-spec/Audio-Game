import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, tierForPriceKey, isPackPriceKey, minutesForPackKey, type PriceKey, STRIPE_PRICES } from "@/lib/payments/stripe";
import { updateUserTier, setStripeCustomerId, findUserByStripeCustomerId, addAiMinutes } from "@/lib/db/queries/users";
import { sendUpgradeEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push/sender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  let event: Awaited<ReturnType<typeof constructWebhookEvent>>;
  try {
    const body = await req.text();
    event = await constructWebhookEvent(body, sig);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        mode?: string;
        metadata?: Record<string, string>;
        customer?: string;
      };
      const userId = session.metadata?.["userId"];
      const customerId = typeof session.customer === "string" ? session.customer : undefined;

      if (userId && customerId) await setStripeCustomerId(userId, customerId);

      // One-time pack purchase — credit AI minutes immediately
      const packId = session.metadata?.["packId"];
      if (session.mode === "payment" && userId && packId && isPackPriceKey(packId)) {
        const minutes = minutesForPackKey(packId);
        if (minutes > 0) {
          await addAiMinutes(userId, minutes);
          void sendPushToUser(userId, {
            title: `${minutes} AI minutes added`,
            body: "Your EchoQuest credit pack is ready. Dive back into your adventure!",
            url: "/library",
          });
        }
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as {
        customer: string;
        status: string;
        items: { data: Array<{ price: { id: string } }> };
        metadata?: Record<string, string>;
      };
      const customerId = sub.customer;
      const user = await findUserByStripeCustomerId(customerId);
      if (user && sub.status === "active") {
        const priceId = sub.items.data[0]?.price.id ?? "";
        const priceKey = (Object.entries(STRIPE_PRICES).find(([, v]) => v === priceId)?.[0] ?? "") as PriceKey | "";
        if (priceKey) {
          const newTier = tierForPriceKey(priceKey);
          await updateUserTier(user.id, newTier);
          const tierLabel = newTier === "creator" ? "Creator" : "Storyteller";
          void sendUpgradeEmail(user.email, user.name ?? user.email.split("@")[0]!, newTier);
          void sendPushToUser(user.id, {
            title: `EchoQuest ${tierLabel} plan active`,
            body: "Unlimited play and premium voices are now unlocked. Tap to start your adventure.",
            url: "/library",
          });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as { customer: string };
      const user = await findUserByStripeCustomerId(sub.customer);
      if (user) await updateUserTier(user.id, "free");
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Return 200 so Stripe doesn't retry — log the error for investigation
  }

  return NextResponse.json({ received: true });
}
