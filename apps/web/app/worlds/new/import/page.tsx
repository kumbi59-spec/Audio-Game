"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { SiteHeader } from "@/components/SiteHeader";

const SESSION_KEY = "echoquest_import_draft";

export default function ImportNotesPage() {
  const router = useRouter();
  const { status } = useSession();
  const { narrate, announce } = useAnnouncer();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/sign-in");
  }, [status, router]);

  useEffect(() => {
    narrate(
      "Import from session notes. Paste your old campaign notes and Claude will extract world-building details to seed the wizard.",
    );
    headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (notes.trim().length < 20) {
      const msg = "Please paste at least 20 characters of session notes.";
      setError(msg);
      announce(msg, "assertive");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/worlds/import-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      const data = (await res.json()) as { draft?: Record<string, string>; error?: string };
      if (!res.ok || !data.draft) {
        const msg = data.error ?? "Extraction failed. Please try again.";
        setError(msg);
        announce(msg, "assertive");
        return;
      }
      const fieldCount = Object.keys(data.draft).length;
      if (fieldCount === 0) {
        const msg = "No world-building details found in those notes. Try adding more context about the setting and characters.";
        setError(msg);
        announce(msg, "assertive");
        return;
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.draft));
      narrate(
        `Extracted ${fieldCount} field${fieldCount === 1 ? "" : "s"} from your notes. Launching the wizard with pre-filled answers.`,
        "assertive",
      );
      router.push("/worlds/new/wizard");
    } catch {
      const msg = "Network error. Please check your connection and try again.";
      setError(msg);
      announce(msg, "assertive");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <header className="px-6 py-8">
        <nav aria-label="Breadcrumb" className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <a href="/worlds/new" className="underline hover:opacity-80" style={{ color: "var(--accent)" }}>
            Create a World
          </a>
          {" / "}
          <span>Import from Notes</span>
        </nav>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold"
          style={{ color: "var(--text)" }}
        >
          Import from Session Notes
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Paste your old campaign notes — handwritten transcripts, session summaries, or world descriptions. Claude will extract the setting, tone, and opening scene to seed your new world.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-6 pb-16">
        <form onSubmit={handleExtract} className="space-y-6">
          <div>
            <label
              htmlFor="notes-input"
              className="mb-2 block text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Paste your session notes
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={16}
              disabled={busy}
              aria-required="true"
              aria-describedby={error ? "notes-error" : "notes-hint"}
              placeholder="Session notes, world documents, campaign summaries… Paste anything here. The more detail, the better Claude can extract your world's details."
              className="w-full resize-y rounded-xl border p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2"
              style={{
                borderColor: error ? "var(--error, #dc2626)" : "var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--text)",
                "--tw-ring-color": "var(--accent)",
              } as React.CSSProperties}
            />
            <p id="notes-hint" className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Minimum 20 characters · Maximum 40,000 characters · {notes.length.toLocaleString()} typed
            </p>
          </div>

          {error && (
            <p
              id="notes-error"
              role="alert"
              aria-live="assertive"
              className="rounded-lg border p-3 text-sm font-semibold"
              style={{
                borderColor: "var(--error, #dc2626)",
                color: "var(--error, #dc2626)",
                backgroundColor: "color-mix(in srgb, var(--error, #dc2626) 8%, transparent)",
              }}
            >
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || notes.trim().length < 20}
              aria-disabled={busy || notes.trim().length < 20}
              className="rounded-xl px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              {busy ? "Extracting…" : "Extract World Details"}
            </button>
            <a
              href="/worlds/new"
              className="rounded-xl border px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Cancel
            </a>
          </div>

          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Claude extracts title, pitch, genre, setting, tone, world rules, and opening scene. You can review and edit every field in the wizard before creating your world.
          </p>
        </form>
      </main>
    </div>
  );
}

export { SESSION_KEY as IMPORT_DRAFT_SESSION_KEY };
