import { create } from "zustand";
import type { Entitlements, Tier } from "@audio-rpg/shared";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";

interface EntitlementSlice {
  entitlements: Entitlements;
  setTier: (tier: Tier) => void;
  setEntitlements: (e: Entitlements) => void;
}

export const useEntitlements = create<EntitlementSlice>((set) => ({
  entitlements: TIER_ENTITLEMENTS.free,

  setTier: (tier) => set({ entitlements: TIER_ENTITLEMENTS[tier] }),

  setEntitlements: (entitlements) => set({ entitlements }),
}));

/** Convenience selector — avoids re-renders when unrelated fields change. */
export function useCan() {
  const e = useEntitlements((s) => s.entitlements);
  return {
    premiumTts: e.premiumTts,
    bibleUpload: e.bibleUpload,
    worldWizard: e.worldWizard,
    publicPublishing: e.publicPublishing,
    maxCampaigns: e.maxCampaigns,
    sessionTurnLimit: e.sessionTurnLimit,
    showAds: e.showAds,
    aiMinutesRemaining: e.aiMinutesRemaining,
    tier: e.tier,
  };
}
