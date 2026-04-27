"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { useCanWeb } from "@/store/entitlements-store";
import { useGameStore } from "@/store/game-store";

type Tab = "official" | "community";

interface WorldItem {
  id: string;
  name: string;
  description: string;
  genre: string;
  tone: string;
  isPrebuilt: boolean;
  difficulty: string;
  tags: string[];
  sortOrder: number;
  author: string | null;
  publishedAt: string | null;
}

function SkeletonCard() {
  return (
    <article
      className="rounded-xl border p-6"
      aria-hidden="true"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="skeleton mb-3 h-5 w-2/3 rounded" />
      <div className="mb-2 flex gap-2">
        <div className="skeleton h-4 w-14 rounded-full" />
        <div className="skeleton h-4 w-14 rounded-full" />
      </div>
      <div className="skeleton mb-1 h-4 w-full rounded" />
      <div className="skeleton mb-4 h-4 w-4/5 rounded" />
      <div className="skeleton h-10 w-full rounded-lg" />
    </article>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const can = useCanWeb();
  const { session, world: savedWorld, clearSession } = useGameStore();
  const hasSavedGame = !!(session && savedWorld && session.turnCount > 0);

  const [worlds, setWorlds] = useState<WorldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("official");
  const [selectedGenre, setSelectedGenre] = useState("All");

  useEffect(() => {
    fetch("/api/worlds")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WorldItem[] | null) => {
        if (Array.isArray(data)) {
          setWorlds(data.sort((a, b) => a.sortOrder - b.sortOrder));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function handleTabChange(next: Tab) {
    setTab(next);
    setSelectedGenre("All");
    const label = next === "official" ? "Official worlds" : "Community worlds";
    announce(label);
    speak(label, { rate: ttsSpeed, volume });
  }

  const tabWorlds = worlds.filter((w) =>
    tab === "official" ? w.isPrebuilt : !w.isPrebuilt
  );

  const genres = ["All", ...Array.from(new Set(tabWorlds.map((w) => w.genre).filter(Boolean)))];

  const visibleWorlds =
    selectedGenre === "All"
      ? tabWorlds
      : tabWorlds.filter((w) => w.genre === selectedGenre);

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text)" }}
              tabIndex={-1}
              data-focus-on-mount
            >
              Adventure Library
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading worlds…" : `${visibleWorlds.length} world${visibleWorlds.length === 1 ? "" : "s"} available`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Link
              href="/worlds/new/upload"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              aria-label="Share your world with the community"
            >
              Share Your World
            </Link>
            {!can.publicPublishing && (
              <p className="flex items-center gap-1 text-xs" style={{ color: "var(--text-subtle, var(--text-muted))" }}>
                <span aria-hidden="true">🔒</span>
                Creator plan required
              </p>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="px-6 pb-16">
        <div className="mx-auto max-w-2xl">
          {/* Continue saved game banner */}
          {hasSavedGame && (
            <div
              className="mb-6 flex items-center justify-between rounded-xl border p-4"
              style={{ borderColor: "var(--accent)", backgroundColor: "var(--surface)" }}
              role="region"
              aria-label="Saved game"
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Continue: {savedWorld.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Turn {session!.turnCount} · {session!.choices.length} choices waiting
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/play")}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
                >
                  Resume →
                </button>
                <button
                  onClick={clearSession}
                  aria-label="Discard saved game"
                  className="rounded-lg border px-3 py-2 text-xs hover:bg-red-500/10 hover:text-red-400"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="World source"
            className="mb-6 flex border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {(["official", "community"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                aria-controls={`tabpanel-${t}`}
                id={`tab-${t}`}
                onClick={() => handleTabChange(t)}
                className="px-4 py-2 text-sm font-semibold capitalize transition-colors"
                style={{
                  color: tab === t ? "var(--accent)" : "var(--text-muted)",
                  borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                  marginBottom: "-1px",
                  background: "none",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                {t === "official" ? "Official" : "Community"}
              </button>
            ))}
          </div>

          {/* Genre filter chips */}
          {!loading && genres.length > 1 && (
            <div
              role="group"
              aria-label="Filter by genre"
              className="mb-6 flex flex-wrap gap-2"
            >
              {genres.map((genre) => (
                <button
                  key={genre}
                  aria-pressed={selectedGenre === genre}
                  onClick={() => setSelectedGenre(genre)}
                  className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-all"
                  style={{
                    backgroundColor: selectedGenre === genre ? "var(--accent)" : "var(--surface-2, var(--surface))",
                    color: selectedGenre === genre ? "#ffffff" : "var(--text-muted)",
                    border: `1px solid ${selectedGenre === genre ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}

          {/* Tab panels */}
          <div
            id="tabpanel-official"
            role="tabpanel"
            aria-labelledby="tab-official"
            hidden={tab !== "official"}
          >
            {loading ? (
              <ul className="space-y-4" aria-label="Loading worlds">
                {[0, 1, 2].map((i) => <li key={i}><SkeletonCard /></li>)}
              </ul>
            ) : (
              <WorldList worlds={visibleWorlds} showAuthor={false} onPlay={(id) => router.push(`/create?worldId=${id}`)} />
            )}
          </div>

          <div
            id="tabpanel-community"
            role="tabpanel"
            aria-labelledby="tab-community"
            hidden={tab !== "community"}
          >
            {loading ? (
              <ul className="space-y-4" aria-label="Loading worlds">
                {[0, 1, 2].map((i) => <li key={i}><SkeletonCard /></li>)}
              </ul>
            ) : visibleWorlds.length === 0 ? (
              <p
                className="py-12 text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No community worlds yet. Be the first to share yours!
              </p>
            ) : (
              <WorldList worlds={visibleWorlds} showAuthor onPlay={(id) => router.push(`/create?worldId=${id}`)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function WorldList({
  worlds,
  showAuthor,
  onPlay,
}: {
  worlds: WorldItem[];
  showAuthor: boolean;
  onPlay: (id: string) => void;
}) {
  return (
    <ul className="space-y-4" aria-label="Available worlds">
      {worlds.map((world) => (
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
                {[world.genre, world.tone, world.difficulty].filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-2 py-0.5 text-xs capitalize"
                    style={{
                      backgroundColor: "var(--surface-2, var(--surface))",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {showAuthor && world.author && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-subtle, var(--text-muted))" }}>
                  by {world.author}
                </p>
              )}
            </header>
            <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              {world.description}
            </p>
            <button
              onClick={() => onPlay(world.id)}
              aria-label={`Play ${world.name}`}
              className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--accent)",
                color: "#ffffff",
              }}
            >
              Play →
            </button>
          </article>
        </li>
      ))}
    </ul>
  );
}
