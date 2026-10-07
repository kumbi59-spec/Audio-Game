"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCanWeb } from "@/store/entitlements-store";

/** sessionStorage: set when a player leaves a game with the Exit link. */
const PENDING_KEY = "eq-upgrade-nudge";
/** localStorage: when the player last dismissed the nudge. */
const DISMISSED_KEY = "eq-upgrade-nudge-dismissed";
const QUIET_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/** The play screen's Exit link calls this, so the nudge appears after a game, never during one. */
export function queueUpgradeNudge(): void {
  try {
    sessionStorage.setItem(PENDING_KEY, "1");
  } catch {
    // Storage blocked: no nudge, which is fine.
  }
}

/**
 * A quiet note about Storyteller, shown to free players once after they
 * leave a game, and not again for a week once dismissed. It is not a live
 * region, so it never interrupts a screen reader.
 */
export function UpgradeNudge() {
  const { tier } = useCanWeb();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(PENDING_KEY) !== "1") return;
      sessionStorage.removeItem(PENDING_KEY);
      const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
      if (Date.now() - dismissedAt < QUIET_FOR_MS) return;
      setPending(true);
    } catch {
      // Storage blocked: no nudge.
    }
  }, []);

  if (!pending || tier !== "free") return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Storage blocked: it just won't be remembered.
    }
    setPending(false);
  }

  return (
    <aside
      aria-label="Storyteller plan"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-foreground">
        Enjoying EchoQuest? Storyteller gives every character its own premium voice, plus unlimited
        campaigns and saves, with no ads.
      </p>
      <div className="flex shrink-0 gap-2">
        <Link
          href="/#pricing"
          className="inline-flex items-center justify-center rounded-lg bg-accent-solid px-3 py-2 text-sm font-semibold text-on-accent hover:opacity-90 focus-ring"
        >
          See Storyteller
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground focus-ring"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}
