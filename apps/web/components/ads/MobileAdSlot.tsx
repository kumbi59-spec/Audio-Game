"use client";

import { useCanWeb } from "@/store/entitlements-store";
import { AdsterraNativeBanner } from "./AdsterraNativeBanner";
import { useServerShowsAds } from "./AdsServerContext";
import { ADSTERRA_ENABLED } from "./adsterra-config";
import { useIsWideScreen } from "./useIsWideScreen";
import { useUnfilledCollapse } from "./useUnfilledCollapse";

/**
 * In-flow ad for screens too narrow for the desktop side rails (phones and
 * tablets). Uses the responsive native banner, whose script fills a fixed
 * container id — so only one native banner may be on a page. Callers ensure
 * that (see pageHasOwnNative in AdRails). Renders nothing for paid tiers.
 *
 * The slot's space is reserved from the server render (hidden by CSS on wide
 * screens), so the ad doesn't push the page down when it arrives; the banner
 * itself only loads once the screen is known to be narrow.
 */
export function MobileAdSlot({ className = "mx-auto my-6 max-w-3xl px-4" }: { className?: string }) {
  const { showAds } = useCanWeb();
  const serverShowsAds = useServerShowsAds();
  const wide = useIsWideScreen();
  const narrow = wide === false;
  const [ref, unfilled] = useUnfilledCollapse(narrow && showAds);
  const reserve = ADSTERRA_ENABLED && (wide === null ? serverShowsAds : showAds && narrow);
  if (!reserve || unfilled) return null;
  return (
    <aside ref={ref} aria-label="Advertisement" className={`ad-slot min-h-[280px] xl:hidden ${className}`}>
      {/* Hidden until the ad network actually fills the banner (globals.css). */}
      <p className="ad-slot-label mb-1 text-center text-[10px] uppercase tracking-wider text-muted">
        Advertisement
      </p>
      {narrow && <AdsterraNativeBanner />}
    </aside>
  );
}
