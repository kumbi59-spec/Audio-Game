"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";
import Link from "next/link";

const LIBRARY_ITEMS = PREBUILT_WORLDS.map((w) => ({
  worldId: w.id,
  title: w.name,
  description: w.description,
  genre: w.genre,
  difficulty: "beginner" as const,
  tags: [w.genre, w.tone],
}));

export default function LibraryPage() {
  const router = useRouter();
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();

  useEffect(() => {
    const msg = `Library. ${LIBRARY_ITEMS.length} adventure${LIBRARY_ITEMS.length === 1 ? "" : "s"} available. ${LIBRARY_ITEMS.map((i) => i.title).join(", ")}.`;
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen">
      <header className="px-6 py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Back to Home
        </Link>
        <h1 className="text-2xl font-bold" tabIndex={-1} data-focus-on-mount>
          Adventure Library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {LIBRARY_ITEMS.length} adventure{LIBRARY_ITEMS.length === 1 ? "" : "s"} available
        </p>
      </header>

      <main id="main-content" className="px-6 pb-16">
        <ul className="mx-auto max-w-2xl space-y-4" aria-label="Available adventures">
          {LIBRARY_ITEMS.map((item, i) => (
            <li key={item.worldId}>
              <article className="rounded-xl border border-border bg-secondary p-6">
                <header className="mb-3">
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <div className="mt-1 flex gap-2" aria-label="Tags">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {item.difficulty}
                    </span>
                  </div>
                </header>
                <p className="mb-4 text-sm text-muted-foreground">{item.description}</p>
                <button
                  onClick={() => router.push(`/create?worldId=${item.worldId}`)}
                  aria-label={`Play ${item.title}. ${item.description}. Press ${i + 1} to select.`}
                  className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
