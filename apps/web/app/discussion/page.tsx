"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { SiteHeader } from "@/components/SiteHeader";

type DiscussionThread = {
  id: string;
  title: string;
  body: string;
  author: string;
  comments: string[];
};

const starterThreads: DiscussionThread[] = [
  {
    id: "best-audio-rpg-builds-2026",
    title: "Best Audio RPG Character Builds in 2026 (Screen Reader Friendly)",
    body: "Share your strongest and most accessible character builds for voice-first campaigns.",
    author: "EchoQuest Team",
    comments: ["My best build is high charisma + stealth for puzzle-heavy worlds."],
  },
  {
    id: "how-to-master-voice-text-adventure",
    title: "How to Master Voice Text Adventure Games: Beginner to Pro Guide",
    body: "Post your tips for faster command phrasing, better narration recaps, and smarter combat choices.",
    author: "EchoQuest Team",
    comments: ["Using short intent statements improved my turns a lot."],
  },
];

export default function DiscussionPage() {
  const { data: session } = useSession();
  const emailVerified = Boolean((session?.user as { emailVerified?: Date | null } | undefined)?.emailVerified);
  const [agreed, setAgreed] = useState(false);
  const [threads, setThreads] = useState<DiscussionThread[]>(starterThreads);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const canPost = emailVerified && agreed;
  const agreementState = useMemo(() => {
    if (!emailVerified) return "Verify your email to unlock posting.";
    if (!agreed) return "You must agree to community rules before posting.";
    return "Posting enabled.";
  }, [emailVerified, agreed]);

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
            onClick={() => {
              setThreads((prev) => [{ id: crypto.randomUUID(), title: title.trim(), body: body.trim(), author: session?.user?.name ?? "Verified User", comments: [] }, ...prev]);
              setTitle("");
              setBody("");
            }}
            className="mt-2 rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Post Thread
          </button>
        </section>

        <section className="mt-6 space-y-4">
          {threads.map((thread) => (
            <article key={thread.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>{thread.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{thread.body}</p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>Posted by {thread.author}</p>
              <div className="mt-3 space-y-2">
                {thread.comments.map((comment, idx) => <p key={idx} className="rounded bg-black/10 px-2 py-1 text-sm">{comment}</p>)}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={commentDrafts[thread.id] ?? ""} onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))} placeholder="Add a comment" className="w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }} disabled={!canPost} />
                <button
                  className="rounded border px-3 py-2 text-sm disabled:opacity-50"
                  style={{ borderColor: "var(--border)" }}
                  disabled={!canPost || !(commentDrafts[thread.id] ?? "").trim()}
                  onClick={() => {
                    const text = (commentDrafts[thread.id] ?? "").trim();
                    if (!text) return;
                    setThreads((prev) => prev.map((t) => t.id === thread.id ? { ...t, comments: [...t.comments, text] } : t));
                    setCommentDrafts((prev) => ({ ...prev, [thread.id]: "" }));
                  }}
                >Comment</button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
