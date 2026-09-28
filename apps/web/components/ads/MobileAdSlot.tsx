"use client";

import { useCanWeb } from "@/store/entitlements-store";
import { AdsterraNativeBanner } from "./AdsterraNativeBanner";
import { ADSTERRA_ENABLED } from "./adsterra-config";
import { useIsWideScreen } from "./useIsWideScreen";

/**
 * In-flow ad for screens too narrow for the desktop side rails (phones and
 * tablets). Uses the responsive native banner, whose script fills a fixed
 * container id — so only one native banner may be on a page. Callers ensure
 * that (see pageHasOwnNative in AdRails). Renders nothing on wide screens
 * or for paid tiers.
 */
export function MobileAdSlot({ className = "mx-auto my-6 max-w-3xl px-4" }: { className?: string }) {
  const { showAds } = useCanWeb();
  const wide = useIsWideScreen();
  if (!ADSTERRA_ENABLED || !showAds || wide !== false) return null;
  return (
    <div className={`ad-slot ${className}`}>
      {/* Hidden until the ad network actually fills the banner (globals.css). */}
      <p className="ad-slot-label mb-1 text-center text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Advertisement
      </p>
      <AdsterraNativeBanner />
    </div>
  );
}
