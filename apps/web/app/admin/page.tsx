"use client";

import { useEffect, useRef, useState } from "react";
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

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
}

type Tab = "users" | "worlds" | "blog";

const EMPTY_DRAFT = { title: "", excerpt: "", content: "", publishedAt: "" };

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [worlds, setWorlds] = useState<AdminWorld[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Blog editor state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogError, setBlogError] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

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
      fetch("/api/admin/blog").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([u, w, b]) => {
        setUsers(Array.isArray(u) ? u : []);
        setWorlds(Array.isArray(w) ? w : []);
        setPosts(Array.isArray(b) ? b : []);
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

  function openNewPost() {
    setEditingPost(null);
    setDraft(EMPTY_DRAFT);
    setBlogError("");
  }

  function openEditPost(post: BlogPost) {
    setEditingPost(post);
    setDraft({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      publishedAt: post.publishedAt ? post.publishedAt.slice(0, 16) : "",
    });
    setBlogError("");
  }

  async function saveBlogPost() {
    if (!draft.title.trim() || !draft.content.trim()) {
      setBlogError("Title and content are required.");
      return;
    }
    setBlogSaving(true);
    setBlogError("");
    try {
      const payload = {
        title: draft.title,
        excerpt: draft.excerpt || draft.title,
        content: draft.content,
        publishedAt: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : null,
      };
      let res: Response;
      if (editingPost) {
        res = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setBlogError(err.error ?? "Save failed.");
        return;
      }
      const saved = await res.json() as BlogPost;
      if (editingPost) {
        setPosts((prev) => prev.map((p) => p.id === saved.id ? saved : p));
      } else {
        setPosts((prev) => [saved, ...prev]);
      }
      setDraft(EMPTY_DRAFT);
      setEditingPost(null);
    } finally {
      setBlogSaving(false);
    }
  }

  async function deletePost(id: string) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (editingPost?.id === id) { setEditingPost(null); setDraft(EMPTY_DRAFT); }
  }

  async function togglePublish(post: BlogPost) {
    const publishedAt = post.publishedAt ? null : new Date().toISOString();
    const res = await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishedAt }),
    });
    if (res.ok) {
      const saved = await res.json() as BlogPost;
      setPosts((prev) => prev.map((p) => p.id === saved.id ? saved : p));
      if (editingPost?.id === saved.id) setEditingPost(saved);
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

  const publishedCount = posts.filter((p) => p.publishedAt).length;

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
            { label: "Blog posts", value: `${publishedCount} / ${posts.length}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </section>

        {/* Tab bar */}
        <div role="tablist" aria-label="Admin sections" className="mb-6 flex border-b" style={{ borderColor: "var(--border)" }}>
          {(["users", "worlds", "blog"] as Tab[]).map((t) => {
            const label = t === "users" ? `Users (${users.length})` : t === "worlds" ? `Worlds (${worlds.length})` : `Blog (${posts.length})`;
            return (
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
                {label}
              </button>
            );
          })}
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
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                          style={{
                            backgroundColor: u.tier === "free" ? "var(--surface-2, var(--surface))" : "var(--accent)",
                            color: u.tier === "free" ? "var(--text-muted)" : "#ffffff",
                          }}>
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
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: w.isPublic ? "var(--success, #16a34a)" : "var(--surface-2, var(--surface))",
                            color: w.isPublic ? "#ffffff" : "var(--text-muted)",
                          }}>
                          {w.isPublic ? "Public" : "Private"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button onClick={() => toggleWorldPublic(w)} disabled={toggling === w.id}
                          aria-label={w.isPublic ? `Unpublish ${w.name}` : `Publish ${w.name}`}
                          className="rounded px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{
                            backgroundColor: w.isPublic ? "transparent" : "var(--accent)",
                            color: w.isPublic ? "var(--text-muted)" : "#ffffff",
                            border: w.isPublic ? "1px solid var(--border)" : "none",
                          }}>
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

        {/* Blog tab */}
        {!loading && tab === "blog" && (
          <div role="tabpanel" aria-label="Blog management" className="grid gap-8 lg:grid-cols-2">
            {/* Post list */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Posts</h2>
                <button onClick={openNewPost}
                  className="rounded px-3 py-1.5 text-sm font-semibold"
                  style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
                  + New post
                </button>
              </div>
              <div className="space-y-3">
                {posts.map((p) => (
                  <div key={p.id} className="flex items-start justify-between rounded-lg border p-3"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate font-medium" style={{ color: "var(--text)" }}>{p.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: p.publishedAt ? "var(--success, #16a34a)" : "var(--surface-2, var(--surface))",
                            color: p.publishedAt ? "#ffffff" : "var(--text-muted)",
                          }}>
                          {p.publishedAt ? "Published" : "Draft"}
                        </span>
                        {p.publishedAt && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {new Date(p.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                        <Link href={`/blog/${p.slug}`} target="_blank"
                          className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                          View ↗
                        </Link>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => togglePublish(p)}
                        className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
                        style={{ backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        {p.publishedAt ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => openEditPost(p)}
                        className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
                        style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
                        Edit
                      </button>
                      <button onClick={() => deletePost(p.id)}
                        className="rounded px-2 py-1 text-xs font-medium hover:opacity-80"
                        style={{ backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444" }}>
                        Del
                      </button>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && <p className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No posts yet. Create your first one.</p>}
              </div>
            </section>

            {/* Editor */}
            <section>
              <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--text)" }}>
                {editingPost ? `Editing: ${editingPost.title}` : "New post"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>Title</label>
                  <input type="text" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Post title"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>Excerpt <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(shown in list)</span></label>
                  <input type="text" value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
                    placeholder="Short summary shown on the blog index…"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>Content <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Markdown)</span></label>
                  <textarea ref={contentRef} value={draft.content}
                    onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                    rows={16} placeholder="Write your post in Markdown…"
                    className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", resize: "vertical" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>Publish date <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(leave blank to save as draft)</span></label>
                  <input type="datetime-local" value={draft.publishedAt}
                    onChange={(e) => setDraft((d) => ({ ...d, publishedAt: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
                {blogError && <p className="text-sm" style={{ color: "#ef4444" }}>{blogError}</p>}
                <div className="flex gap-3">
                  <button onClick={saveBlogPost} disabled={blogSaving}
                    className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
                    {blogSaving ? "Saving…" : editingPost ? "Save changes" : "Create post"}
                  </button>
                  {editingPost && (
                    <button onClick={openNewPost}
                      className="rounded-lg border px-4 py-2 text-sm font-medium"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
