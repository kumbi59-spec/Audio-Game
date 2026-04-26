"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  createdAt: string;
  worldCount: number;
  sessionCount: number;
}

interface AdminWorld {
  id: string;
  name: string;
  genre: string;
  isPublic: boolean;
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  sessionCount: number;
}

type Tab = "users" | "worlds";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [worlds, setWorlds] = useState<AdminWorld[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/sign-in");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    Promise.all([
      fetch("/api/admin/users").then((r) => {
        if (r.status === 403) { setForbidden(true); return []; }
        return r.ok ? r.json() : [];
      }),
      fetch("/api/admin/worlds").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([u, w]) => {
        setUsers(Array.isArray(u) ? u : []);
        setWorlds(Array.isArray(w) ? w : []);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [status]);

  async function toggleWorldPublic(world: AdminWorld) {
    setToggling(world.id);
    try {
      await fetch("/api/admin/worlds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldId: world.id, isPublic: !world.isPublic }),
      });
      setWorlds((prev) => prev.map((w) => w.id === world.id ? { ...w, isPublic: !world.isPublic } : w));
    } finally {
      setToggling(null);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Access denied.</p>
        <Link href="/" className="mt-4 text-sm hover:underline" style={{ color: "var(--text-muted)" }}>← Home</Link>
      </div>
    );
  }

  const TIER_COUNTS = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.tier] = (acc[u.tier] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="border-b px-6 py-6" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="mb-2 inline-block text-sm hover:underline" style={{ color: "var(--text-muted)" }}>← Home</Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Admin Dashboard</h1>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Signed in as {session?.user?.email}</p>
      </header>

      <main className="px-6 py-8">
        {/* Summary stats */}
        <section aria-label="Summary statistics" className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total users", value: users.length },
            { label: "Free", value: TIER_COUNTS["free"] ?? 0 },
            { label: "Paid", value: (TIER_COUNTS["storyteller"] ?? 0) + (TIER_COUNTS["creator"] ?? 0) },
            { label: "Community worlds", value: worlds.length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </section>

        {/* Tab bar */}
        <div role="tablist" aria-label="Admin sections" className="mb-6 flex border-b" style={{ borderColor: "var(--border)" }}>
          {(["users", "worlds"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-semibold capitalize"
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
              {t === "users" ? `Users (${users.length})` : `Worlds (${worlds.length})`}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>}

        {/* Users table */}
        {!loading && tab === "users" && (
          <div role="tabpanel" aria-label="Users list">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="User accounts">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
                    {["Email", "Name", "Tier", "Worlds", "Sessions", "Joined"].map((h) => (
                      <th key={h} scope="col" className="pb-3 pr-4 font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="py-3 pr-4" style={{ color: "var(--text)" }}>{u.email}</td>
                      <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{u.name ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                          style={{
                            backgroundColor: u.tier === "free" ? "var(--surface-2, var(--surface))" : "var(--accent)",
                            color: u.tier === "free" ? "var(--text-muted)" : "#ffffff",
                          }}
                        >
                          {u.tier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center" style={{ color: "var(--text-muted)" }}>{u.worldCount}</td>
                      <td className="py-3 pr-4 text-center" style={{ color: "var(--text-muted)" }}>{u.sessionCount}</td>
                      <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No users yet.</p>}
            </div>
          </div>
        )}

        {/* Worlds table */}
        {!loading && tab === "worlds" && (
          <div role="tabpanel" aria-label="Community worlds list">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Community worlds">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
                    {["Name", "Genre", "Owner", "Sessions", "Status", "Actions"].map((h) => (
                      <th key={h} scope="col" className="pb-3 pr-4 font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {worlds.map((w) => (
                    <tr key={w.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="py-3 pr-4 font-medium" style={{ color: "var(--text)" }}>{w.name}</td>
                      <td className="py-3 pr-4 capitalize" style={{ color: "var(--text-muted)" }}>{w.genre}</td>
                      <td className="py-3 pr-4" style={{ color: "var(--text-muted)" }}>{w.ownerEmail ?? "—"}</td>
                      <td className="py-3 pr-4 text-center" style={{ color: "var(--text-muted)" }}>{w.sessionCount}</td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: w.isPublic ? "var(--success, #16a34a)" : "var(--surface-2, var(--surface))",
                            color: w.isPublic ? "#ffffff" : "var(--text-muted)",
                          }}
                        >
                          {w.isPublic ? "Public" : "Private"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => toggleWorldPublic(w)}
                          disabled={toggling === w.id}
                          aria-label={w.isPublic ? `Unpublish ${w.name}` : `Publish ${w.name}`}
                          className="rounded px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{
                            backgroundColor: w.isPublic ? "transparent" : "var(--accent)",
                            color: w.isPublic ? "var(--text-muted)" : "#ffffff",
                            border: w.isPublic ? "1px solid var(--border)" : "none",
                          }}
                        >
                          {toggling === w.id ? "…" : w.isPublic ? "Unpublish" : "Publish"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {worlds.length === 0 && <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No community worlds yet.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
