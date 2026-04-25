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
    emoji: "📖",
    description: "Choose from our library of interactive audio adventures guided by an AI Game Master.",
    href: "/library",
    available: true,
  },
  {
    id: "upload",
    title: "Upload a Game Bible",
    emoji: "📤",
    description: "Upload a PDF, DOCX, or text file — your rules, lore, and setting — and we'll turn it into a playable world.",
    href: "/worlds/new/upload",
    available: false,
    comingSoon: true,
  },
  {
    id: "create",
    title: "Create Your World",
    emoji: "🌍",
    description: "Build a custom world step by step with an audio-guided wizard. Play in it immediately.",
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
      "Welcome to Audio RPG. Home screen. 3 modes available: Play a Story, Upload a Game Bible, or Create Your World. Use Tab to navigate or press a number key.";
    announce(welcome);
    speak(welcome, { rate: ttsSpeed, volume });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p aria-hidden="true" className="mb-4 text-5xl">🎙️</p>
        <h1
          className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
          data-focus-on-mount
          tabIndex={-1}
        >
          Audio RPG
        </h1>
        <p className="max-w-lg text-base text-muted-foreground md:text-lg">
          An audio-first interactive storytelling platform with an AI Game Master.
          Fully accessible. Built for blind and sighted adventurers alike.
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
                    ? "border-border bg-secondary hover:border-primary hover:bg-accent cursor-pointer"
                    : "border-border/50 bg-secondary/50 cursor-not-allowed opacity-60"
                }`}
              >
                <button
                  onClick={() => mode.available && router.push(mode.href)}
                  disabled={!mode.available}
                  aria-label={`${mode.title}${mode.comingSoon ? " (coming soon)" : ""}. ${mode.description}. Press ${i + 1} to select.`}
                  aria-describedby={`mode-desc-${mode.id}`}
                  className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
                <div aria-hidden="true" className="mb-3 text-3xl">
                  {mode.emoji}
                </div>
                <h3 className="mb-1 font-semibold">{mode.title}</h3>
                <p
                  id={`mode-desc-${mode.id}`}
                  className="text-sm text-muted-foreground"
                >
                  {mode.description}
                </p>
                {mode.comingSoon && (
                  <span className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Accessibility note */}
        <section
          aria-label="Accessibility information"
          className="mx-auto mt-12 max-w-3xl rounded-xl border border-border bg-muted/30 p-6"
        >
          <h2 className="mb-2 font-semibold">Accessibility-first</h2>
          <p className="text-sm text-muted-foreground">
            Every feature works by voice, keyboard, and screen reader. Press{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">H</kbd>{" "}
            at any time for keyboard shortcuts. Audio narration plays automatically.
            Adjust speed and voice in the audio controls during play.
          </p>
        </section>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
        <p>Audio RPG — Powered by Claude AI · Audio-first interactive storytelling</p>
      </footer>
    </div>
  );
}
