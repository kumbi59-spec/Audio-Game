"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTACT_TOPICS, MAX_CONTACT_MESSAGE_CHARS, type ContactTopic } from "@/lib/email/contact-form";

export default function ContactUsPage() {
  const [topic, setTopic] = useState<ContactTopic>(CONTACT_TOPICS[0]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  // An address to write to instead, when the server can't send the form.
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSubmitted(false);
    setError("");
    setFallbackEmail(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, message, ...(email.trim() ? { email: email.trim() } : {}) }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; email?: string };
      if (!res.ok) {
        setError(data.error ?? "Your message couldn't be sent. Please try again.");
        setFallbackEmail(typeof data.email === "string" ? data.email : null);
      } else {
        setSubmitted(true);
        setMessage("");
      }
    } catch {
      setError("Your message couldn't be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
        <p className="mt-3 text-base text-muted">
          We&rsquo;re a small team and we read every message that comes
          through this form. Whether you&rsquo;re reporting a bug, asking
          for a refund, sharing feedback, or want to talk to us about
          accessibility, you&rsquo;ll get a human reply &mdash; usually
          within two business days.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-5 border-border bg-surface">
            <h2 className="text-base font-semibold text-foreground">Bug reports</h2>
            <p className="mt-2 text-sm text-muted">
              If something broke mid-session, tell us what world you were
              playing, what action you tried, and what happened instead. A
              browser console screenshot helps but isn&rsquo;t required.
            </p>
          </div>
          <div className="rounded-xl border p-5 border-border bg-surface">
            <h2 className="text-base font-semibold text-foreground">Billing &amp; refunds</h2>
            <p className="mt-2 text-sm text-muted">
              Pick &ldquo;Having a problem&rdquo; below and include the
              email on your account. Refunds for clear product faults
              (charged after cancel, feature didn&rsquo;t work) are
              processed within five business days.
            </p>
          </div>
          <div className="rounded-xl border p-5 border-border bg-surface">
            <h2 className="text-base font-semibold text-foreground">Accessibility feedback</h2>
            <p className="mt-2 text-sm text-muted">
              Screen-reader regressions, missing keyboard paths, broken
              focus order &mdash; we treat these as P0 bugs. Tell us your
              assistive tech (NVDA, JAWS, VoiceOver, TalkBack) and the
              page or session step where it broke.
            </p>
          </div>
          <div className="rounded-xl border p-5 border-border bg-surface">
            <h2 className="text-base font-semibold text-foreground">Press, partnerships, legal</h2>
            <p className="mt-2 text-sm text-muted">
              For press enquiries, accessibility-org partnerships, or
              formal legal notices, pick &ldquo;Suggestion&rdquo; below and
              include the word &ldquo;press&rdquo;, &ldquo;partnership&rdquo;
              or &ldquo;legal&rdquo; at the top of your message so it routes
              correctly.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Before you write</h2>
          <p className="mt-3 text-base text-muted">
            Many of the most common questions are answered without waiting
            on us:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base text-muted">
            <li>
              <Link href="/about" className="hover:underline text-accent">About EchoQuest</Link>
              {" "}— what the platform is and who it&rsquo;s for.
            </li>
            <li>
              <Link href="/blog" className="hover:underline text-accent">Blog</Link>
              {" "}— how-to guides, accessibility deep-dives, world-building tips.
            </li>
            <li>
              <Link href="/seo/play-audio-rpg-with-screen-reader" className="hover:underline text-accent">Screen-reader guide</Link>
              {" "}— NVDA / JAWS / VoiceOver / TalkBack walkthrough.
            </li>
            <li>
              <Link href="/privacy" className="hover:underline text-accent">Privacy policy</Link>
              {" "}and{" "}
              <Link href="/terms" className="hover:underline text-accent">terms of use</Link>.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Send us a message</h2>
          <form
            className="mt-4 rounded-xl border p-5 border-border bg-surface"
            onSubmit={handleSubmit}
          >
            <label className="block text-sm" htmlFor="issue-type">Issue Type</label>
            <select
              id="issue-type"
              value={topic}
              onChange={(e) => setTopic(e.target.value as ContactTopic)}
              className="mt-1 w-full rounded border px-3 py-2 border-border bg-bg"
            >
              {CONTACT_TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="mt-4 block text-sm" htmlFor="contact-email">Your email (optional)</label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
              aria-describedby="contact-email-hint"
              className="mt-1 w-full rounded border px-3 py-2 border-border bg-bg"
            />
            <p id="contact-email-hint" className="mt-2 text-xs text-muted">
              Include your email if you want a reply. We don&rsquo;t use it
              for marketing.
            </p>
            <label className="mt-4 block text-sm" htmlFor="message">Message</label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_CONTACT_MESSAGE_CHARS}
              className="mt-1 w-full rounded border px-3 py-2 border-border bg-bg"
            />
            <button
              className="mt-4 rounded px-4 py-2 text-sm font-semibold text-on-accent bg-accent-solid disabled:opacity-50"
              type="submit"
              disabled={busy}
            >
              {busy ? "Sending…" : "Send message"}
            </button>
            <div aria-live="polite">
              {submitted && <p className="mt-3 text-sm text-green-400">Thanks &mdash; we received your message and will reply within two business days.</p>}
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm" style={{ color: "var(--danger, #ef4444)" }}>
                {error}
                {fallbackEmail && (
                  <>
                    {" "}
                    <a href={`mailto:${fallbackEmail}`} className="underline text-accent">Email {fallbackEmail}</a>
                  </>
                )}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
