"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useCanWeb } from "@/store/entitlements-store";
import { useGameStore } from "@/store/game-store";
import { useShallow } from "zustand/react/shallow";
import { createLobbyPath } from "@/lib/multiplayer/create-lobby-client";
import { ServerSaves } from "./ServerSaves";
import { UpgradeNudge } from "@/components/entitlements/UpgradeNudge";
import {
  sortWorldsByOrder,
  filterWorldsByTab,
  extractGenres,
  filterWorldsByGenre,
} from "@/src/domain/world/use-cases";
import type { PublicWorld } from "@/lib/worlds/shape";

type Tab = "official" | "community";

export function LibraryClient({ initialWorlds }: { initialWorlds: PublicWorld[] }) {
  const router = useRouter();
  const { narrate } = useAnnouncer();
  const can = useCanWeb();
  const { session, world: savedWorld, dbSessionId, clearSession, savedCampaigns, saveCurrentCampaign, loadSavedCampaign, deleteSavedCampaign } = useGameStore(
    useShallow((s) => ({ session: s.session, world: s.world, dbSessionId: s.dbSessionId, clearSession: s.clearSession, savedCampaigns: s.savedCampaigns, saveCurrentCampaign: s.saveCurrentCampaign, loadSavedCampaign: s.loadSavedCampaign, deleteSavedCampaign: s.deleteSavedCampaign })),
  );
  const hasSavedGame = !!(session && savedWorld && session.narrationLog.length > 0);

  const [tab, setTab] = useState<Tab>("official");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const worlds = sortWorldsByOrder(initialWorlds);

  function handleTabChange(next: Tab) {
    setTab(next);
    setSelectedGenre("All");
    narrate(next === "official" ? "Official worlds" : "Community worlds");
  }

  const tabWorlds = filterWorldsByTab(worlds, tab);
  const genres = ["All", ...extractGenres(tabWorlds)];
  const visibleWorlds = filterWorldsByGenre(tabWorlds, selectedGenre);

  return (
    <>
      <p className="mt-1 text-sm text-muted">
        {visibleWorlds.length} world{visibleWorlds.length === 1 ? "" : "s"} available
      </p>

      <div className="mt-6">
        <div className="flex flex-col items-end gap-1">
          <Link
            href="/worlds/new/upload"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 bg-accent-solid text-on-accent"
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

      <main id="main-content" className="px-6 pb-16">
        <div className="mx-auto max-w-2xl">
          <UpgradeNudge />
          {hasSavedGame && (
            <div
              className="mb-6 flex items-center justify-between rounded-xl border p-4 border-accent bg-surface"
              role="region"
              aria-label="Saved game"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Continue: {savedWorld.name}
                </p>
                <p className="text-xs text-muted">
                  Turn {session!.turnCount} · {session!.choices.length} choices waiting
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { saveCurrentCampaign(); router.push("/play"); }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 bg-accent-solid text-on-accent"
                >
                  Resume →
                </button>
                <button
                  onClick={() => { clearSession(); }}
                  aria-label="Discard saved game"
                  className="rounded-lg border px-3 py-2 text-xs hover:bg-red-500/10 hover:text-red-400 border-border text-muted"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <ServerSaves
            excludeSessionIds={[
              ...(hasSavedGame && dbSessionId ? [dbSessionId] : []),
              ...savedCampaigns.flatMap((c) => (c.dbSessionId ? [c.dbSessionId] : [])),
            ]}
          />

          {savedCampaigns.length > 0 && (
            <div className="mb-6 rounded-xl border p-4 border-border bg-surface">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Saved campaigns</h2>
              <ul className="space-y-2">
                {savedCampaigns.map((save) => (
                  <li key={save.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-foreground">{save.world.name}</p>
                      <p className="text-xs text-muted">Turn {save.session.turnCount} · {new Date(save.savedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { loadSavedCampaign(save.id); router.push('/play'); }} className="min-h-[44px] rounded border px-3 py-2 text-xs" style={{ borderColor: 'var(--border)' }}>Resume</button>
                      <button onClick={async () => { const lobby = await createLobbyPath(); if (!lobby.ok) { narrate(lobby.message, "assertive"); return; } loadSavedCampaign(save.id); router.push(lobby.path); }} className="min-h-[44px] rounded border px-3 py-2 text-xs" style={{ borderColor: 'var(--border)' }} aria-label={`Start multiplayer lobby for ${save.world.name}`}>Multiplayer</button>
                      <button onClick={async () => { const url = `${window.location.origin}/create?worldId=${save.world.id}`; const text = `Continue my ${save.world.name} campaign on EchoQuest`; if (navigator.share) await navigator.share({ title: `${save.world.name} save`, text, url }); else window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer'); }} className="min-h-[44px] rounded border px-3 py-2 text-xs" style={{ borderColor: 'var(--border)' }}>Share</button>
                      <button onClick={() => deleteSavedCampaign(save.id)} className="min-h-[44px] rounded border px-3 py-2 text-xs hover:bg-red-500/10 hover:text-red-400" style={{ borderColor: 'var(--border)' }}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            role="tablist"
            aria-label="World source"
            className="mb-6 flex border-b border-border"
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

          {genres.length > 1 && (
            <div className="mb-6 flex items-center gap-3">
              <label
                htmlFor="genre-filter"
                className="text-xs font-semibold uppercase tracking-widest text-muted"
              >
                Genre
              </label>
              <select
                id="genre-filter"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm capitalize focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                  borderColor: "var(--border)",
                  minHeight: "44px",
                  minWidth: "12rem",
                }}
              >
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            id="tabpanel-official"
            role="tabpanel"
            aria-labelledby="tab-official"
            hidden={tab !== "official"}
          >
            <WorldList worlds={visibleWorlds} showAuthor={false} onPlay={(id) => router.push(`/create?worldId=${id}`)} />
          </div>

          <div
            id="tabpanel-community"
            role="tabpanel"
            aria-labelledby="tab-community"
            hidden={tab !== "community"}
          >
            {visibleWorlds.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <span className="text-5xl opacity-20" aria-hidden="true">🌍</span>
                <p className="text-sm text-muted">
                  No community worlds yet.
                </p>
                <Link
                  href="/worlds/new"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 bg-accent-solid text-on-accent"
                >
                  Create the first one →
                </Link>
              </div>
            ) : (
              <WorldList worlds={visibleWorlds} showAuthor onPlay={(id) => router.push(`/create?worldId=${id}`)} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function WorldList({
  worlds,
  showAuthor,
  onPlay,
}: {
  worlds: PublicWorld[];
  showAuthor: boolean;
  onPlay: (id: string) => void;
}) {
  return (
    <ul className="space-y-4" aria-label="Available worlds">
      {worlds.map((world) => (
        <li key={world.id}>
          <WorldCard world={world} showAuthor={showAuthor} onPlay={onPlay} />
        </li>
      ))}
    </ul>
  );
}

function WorldCard({
  world,
  showAuthor,
  onPlay,
}: {
  world: PublicWorld;
  showAuthor: boolean;
  onPlay: (id: string) => void;
}) {
  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      {world.imageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URL; next/image would require allowing all remote domains */}
          <img
            src={world.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div
          className="flex aspect-video w-full items-center justify-center"
          aria-hidden="true"
          style={{ backgroundColor: "var(--surface-2, var(--surface))" }}
        >
          <span className="text-4xl opacity-30">🌍</span>
        </div>
      )}

      <div className="p-5">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-foreground">
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
        <p className="mb-4 text-sm text-muted">
          {world.description}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPlay(world.id)}
            aria-label={`Play ${world.name}`}
            className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90 bg-accent-solid text-on-accent"
          >
            Play Game →
          </button>
          <Link
            href="/campaigns"
            aria-label="View campaign information page"
            className="inline-flex items-center justify-center rounded-lg border px-3 py-3 text-xs font-semibold hover:opacity-90 border-border text-muted"
          >
            Campaign Info
          </Link>
        </div>
      </div>
    </article>
  );
}
