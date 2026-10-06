"use client";

import { useCanWeb } from "@/store/entitlements-store";
import { AdsterraNativeBanner } from "./AdsterraNativeBanner";
import { useServerShowsAds } from "./AdsServerContext";
import { ADSTERRA_ENABLED } from "./adsterra-config";
import { useIsWideScreen } from "./useIsWideScreen";
import { useUnfilledCollapse } from "./useUnfilledCollapse";

/**
 * What the mobile slot renders. `unfilled` (no ad yet after the wait) only
 * gives back the reserved height: the slot and its banner stay mounted, so a
 * slow ad still appears and counts when it arrives.
 */
export function mobileAdSlotState(opts: {
  enabled: boolean;
  wide: boolean | null;
  showAds: boolean;
  serverShowsAds: boolean;
  unfilled: boolean;
}): { render: boolean; mountBanner: boolean; reserveHeight: boolean } {
  const narrow = opts.wide === false;
  const render = opts.enabled && (opts.wide === null ? opts.serverShowsAds : opts.showAds && narrow);
  return { render, mountBanner: render && narrow, reserveHeight: !opts.unfilled };
}

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
  const [ref, unfilled] = useUnfilledCollapse(wide === false && showAds);
  const slot = mobileAdSlotState({ enabled: ADSTERRA_ENABLED, wide, showAds, serverShowsAds, unfilled });
  if (!slot.render) return null;
  return (
    <aside
      ref={ref}
      aria-label="Advertisement"
      className={`ad-slot xl:hidden ${slot.reserveHeight ? "min-h-[280px]" : ""} ${className}`}
    >
      {/* Hidden until the ad network actually fills the banner (globals.css). */}
      <p className="ad-slot-label mb-1 text-center text-[10px] uppercase tracking-wider text-muted">
        Advertisement
      </p>
      {slot.mountBanner && <AdsterraNativeBanner />}
    </aside>
  );
}
