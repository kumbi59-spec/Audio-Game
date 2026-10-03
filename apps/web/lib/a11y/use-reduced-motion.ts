"use client";

import { useEffect, useState } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";

/** True when motion should be cut: the in-app setting, or the device's. */
export function useReducedMotion(): boolean {
  const setting = useAccessibilityStore((s) => s.reducedMotion);
  const [device, setDevice] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setDevice(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return setting || device;
}
