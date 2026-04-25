"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";
import Link from "next/link";

interface WorldListItem {
  id: string;
  name: string;
  description: string;
  genre: string;
  tone: string;
  difficulty: string;
  tags: string[];
  sortOrder: number;
}

// Build initial items from static data so the page renders instantly
const STATIC_ITEMS: WorldListItem[] = PREBUILT_WORLDS.map((w, i) => ({
  id: w.id,
  name: w.name,
  description: w.description,
  genre: w.genre,
  tone: w.tone,
  difficulty: "beginner",
  tags: [w.genre, w.tone],
  sortOrder: i,
}));

export default function LibraryPage() {
  const router = useRouter();
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const [worlds, setWorlds] = useState<WorldListItem[]>(STATIC_ITEMS);

  // Hydrate from DB in background; falls back gracefully if DB unavailable
  useEffect(() => {
    fetch("/api/worlds")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WorldListItem[] | null) => {
        if (Array.isArray(data) && data.length > 0) {
          setWorlds(data.sort((a, b) => a.sortOrder - b.sortOrder));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const msg = `LIBRARY. ${worlds.length} adventure${worlds.length === 1 ? "" : "s"} available. ${worlds.map((i) => i.name).join(", ")}.`;
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
  }, [worlds]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="px-6 py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to Home
        </Link>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text)" }}
          tabIndex={-1}
          data-focus-on-mount
        >
          Adventure Library
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {worlds.length} adventure{worlds.length === 1 ? "" : "s"} available
        </p>
      </header>

      <main id="main-content" className="px-6 pb-16">
        <ul className="mx-auto max-w-2xl space-y-4" aria-label="Available adventures">
          {worlds.map((world, i) => (
            <li key={world.id}>
              <article
                className="rounded-xl border p-6"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <header className="mb-3">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                    {world.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-2" aria-label="Tags">
                    {world.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-xs capitalize"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    <span
                      className="rounded-full px-2 py-0.5 text-xs capitalize"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {world.difficulty}
                    </span>
                  </div>
                </header>
                <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
                  {world.description}
                </p>
                <button
                  onClick={() => router.push(`/create?worldId=${world.id}`)}
                  aria-label={`Play ${world.name}. ${world.description}. Press ${i + 1} to select.`}
                  className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "#ffffff",
                  }}
                >
                  Play This Adventure →
                </button>
              </article>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
