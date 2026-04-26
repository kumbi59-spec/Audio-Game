"use client";

import { create } from "zustand";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import type { Tier, Entitlements } from "@audio-rpg/shared";

interface EntitlementsStore {
  entitlements: Entitlements;
  setTier: (t: Tier) => void;
  setEntitlements: (e: Entitlements) => void;
}

export const useEntitlementsStore = create<EntitlementsStore>((set) => ({
  entitlements: TIER_ENTITLEMENTS.free,
  setTier: (t) => set({ entitlements: TIER_ENTITLEMENTS[t] }),
  setEntitlements: (e) => set({ entitlements: e }),
}));

export function useCanWeb() {
  const { entitlements } = useEntitlementsStore();
  return {
    bibleUpload: entitlements.bibleUpload,
    worldWizard: entitlements.worldWizard,
    showAds: entitlements.showAds,
    aiMinutesRemaining: entitlements.aiMinutesRemaining,
    tier: entitlements.tier,
    publicPublishing: entitlements.publicPublishing,
  };
}

export function loadEntitlementsFromStorage() {
  const stored = localStorage.getItem("echoquest-tier");
  if (stored) {
    const { setTier } = useEntitlementsStore.getState();
    setTier(stored as Tier);
  }
}
