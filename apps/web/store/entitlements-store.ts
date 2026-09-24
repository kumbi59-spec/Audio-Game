"use client";

import { create } from "zustand";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import type { Tier, Entitlements } from "@audio-rpg/shared";

interface EntitlementsStore {
  entitlements: Entitlements;
  /** Ad preview: show ads even on a paid/admin account (for checking placements). */
  adPreview: boolean;
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

const AD_PREVIEW_KEY = "echoquest-adpreview";

/**
 * Visiting any page with ?adpreview=1 turns ad preview on for the rest of the
 * browser session (?adpreview=0 turns it off), so an admin or paid account can
 * check ad placements without signing out.
 */
function getInitialAdPreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const flag = new URLSearchParams(window.location.search).get("adpreview");
    if (flag === "1") sessionStorage.setItem(AD_PREVIEW_KEY, "1");
    if (flag === "0") sessionStorage.removeItem(AD_PREVIEW_KEY);
    return sessionStorage.getItem(AD_PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export const useEntitlementsStore = create<EntitlementsStore>((set) => ({
  entitlements: getInitialEntitlements(),
  adPreview: getInitialAdPreview(),
  setTier: (t) => set({ entitlements: TIER_ENTITLEMENTS[t] }),
  setEntitlements: (e) => set({ entitlements: e }),
}));

export function useCanWeb() {
  const { entitlements, adPreview } = useEntitlementsStore();
  return {
    bibleUpload: entitlements.bibleUpload,
    worldWizard: entitlements.worldWizard,
    showAds: entitlements.showAds || adPreview,
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
