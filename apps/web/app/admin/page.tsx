"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

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
type SeoCheck = { label: string; pass: boolean };

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSeoChecks(post: BlogPost): SeoCheck[] {
  const plain = stripMarkdown(post.content);
  const primaryPhrase = post.title.toLowerCase().split(/\s+/).slice(0, 4).join(" ").trim();
  const first100Words = plain.toLowerCase().split(/\s+/).slice(0, 100).join(" ");
  return [
    { label: "Meta description", pass: post.excerpt.trim().length >= 80 },
    { label: "Keyword in first 100 words", pass: !!primaryPhrase && first100Words.includes(primaryPhrase) },
    { label: "Has H2/H3 section", pass: /^#{2,3}\s+/m.test(post.content) },
    { label: "Internal link", pass: /\]\(\/(blog|library|campaigns|pricing|worlds)[^)]+\)/i.test(post.content) },
    { label: "External link", pass: /\]\(https?:\/\/(?!echoquest\.app)[^)]+\)/i.test(post.content) },
    { label: "Image alt text", pass: /!\[[^\]]{4,}\]\([^)]+\)/.test(post.content) },
  ];
}

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
  const [generatingCovers, setGeneratingCovers] = useState(false);
  const [coverResult, setCoverResult] = useState("");
  const [generatingBlogCovers, setGeneratingBlogCovers] = useState(false);
  const [blogCoverResult, setBlogCoverResult] = useState("");

  async function generateCovers() {
    setGeneratingCovers(true);
    setCoverResult("Fetching worlds…");
    try {
      const listRes = await fetch("/api/admin/worlds/covers");
      if (!listRes.ok) { setCoverResult("Failed to fetch worlds."); return; }
      const { worlds, configError } = await listRes.json() as { worlds: Array<{ id: string; name: string }>; configError: string | null };
      if (configError) { setCoverResult(`Config error: ${configError}`); return; }
      let ok = 0, failed = 0, lastReason = "";
      for (let i = 0; i < worlds.length; i++) {
        const w = worlds[i];
        setCoverResult(`Generating ${i + 1}/${worlds.length}: ${w.name}…`);
        try {
          const res = await fetch("/api/admin/worlds/covers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ worldId: w.id }),
          });
          const data = await res.json() as { status?: string; reason?: string };
          if (res.ok && data.status === "ok") { ok++; } else { failed++; lastReason = data.reason ?? ""; }
        } catch { failed++; }
      }
      setCoverResult(`Done — ${ok} generated, ${failed} failed.${lastReason ? ` Reason: ${lastReason}` : ""}`);
    } catch (err) {
      setCoverResult(err instanceof Error ? err.message : "Failed.");
    } finally {
      setGeneratingCovers(false);
    }
  }

  /**
   * Loop the bulk blog-cover endpoint until it reports `done: true`. The
   * endpoint processes one post per call to stay inside the function timeout,
   * so the UI drives the iteration. Pass `force=true` to overwrite covers
   * that have already been generated; otherwise we only fill in posts whose
   * coverImageUrl is null.
   */
  async function generateBlogCovers(force = false) {
    setGeneratingBlogCovers(true);
    setBlogCoverResult("Checking provider config…");
    try {
      const listRes = await fetch("/api/admin/blog/covers");
      if (!listRes.ok) { setBlogCoverResult("Failed to fetch blog posts."); return; }
      const list = await listRes.json() as {
        summary: { total: number; withCover: number; withoutCover: number };
        configError: string | null;
      };
      if (list.configError) { setBlogCoverResult(`Config error: ${list.configError}`); return; }
      const todo = force ? list.summary.total : list.summary.withoutCover;
      if (todo === 0) {
        setBlogCoverResult(`All ${list.summary.total} posts already have covers. Use the Force button to regenerate.`);
        return;
      }
      let ok = 0, failed = 0, lastReason = "";
      let iteration = 0;
      // Track the next post the server told us to process. Required for
      // the force loop — without an explicit id, the server keeps picking
      // the oldest post and would regenerate the same row every iteration.
      // First call: no nextCursor (server picks the seed post). Subsequent
      // calls: pass the nextId returned by the prior response.
      let nextCursor: string | null = null;
      while (iteration < list.summary.total + 5) {
        iteration++;
        setBlogCoverResult(`Generating ${iteration} of up to ${todo}…`);
        try {
          const params = new URLSearchParams();
          if (force) params.set("force", "true");
          if (nextCursor) params.set("id", nextCursor);
          const qs = params.toString();
          const res = await fetch(`/api/admin/blog/covers${qs ? `?${qs}` : ""}`, { method: "POST" });
          const data = await res.json() as {
            status?: string;
            done?: boolean;
            title?: string;
            reason?: string;
            nextId?: string | null;
          };
          if (res.ok && data.status === "ok") {
            ok++;
            setBlogCoverResult(`Generated ${ok}/${todo}${data.title ? `: ${data.title}` : ""}…`);
          } else {
            failed++;
            lastReason = data.reason ?? "";
          }
          nextCursor = data.nextId ?? null;
          if (data.done || !nextCursor) break;
        } catch {
          failed++;
          break;
        }
      }
      setBlogCoverResult(`Done — ${ok} generated, ${failed} failed.${lastReason ? ` Last error: ${lastReason}` : ""}`);
      // Refresh post list so the UI shows the new cover indicators.
      const fresh = await fetch("/api/admin/blog").then((r) => r.ok ? r.json() : []) as BlogPost[];
      setPosts(Array.isArray(fresh) ? fresh : posts);
    } catch (err) {
      setBlogCoverResult(err instanceof Error ? err.message : "Failed.");
    } finally {
      setGeneratingBlogCovers(false);
    }
  }

  // Blog editor state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogError, setBlogError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState("");
  const [seoFixing, setSeoFixing] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  async function seedPosts(force = false) {
    setSeeding(true);
    setSeedResult("");
    try {
      const res = await fetch(`/api/admin/blog/seed${force ? "?force=1" : ""}`, { method: "POST" });
      let data: { created?: string[]; updated?: string[]; skipped?: string[]; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) { setSeedResult(data.error ?? `Seed failed (${res.status}).`); return; }
      const newPosts = await fetch("/api/admin/blog").then((r) => r.ok ? r.json() : []) as BlogPost[];
      setPosts(Array.isArray(newPosts) ? newPosts : []);
      setSeedResult(
        `Created ${data.created?.length ?? 0} · Updated ${data.updated?.length ?? 0} · Skipped ${data.skipped?.length ?? 0}.`
      );
    } catch (err) {
      setSeedResult(err instanceof Error ? err.message : "Seed failed.");
    } finally {
      setSeeding(false);
    }
  }

  async function applySeoFixes() {
    setSeoFixing(true);
    setSeedResult("");
    try {
      const res = await fetch("/api/admin/blog/seo-fix", { method: "POST" });
      const data = await res.json().catch(() => ({})) as { error?: string; updatedCount?: number };
      if (!res.ok) {
        setSeedResult(data.error ?? `SEO fix failed (${res.status}).`);
        return;
      }
      const newPosts = await fetch("/api/admin/blog").then((r) => r.ok ? r.json() : []) as BlogPost[];
      setPosts(Array.isArray(newPosts) ? newPosts : []);
      setSeedResult(`Applied SEO updates to ${data.updatedCount ?? 0} posts.`);
    } catch (err) {
      setSeedResult(err instanceof Error ? err.message : "SEO fix failed.");
    } finally {
      setSeoFixing(false);
    }
  }

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
      <SiteHeader />
      <header className="border-b px-6 py-6" style={{ borderColor: "var(--border)" }}>
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
            <div className="mb-4 flex items-center gap-3 flex-wrap">
              <button
                onClick={generateCovers}
                disabled={generatingCovers}
                className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              >
                {generatingCovers ? "Generating…" : "Generate Official Covers"}
              </button>
              {coverResult && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{coverResult}</p>
              )}
            </div>
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
              <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Posts</h2>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => seedPosts(false)} disabled={seeding}
                    className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {seeding ? "Seeding…" : "Seed 30 posts"}
                  </button>
                  <button onClick={() => seedPosts(true)} disabled={seeding}
                    className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    title="Replaces title, excerpt, and content of existing posts with the latest seed data — preserves publish date and author">
                    {seeding ? "Updating…" : "Re-seed (update content)"}
                  </button>
                  <button onClick={openNewPost}
                    className="rounded px-3 py-1.5 text-sm font-semibold"
                    style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}>
                    + New post
                  </button>
                  <button onClick={applySeoFixes} disabled={seoFixing}
                    className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    title="Auto-updates existing blog content with baseline SEO improvements.">
                    {seoFixing ? "Applying SEO…" : "Auto-fix existing SEO"}
                  </button>
                  <button
                    onClick={() => generateBlogCovers(false)}
                    disabled={generatingBlogCovers}
                    className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
                    title="Calls BFL (or Replicate) for every post that doesn't yet have a coverImageUrl. Skips posts that already have a cover.">
                    {generatingBlogCovers ? "Generating covers…" : "Generate Blog Covers"}
                  </button>
                  <button
                    onClick={() => generateBlogCovers(true)}
                    disabled={generatingBlogCovers}
                    className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    title="Regenerates ALL blog covers, overwriting existing ones. Use after a prompt change.">
                    {generatingBlogCovers ? "…" : "Force-regen all covers"}
                  </button>
                </div>
              </div>
              {blogCoverResult && <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>{blogCoverResult}</p>}
              {seedResult && <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>{seedResult}</p>}
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
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getSeoChecks(p).map((check) => (
                          <span key={check.label}
                            className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                            style={{ borderColor: check.pass ? "#16a34a" : "#f59e0b", color: check.pass ? "#16a34a" : "#f59e0b" }}>
                            {check.pass ? "✓" : "!"} {check.label}
                          </span>
                        ))}
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
                    placeholder="Post title (include your primary keyword naturally)"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>Excerpt <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(shown in list + used as meta description)</span></label>
                  <input type="text" value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
                    placeholder="1–2 sentence summary with the target keyword and user intent."
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-muted)" }}>Content <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Markdown)</span></label>
                  <textarea ref={contentRef} value={draft.content}
                    onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                    rows={16} placeholder="Write your post in Markdown. Use the target keyword in the first paragraph, add at least one H2/H3 with the key phrase, include internal/external links, and add image alt text."
                    className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)", resize: "vertical" }} />
                </div>
                <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}>
                  <p className="font-semibold">SEO publishing checklist</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: "var(--text-muted)" }}>
                    <li>Confirm keyword + intent from Ahrefs/SEMrush/Google Keyword Planner before writing.</li>
                    <li>Keep URL short and descriptive when choosing the slug.</li>
                    <li>Use the target phrase in title, excerpt (meta description), and at least one H2/H3.</li>
                    <li>Put the target phrase naturally in the first ~100 words.</li>
                    <li>Use short paragraphs and add useful multimedia with descriptive alt text.</li>
                    <li>Add internal links to relevant EchoQuest posts/pages and external links to reputable sources.</li>
                    <li>Include an author section and revisit posts periodically for freshness + broken links.</li>
                  </ul>
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
