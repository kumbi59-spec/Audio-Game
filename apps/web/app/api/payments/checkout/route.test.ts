import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: vi.fn().mockResolvedValue(null) } } }));
vi.mock("@/lib/payments/stripe", () => ({
  STRIPE_PRICES: { storyteller_monthly: "price_1", pack_small: "price_2" },
  isPackPriceKey: (k: string) => k.startsWith("pack_"),
  createCheckoutSession: mocks.createCheckoutSession,
}));

import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const env = process.env as Record<string, string | undefined>;
let savedSiteUrl: string | undefined;

describe("checkout return URLs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedSiteUrl = env["NEXT_PUBLIC_SITE_URL"];
    env["NEXT_PUBLIC_SITE_URL"] = "https://echoquest.us";
    mocks.auth.mockResolvedValue(null);
    mocks.createCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/c/1" });
  });
  afterEach(() => {
    if (savedSiteUrl === undefined) delete env["NEXT_PUBLIC_SITE_URL"];
    else env["NEXT_PUBLIC_SITE_URL"] = savedSiteUrl;
  });

  it("POST rejects a forged Origin", async () => {
    const res = await POST(new NextRequest("https://echoquest.us/api/payments/checkout", {
      method: "POST",
      headers: { origin: "https://evil.example", "content-type": "application/json" },
      body: JSON.stringify({ priceKey: "pack_small" }),
    }));
    expect(res.status).toBe(403);
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("POST rejects a missing Origin", async () => {
    const res = await POST(new NextRequest("https://echoquest.us/api/payments/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ priceKey: "pack_small" }),
    }));
    expect(res.status).toBe(403);
  });

  it("POST builds return URLs from the canonical site URL", async () => {
    const res = await POST(new NextRequest("https://echoquest.us/api/payments/checkout", {
      method: "POST",
      headers: { origin: "https://echoquest.us", host: "evil.example", "content-type": "application/json" },
      body: JSON.stringify({ priceKey: "pack_small" }),
    }));
    expect(res.status).toBe(200);
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith("pack_small", expect.objectContaining({
      successUrl: "https://echoquest.us/account?pack_purchased=true",
      cancelUrl: "https://echoquest.us/account",
    }));
  });

  it("GET ignores a forged Host when building return URLs", async () => {
    const res = await GET(new NextRequest("https://evil.example/api/payments/checkout?tier=storyteller_monthly", {
      headers: { host: "evil.example" },
    }));
    expect(res.status).toBe(307);
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith("storyteller_monthly", expect.objectContaining({
      successUrl: "https://echoquest.us/?upgraded=true",
      cancelUrl: "https://echoquest.us/",
    }));
  });
});
