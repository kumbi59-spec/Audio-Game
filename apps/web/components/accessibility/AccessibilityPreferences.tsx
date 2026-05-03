"use client";

import { useEffect } from "react";

const KEY_CONTRAST = "a11y_high_contrast";
const KEY_LARGE = "a11y_large_controls";
const KEY_REDUCED_MOTION = "a11y_reduced_motion";

export function AccessibilityPreferences() {
  useEffect(() => {
    const root = document.documentElement;
    const highContrast = localStorage.getItem(KEY_CONTRAST) === "1";
    const largeControls = localStorage.getItem(KEY_LARGE) === "1";
    const reducedMotion = localStorage.getItem(KEY_REDUCED_MOTION) === "1";

    root.classList.toggle("theme-high-contrast", highContrast);
    root.classList.toggle("a11y-large-controls", largeControls);
    root.classList.toggle("a11y-reduced-motion", reducedMotion);
  }, []);

  return null;
}
