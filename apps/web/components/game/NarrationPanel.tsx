"use client";

import { useEffect, useRef } from "react";
import type { NarrationEntry } from "@/types/game";

interface NarrationPanelProps {
  entries: NarrationEntry[];
  isGenerating: boolean;
}

export function NarrationPanel({ entries, isGenerating }: NarrationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <section
      aria-label="Story narration"
      aria-live="polite"
      aria-relevant="additions"
      ref={regionRef}
      className="flex-1 overflow-y-auto rounded-xl border border-border bg-background/50 p-4 md:p-6"
    >
      {entries.length === 0 && (
        <p className="text-muted-foreground italic">
          Your adventure awaits. Make a choice below to begin.
        </p>
      )}
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`mb-4 leading-relaxed ${
            entry.type === "player_action"
              ? "font-mono text-sm text-accent-foreground/80 before:content-['>_']"
              : entry.type === "system"
              ? "text-sm text-muted-foreground italic"
              : "text-base text-foreground"
          }`}
        >
          {entry.type === "narration"
            ? entry.text.split("\n\n").map((para, i) => (
                <p key={i} className="mb-3">
                  {para}
                </p>
              ))
            : entry.text}
        </div>
      ))}

      {isGenerating && (
        <div
          role="status"
          aria-label="Game Master is responding"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className="inline-flex gap-1"
          >
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
          </span>
          <span>The Game Master is narrating…</span>
        </div>
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </section>
  );
}
