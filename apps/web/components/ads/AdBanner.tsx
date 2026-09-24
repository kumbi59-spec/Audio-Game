"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCanWeb } from "@/store/entitlements-store";

const PUB_ID = process.env["NEXT_PUBLIC_ADSENSE_PUB_ID"];
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
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
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
 * Renders an ad banner for free-tier users.
 * Shows a real AdSense unit when NEXT_PUBLIC_ADSENSE_PUB_ID is set,
 * otherwise falls back to an upgrade prompt.
 * Returns null for paid users (showAds = false).
 */
export function AdBanner({ visible = true }: { visible?: boolean }) {
  const { showAds } = useCanWeb();
  if (!showAds || !visible) return null;

  if (PUB_ID && AD_SLOT) {
    return <AdSenseUnit pubId={PUB_ID} slot={AD_SLOT} />;
  }

  return <HouseAd />;
}
