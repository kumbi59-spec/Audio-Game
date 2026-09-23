"use client";

import { useCanWeb } from "@/store/entitlements-store";
import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

/** Adsterra smartlink rendered as a clearly-labelled sponsored link (free tier only). */
export function AdsterraSmartlink({ className }: { className?: string }) {
  const { showAds } = useCanWeb();
  if (!ADSTERRA_ENABLED || !showAds) return null;
  return (
    <a
      href={ADSTERRA.smartlinkUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={className ?? "hover:underline"}
    >
      Sponsored
      <span className="sr-only"> (advertisement, opens in a new tab)</span>
    </a>
  );
}
