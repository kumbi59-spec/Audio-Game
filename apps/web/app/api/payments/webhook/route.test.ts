import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructWebhookEvent: vi.fn(),
  markStripeEventProcessed: vi.fn(),
  unmarkStripeEventProcessed: vi.fn(),
  addAiMinutes: vi.fn(),
  sendPushToUser: vi.fn(),
  updateUserTier: vi.fn(),
  resolveUserForCustomer: vi.fn(),
  bestTierForCustomer: vi.fn(),
  findUserByStripeCustomerId: vi.fn(),
  sendUpgradeEmail: vi.fn(),
}));

vi.mock("@/lib/payments/stripe", () => ({
  constructWebhookEvent: mocks.constructWebhookEvent,
  isPackPriceKey: (key: string) => key === "pack_small",
  minutesForPackKey: () => 30,
}));

vi.mock("@/lib/payments/sync", () => ({
  resolveUserForCustomer: mocks.resolveUserForCustomer,
  bestTierForCustomer: mocks.bestTierForCustomer,
}));

vi.mock("@/lib/db/queries/users", () => ({
  updateUserTier: mocks.updateUserTier,
  setStripeCustomerId: vi.fn(),
  findUserByStripeCustomerId: mocks.findUserByStripeCustomerId,
  addAiMinutes: mocks.addAiMinutes,
  markStripeEventProcessed: mocks.markStripeEventProcessed,
  unmarkStripeEventProcessed: mocks.unmarkStripeEventProcessed,
}));

vi.mock("@/lib/email", () => ({ sendUpgradeEmail: mocks.sendUpgradeEmail }));
vi.mock("@/lib/push/sender", () => ({ sendPushToUser: mocks.sendPushToUser }));

import { POST } from "./route";

function deliverEvent(event: { id: string; type: string; data: { object: Record<string, unknown> } }) {
  mocks.constructWebhookEvent.mockResolvedValue(event);
  return POST(new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "stripe-signature": "sig" },
    body: "{}",
  }) as never);
}

describe("POST /api/payments/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.addAiMinutes.mockResolvedValue(undefined);
  });

  it("ignores duplicate webhook deliveries using Stripe event id idempotency", async () => {
    mocks.constructWebhookEvent.mockResolvedValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "payment",
          payment_status: "paid",
          metadata: { userId: "user_1", packId: "pack_small" },
          customer: "cus_1",
        },
      },
    });
    mocks.markStripeEventProcessed.mockResolvedValue(false);

    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: JSON.stringify({ any: "payload" }),
    });

    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mocks.addAiMinutes).not.toHaveBeenCalled();
    expect(mocks.sendPushToUser).not.toHaveBeenCalled();
  });

  it("returns 500 for transient DB failures so Stripe retries delivery", async () => {
    mocks.constructWebhookEvent.mockResolvedValue({
      id: "evt_retry",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "payment",
          payment_status: "paid",
          metadata: { userId: "user_1", packId: "pack_small" },
          customer: "cus_1",
        },
      },
    });
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.addAiMinutes.mockRejectedValue(new Error("transient db outage"));

    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: JSON.stringify({ any: "payload" }),
    });

    const res = await POST(req as never);

    expect(res.status).toBe(500);
  });

  it("applies Stripe's retry of an event whose first delivery failed", async () => {
    const processed = new Set<string>();
    mocks.markStripeEventProcessed.mockImplementation(async (id: string) => {
      if (processed.has(id)) return false;
      processed.add(id);
      return true;
    });
    mocks.unmarkStripeEventProcessed.mockImplementation(async (id: string) => {
      processed.delete(id);
    });
    mocks.constructWebhookEvent.mockResolvedValue({
      id: "evt_redeliver",
      type: "checkout.session.completed",
      data: { object: { mode: "payment", payment_status: "paid", metadata: { userId: "user_1", packId: "pack_small" }, customer: "cus_1" } },
    });
    mocks.addAiMinutes.mockRejectedValueOnce(new Error("transient db outage")).mockResolvedValueOnce(undefined);
    const deliver = () =>
      POST(new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: JSON.stringify({ any: "payload" }),
      }) as never);

    expect((await deliver()).status).toBe(500);
    const retry = await deliver();

    expect(retry.status).toBe(200);
    expect(await retry.json()).not.toMatchObject({ duplicate: true });
    expect(mocks.addAiMinutes).toHaveBeenCalledTimes(2);
  });

  it("upgrades on checkout.session.completed even if subscription.created arrived first", async () => {
    mocks.constructWebhookEvent.mockResolvedValue({
      id: "evt_checkout_sub",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          metadata: { userId: "user_1" },
          customer: "cus_1",
          subscription: "sub_1",
          customer_details: { email: "player@example.com" },
        },
      },
    });
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.resolveUserForCustomer.mockResolvedValue({ id: "user_1", email: "player@example.com", name: null, tier: "free" });
    mocks.bestTierForCustomer.mockResolvedValue("creator");

    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mocks.resolveUserForCustomer).toHaveBeenCalledWith("cus_1", { userId: "user_1", email: "player@example.com" });
    expect(mocks.bestTierForCustomer).toHaveBeenCalledWith("cus_1");
    expect(mocks.updateUserTier).toHaveBeenCalledWith("user_1", "creator");
  });

  it("links the user via subscription metadata when the customer id is not stored yet", async () => {
    mocks.constructWebhookEvent.mockResolvedValue({
      id: "evt_sub_created",
      type: "customer.subscription.created",
      data: {
        object: {
          customer: "cus_new",
          status: "active",
          metadata: { userId: "user_2" },
          items: { data: [{ price: { id: "price_creator" } }] },
        },
      },
    });
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.resolveUserForCustomer.mockResolvedValue({ id: "user_2", email: "b@example.com", name: null, tier: "free" });
    mocks.bestTierForCustomer.mockResolvedValue("creator");

    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mocks.resolveUserForCustomer).toHaveBeenCalledWith("cus_new", { userId: "user_2" });
    expect(mocks.updateUserTier).toHaveBeenCalledWith("user_2", "creator");
  });

  it("credits nothing for a pack checkout that completed unpaid", async () => {
    mocks.markStripeEventProcessed.mockResolvedValue(true);

    const res = await deliverEvent({
      id: "evt_pack_unpaid",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "payment",
          payment_status: "unpaid",
          metadata: { userId: "user_1", packId: "pack_small" },
          customer: "cus_1",
        },
      },
    });

    expect(res.status).toBe(200);
    expect(mocks.addAiMinutes).not.toHaveBeenCalled();
    expect(mocks.sendPushToUser).not.toHaveBeenCalled();
  });

  it("credits a pack when its delayed payment succeeds", async () => {
    mocks.markStripeEventProcessed.mockResolvedValue(true);

    const res = await deliverEvent({
      id: "evt_pack_async_paid",
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          mode: "payment",
          payment_status: "paid",
          metadata: { userId: "user_1", packId: "pack_small" },
          customer: "cus_1",
        },
      },
    });

    expect(res.status).toBe(200);
    expect(mocks.addAiMinutes).toHaveBeenCalledWith("user_1", 30);
  });

  it.each(["unpaid", "canceled"])("downgrades to free when the subscription becomes %s", async (status) => {
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.resolveUserForCustomer.mockResolvedValue({ id: "user_3", email: "c@example.com", name: null, tier: "creator" });
    mocks.bestTierForCustomer.mockResolvedValue("free");

    const res = await deliverEvent({
      id: `evt_sub_${status}`,
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_3", status, items: { data: [{ price: { id: "price_creator" } }] } } },
    });

    expect(res.status).toBe(200);
    expect(mocks.bestTierForCustomer).toHaveBeenCalledWith("cus_3");
    expect(mocks.updateUserTier).toHaveBeenCalledWith("user_3", "free");
    expect(mocks.sendUpgradeEmail).not.toHaveBeenCalled();
  });

  it("does not re-grant a canceled plan from a stale active snapshot", async () => {
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.resolveUserForCustomer.mockResolvedValue({ id: "user_3", email: "c@example.com", name: null, tier: "free" });
    mocks.bestTierForCustomer.mockResolvedValue("free");

    const res = await deliverEvent({
      id: "evt_sub_stale_retry",
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_3", status: "active", items: { data: [{ price: { id: "price_creator" } }] } } },
    });

    expect(res.status).toBe(200);
    expect(mocks.updateUserTier).not.toHaveBeenCalled();
  });

  it("keeps a remaining subscription's tier when another one is deleted", async () => {
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.findUserByStripeCustomerId.mockResolvedValue({ id: "user_4", email: "d@example.com", name: null, tier: "creator" });
    mocks.bestTierForCustomer.mockResolvedValue("storyteller");

    const res = await deliverEvent({
      id: "evt_sub_deleted_one_of_two",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_4" } },
    });

    expect(res.status).toBe(200);
    expect(mocks.bestTierForCustomer).toHaveBeenCalledWith("cus_4");
    expect(mocks.updateUserTier).toHaveBeenCalledWith("user_4", "storyteller");
    expect(mocks.updateUserTier).not.toHaveBeenCalledWith("user_4", "free");
    expect(mocks.sendUpgradeEmail).not.toHaveBeenCalled();
  });

  it("leaves the tier alone when the deleted plan was not the best one", async () => {
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.findUserByStripeCustomerId.mockResolvedValue({ id: "user_4", email: "d@example.com", name: null, tier: "creator" });
    mocks.bestTierForCustomer.mockResolvedValue("creator");

    const res = await deliverEvent({
      id: "evt_sub_deleted_lesser",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_4" } },
    });

    expect(res.status).toBe(200);
    expect(mocks.updateUserTier).not.toHaveBeenCalled();
  });

  it("downgrades to free when the last subscription is deleted", async () => {
    mocks.markStripeEventProcessed.mockResolvedValue(true);
    mocks.findUserByStripeCustomerId.mockResolvedValue({ id: "user_4", email: "d@example.com", name: null, tier: "storyteller" });
    mocks.bestTierForCustomer.mockResolvedValue("free");

    const res = await deliverEvent({
      id: "evt_sub_deleted_last",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_4" } },
    });

    expect(res.status).toBe(200);
    expect(mocks.updateUserTier).toHaveBeenCalledWith("user_4", "free");
  });
});
