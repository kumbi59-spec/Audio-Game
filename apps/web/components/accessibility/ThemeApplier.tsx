"use client";

import { useEffect } from "react";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { applyDisplayModes, resolveDisplayModes } from "@/lib/a11y/display-prefs";
import { writeHideAdsCookie } from "@/lib/ads/hide-ads";

/**
 * Keeps <html> in step with the display settings (theme, high contrast,
 * large text, reduced motion) and with the device's own preferences as
 * they change. The root layout's boot script applies them before first
 * paint; this takes over once the page is interactive.
 *
 * It also keeps the "Hide ads" cookie matching the saved setting, since the
 * server reads the cookie to leave ad scripts out of the page.
 */
export function ThemeApplier() {
  const theme = useAccessibilityStore((s) => s.theme);
  const highContrast = useAccessibilityStore((s) => s.highContrast);
  const largeText = useAccessibilityStore((s) => s.largeText);
  const reducedMotion = useAccessibilityStore((s) => s.reducedMotion);
  const hideAds = useAccessibilityStore((s) => s.hideAds);

  useEffect(() => writeHideAdsCookie(hideAds), [hideAds]);

  useEffect(() => {
    const queries = {
      light: window.matchMedia("(prefers-color-scheme: light)"),
      contrast: window.matchMedia("(prefers-contrast: more)"),
      motion: window.matchMedia("(prefers-reduced-motion: reduce)"),
    };
    const apply = () =>
      applyDisplayModes(
        document.documentElement,
        resolveDisplayModes(
          { theme, highContrast, largeText, reducedMotion },
          {
            prefersLight: queries.light.matches,
            prefersMoreContrast: queries.contrast.matches,
            prefersReducedMotion: queries.motion.matches,
          },
        ),
      );
    apply();
    const all = Object.values(queries);
    for (const q of all) q.addEventListener("change", apply);
    return () => {
      for (const q of all) q.removeEventListener("change", apply);
    };
  }, [theme, highContrast, largeText, reducedMotion]);

  return null;
}
