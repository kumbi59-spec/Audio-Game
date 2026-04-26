"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { useCanWeb } from "@/store/entitlements-store";

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
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const can = useCanWeb();

  const [worlds, setWorlds] = useState<MyWorld[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/sign-in");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const msg = "My Worlds page. Manage and publish your uploaded worlds.";
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/my-worlds")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MyWorld[]) => setWorlds(Array.isArray(data) ? data : []))
      .catch(() => setWorlds([]))
      .finally(() => setLoading(false));
  }, [status]);

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
        const msg = world.isPublic
          ? `${world.name} is now private.`
          : `${world.name} is now public in the library.`;
        announce(msg);
        speak(msg, { rate: ttsSpeed, volume });
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
      <header className="px-6 py-8">
        <Link
          href="/library"
          className="mb-4 inline-block text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to Library
        </Link>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text)" }}
          tabIndex={-1}
          data-focus-on-mount
        >
          My Worlds
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Manage your uploaded worlds and publish them to the community.
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
                  )}

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
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
