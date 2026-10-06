import { describe, expect, it } from "vitest";
import { mobileAdSlotState } from "./MobileAdSlot";

const phone = { enabled: true, wide: false, showAds: true, serverShowsAds: true } as const;

describe("mobileAdSlotState", () => {
  it("keeps the slot and its banner when the ad hasn't filled yet", () => {
    // A slow network must not cost the impression: only the reserved space goes.
    expect(mobileAdSlotState({ ...phone, unfilled: true })).toEqual({
      render: true,
      mountBanner: true,
      reserveHeight: false,
    });
  });

  it("reserves the height while waiting for the ad", () => {
    expect(mobileAdSlotState({ ...phone, unfilled: false })).toEqual({
      render: true,
      mountBanner: true,
      reserveHeight: true,
    });
  });

  it("holds space from the server render, before the screen width is known", () => {
    expect(mobileAdSlotState({ ...phone, wide: null, unfilled: false })).toMatchObject({
      render: true,
      mountBanner: false,
    });
    expect(mobileAdSlotState({ ...phone, wide: null, serverShowsAds: false, unfilled: false }).render).toBe(false);
  });

  it("renders nothing on wide screens, for paid tiers, or with ads off", () => {
    expect(mobileAdSlotState({ ...phone, wide: true, unfilled: false }).render).toBe(false);
    expect(mobileAdSlotState({ ...phone, showAds: false, unfilled: false }).render).toBe(false);
    expect(mobileAdSlotState({ ...phone, enabled: false, unfilled: false }).render).toBe(false);
  });
});
