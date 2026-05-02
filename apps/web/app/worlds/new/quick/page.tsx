"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnnouncer } from "@/components/accessibility/AudioAnnouncer";
import { useCanWeb } from "@/store/entitlements-store";
import { UpgradeModal } from "@/components/entitlements/UpgradeModal";

const GENRE_OPTIONS = [
  "Dark fantasy",
  "High fantasy",
  "Science fiction",
  "Sci-fi noir",
  "Post-apocalyptic",
  "Cyberpunk",
  "Steampunk",
  "Horror",
  "Cozy mystery",
  "Historical adventure",
  "Space opera",
  "Urban fantasy",
  "Gothic horror",
  "Western",
  "Solarpunk",
  "Other",
];

export default function QuickBuildPage() {
  const router = useRouter();
  const { narrate } = useAnnouncer();
  const can = useCanWeb();

  const [paywallOpen, setPaywallOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [pitch, setPitch] = useState("");
  const [openingScene, setOpeningScene] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!can.worldWizard) {
      setPaywallOpen(true);
      return;
    }
    narrate("Quick Build. Answer 4 questions and Claude builds the rest of your world automatically.");
    titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedGenre = genre === "Other" ? customGenre.trim() : genre;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!can.worldWizard) { setPaywallOpen(true); return; }

    if (!title.trim()) { setError("Please enter a world name."); return; }
    if (!resolvedGenre) { setError("Please choose a genre."); return; }
    if (!pitch.trim()) { setError("Please write a one-sentence pitch."); return; }
    if (!openingScene.trim()) { setError("Please describe the opening scene."); return; }

    setBusy(true);
    setError(null);

    narrate("Building your world. This takes about 10 seconds.");

    try {
      const res = await fetch("/api/worlds/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          genre: resolvedGenre,
          pitch: pitch.trim(),
          openingScene: openingScene.trim(),
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { worldId?: string; error?: string };

      if (!res.ok || !data.worldId) {
        const msg = data.error ?? "Could not create world. Please try again.";
        setError(msg);
        narrate(msg, "assertive");
        return;
      }

      narrate(`Your world "${title.trim()}" is ready. Starting character creation.`, "assertive");
      router.push(`/create?worldId=${data.worldId}`);
    } catch {
      const msg = "Network error. Please check your connection and try again.";
      setError(msg);
      narrate(msg, "assertive");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <a
        href="#quick-main"
        className="sr-only focus:not-sr-only absolute left-4 top-4 rounded px-3 py-1 text-sm font-semibold"
        style={{ backgroundColor: "var(--accent)", color: "#fff" }}
      >
        Skip to form
      </a>

      <header className="px-6 py-6">
        <Link
          href="/worlds/new"
          className="mb-4 inline-block text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
          aria-label="Back to world creation options"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Quick Build
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Answer 4 questions — Claude fills in everything else automatically.
        </p>
      </header>

      <main id="quick-main" className="mx-auto max-w-xl px-6 pb-20">
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">

          {/* 1. World name */}
          <div>
            <label
              htmlFor="world-title"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              1. What is the name of your world?
              <span aria-hidden="true" className="ml-1" style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="world-title"
              ref={titleRef}
              type="text"
              required
              aria-required="true"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              placeholder="e.g. The Shattered Realm"
              className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface2)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* 2. Genre */}
          <div>
            <label
              htmlFor="world-genre"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              2. What genre is it?
              <span aria-hidden="true" className="ml-1" style={{ color: "var(--danger)" }}>*</span>
            </label>
            <select
              id="world-genre"
              required
              aria-required="true"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={busy}
              className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface2)",
                color: genre ? "var(--text)" : "var(--text-muted)",
              }}
            >
              <option value="" disabled>Select a genre…</option>
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {genre === "Other" && (
              <input
                type="text"
                aria-label="Custom genre"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                disabled={busy}
                placeholder="Describe your genre…"
                className="mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface2)",
                  color: "var(--text)",
                }}
              />
            )}
          </div>

          {/* 3. Pitch */}
          <div>
            <label
              htmlFor="world-pitch"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              3. Describe your world in one sentence.
              <span aria-hidden="true" className="ml-1" style={{ color: "var(--danger)" }}>*</span>
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              What is the core hook? Imagine telling a friend in one line.
            </p>
            <textarea
              id="world-pitch"
              required
              aria-required="true"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              disabled={busy}
              placeholder="e.g. A dying empire where magic is outlawed and rebels speak in whispers."
              rows={3}
              className="w-full resize-none rounded-xl border px-4 py-3 text-base outline-none focus:ring-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface2)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* 4. Opening scene */}
          <div>
            <label
              htmlFor="world-opening"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              4. Where does the story begin?
              <span aria-hidden="true" className="ml-1" style={{ color: "var(--danger)" }}>*</span>
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Set the scene — the very first moment the player steps into your world.
            </p>
            <textarea
              id="world-opening"
              required
              aria-required="true"
              value={openingScene}
              onChange={(e) => setOpeningScene(e.target.value)}
              disabled={busy}
              placeholder="e.g. You wake in a burnt-out village, smoke still rising, clutching a letter you don't remember writing."
              rows={3}
              className="w-full resize-none rounded-xl border px-4 py-3 text-base outline-none focus:ring-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface2)",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Optional cover image */}
          <div>
            <label
              htmlFor="cover-url"
              className="mb-1.5 block text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Cover image <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span>
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Paste a public image URL. Leave blank and one is generated automatically.
            </p>
            <input
              id="cover-url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={busy}
              placeholder="https://example.com/cover.jpg"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface2)",
                color: "var(--text)",
              }}
            />
            {imageUrl.trim() && (
              <div className="mt-3 overflow-hidden rounded-lg" style={{ maxHeight: 160 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl.trim()}
                  alt="Cover preview"
                  className="h-40 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-sm font-semibold"
              style={{ color: "var(--danger)" }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="w-full rounded-xl py-3.5 text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  Building your world…
                </span>
              ) : (
                "Build My World →"
              )}
            </button>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-faint)" }}>
              Claude fills in setting, tone, rules, and more — takes about 10 seconds.
            </p>
          </div>
        </form>
      </main>

      <UpgradeModal
        open={paywallOpen}
        requiredTier="storyteller"
        featureName="Quick Build"
        onClose={() => { setPaywallOpen(false); router.push("/worlds/new"); }}
      />
    </div>
  );
}
