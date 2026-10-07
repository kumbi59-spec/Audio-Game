import { describe, expect, it } from "vitest";
import { effectiveShowAds } from "./hide-ads";

describe("effectiveShowAds", () => {
  it("shows ads to a free player who hasn't hidden them", () => {
    expect(effectiveShowAds({ entitled: true, hideAds: false, adPreview: false })).toBe(true);
  });

  it("hides them when the player switches ads off, whatever the tier", () => {
    expect(effectiveShowAds({ entitled: true, hideAds: true, adPreview: false })).toBe(false);
  });

  it("never shows them to paid tiers", () => {
    expect(effectiveShowAds({ entitled: false, hideAds: false, adPreview: false })).toBe(false);
  });

  it("shows them in ad preview, so placements can still be checked", () => {
    expect(effectiveShowAds({ entitled: false, hideAds: true, adPreview: true })).toBe(true);
  });
});
