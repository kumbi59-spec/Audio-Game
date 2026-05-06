import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructWebhookEvent: vi.fn(),
  markStripeEventProcessed: vi.fn(),
  hasProcessedStripeEvent: vi.fn(),
  addAiMinutes: vi.fn(),
  sendPushToUser: vi.fn(),
}));

vi.mock("@/lib/payments/stripe", () => ({
  constructWebhookEvent: mocks.constructWebhookEvent,
  tierForPriceKey: vi.fn(),
  isPackPriceKey: (key: string) => key === "pack_small",
  minutesForPackKey: () => 30,
  STRIPE_PRICES: {},
}));

vi.mock("@/lib/db/queries/users", () => ({
  updateUserTier: vi.fn(),
  setStripeCustomerId: vi.fn(),
  findUserByStripeCustomerId: vi.fn(),
  addAiMinutes: mocks.addAiMinutes,
  hasProcessedStripeEvent: mocks.hasProcessedStripeEvent,
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
    mocks.hasProcessedStripeEvent.mockResolvedValue(true);

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
    mocks.hasProcessedStripeEvent.mockResolvedValue(false);
    mocks.addAiMinutes.mockRejectedValue(new Error("transient db outage"));

    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: JSON.stringify({ any: "payload" }),
    });

    const res = await POST(req as never);

    expect(res.status).toBe(500);
  });
});
