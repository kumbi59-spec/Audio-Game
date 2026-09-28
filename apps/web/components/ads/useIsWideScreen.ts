"use client";

import { useEffect, useState } from "react";

/** Width at which the desktop side rails fit (Tailwind `xl`). */
export const RAIL_MIN_WIDTH_PX = 1280;

/**
 * `true` at rail widths, `false` below, `null` until mounted (the server
 * can't know the viewport, so callers render nothing until then).
 */
export function useIsWideScreen(): boolean | null {
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${RAIL_MIN_WIDTH_PX}px)`);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}
