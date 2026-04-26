"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { speak } from "@/lib/audio/tts-provider";
import { useAudioStore } from "@/store/audio-store";
import { useCanWeb } from "@/store/entitlements-store";

export default function NewWorldPage() {
  const { announce } = useAnnouncer();
  const { ttsSpeed, volume } = useAudioStore();
  const can = useCanWeb();

  useEffect(() => {
    const msg = "Create a new world. Choose the wizard for a guided experience, or upload a Game Bible document.";
    announce(msg);
    speak(msg, { rate: ttsSpeed, volume });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {/* Wizard option */}
          <Link
            href="/worlds/new/wizard"
            aria-label="World Builder Wizard. Answer 10 questions and the AI builds your world. Requires Creator plan."
            className="block rounded-2xl border p-6 transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--accent)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">🧙</span>
              <div>
                <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text)" }}>
                  World Builder Wizard
                  {!can.worldWizard && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--accentBg, rgba(99,102,241,0.12))",
                        color: "var(--accent)",
                      }}
                    >
                      Creator
                    </span>
                  )}
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Answer 10 spoken questions. Claude suggests ideas at each step. Your world is ready to play in under 5 minutes.
                </p>
                <ul className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-faint)" }}>
                  <li>✓ Voice input supported</li>
                  <li>✓ AI suggestions at every step</li>
                  <li>✓ Publish to community library</li>
                </ul>
              </div>
            </div>
          </Link>

          {/* Upload option */}
          <Link
            href="/worlds/new/upload"
            aria-label="Upload a Game Bible. Upload a PDF, Word doc, or text file and the AI extracts your world. Requires Storyteller plan."
            className="block rounded-2xl border p-6 transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl" aria-hidden="true">📖</span>
              <div>
                <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text)" }}>
                  Upload a Game Bible
                  {!can.bibleUpload && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--surface3)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Storyteller
                    </span>
                  )}
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
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
      </main>
    </div>
  );
}
