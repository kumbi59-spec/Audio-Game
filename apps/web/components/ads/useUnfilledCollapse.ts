"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Ad slots reserve their height from the first render so the page doesn't
 * jump when the ad arrives. If the network never fills the slot, this
 * reports `true` after `ms`, so the reserved space can be released.
 */
export function useUnfilledCollapse(active: boolean, ms = 8000): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
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
