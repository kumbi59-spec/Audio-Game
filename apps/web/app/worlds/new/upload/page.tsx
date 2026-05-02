"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BibleUploader } from "@/components/worlds/BibleUploader";
import { UploadProgress } from "@/components/worlds/UploadProgress";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useCanWeb } from "@/store/entitlements-store";
import { UpgradeModal } from "@/components/entitlements/UpgradeModal";
import type { UploadProgressEvent } from "@/lib/upload/types";

type Stage = UploadProgressEvent["stage"];

export default function UploadBiblePage() {
  const router = useRouter();
  const { narrate } = useAnnouncer();
  const can = useCanWeb();

  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [message, setMessage] = useState("");
  const [worldId, setWorldId] = useState<string | null>(null);
  const [worldName, setWorldName] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const isProcessing = stage !== null && stage !== "done" && stage !== "error";
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    narrate("Upload Game Bible page. Select a PDF, Word document, text file, or JSON to turn your world into an AI-narrated adventure.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function announceStage(msg: string, assertive = false) {
    narrate(msg, assertive ? "assertive" : "polite");
  }

  async function handleUpload() {
    if (!can.bibleUpload) { setPaywallOpen(true); return; }
    if (!file || isProcessing) return;

    const guestId = (() => {
      const stored = localStorage.getItem("echoquest-guest-id");
      if (stored) return stored;
      const id = crypto.randomUUID();
      localStorage.setItem("echoquest-guest-id", id);
      return id;
    })();

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("guestId", guestId);

    setStage("receiving");
    setMessage("Sending your file…");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        setStage("error");
        setMessage("Upload failed. Please try again.");
        announceStage("Upload failed. Please try again.", true);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const dataLine = chunk
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          try {
            const evt = JSON.parse(dataLine.slice(6)) as UploadProgressEvent;
            setStage(evt.stage);
            setMessage(evt.message);
            announceStage(evt.message, evt.stage === "error" || evt.stage === "done");

            if (evt.stage === "done") {
              setWorldId(evt.worldId ?? null);
              setWorldName(evt.worldName ?? null);
            }
          } catch {
            // malformed event — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setStage("error");
        const msg = "Connection lost. Please check your network and try again.";
        setMessage(msg);
        announceStage(msg, true);
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="px-6 py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to Home
        </Link>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text)" }}
          tabIndex={-1}
          data-focus-on-mount
        >
          Upload a Game Bible
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Upload your world document and the AI will turn it into a playable adventure.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-xl px-6 pb-16">
        {/* What is a Game Bible? */}
        <section
          aria-label="About Game Bibles"
          className="mb-6 rounded-xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <h2
            className="mb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            WHAT TO UPLOAD
          </h2>
          <ul className="space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <li>A homebrew TTRPG campaign document or setting guide</li>
            <li>A world-building document with locations, NPCs, and lore</li>
            <li>An original story outline or novel world guide</li>
            <li>A structured JSON file you built yourself</li>
          </ul>
          <p className="mt-3 text-xs" style={{ color: "var(--text-subtle)" }}>
            The AI reads your document, identifies key characters, locations, and story hooks, then generates a playable world. You can review the extracted summary before playing.
          </p>
        </section>

        {/* Upload form */}
        {stage === null && (
          <section aria-label="File upload" className="space-y-4">
            <BibleUploader
              onFileSelected={(f) => setFile(f)}
              disabled={isProcessing}
            />

            <button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              aria-label={file ? `Upload ${file.name} and create world` : "Select a file first"}
              className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              Create World from File
            </button>
          </section>
        )}

        {/* Progress */}
        {stage !== null && (
          <section aria-label="Upload progress" className="space-y-4">
            <UploadProgress stage={stage} message={message} />

            {/* Done — play now */}
            {stage === "done" && worldId && (
              <div className="animate-fade-slide-in space-y-3">
                <button
                  onClick={() => router.push(`/create?worldId=${worldId}`)}
                  aria-label={`Play your world ${worldName ?? ""}. Start your adventure now.`}
                  className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                >
                  Play Your World Now →
                </button>
                <button
                  onClick={() => router.push("/library")}
                  className="w-full rounded-lg border py-3 text-sm transition-colors hover:opacity-90"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  Back to Library
                </button>
              </div>
            )}

            {/* Error — try again */}
            {stage === "error" && (
              <button
                onClick={() => {
                  setStage(null);
                  setMessage("");
                  setWorldId(null);
                }}
                className="w-full rounded-lg border py-3 text-sm transition-colors hover:opacity-90"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Try Again
              </button>
            )}
          </section>
        )}
      </main>
      <UpgradeModal
        open={paywallOpen}
        requiredTier="storyteller"
        featureName="Game Bible Upload"
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}
