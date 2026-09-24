"use client";

import { useEffect, useRef, useState } from "react";
import { useCanWeb } from "@/store/entitlements-store";
import { useServerShowsAds } from "./AdsServerContext";
import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

const SLOT_ID = "adsterra-native-slot";

declare global {
  interface Window {
    /** Set by the server-rendered banner markup once the browser has run its scripts. */
    __eqNativeBannerSSR?: boolean;
  }
}

/**
 * Adsterra native banner. The invoke script fills the element with the fixed
 * container id, so render at most one of these per page.
 *
 * For free-tier sessions the server writes Adsterra's standard snippet
 * (script + container) straight into the HTML, so it appears in "View page
 * source" and runs as the page loads. Scripts inside HTML that React inserts
 * later (client-side navigation, ad preview) never run, so in that case the
 * effect injects the script itself.
 */
export function AdsterraNativeBanner({ visible = true }: { visible?: boolean }) {
  const { showAds } = useCanWeb();
  const serverShowsAds = useServerShowsAds();
  const ref = useRef<HTMLElement>(null);
  const show = ADSTERRA_ENABLED && showAds && visible;

  const container = `<div id="${ADSTERRA.nativeBannerContainerId}"></div>`;
  const serverHtml = serverShowsAds
    ? container +
      `<script>window.__eqNativeBannerSSR=true</script>` +
      `<script async="async" data-cfasync="false" src="${ADSTERRA.nativeBannerSrc}"></script>`
    : container;
  // By the time React hydrates, the ad script may already have filled the
  // container. Adopt whatever markup is on the page so React never resets it
  // back to the empty server version (and never touches it afterwards).
  const [html] = useState(() => {
    // Only while hydrating the server-rendered snippet; later mounts start fresh.
    if (typeof window === "undefined" || !window.__eqNativeBannerSSR) return serverHtml;
    return document.getElementById(SLOT_ID)?.innerHTML ?? serverHtml;
  });

  useEffect(() => {
    const host = ref.current;
    if (!show || !host) return;
    if (window.__eqNativeBannerSSR) {
      // The browser already ran the server-rendered snippet for this page load.
      window.__eqNativeBannerSSR = false;
      return;
    }
    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.src = ADSTERRA.nativeBannerSrc;
    host.appendChild(s);
    return () => {
      s.remove();
    };
  }, [show]);

  if (!show) return null;

  return (
    <aside
      id={SLOT_ID}
      aria-label="Advertisement"
      className="my-4"
      ref={ref}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
