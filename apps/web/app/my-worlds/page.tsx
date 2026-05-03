"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useCanWeb } from "@/store/entitlements-store";
import { useGameStore } from "@/store/game-store";
import { EngagementSparkline } from "@/components/analytics/EngagementSparkline";
import { SiteHeader } from "@/components/SiteHeader";

interface EngagementSeries {
  days: string[];
  sessionsStarted: number[];
  playerTurns: number[];
}

interface WorldAnalytics {
  sessionCount: number;
  totalTurns: number;
  uniquePlayers: number;
}

interface MyWorld {
  id: string;
  name: string;
  description: string;
  genre: string;
  tone: string;
  isPublic: boolean;
  difficulty: string;
  tags: string[];
  analytics: WorldAnalytics | null;
}

export default function MyWorldsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { announce, narrate } = useAnnouncer();
  const can = useCanWeb();
  const { session: activeSession, world: activeWorld } = useGameStore();
  const activeWorldId =
    activeSession && activeWorld && activeSession.narrationLog.length > 0
      ? activeWorld.id
      : null;

  const [worlds, setWorlds] = useState<MyWorld[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [reparsing, setReparsing] = useState<string | null>(null);
  const [reparseResult, setReparseResult] = useState<Record<string, { ok: boolean; classCount?: number; backgroundCount?: number; error?: boolean }>>({});
  const [generatingCover, setGeneratingCover] = useState<string | null>(null);
  const [coverGenResult, setCoverGenResult] = useState<Record<string, { ok: boolean; error?: string }>>({});
  const [trends, setTrends] = useState<Record<string, EngagementSeries>>({});
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsRequested, setTrendsRequested] = useState(false);

  async function loadTrends() {
    if (trendsRequested || !can.publicPublishing) return;
    setTrendsRequested(true);
    setTrendsLoading(true);
    try {
      const res = await fetch("/api/my-worlds/trends?days=30");
      if (res.ok) {
        const data = (await res.json()) as { days: number; trends: Record<string, EngagementSeries> };
        setTrends(data.trends ?? {});
      }
    } finally {
      setTrendsLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/sign-in");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    narrate("My Worlds page. Manage and publish your uploaded worlds.");
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/my-worlds")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MyWorld[]) => setWorlds(Array.isArray(data) ? data : []))
      .catch(() => setWorlds([]))
      .finally(() => setLoading(false));
  }, [status]);

  async function handleDelete(worldId: string) {
    setDeleting(worldId);
    setConfirmDeleteId(null);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/worlds/${worldId}`, { method: "DELETE" });
      if (res.ok) {
        setWorlds((prev) => prev.filter((w) => w.id !== worldId));
        const world = worlds.find((w) => w.id === worldId);
        narrate(world ? `${world.name} has been deleted.` : "World deleted.");
      } else {
        let errMsg = "Failed to delete world. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) errMsg = data.error;
        } catch { /* non-JSON body */ }
        setDeleteError(errMsg);
        announce(errMsg, "assertive");
      }
    } catch {
      const msg = "Network error. Please check your connection and try again.";
      setDeleteError(msg);
      announce(msg, "assertive");
    } finally {
      setDeleting(null);
    }
  }

  async function handleReparse(world: MyWorld) {
    setReparsing(world.id);
    setReparseResult((prev) => { const n = { ...prev }; delete n[world.id]; return n; });
    try {
      const res = await fetch(`/api/worlds/${world.id}/reparse`, { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as { ok: boolean; classCount?: number; backgroundCount?: number };
        setReparseResult((prev) => ({ ...prev, [world.id]: { ok: true, classCount: data.classCount ?? 0, backgroundCount: data.backgroundCount ?? 0 } }));
        const classInfo = (data.classCount ?? 0) > 0 ? `${data.classCount} classes` : "no custom classes";
        narrate(`${world.name} re-analysed. Found ${classInfo} from your game bible.`);
      } else {
        setReparseResult((prev) => ({ ...prev, [world.id]: { ok: false, error: true } }));
      }
    } finally {
      setReparsing(null);
    }
  }

  async function handleGenerateCover(world: MyWorld) {
    setGeneratingCover(world.id);
    setCoverGenResult((prev) => { const n = { ...prev }; delete n[world.id]; return n; });
    try {
      const res = await fetch(`/api/worlds/${world.id}/cover`, { method: "POST" });
      if (res.ok) {
        setCoverGenResult((prev) => ({ ...prev, [world.id]: { ok: true } }));
        narrate(`Cover image generated for ${world.name}.`);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCoverGenResult((prev) => ({ ...prev, [world.id]: { ok: false, error: data.error ?? "Generation failed" } }));
      }
    } catch {
      setCoverGenResult((prev) => ({ ...prev, [world.id]: { ok: false, error: "Network error" } }));
    } finally {
      setGeneratingCover(null);
    }
  }

  async function togglePublish(world: MyWorld) {
    if (!can.publicPublishing) return;
    setToggling(world.id);
    try {
      const method = world.isPublic ? "DELETE" : "POST";
      const res = await fetch(`/api/worlds/${world.id}/publish`, { method });
      if (res.ok) {
        setWorlds((prev) =>
          prev.map((w) => (w.id === world.id ? { ...w, isPublic: !w.isPublic } : w))
        );
        narrate(
          world.isPublic
            ? `${world.name} is now private.`
            : `${world.name} is now public in the library.`,
        );
      }
    } finally {
      setToggling(null);
    }
  }

  if (status === "loading" || (status === "unauthenticated")) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <header className="px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text)" }}
            tabIndex={-1}
            data-focus-on-mount
          >
            My Worlds
          </h1>
          {can.worldWizard && (
            <Link
              href="/worlds/new"
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              + Create New World
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Manage your uploaded worlds, play them privately, and publish them to the community.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-6 pb-16">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading your worlds…</p>
        ) : worlds.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              You haven&apos;t uploaded any worlds yet.
            </p>
            <Link
              href="/worlds/new/upload"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              Upload a World
            </Link>
          </div>
        ) : (
          <ul className="space-y-4" aria-label="Your worlds">
            {worlds.map((world) => (
              <li key={world.id}>
                <article
                  className="rounded-xl border p-6"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface)",
                  }}
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                      {world.name}
                    </h2>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: world.isPublic ? "var(--success)" : "var(--surface-2, var(--surface))",
                        color: world.isPublic ? "#ffffff" : "var(--text-muted)",
                        border: world.isPublic ? "none" : "1px solid var(--border)",
                        flexShrink: 0,
                      }}
                    >
                      {world.isPublic ? "Published" : "Private"}
                    </span>
                  </div>
                  <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
                    {world.description}
                  </p>

                  {world.analytics && can.publicPublishing && (
                    <>
                      <dl
                        className="mb-4 grid grid-cols-3 gap-2 rounded-lg p-3 text-center"
                        style={{ backgroundColor: "var(--surface-2, var(--surface))", border: "1px solid var(--border)" }}
                        aria-label="World analytics"
                      >
                        <div>
                          <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Sessions</dt>
                          <dd className="text-lg font-bold" style={{ color: "var(--text)" }}>
                            {world.analytics.sessionCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Turns</dt>
                          <dd className="text-lg font-bold" style={{ color: "var(--text)" }}>
                            {world.analytics.totalTurns}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Players</dt>
                          <dd className="text-lg font-bold" style={{ color: "var(--text)" }}>
                            {world.analytics.uniquePlayers}
                          </dd>
                        </div>
                      </dl>

                      {trends[world.id] ? (
                        <EngagementSparkline
                          worldName={world.name}
                          days={trends[world.id]!.days}
                          sessionsStarted={trends[world.id]!.sessionsStarted}
                          playerTurns={trends[world.id]!.playerTurns}
                        />
                      ) : (
                        !trendsRequested && (
                          <button
                            type="button"
                            onClick={loadTrends}
                            className="mb-4 w-full rounded-lg border py-2 text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            aria-label={`Show 30-day engagement trend for ${world.name}`}
                          >
                            {trendsLoading ? "Loading trend…" : "Show 30-day engagement trend"}
                          </button>
                        )
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    {activeWorldId === world.id && (
                      <button
                        type="button"
                        onClick={() => router.push("/play")}
                        aria-label={`Resume your active session in ${world.name}`}
                        className="w-full rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{
                          borderColor: "var(--accent)",
                          backgroundColor: "var(--accent)",
                          color: "#ffffff",
                        }}
                      >
                        Resume Session →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(`/create?worldId=${world.id}`)}
                      aria-label={`Play ${world.name}`}
                      className="w-full rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{
                        borderColor: activeWorldId === world.id ? "var(--border)" : "var(--accent)",
                        backgroundColor: activeWorldId === world.id ? "transparent" : "var(--accent)",
                        color: activeWorldId === world.id ? "var(--text-muted)" : "#ffffff",
                      }}
                    >
                      {activeWorldId === world.id ? "New Session" : "Play This World"}
                    </button>

                    {can.publicPublishing ? (
                      <button
                        onClick={() => togglePublish(world)}
                        disabled={toggling === world.id}
                        aria-label={world.isPublic ? `Unpublish ${world.name}` : `Publish ${world.name} to the library`}
                        className="w-full rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          borderColor: world.isPublic ? "var(--border)" : "var(--accent)",
                          backgroundColor: world.isPublic ? "transparent" : "var(--accent)",
                          color: world.isPublic ? "var(--text-muted)" : "#ffffff",
                        }}
                      >
                        {toggling === world.id
                          ? "Saving…"
                          : world.isPublic
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <button
                          disabled
                          aria-disabled="true"
                          className="w-full cursor-not-allowed rounded-lg border py-3 text-sm font-semibold opacity-40"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          {world.isPublic ? "Unpublish" : "Publish"}
                        </button>
                        <p className="text-center text-xs" style={{ color: "var(--text-subtle, var(--text-muted))" }}>
                          Creator plan required
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => handleReparse(world)}
                        disabled={reparsing === world.id}
                        aria-label={`Re-analyse game bible for ${world.name}`}
                        className="w-full rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        {reparsing === world.id
                          ? "Re-analysing… (up to 30s)"
                          : reparseResult[world.id]?.ok
                          ? `Re-analysed ✓ — ${reparseResult[world.id]!.classCount} class${reparseResult[world.id]!.classCount === 1 ? "" : "es"}, ${reparseResult[world.id]!.backgroundCount} background${reparseResult[world.id]!.backgroundCount === 1 ? "" : "s"} found`
                          : reparseResult[world.id]?.error
                          ? "Re-analyse failed — try again"
                          : "Re-analyse Game Bible"}
                      </button>
                      {reparseResult[world.id]?.ok && reparseResult[world.id]!.classCount === 0 && (
                        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                          No classes defined in your bible — generic classes will be used. Add a &ldquo;Character Classes&rdquo; or &ldquo;Roles&rdquo; section to your document and re-analyse.
                        </p>
                      )}
                    </div>

                    {can.tier === "creator" && (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleGenerateCover(world)}
                          disabled={generatingCover === world.id}
                          aria-label={`Generate AI cover image for ${world.name}`}
                          className="w-full rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          {generatingCover === world.id
                            ? "Generating cover… (up to 30s)"
                            : coverGenResult[world.id]?.ok
                            ? "Cover generated ✓"
                            : coverGenResult[world.id]?.error
                            ? "Cover failed — try again"
                            : "Generate AI Cover"}
                        </button>
                        {coverGenResult[world.id]?.error && (
                          <p className="text-center text-xs" style={{ color: "var(--error, #dc2626)" }}>
                            {coverGenResult[world.id]!.error}
                          </p>
                        )}
                      </div>
                    )}

                    {confirmDeleteId === world.id ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(world.id)}
                          disabled={deleting === world.id}
                          aria-label={`Confirm delete ${world.name}`}
                          className="flex-1 rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ borderColor: "var(--error, #dc2626)", backgroundColor: "var(--error, #dc2626)", color: "#ffffff" }}
                        >
                          {deleting === world.id ? "Deleting…" : "Confirm Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          aria-label="Cancel delete"
                          className="flex-1 rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-80"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(world.id)}
                        disabled={deleting === world.id}
                        aria-label={`Delete ${world.name}`}
                        className="w-full rounded-lg border py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: "var(--error, #dc2626)", color: "var(--error, #dc2626)" }}
                      >
                        Delete World
                      </button>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        {deleteError && (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-4 text-sm font-semibold"
            style={{ color: "var(--error, #dc2626)" }}
          >
            {deleteError}
          </p>
        )}

        {!loading && worlds.length > 0 && can.worldWizard && (
          <div className="mt-8 text-center">
            <Link
              href="/worlds/new"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              + Create Another World
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
