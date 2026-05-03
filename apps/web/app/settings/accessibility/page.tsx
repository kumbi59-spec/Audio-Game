"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

const KEY_CONTRAST = "a11y_high_contrast";
const KEY_LARGE = "a11y_large_controls";
const KEY_REDUCED_MOTION = "a11y_reduced_motion";

export default function AccessibilitySettingsPage() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeControls, setLargeControls] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setHighContrast(localStorage.getItem(KEY_CONTRAST) === "1");
    setLargeControls(localStorage.getItem(KEY_LARGE) === "1");
    setReducedMotion(localStorage.getItem(KEY_REDUCED_MOTION) === "1");
  }, []);

  function apply(next: { highContrast?: boolean; largeControls?: boolean; reducedMotion?: boolean }) {
    const hc = next.highContrast ?? highContrast;
    const lc = next.largeControls ?? largeControls;
    const rm = next.reducedMotion ?? reducedMotion;
    setHighContrast(hc); setLargeControls(lc); setReducedMotion(rm);
    localStorage.setItem(KEY_CONTRAST, hc ? "1" : "0");
    localStorage.setItem(KEY_LARGE, lc ? "1" : "0");
    localStorage.setItem(KEY_REDUCED_MOTION, rm ? "1" : "0");
    const root = document.documentElement;
    root.classList.toggle("theme-high-contrast", hc);
    root.classList.toggle("a11y-large-controls", lc);
    root.classList.toggle("a11y-reduced-motion", rm);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-bold">Accessibility settings</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Extra options for easier mobile interaction and readability.
        </p>
        <div className="mt-6 space-y-4">
          <label className="flex items-center justify-between rounded-xl border p-4">
            <span>High contrast theme</span>
            <input type="checkbox" checked={highContrast} onChange={(e) => apply({ highContrast: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between rounded-xl border p-4">
            <span>Larger touch controls</span>
            <input type="checkbox" checked={largeControls} onChange={(e) => apply({ largeControls: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between rounded-xl border p-4">
            <span>Reduced motion</span>
            <input type="checkbox" checked={reducedMotion} onChange={(e) => apply({ reducedMotion: e.target.checked })} />
          </label>
        </div>

        <Link href="/settings/voice" className="mt-8 inline-block underline" style={{ color: "var(--accent)" }}>
          Back to voice settings
        </Link>
      </main>
    </div>
  );
}
