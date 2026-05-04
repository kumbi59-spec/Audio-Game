"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";

type Comment = { id: string; author: string; body: string; createdAt: string };
type Thread = { id: string; title: string; body: string; author: string; createdAt: string; comments: Comment[] };

const STARTER_THREADS: Thread[] = [
  {
    id: "t1",
    title: "Best AI RPG campaigns for blind and low-vision players",
    body: "Share your favorite worlds, accessibility tips, and narration settings that made campaigns easier to play.",
    author: "EchoQuest Team",
    createdAt: new Date("2026-05-01").toISOString(),
    comments: [],
  },
  {
    id: "t2",
    title: "How to build immersive audio-first tabletop adventures",
    body: "Post your techniques for ambient sound, pacing narration, and creating memorable voice-driven encounters.",
    author: "EchoQuest Team",
    createdAt: new Date("2026-05-02").toISOString(),
    comments: [],
  },
];

const AGREEMENT_KEY = "echoquest-discussion-agreement";

export default function DiscussionPage() {
  const { data: session } = useSession();
  const emailVerified = !!(session?.user as { emailVerified?: Date | null } | undefined)?.emailVerified;
  const [threads, setThreads] = useState<Thread[]>(STARTER_THREADS);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState<boolean>(() => typeof window !== "undefined" && localStorage.getItem(AGREEMENT_KEY) === "agreed");

  const canPost = useMemo(() => emailVerified && agreed, [emailVerified, agreed]);

  function agree(value: "agreed" | "disagreed") {
    localStorage.setItem(AGREEMENT_KEY, value);
    setAgreed(value === "agreed");
  }

  function createThread() {
    if (!canPost || !title.trim() || !body.trim()) return;
    setThreads((prev) => [
      {
        id: `t-${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        author: session?.user?.name ?? session?.user?.email ?? "Verified user",
        createdAt: new Date().toISOString(),
        comments: [],
      },
      ...prev,
    ]);
    setTitle("");
    setBody("");
  }

  function addComment(threadId: string) {
    const draft = (commentDrafts[threadId] ?? "").trim();
    if (!canPost || !draft) return;
    setThreads((prev) => prev.map((t) => t.id !== threadId ? t : {
      ...t,
      comments: [...t.comments, { id: `c-${Date.now()}`, author: session?.user?.name ?? "Verified user", body: draft, createdAt: new Date().toISOString() }],
    }));
    setCommentDrafts((prev) => ({ ...prev, [threadId]: "" }));
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Discussion</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Verified members can create threads and comment.
        </p>

        <section className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Community agreement</h2>
          <ul className="mt-2 list-disc pl-5 text-sm" style={{ color: "var(--text-muted)" }}>
            <li>Be respectful to other users.</li>
            <li>No spamming or promoting products.</li>
            <li>Do not post sexual content.</li>
          </ul>
          <div className="mt-3 flex gap-2">
            <button onClick={() => agree("agreed")} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>Agree</button>
            <button onClick={() => agree("disagreed")} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>Disagree</button>
          </div>
        </section>

        <section className="mt-6 rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Create thread</h2>
          {!emailVerified && <p className="mt-2 text-sm text-amber-400">Verify your email to post.</p>}
          {emailVerified && !agreed && <p className="mt-2 text-sm text-amber-400">You must agree to the rules before posting.</p>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title" className="mt-3 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your post" className="mt-2 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", minHeight: 90 }} />
          <button disabled={!canPost} onClick={createThread} className="mt-2 rounded px-3 py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>Post thread</button>
        </section>

        <section className="mt-6 space-y-4">
          {threads.map((thread) => (
            <article key={thread.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{thread.title}</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>by {thread.author}</p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{thread.body}</p>

              <div className="mt-3 space-y-2">
                {thread.comments.map((comment) => (
                  <div key={comment.id} className="rounded border p-2" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{comment.author}</p>
                    <p className="text-sm" style={{ color: "var(--text)" }}>{comment.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input value={commentDrafts[thread.id] ?? ""} onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))} placeholder="Add a comment" className="w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }} />
                <button disabled={!canPost} onClick={() => addComment(thread.id)} className="rounded border px-3 py-2 text-sm disabled:opacity-50" style={{ borderColor: "var(--border)" }}>Comment</button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
