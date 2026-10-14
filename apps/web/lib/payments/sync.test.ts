import { beforeEach, describe, expect, it, vi } from "vitest";

type UserRow = { id: string; email: string; emailVerified: Date | null; stripeCustomerId: string | null; tier: string };
type Where = {
  id?: string;
  stripeCustomerId?: string;
  email?: { equals: string; mode: "insensitive" };
  emailVerified?: { not: null };
};

const db = vi.hoisted(() => {
  process.env["STRIPE_PRICE_STORYTELLER_MONTHLY"] = "price_storyteller";
  process.env["STRIPE_PRICE_CREATOR_MONTHLY"] = "price_creator";
  return { users: [] as UserRow[], subscriptions: [] as Array<{ status: string; priceId: string }> };
});

vi.mock("@/lib/db", () => {
  const matches = (u: UserRow, where: Where) =>
    (where.id === undefined || u.id === where.id) &&
    (where.stripeCustomerId === undefined || u.stripeCustomerId === where.stripeCustomerId) &&
    (!where.email || u.email.toLowerCase() === where.email.equals.toLowerCase()) &&
    (!where.emailVerified || u.emailVerified !== null);
  return {
    prisma: {
      user: {
        findFirst: async ({ where }: { where: Where }) => db.users.find((u) => matches(u, where)) ?? null,
        findUnique: async ({ where }: { where: Where }) => db.users.find((u) => matches(u, where)) ?? null,
        update: async ({ where, data }: { where: { id: string }; data: Partial<UserRow> }) => {
          const user = db.users.find((u) => u.id === where.id)!;
          Object.assign(user, data);
          return user;
        },
      },
    },
  };
});

vi.mock("@/lib/payments/stripe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/payments/stripe")>()),
  getStripe: () => ({
    customers: { retrieve: async () => ({ email: "player@example.com" }) },
    subscriptions: {
      list: async () => ({
        data: db.subscriptions.map((s) => ({ status: s.status, items: { data: [{ price: { id: s.priceId } }] } })),
      }),
    },
  }),
}));

import { bestTierForCustomer, resolveUserForCustomer } from "./sync";

describe("resolveUserForCustomer", () => {
  beforeEach(() => {
    db.users = [];
  });

  it("links the customer by email when the account's email is verified", async () => {
    db.users.push({ id: "u1", email: "Player@example.com", emailVerified: new Date(), stripeCustomerId: null, tier: "free" });

    const user = await resolveUserForCustomer("cus_1", { email: "player@example.com" });

    expect(user?.id).toBe("u1");
    expect(db.users[0]!.stripeCustomerId).toBe("cus_1");
  });

  it("does not link a customer to an unverified account with the same email", async () => {
    db.users.push({ id: "squatter", email: "player@example.com", emailVerified: null, stripeCustomerId: null, tier: "free" });

    expect(await resolveUserForCustomer("cus_1", { email: "player@example.com" })).toBeNull();
    // Nor through the email on the Stripe customer itself.
    expect(await resolveUserForCustomer("cus_1")).toBeNull();
    expect(db.users[0]!.stripeCustomerId).toBeNull();
  });

  it("still trusts the userId from our own checkout metadata", async () => {
    db.users.push({ id: "u2", email: "new@example.com", emailVerified: null, stripeCustomerId: null, tier: "free" });

    const user = await resolveUserForCustomer("cus_2", { userId: "u2" });

    expect(user?.id).toBe("u2");
    expect(db.users[0]!.stripeCustomerId).toBe("cus_2");
  });
});

describe("bestTierForCustomer", () => {
  beforeEach(() => {
    db.subscriptions = [];
  });

  it("is free when no subscription is entitled", async () => {
    db.subscriptions.push({ status: "canceled", priceId: "price_creator" }, { status: "unpaid", priceId: "price_storyteller" });
    expect(await bestTierForCustomer("cus_1")).toBe("free");
  });

  it("prefers Creator over Storyteller", async () => {
    db.subscriptions.push({ status: "active", priceId: "price_storyteller" }, { status: "trialing", priceId: "price_creator" });
    expect(await bestTierForCustomer("cus_1")).toBe("creator");
  });

  it("keeps the remaining entitled plan when another is canceled", async () => {
    db.subscriptions.push({ status: "canceled", priceId: "price_creator" }, { status: "active", priceId: "price_storyteller" });
    expect(await bestTierForCustomer("cus_1")).toBe("storyteller");
  });
});
