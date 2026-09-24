import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructWebhookEvent: vi.fn(),
  markStripeEventProcessed: vi.fn(),
  addAiMinutes: vi.fn(),
  sendPushToUser: vi.fn(),
  updateUserTier: vi.fn(),
  resolveUserForCustomer: vi.fn(),
  tierForSubscription: vi.fn(),
  retrieveSubscription: vi.fn(),
}));

vi.mock("@/lib/payments/stripe", () => ({
  constructWebhookEvent: mocks.constructWebhookEvent,
  getStripe: () => ({ subscriptions: { retrieve: mocks.retrieveSubscription } }),
  isPackPriceKey: (key: string) => key === "pack_small",
  minutesForPackKey: () => 30,
}));

vi.mock("@/lib/payments/sync", () => ({
  resolveUserForCustomer: mocks.resolveUserForCustomer,
  tierForSubscription: mocks.tierForSubscription,
}));

vi.mock("@/lib/db/queries/users", () => ({
  updateUserTier: mocks.updateUserTier,
  setStripeCustomerId: vi.fn(),
  findUserByStripeCustomerId: vi.fn(),
  addAiMinutes: mocks.addAiMinutes,
  markStripeEventProcessed: mocks.markStripeEventProcessed,
}));

vi.mock("@/lib/email", () => ({ sendUpgradeEmail: vi.fn() }));
vi.mock("@/lib/push/sender", () => ({ sendPushToUser: mocks.sendPushToUser }));

import { POST } from "./route";

describe("POST /api/payments/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores duplicate webhook deliveries using Stripe event id idempotency", async () => {
    mocks.constructWebhookEvent.mockResolvedValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "payment",
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
    const sub = { status: "active", items: { data: [{ price: { id: "price_creator" } }] } };
    mocks.retrieveSubscription.mockResolvedValue(sub);
    mocks.tierForSubscription.mockReturnValue("creator");

    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(mocks.resolveUserForCustomer).toHaveBeenCalledWith("cus_1", { userId: "user_1", email: "player@example.com" });
    expect(mocks.retrieveSubscription).toHaveBeenCalledWith("sub_1");
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
    mocks.tierForSubscription.mockReturnValue("creator");

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
});
