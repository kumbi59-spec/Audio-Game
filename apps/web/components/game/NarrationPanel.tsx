"use client";

import { useEffect, useRef, useState } from "react";
import type { NarrationEntry } from "@/types/game";
import { useAudioStore } from "@/store/audio-store";

interface NarrationPanelProps {
  entries: NarrationEntry[];
  isGenerating: boolean;
}

export function NarrationPanel({ entries, isGenerating }: NarrationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const volume = useAudioStore((s) => s.volume);
  const ttsProvider = useAudioStore((s) => s.ttsProvider);
  // Whether this browser can speak narration at all (no speechSynthesis and
  // no premium voice means it's silent). Assumed until checked on the client.
  const [canSpeak, setCanSpeak] = useState(true);
  useEffect(() => {
    setCanSpeak(ttsProvider === "elevenlabs" || "speechSynthesis" in window);
  }, [ttsProvider]);
  // Narration is only hidden from screen readers while it's actually being
  // spoken aloud; muted or unsupported, the screen reader reads it instead.
  const voiced = canSpeak && volume > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  return (
    <section
      aria-label="Story narration"
      ref={regionRef}
      className="h-full"
    >
      {entries.length === 0 && (
        <p className="italic text-muted">
          Your adventure awaits. Make a choice below to begin.
        </p>
      )}
      {entries.map((entry) => {
        const isNarration = entry.type === "narration";
        return (
          <div
            key={entry.id}
            // GM narration is voiced through the TTS engine. Hide it from
            // screen readers so VoiceOver / TalkBack don't read it on top
            // of the spoken narration. Player actions and system messages
            // are NOT voiced via TTS — keep them screen-reader visible.
            aria-hidden={isNarration && voiced ? true : undefined}
            className={`mb-4 leading-relaxed ${
              entry.type === "player_action"
                ? "font-mono text-sm before:content-['>_']"
                : entry.type === "system"
                ? "text-sm italic"
                : "narration text-base md:text-lg"
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
            {isNarration
              ? entry.text.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-3">
                    {para}
                  </p>
                ))
              : entry.text}
          </div>
        );
      })}

      {isGenerating && (
        <div
          role="status"
          aria-label="Game Master is responding"
          className="flex items-center gap-2 text-sm text-muted"
        >
          <span
            aria-hidden="true"
            className="inline-flex gap-1"
          >
            <span className="h-2 w-2 animate-bounce-subtle rounded-full [animation-delay:-0.3s] bg-accent-solid" />
            <span className="h-2 w-2 animate-bounce-subtle rounded-full [animation-delay:-0.15s] bg-accent-solid" />
            <span className="h-2 w-2 animate-bounce-subtle rounded-full bg-accent-solid" />
          </span>
          <span>The Game Master is narrating…</span>
        </div>
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </section>
  );
}
