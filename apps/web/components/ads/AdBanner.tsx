"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCanWeb } from "@/store/entitlements-store";
import { ADSENSE_ENABLED } from "./adsense-config";
import { AdsterraBanner } from "./AdsterraBanner";
import { useIsWideScreen } from "./useIsWideScreen";

/**
 * AdSense needs `data-ad-client` in its "ca-pub-…" form. The env var has been
 * set as the bare "pub-…" id (the ads.txt form), which AdSense treats as an
 * unknown client: the unit reports "unfilled" and collapses right after it
 * appears. Accept either form (or just the digits).
 */
export function adClientId(raw: string | undefined): string | undefined {
  const id = raw?.trim();
  if (!id) return undefined;
  if (id.startsWith("ca-pub-")) return id;
  if (id.startsWith("pub-")) return `ca-${id}`;
  return /^\d+$/.test(id) ? `ca-pub-${id}` : id;
}

const PUB_ID = adClientId(process.env["NEXT_PUBLIC_ADSENSE_PUB_ID"]);
const AD_SLOT = process.env["NEXT_PUBLIC_ADSENSE_SLOT"];

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/** House-ad fallback shown when AdSense isn't configured. */
function HouseAd() {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-2 text-xs"
      style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}
      aria-label="Advertisement — upgrade to remove ads"
    >
      <span style={{ color: "var(--text-muted)" }}>
        Playing free — ads keep EchoQuest running.
      </span>
      <Link
        href="/account"
        className="rounded px-2 py-1 text-xs font-semibold hover:opacity-90"
        style={{ backgroundColor: "var(--accent-solid)", color: "var(--on-accent)" }}
      >
        Upgrade to remove ads
      </Link>
    </div>
  );
}

/**
 * Google AdSense banner. Initialises the ad unit after mount and hides the
 * whole slot when AdSense reports it as unfilled, so no blank box is left.
 */
function AdSenseUnit({ pubId, slot }: { pubId: string; slot: string }) {
  const initialised = useRef(false);
  const insRef = useRef<HTMLModElement>(null);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet — script still initialising.
    }
  }, []);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;
    const check = () => setUnfilled(ins.getAttribute("data-ad-status") === "unfilled");
    check();
    const observer = new MutationObserver(check);
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="flex justify-center overflow-hidden"
      style={unfilled ? { display: "none" } : { borderTop: "1px solid var(--border)", minHeight: 50 }}
      aria-label="Advertisement"
      aria-hidden={unfilled || undefined}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: 50 }}
        data-ad-client={pubId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Adsterra display banner (the account's 160×600 display unit) for in-content
 * spots on narrow screens. On wide screens the side rails already carry that
 * unit, so nothing is added there.
 */
function AdsterraDisplaySlot() {
  const wide = useIsWideScreen();
  if (wide !== false) return null;
  return (
    <div className="flex justify-center py-2" aria-label="Advertisement">
      <AdsterraBanner />
    </div>
  );
}

/**
 * In-content ad slot for free-tier users. The site's ads are Adsterra, so by
 * default this is the Adsterra display banner (`fallback="display"`, phones
 * and tablets only) or nothing (`fallback="none"`, e.g. in-game, where the
 * Adsterra native banner fills the ad turn). Only when AdSense is enabled
 * (adsense-config.ts) does it show an AdSense unit (or, with no unit
 * configured, the built-in house banner). Returns null for paid users.
 */
export function AdBanner({
  visible = true,
  fallback = "display",
}: {
  visible?: boolean;
  fallback?: "display" | "none";
}) {
  const { showAds } = useCanWeb();
  if (!showAds || !visible) return null;
  if (!ADSENSE_ENABLED) return fallback === "display" ? <AdsterraDisplaySlot /> : null;

  if (PUB_ID && AD_SLOT) {
    return <AdSenseUnit pubId={PUB_ID} slot={AD_SLOT} />;
  }

  return <HouseAd />;
}
