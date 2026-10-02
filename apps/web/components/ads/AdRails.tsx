"use client";

import { usePathname } from "next/navigation";
import { useCanWeb } from "@/store/entitlements-store";
import { AdsterraBanner } from "./AdsterraBanner";
import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";
import { MobileAdSlot } from "./MobileAdSlot";
import { useIsWideScreen } from "./useIsWideScreen";

/**
 * Routes whose content column is narrow (max-w-3xl / 4xl) and so leaves empty
 * gutters on wide screens. The rails only render there, and only at xl+
 * widths, where a 160px rail fits beside the column without overlapping it.
 */
const RAIL_PREFIXES = ["/blog", "/seo", "/campaigns", "/about", "/discussion", "/forks"];

function showRailsOn(pathname: string): boolean {
  return pathname === "/" || RAIL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Pages that place their own native banner (the home page's mobile slot, the
 * in-article banner on blog posts). The narrow-screen fallback slot skips
 * them, since only one native banner can be on a page.
 */
function pageHasOwnNative(pathname: string): boolean {
  return pathname === "/" || /^\/blog\/[^/]+/.test(pathname);
}

/** Clearly-labelled sponsored card that opens the Adsterra smartlink. */
function SponsoredCard() {
  if (!ADSTERRA_ENABLED) return null;
  return (
    <a
      href={ADSTERRA.smartlinkUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="block rounded-xl border p-4 text-center transition-opacity hover:opacity-90"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <span className="block text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Sponsored
      </span>
      <span className="mt-2 block text-sm font-semibold" style={{ color: "var(--text)" }}>
        Explore offers from our partners
      </span>
      <span
        className="mt-3 inline-block rounded px-3 py-1.5 text-xs font-semibold"
        style={{ backgroundColor: "var(--accent-solid)", color: "var(--on-accent)" }}
      >
        Take a look
      </span>
      <span className="sr-only"> (advertisement, opens in a new tab)</span>
    </a>
  );
}

/**
 * Adsterra counts each banner code once per page: the same code twice on a
 * page breaks its stats. The account has one 160×600 unit, so only the right
 * rail carries it; the left rail holds the sponsored card.
 */
function Rail({ side }: { side: "left" | "right" }) {
  return (
    <aside
      aria-label="Advertisement"
      className={`fixed top-20 z-10 hidden w-[160px] flex-col gap-4 xl:flex ${side === "left" ? "left-4" : "right-4"}`}
    >
      {side === "right" ? <AdsterraBanner /> : <SponsoredCard />}
    </aside>
  );
}

/**
 * Side-rail ads for free-tier users, filling the empty gutters beside narrow
 * content pages. Rendered after the page content so screen readers reach the
 * article first.
 *
 * The rails only mount at xl widths: a CSS-hidden iframe still loads its ad,
 * which on phones meant invisible impressions and no visible ad. Below xl a
 * responsive in-flow slot takes their place, except on pages that place their
 * own native banner.
 */
export function AdRails() {
  const { showAds } = useCanWeb();
  const pathname = usePathname() ?? "";
  const wide = useIsWideScreen();
  if (!showAds || !showRailsOn(pathname) || wide === null) return null;
  if (!wide) return pageHasOwnNative(pathname) ? null : <MobileAdSlot />;
  return (
    <>
      <Rail side="left" />
      <Rail side="right" />
    </>
  );
}
