"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCanWeb } from "@/store/entitlements-store";
import { ADSTERRA, ADSTERRA_ENABLED, ADSTERRA_EXCLUDED_PREFIXES } from "./adsterra-config";
import { SOCIAL_BAR_SCRIPT_ID } from "./social-bar";

function injectOnce(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.src = src;
  document.body.appendChild(s);
}

/**
 * Loads Adsterra's page-level format (the social bar) for free-tier users,
 * once per page load, outside of gameplay/admin/auth routes. It can't be
 * unloaded, so links into gameplay use enterAdFreeRoute (./social-bar).
 */
export function AdsterraGlobal() {
  const { showAds } = useCanWeb();
  const pathname = usePathname() ?? "";
  const excluded = ADSTERRA_EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!ADSTERRA_ENABLED || !showAds || excluded) return;
    injectOnce(SOCIAL_BAR_SCRIPT_ID, ADSTERRA.socialBarSrc);
  }, [showAds, excluded]);

  return null;
}
