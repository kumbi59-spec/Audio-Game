"use client";

import { create } from "zustand";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import type { Tier, Entitlements } from "@audio-rpg/shared";
import { effectiveShowAds } from "@/lib/ads/hide-ads";
import { useAccessibilityStore } from "@/store/accessibility-store";

interface EntitlementsStore {
  entitlements: Entitlements;
  /** Ad preview: show ads even on a paid/admin account (for checking placements). */
  adPreview: boolean;
  setTier: (t: Tier) => void;
  setEntitlements: (e: Entitlements) => void;
  /** Turn ad preview off for the rest of the browser session. */
  clearAdPreview: () => void;
}

const TIER_KEY = "echoquest-tier";

/**
 * The tier remembered from the last visit, if it's a real one. Storage can be
 * blocked (privacy settings, some embedded browsers), where reading it
 * throws, and this runs when the module loads, so it falls back to null.
 */
function storedTier(): Tier | null {
  try {
    const stored = localStorage.getItem(TIER_KEY);
    if (stored && Object.prototype.hasOwnProperty.call(TIER_ENTITLEMENTS, stored)) return stored as Tier;
  } catch {
    // Storage blocked — start from the free tier.
  }
  return null;
}

export function getInitialEntitlements(): Entitlements {
  if (typeof window === "undefined") return TIER_ENTITLEMENTS.free;
  const stored = storedTier();
  return stored ? TIER_ENTITLEMENTS[stored] : TIER_ENTITLEMENTS.free;
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
  clearAdPreview: () => {
    try {
      sessionStorage.removeItem(AD_PREVIEW_KEY);
    } catch {
      // Storage blocked — the in-memory flag below still turns it off.
    }
    set({ adPreview: false });
  },
}));

export function useCanWeb() {
  const { entitlements, adPreview } = useEntitlementsStore();
  // "Hide ads" in the accessibility settings is free for everyone.
  const hideAds = useAccessibilityStore((s) => s.hideAds);
  return {
    bibleUpload: entitlements.bibleUpload,
    worldWizard: entitlements.worldWizard,
    showAds: effectiveShowAds({ entitled: entitlements.showAds, hideAds, adPreview }),
    aiMinutesRemaining: entitlements.aiMinutesRemaining,
    tier: entitlements.tier,
    publicPublishing: entitlements.publicPublishing,
  };
}

export function loadEntitlementsFromStorage() {
  const stored = storedTier();
  if (stored) {
    const { setTier } = useEntitlementsStore.getState();
    setTier(stored);
  }
}

/** Remembers the signed-in tier for the next visit; null forgets it. */
export function saveTierToStorage(tier: Tier | null): void {
  try {
    if (tier) localStorage.setItem(TIER_KEY, tier);
    else localStorage.removeItem(TIER_KEY);
  } catch {
    // Storage blocked — the tier still applies for this visit.
  }
}
