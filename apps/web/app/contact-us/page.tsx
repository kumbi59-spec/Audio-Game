"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
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
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label className="block text-sm" htmlFor="issue-type">Issue Type</label>
            <select id="issue-type" className="mt-1 w-full rounded border px-3 py-2 border-border bg-bg">
              <option>Bug report</option>
              <option>Having a problem</option>
              <option>Suggestion</option>
            </select>
            <label className="mt-4 block text-sm" htmlFor="message">Message</label>
            <textarea
              id="message"
              required
              rows={6}
              className="mt-1 w-full rounded border px-3 py-2 border-border bg-bg"
            />
            <p className="mt-2 text-xs text-muted">
              Include your email if you want a reply. We don&rsquo;t use it
              for marketing.
            </p>
            <button className="mt-4 rounded px-4 py-2 text-sm font-semibold text-on-accent bg-accent-solid" type="submit">
              Send message
            </button>
            {submitted && <p className="mt-3 text-sm text-green-400">Thanks &mdash; we received your message and will reply within two business days.</p>}
          </form>
        </section>
      </main>
    </div>
  );
}
