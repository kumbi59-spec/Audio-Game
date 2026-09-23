"use client";

import { useEffect, useRef } from "react";
import { useCanWeb } from "@/store/entitlements-store";
import { ADSTERRA, ADSTERRA_ENABLED } from "./adsterra-config";

/**
 * Adsterra native banner. The invoke script fills the element with the fixed
 * container id, so render at most one of these per page.
 */
export function AdsterraNativeBanner({ visible = true }: { visible?: boolean }) {
  const { showAds } = useCanWeb();
  const ref = useRef<HTMLDivElement>(null);
  const show = ADSTERRA_ENABLED && showAds && visible;

  useEffect(() => {
    const host = ref.current;
    if (!show || !host) return;
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
    <aside aria-label="Advertisement" className="my-4" ref={ref}>
      <div id={ADSTERRA.nativeBannerContainerId} />
    </aside>
  );
}
