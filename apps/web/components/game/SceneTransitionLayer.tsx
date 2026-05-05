"use client";

import { useEffect, useMemo, useState } from "react";
import type { SceneTransition } from "@/types/game";

interface SceneTransitionLayerProps {
  transition: SceneTransition | null;
  reducedMotion?: boolean;
  instantMode?: boolean;
  onComplete: () => void;
}

const DEFAULT_DURATION_MS = 1400;

export function SceneTransitionLayer({
  transition,
  reducedMotion = false,
  instantMode = false,
  onComplete,
}: SceneTransitionLayerProps) {
  const [mountedTransition, setMountedTransition] = useState<SceneTransition | null>(null);

  const durationMs = useMemo(() => {
    if (!transition) return 0;
    if (instantMode || reducedMotion) return 0;
    return transition.durationMs ?? DEFAULT_DURATION_MS;
  }, [transition, instantMode, reducedMotion]);

  useEffect(() => {
    setMountedTransition(transition);
  }, [transition]);

  useEffect(() => {
    if (!mountedTransition) return;
    if (durationMs <= 0) {
      onComplete();
      return;
    }
    const timeout = window.setTimeout(onComplete, durationMs);
    return () => window.clearTimeout(timeout);
  }, [mountedTransition, durationMs, onComplete]);

  if (!mountedTransition) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-live="polite">
      <div className="absolute inset-0 bg-background/35 motion-safe:animate-pulse" />
      <div className="absolute inset-x-4 top-6 flex justify-center">
        <div className="rounded-full border border-border/80 bg-background/85 px-4 py-1 text-xs tracking-wide text-muted-foreground backdrop-blur-sm">
          {mountedTransition.subtitle || "Transition"}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="rounded-lg border border-border/70 bg-background/90 px-6 py-4 text-center shadow-lg backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{mountedTransition.type}</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{mountedTransition.title}</p>
          {mountedTransition.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{mountedTransition.subtitle}</p>
          )}
        </div>
      </div>
      <div className="pointer-events-auto absolute right-4 bottom-4">
        <button
          type="button"
          onClick={onComplete}
          className="rounded-md border border-border/70 bg-background/85 px-3 py-1 text-xs text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip transition
        </button>
      </div>
    </div>
  );
}
