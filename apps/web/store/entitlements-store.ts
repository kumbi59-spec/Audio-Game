"use client";

import { create } from "zustand";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import type { Tier, Entitlements } from "@audio-rpg/shared";

interface EntitlementsStore {
  entitlements: Entitlements;
  setTier: (t: Tier) => void;
  setEntitlements: (e: Entitlements) => void;
}

function getInitialEntitlements(): Entitlements {
  if (typeof window === "undefined") return TIER_ENTITLEMENTS.free;
  const stored = localStorage.getItem("echoquest-tier");
  if (stored && Object.prototype.hasOwnProperty.call(TIER_ENTITLEMENTS, stored)) {
    return TIER_ENTITLEMENTS[stored as Tier];
  }
  return TIER_ENTITLEMENTS.free;
}

export const useEntitlementsStore = create<EntitlementsStore>((set) => ({
  entitlements: getInitialEntitlements(),
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
