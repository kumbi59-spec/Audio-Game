"use client";

import { usePathname } from "next/navigation";
import { useCanWeb } from "@/store/entitlements-store";
import { AdSenseRailUnit } from "./AdBanner";
import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

/**
 * Routes whose content column is narrow (max-w-3xl / 4xl) and so leaves empty
 * gutters on wide screens. The rails only render there, and only at xl+
 * widths, where a 160px rail fits beside the column without overlapping it.
 */
const RAIL_PREFIXES = ["/blog", "/seo", "/campaigns", "/about", "/discussion", "/forks"];

function showRailsOn(pathname: string): boolean {
  return pathname === "/" || RAIL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
      >
        Take a look
      </span>
      <span className="sr-only"> (advertisement, opens in a new tab)</span>
    </a>
  );
}

function Rail({ side }: { side: "left" | "right" }) {
  return (
    <aside
      aria-label="Advertisement"
      className={`fixed top-20 z-10 hidden w-[160px] flex-col gap-4 xl:flex ${side === "left" ? "left-4" : "right-4"}`}
    >
      <SponsoredCard />
      <AdSenseRailUnit />
    </aside>
  );
}

/**
 * Desktop side-rail ads for free-tier users, filling the empty gutters beside
 * narrow content pages. Rendered after the page content so screen readers
 * reach the article first.
 */
export function AdRails() {
  const { showAds } = useCanWeb();
  const pathname = usePathname() ?? "";
  if (!showAds || !showRailsOn(pathname)) return null;
  return (
    <>
      <Rail side="left" />
      <Rail side="right" />
    </>
  );
}
