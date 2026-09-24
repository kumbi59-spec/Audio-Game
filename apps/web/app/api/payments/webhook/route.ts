import { NextRequest, NextResponse } from "next/server";
import type { Tier } from "@audio-rpg/shared";
import { constructWebhookEvent, getStripe, isPackPriceKey, minutesForPackKey } from "@/lib/payments/stripe";
import { resolveUserForCustomer, tierForSubscription } from "@/lib/payments/sync";
import { updateUserTier, setStripeCustomerId, findUserByStripeCustomerId, addAiMinutes, markStripeEventProcessed } from "@/lib/db/queries/users";
import { sendUpgradeEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push/sender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function applyPaidTier(
  user: { id: string; email: string; name: string | null; tier: string },
  newTier: Tier,
  eventId: string,
) {
  if (user.tier === newTier) return;
  await updateUserTier(user.id, newTier);
  const tierLabel = newTier === "creator" ? "Creator" : "Storyteller";
  try {
    await sendUpgradeEmail(user.email, user.name ?? user.email.split("@")[0]!, newTier);
  } catch (error) {
    console.error("Non-critical webhook side effect failed: upgrade email", { eventId, error });
  }
  try {
    await sendPushToUser(user.id, {
      title: `EchoQuest ${tierLabel} plan active`,
      body: "Unlimited play and premium voices are now unlocked. Tap to start your adventure.",
      url: "/library",
    });
  } catch (error) {
    console.error("Non-critical webhook side effect failed: upgrade push", { eventId, error });
  }
}

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
    const wasFirstDelivery = await markStripeEventProcessed(event.id);
    if (!wasFirstDelivery) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        mode?: string;
        metadata?: Record<string, string>;
        customer?: string;
        subscription?: string | { id: string } | null;
        customer_details?: { email?: string | null } | null;
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
          try {
            await sendPushToUser(userId, {
              title: `${minutes} AI minutes added`,
              body: "Your EchoQuest credit pack is ready. Dive back into your adventure!",
              url: "/library",
            });
          } catch (error) {
            console.error("Non-critical webhook side effect failed: pack push", { eventId: event.id, error });
          }
        }
      }

      // Subscription checkout — upgrade here too. Stripe may deliver
      // customer.subscription.created before this event, when the customer id
      // was not yet linked to the user, so we can't rely on that event alone.
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (session.mode === "subscription" && customerId && subscriptionId) {
        const user = await resolveUserForCustomer(customerId, {
          userId,
          email: session.customer_details?.email,
        });
        if (user) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const newTier = tierForSubscription(sub);
          if (newTier) await applyPaidTier(user, newTier, event.id);
        } else {
          console.error("Subscription checkout completed but no matching user", { eventId: event.id, customerId });
        }
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as Parameters<typeof tierForSubscription>[0] & {
        customer: string;
        metadata?: Record<string, string>;
      };
      const user = await resolveUserForCustomer(sub.customer, { userId: sub.metadata?.["userId"] });
      const newTier = tierForSubscription(sub);
      if (user && newTier) await applyPaidTier(user, newTier, event.id);
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as { customer: string };
      const user = await findUserByStripeCustomerId(sub.customer);
      if (user) await updateUserTier(user.id, "free");
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
