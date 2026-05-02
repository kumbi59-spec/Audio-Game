"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useCanWeb } from "@/store/entitlements-store";

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
          Create a New World
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
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
            className="block rounded-2xl border-2 p-6 transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--accent)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">⚡</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
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
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--surface3)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Storyteller+
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  No Game Bible needed. Answer 4 questions — Claude automatically generates setting, tone, narrator style, and world rules.
                </p>
                <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-faint)" }}>
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
            className="block rounded-2xl border p-6 transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">🧙</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    World Builder Wizard
                  </h2>
                  {locked && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--surface3)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Storyteller+
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  Answer 10 spoken questions. Claude suggests ideas at each step. Full creative control over every detail.
                </p>
                <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-faint)" }}>
                  <li>✓ AI suggestions at every step</li>
                  <li>✓ Step-by-step voice walkthrough</li>
                  <li>✓ Ready in under 5 minutes</li>
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
            className="block rounded-2xl border p-6 transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">📖</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    Upload a Game Bible
                  </h2>
                  {!can.bibleUpload && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--surface3)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Storyteller+
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  Upload a PDF, Word document, text file, or JSON. Claude reads it, identifies characters and locations, and builds a playable world.
                </p>
                <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-faint)" }}>
                  <li>✓ PDF, DOCX, TXT, MD, JSON</li>
                  <li>✓ Extracts NPCs, locations, lore</li>
                  <li>✓ Review summary before playing</li>
                </ul>
              </div>
            </div>
          </Link>

        </div>

        {locked && (
          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            World creation requires the{" "}
            <Link href="/account" className="underline" style={{ color: "var(--accent)" }}>
              Storyteller plan
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  );
}
