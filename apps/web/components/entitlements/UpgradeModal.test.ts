import { describe, expect, it } from "vitest";
import { STRIPE_PRICES } from "@/lib/payments/stripe";
import { upgradeCheckoutUrl } from "./UpgradeModal";

describe("UpgradeModal checkout link", () => {
  it.each(["storyteller", "creator"] as const)("opens checkout for the %s monthly price key", (tier) => {
    const url = new URL(upgradeCheckoutUrl(tier), "https://echoquest.us");
    expect(url.pathname).toBe("/api/payments/checkout");
    expect(url.searchParams.get("tier")).toBe(`${tier}_monthly`);
    // The checkout route only accepts price keys; a bare tier bounces to /#pricing.
    expect(Object.keys(STRIPE_PRICES)).toContain(url.searchParams.get("tier"));
  });
});
