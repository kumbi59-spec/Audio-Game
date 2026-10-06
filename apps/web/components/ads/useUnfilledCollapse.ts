"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Ad slots reserve their height from the first render so the page doesn't
 * jump when the ad arrives. If the network hasn't filled the slot after `ms`,
 * this reports `true` so the caller can give that reserved space back.
 *
 * It never removes the ad itself. Ad networks can take well over `ms` on a
 * phone, and an ad that fills late still has to be on the page to show (and
 * to count as an impression).
 */
export function useUnfilledCollapse(active: boolean, ms = 8000): [RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [unfilled, setUnfilled] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      const el = ref.current;
      const filled = !!el?.querySelector('[id^="container-"] > *, iframe, ins[data-ad-status="filled"]');
      if (!filled) setUnfilled(true);
    }, ms);
    return () => clearTimeout(timer);
  }, [active, ms]);
  return [ref, unfilled];
}
