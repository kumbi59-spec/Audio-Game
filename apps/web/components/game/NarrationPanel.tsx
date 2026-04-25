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
      className="max-h-52 overflow-y-auto rounded-xl border p-4 md:max-h-72 md:p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      {entries.length === 0 && (
        <p className="italic" style={{ color: "var(--text-muted)" }}>
          Your adventure awaits. Make a choice below to begin.
        </p>
      )}
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`mb-4 leading-relaxed ${
            entry.type === "player_action"
              ? "font-mono text-sm before:content-['>_']"
              : entry.type === "system"
              ? "text-sm italic"
              : "narration text-base"
          }`}
          style={{
            color:
              entry.type === "player_action"
                ? "var(--accent)"
                : entry.type === "system"
                ? "var(--text-muted)"
                : "var(--text)",
          }}
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
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <span
            aria-hidden="true"
            className="inline-flex gap-1"
          >
            <span className="h-2 w-2 animate-bounce-subtle rounded-full [animation-delay:-0.3s]" style={{ backgroundColor: "var(--accent)" }} />
            <span className="h-2 w-2 animate-bounce-subtle rounded-full [animation-delay:-0.15s]" style={{ backgroundColor: "var(--accent)" }} />
            <span className="h-2 w-2 animate-bounce-subtle rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          </span>
          <span>The Game Master is narrating…</span>
        </div>
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </section>
  );
}
