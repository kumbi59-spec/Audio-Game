"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useCanWeb } from "@/store/entitlements-store";
import { SiteHeader } from "@/components/SiteHeader";

export default function NewWorldPage() {
  const { narrate } = useAnnouncer();
  const can = useCanWeb();

  useEffect(() => {
    narrate(
      "Create a new world. Choose Quick Build for the fastest path, the World Builder Wizard for full creative control, or upload a Game Bible document.",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locked = !can.worldWizard;

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <header className="px-6 py-8">
        <h1
          className="text-2xl font-bold text-foreground"
          tabIndex={-1}
          data-focus-on-mount
        >
          Create a New World
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choose how you&apos;d like to build your world.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-xl px-6 pb-16">
        <div className="space-y-4">

          {/* ── Quick Build ─────────────────────────────────────────────── */}
          <Link
            href="/worlds/new/quick"
            aria-label={
              locked
                ? "Quick Build — answer 4 questions, Claude fills the rest. Requires Storyteller plan."
                : "Quick Build — answer 4 questions, Claude fills the rest."
            }
            className="block rounded-2xl border-2 p-6 transition-opacity hover:opacity-90 border-accent bg-surface"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">⚡</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    Quick Build
                  </h2>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--accentBg, rgba(99,102,241,0.12))",
                      color: "var(--accent)",
                    }}
                  >
                    Fastest
                  </span>
                  {locked && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold bg-surface-3 text-muted"
                    >
                      Storyteller+
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  No Game Bible needed. Answer 4 questions — Claude automatically generates setting, tone, narrator style, and world rules.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-subtle">
                  <li>✓ Ready to play in under 30 seconds</li>
                  <li>✓ AI fills in everything you don&apos;t write</li>
                  <li>✓ Voice input supported</li>
                </ul>
              </div>
            </div>
          </Link>

          {/* ── World Builder Wizard ─────────────────────────────────────── */}
          <Link
            href="/worlds/new/wizard"
            aria-label={
              locked
                ? "World Builder Wizard — answer 10 questions with AI suggestions at each step. Requires Storyteller plan."
                : "World Builder Wizard — answer 10 questions with AI suggestions at each step."
            }
            className="block rounded-2xl border p-6 transition-opacity hover:opacity-90 border-border bg-surface"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">🧙</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    World Builder Wizard
                  </h2>
                  {locked && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold bg-surface-3 text-muted"
                    >
                      Storyteller+
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  Answer 10 spoken questions. Claude suggests ideas at each step. Full creative control over every detail.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-subtle">
                  <li>✓ AI suggestions at every step</li>
                  <li>✓ Step-by-step voice walkthrough</li>
                  <li>✓ Ready in under 5 minutes</li>
                </ul>
              </div>
            </div>
          </Link>

          {/* ── Import from Session Notes ───────────────────────────────── */}
          <Link
            href="/worlds/new/import"
            aria-label="Import from session notes — paste old campaign notes and Claude extracts your world."
            className="block rounded-2xl border p-6 transition-opacity hover:opacity-90 border-border bg-surface"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">📋</span>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">
                  Import from Session Notes
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Paste your old campaign notes — handwritten transcripts, session summaries, or world descriptions. Claude converts them into a Game Bible.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-subtle">
                  <li>✓ Works with any text format</li>
                  <li>✓ Pre-fills wizard with extracted details</li>
                  <li>✓ You review every field before saving</li>
                </ul>
              </div>
            </div>
          </Link>

          {/* ── Upload a Game Bible ──────────────────────────────────────── */}
          <Link
            href="/worlds/new/upload"
            aria-label={
              !can.bibleUpload
                ? "Upload a Game Bible — upload a PDF, Word doc, or text file. Requires Storyteller plan."
                : "Upload a Game Bible — upload a PDF, Word doc, or text file and Claude extracts your world."
            }
            className="block rounded-2xl border p-6 transition-opacity hover:opacity-90 border-border bg-surface"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">📖</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    Upload a Game Bible
                  </h2>
                  {!can.bibleUpload && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold bg-surface-3 text-muted"
                    >
                      Storyteller+
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  Upload a PDF, Word document, text file, or JSON. Claude reads it, identifies characters and locations, and builds a playable world.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-subtle">
                  <li>✓ PDF, DOCX, TXT, MD, JSON</li>
                  <li>✓ Extracts NPCs, locations, lore</li>
                  <li>✓ Review summary before playing</li>
                </ul>
              </div>
            </div>
          </Link>

        </div>

        {locked && (
          <p className="mt-6 text-center text-sm text-muted">
            World creation requires the{" "}
            <Link href="/account" className="underline text-accent">
              Storyteller plan
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  );
}
