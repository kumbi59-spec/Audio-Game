"use client";

import { useEntitlementsStore } from "@/store/entitlements-store";

/**
 * Visible marker while ad preview (?adpreview=1) is on. The preview persists
 * for the browser session and shows ads even on admin and paid accounts, so
 * without this it's easy to forget it's on and think the ad gating is broken.
 */
export function AdPreviewBadge() {
  const adPreview = useEntitlementsStore((s) => s.adPreview);
  const clearAdPreview = useEntitlementsStore((s) => s.clearAdPreview);
  if (!adPreview) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-lg border-border bg-surface text-foreground"
    >
      <span>Ad preview is on — you&apos;re seeing ads on purpose.</span>
      <button
        type="button"
        onClick={clearAdPreview}
        className="rounded-full px-2 py-1 font-semibold hover:opacity-90"
        style={{ backgroundColor: "var(--accent-solid)", color: "var(--on-accent)", minHeight: 32 }}
      >
        Turn off
      </button>
    </div>
  );
}
