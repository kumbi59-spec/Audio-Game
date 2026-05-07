"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";

type ApiComment = { id: string; text: string; author: string; createdAt: string };
type ApiThread = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  comments: ApiComment[];
};

export default function DiscussionPage() {
  const { data: session } = useSession();
  const emailVerified = Boolean((session?.user as { emailVerified?: Date | null } | undefined)?.emailVerified);
  const [agreed, setAgreed] = useState(false);
  const [threads, setThreads] = useState<ApiThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const canPost = emailVerified && agreed;
  const agreementState = useMemo(() => {
    if (!emailVerified) return "Verify your email to unlock posting.";
    if (!agreed) return "You must agree to community rules before posting.";
    return "Posting enabled.";
  }, [emailVerified, agreed]);

  useEffect(() => {
    fetch("/api/discussion/threads")
      .then((r) => r.json())
      .then((data: ApiThread[]) => setThreads(data))
      .catch((err) => console.error("[discussion] failed to load threads:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handlePostThread() {
    if (!canPost || !title.trim() || !body.trim()) return;
    try {
      const res = await fetch("/api/discussion/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      if (!res.ok) return;
      const thread = (await res.json()) as ApiThread;
      setThreads((prev) => [thread, ...prev]);
      setTitle("");
      setBody("");
    } catch (err) {
      console.error("[discussion] failed to post thread:", err);
    }
  }

  async function handlePostComment(threadId: string) {
    const text = (commentDrafts[threadId] ?? "").trim();
    if (!canPost || !text) return;
    try {
      const res = await fetch(`/api/discussion/threads/${threadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const comment = (await res.json()) as ApiComment;
      setThreads((prev) =>
        prev.map((t) => t.id === threadId ? { ...t, comments: [...t.comments, comment] } : t)
      );
      setCommentDrafts((prev) => ({ ...prev, [threadId]: "" }));
    } catch (err) {
      console.error("[discussion] failed to post comment:", err);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Discussion</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>{agreementState}</p>

        <section className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Community Agreement</h2>
          <ul className="mt-3 list-disc pl-5 text-sm" style={{ color: "var(--text-muted)" }}>
            <li>Be respectful to other users.</li>
            <li>No spamming or promoting products.</li>
            <li>Do not post sexual content.</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <button className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} onClick={() => setAgreed(true)}>Agree</button>
            <button className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} onClick={() => setAgreed(false)}>Disagree</button>
          </div>
        </section>

        <section className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Create Thread</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title" className="mt-3 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }} disabled={!canPost} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What do you want to discuss?" className="mt-2 w-full rounded border px-3 py-2 text-sm" rows={4} style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }} disabled={!canPost} />
          <button
            disabled={!canPost || !title.trim() || !body.trim()}
            onClick={() => { void handlePostThread(); }}
            className="mt-2 rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Post Thread
          </button>
        </section>

        <section className="mt-6 space-y-4">
          {loading && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading threads…</p>}
          {threads.map((thread) => (
            <article key={thread.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>{thread.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{thread.body}</p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Posted by {thread.author}</p>
              <div className="mt-3 space-y-2">
                {thread.comments.map((comment) => (
                  <p key={comment.id} className="rounded bg-black/10 px-2 py-1 text-sm">{comment.text}</p>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={commentDrafts[thread.id] ?? ""}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
                  placeholder="Add a comment"
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
                  disabled={!canPost}
                />
                <button
                  className="rounded border px-3 py-2 text-sm disabled:opacity-50"
                  style={{ borderColor: "var(--border)" }}
                  disabled={!canPost || !(commentDrafts[thread.id] ?? "").trim()}
                  onClick={() => { void handlePostComment(thread.id); }}
                >Comment</button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
