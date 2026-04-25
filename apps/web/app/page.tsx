"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";

const MODES = [
  {
    id: "prebuilt",
    title: "Play a Story",
    description:
      "Choose from our library of narrated AI adventures guided by an AI Game Master.",
    href: "/library",
    available: true,
  },
  {
    id: "upload",
    title: "Upload a Game Bible",
    description:
      "Upload a PDF, DOCX, or text file — your rules, lore, and setting — and we'll turn it into a playable world.",
    href: "/worlds/new/upload",
    available: false,
    comingSoon: true,
  },
  {
    id: "create",
    title: "Create Your World",
    description:
      "Build a custom world step by step with an audio-guided wizard. Play in it immediately.",
    href: "/worlds/new/wizard",
    available: false,
    comingSoon: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();

  useEffect(() => {
    const welcome =
      "Welcome to EchoQuest. Home screen. Three modes available: Play a Story, Upload a Game Bible, or Create Your World. Use Tab to navigate or press a number key.";
    announce(welcome);
    speak(welcome, { rate: ttsSpeed, volume });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-slide-in">
        <h1
          className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
          style={{ color: "var(--text)" }}
          data-focus-on-mount
          tabIndex={-1}
        >
          EchoQuest
        </h1>
        <p
          className="max-w-lg text-base md:text-lg"
          style={{ color: "var(--text-muted)" }}
        >
          An audio-first interactive storytelling platform with an AI Game
          Master. Fully accessible. Built for blind and sighted adventurers
          alike.
        </p>
      </header>

      {/* Mode selection */}
      <main id="main-content" className="flex-1 px-4 pb-16">
        <section aria-label="Choose your adventure mode">
          <h2 className="sr-only">Choose a mode</h2>
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-3">
            {MODES.map((mode, i) => (
              <article
                key={mode.id}
                className={`relative rounded-xl border p-6 transition-colors ${
                  mode.available
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                }`}
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <button
                  onClick={() => mode.available && router.push(mode.href)}
                  disabled={!mode.available}
                  aria-label={`${mode.title}${mode.comingSoon ? " (coming soon)" : ""}. ${mode.description}. Press ${i + 1} to select.`}
                  aria-describedby={`mode-desc-${mode.id}`}
                  className="absolute inset-0 rounded-xl"
                  style={{ minHeight: "unset" }}
                />
                <h3
                  className="mb-1 font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {mode.title}
                </h3>
                <p
                  id={`mode-desc-${mode.id}`}
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {mode.description}
                </p>
                {mode.comingSoon && (
                  <span
                    className="mt-3 inline-block rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                  >
                    COMING SOON
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Accessibility note */}
        <section
          aria-label="Accessibility information"
          className="mx-auto mt-12 max-w-3xl rounded-xl border p-6"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
          }}
        >
          <h2
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            ACCESSIBILITY
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Every feature works by voice, keyboard, and screen reader. Press{" "}
            <kbd
              className="rounded px-1.5 py-0.5 font-mono text-xs"
              style={{
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              H
            </kbd>{" "}
            at any time for keyboard shortcuts. Audio narration plays
            automatically. Adjust speed and voice in the audio controls during
            play.
          </p>
        </section>
      </main>

      <footer
        className="px-6 py-4 text-center text-xs"
        style={{ color: "var(--text-subtle)" }}
      >
        <p>EchoQuest — Powered by Claude AI · Audio-first interactive storytelling</p>
      </footer>
    </div>
  );
}
