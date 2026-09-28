"use client";

import { useEffect, useState } from "react";
import { useCanWeb } from "@/store/entitlements-store";
import { AdsterraNativeBanner, NATIVE_SLOT_ID } from "./AdsterraNativeBanner";
import { ADSTERRA_ENABLED } from "./adsterra-config";
import { useIsWideScreen } from "./useIsWideScreen";

// The native banner's invoke script fills a fixed container id, so only one
// may exist per page. The first slot to mount claims it.
let claimed = false;

/**
 * In-flow ad for screens too narrow for the desktop side rails (phones and
 * tablets). Uses the responsive native banner. Renders nothing on wide
 * screens, for paid tiers, or when the page already shows a native banner.
 */
export function MobileAdSlot({ className = "mx-auto my-6 max-w-3xl px-4" }: { className?: string }) {
  const { showAds } = useCanWeb();
  const wide = useIsWideScreen();
  const [owner, setOwner] = useState(false);
  const want = ADSTERRA_ENABLED && showAds && wide === false;

  useEffect(() => {
    if (!want || claimed || document.getElementById(NATIVE_SLOT_ID)) return;
    claimed = true;
    setOwner(true);
    return () => {
      claimed = false;
      setOwner(false);
    };
  }, [want]);

  if (!want || !owner) return null;
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
