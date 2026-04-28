"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useAudioStore } from "@/store/audio-store";
import { speak, stopSpeech } from "@/lib/audio/tts-provider";
import { ELEVENLABS_PRESET_VOICES, DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/audio/voices-catalog";
import type { TTSProviderType, TTSVoice } from "@/types/audio";

const PREVIEW_TEXT =
  "The fog rolls in off the cliffs. Somewhere a bell tolls the watch change. Tonight, the city is yours.";

export default function VoiceSettingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const store = useAudioStore();

  const [browserVoices, setBrowserVoices] = useState<TTSVoice[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const dirtyRef = useRef(false);

  // Cloning state
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [clonedVoiceLabel, setClonedVoiceLabel] = useState<string | null>(null);
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloneLabel, setCloneLabel] = useState<string>("My voice");
  const [cloneConsent, setCloneConsent] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/sign-in");
  }, [status, router]);

  // Hydrate from server on mount
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me/voice-preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        store.hydrateFromServer(data);
        setClonedVoiceId(data.clonedVoiceId ?? null);
        setClonedVoiceLabel(data.clonedVoiceLabel ?? null);
      })
      .catch(() => undefined);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Read browser voices (async on Chrome — may fire after a tick)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const read = () => {
      setBrowserVoices(
        window.speechSynthesis.getVoices().map((v) => ({
          id: v.voiceURI,
          name: `${v.name} (${v.lang})`,
          lang: v.lang,
          provider: "browser" as const,
        })),
      );
    };
    read();
    window.speechSynthesis.addEventListener("voiceschanged", read);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", read);
  }, []);

  const voicesForProvider: TTSVoice[] = useMemo(() => {
    if (store.ttsProvider === "elevenlabs") {
      const cloned: TTSVoice[] = clonedVoiceId
        ? [{
            id: clonedVoiceId,
            name: `${clonedVoiceLabel ?? "My voice"} (your clone)`,
            lang: "en-US",
            provider: "elevenlabs",
          }]
        : [];
      return [...cloned, ...ELEVENLABS_PRESET_VOICES];
    }
    return browserVoices;
  }, [store.ttsProvider, browserVoices, clonedVoiceId, clonedVoiceLabel]);

  // Auto-save when settings change (debounced via effect timer)
  useEffect(() => {
    if (!dirtyRef.current) return;
    const handle = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch("/api/me/voice-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ttsProvider: store.ttsProvider,
            ttsVoiceId: store.ttsVoiceId,
            ttsSpeed: store.ttsSpeed,
            ttsPitch: store.ttsPitch,
            volume: store.volume,
          }),
        });
        if (res.ok) setSavedAt(Date.now());
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [store.ttsProvider, store.ttsVoiceId, store.ttsSpeed, store.ttsPitch, store.volume]);

  function markDirty<T>(setter: (v: T) => void): (v: T) => void {
    return (v: T) => {
      dirtyRef.current = true;
      setter(v);
    };
  }

  async function preview() {
    setPreviewing(true);
    try {
      stopSpeech();
      await speak(PREVIEW_TEXT);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleClone(e: React.FormEvent) {
    e.preventDefault();
    setCloneError(null);
    if (!cloneFile) {
      setCloneError("Pick an audio file first.");
      return;
    }
    if (!cloneConsent) {
      setCloneError("Please confirm consent.");
      return;
    }
    setCloning(true);
    try {
      const form = new FormData();
      form.append("sample", cloneFile, cloneFile.name);
      form.append("consent", "yes");
      form.append("label", cloneLabel.trim() || "My voice");
      const res = await fetch("/api/me/voice-clone", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCloneError(body.error ?? `Upload failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setClonedVoiceId(data.clonedVoiceId ?? null);
      setClonedVoiceLabel(data.clonedVoiceLabel ?? null);
      // The server auto-switched the user onto ElevenLabs + the new voice;
      // update the store so the UI reflects that immediately.
      store.hydrateFromServer({
        ttsProvider: data.ttsProvider,
        ttsVoiceId: data.ttsVoiceId,
      });
      setCloneFile(null);
      setCloneConsent(false);
    } finally {
      setCloning(false);
    }
  }

  async function handleDeleteClone() {
    if (!confirm("Delete your cloned voice? You can re-upload anytime.")) return;
    const res = await fetch("/api/me/voice-clone", { method: "DELETE" });
    if (res.ok) {
      setClonedVoiceId(null);
      setClonedVoiceLabel(null);
      // If they were narrating with the deleted clone, the server cleared
      // ttsVoiceId — sync the store so the picker doesn't point at a
      // voice that no longer exists.
      if (store.ttsVoiceId === clonedVoiceId) {
        store.setTTSVoiceId("");
      }
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header className="px-6 py-8">
        <Link href="/" className="mb-4 inline-block text-sm hover:underline" style={{ color: "var(--text-muted)" }}>
          ← Home
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }} tabIndex={-1}>
          Narrator Voice
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Choose how the Game Master sounds. Settings save automatically and follow your account across devices.
        </p>
      </header>

      <main id="main-content" className="mx-auto max-w-xl px-6 pb-16">
        <section
          aria-label="Voice provider"
          className="mb-6 rounded-xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>
            Provider
          </h2>
          <div role="radiogroup" aria-label="TTS provider" className="space-y-2">
            {(["browser", "elevenlabs"] as TTSProviderType[]).map((p) => (
              <label key={p} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:opacity-90">
                <input
                  type="radio"
                  name="provider"
                  value={p}
                  checked={store.ttsProvider === p}
                  onChange={() => markDirty(store.setTTSProvider)(p)}
                  className="mt-1"
                  style={{ minHeight: 20, minWidth: 20 }}
                />
                <span>
                  <span className="block text-sm font-medium" style={{ color: "var(--text)" }}>
                    {p === "browser" ? "Browser narrator" : "ElevenLabs (premium)"}
                  </span>
                  <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                    {p === "browser"
                      ? "Uses your device's built-in voices. Free, instant, offline-friendly."
                      : "Studio-quality narration. Requires ElevenLabs to be configured server-side."}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section
          aria-label="Voice"
          className="mb-6 rounded-xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>
            Voice
          </h2>
          {voicesForProvider.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {store.ttsProvider === "browser"
                ? "No browser voices found. Try Chrome, Edge, or Safari, or switch to ElevenLabs."
                : "Loading voices…"}
            </p>
          ) : (
            <select
              aria-label="Narrator voice"
              value={store.ttsVoiceId || (store.ttsProvider === "elevenlabs" ? DEFAULT_ELEVENLABS_VOICE_ID : "")}
              onChange={(e) => markDirty(store.setTTSVoiceId)(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
                minHeight: 44,
              }}
            >
              {store.ttsProvider === "browser" && <option value="">System default</option>}
              {voicesForProvider.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </section>

        <section
          aria-label="Speed and pitch"
          className="mb-6 rounded-xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>
            Speed &amp; pitch
          </h2>

          <label className="mb-4 block">
            <span className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Speed</span>
              <span aria-hidden="true">{store.ttsSpeed.toFixed(2)}×</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={store.ttsSpeed}
              onChange={(e) => markDirty(store.setTTSSpeed)(Number(e.target.value))}
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-valuenow={store.ttsSpeed}
              aria-label="Narration speed"
              className="w-full"
              style={{ minHeight: 44 }}
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Pitch</span>
              <span aria-hidden="true">{store.ttsPitch.toFixed(2)}×</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={store.ttsPitch}
              onChange={(e) => markDirty(store.setTTSPitch)(Number(e.target.value))}
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-valuenow={store.ttsPitch}
              aria-label="Narration pitch"
              disabled={store.ttsProvider === "elevenlabs"}
              className="w-full"
              style={{ minHeight: 44, opacity: store.ttsProvider === "elevenlabs" ? 0.5 : 1 }}
            />
            {store.ttsProvider === "elevenlabs" && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Pitch is fixed for ElevenLabs voices.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Volume</span>
              <span aria-hidden="true">{Math.round(store.volume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={store.volume}
              onChange={(e) => markDirty(store.setVolume)(Number(e.target.value))}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={store.volume}
              aria-label="Narration volume"
              className="w-full"
              style={{ minHeight: 44 }}
            />
          </label>
        </section>

        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={preview}
            disabled={previewing}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--accent)",
              color: "#ffffff",
              minHeight: 44,
              minWidth: 120,
            }}
          >
            {previewing ? "Speaking…" : "Preview voice"}
          </button>
          <span className="text-xs" style={{ color: "var(--text-muted)" }} aria-live="polite">
            {saving ? "Saving…" : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : ""}
          </span>
        </div>

        <section
          aria-label="Voice cloning"
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <h2 className="mb-1 text-base font-semibold" style={{ color: "var(--text)" }}>
            Clone your own voice
          </h2>
          <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Upload a 30-second to 10-minute audio sample of a single speaker. We&apos;ll create a
            cloned voice on ElevenLabs that you can use for narration. Sample quality matters —
            quiet room, clear speech, no music.
          </p>

          {clonedVoiceId ? (
            <div
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
            >
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--text)" }}>
                You have a cloned voice: <em>{clonedVoiceLabel ?? "My voice"}</em>
              </p>
              <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
                It appears at the top of the voice picker above when ElevenLabs is selected.
              </p>
              <button
                type="button"
                onClick={handleDeleteClone}
                className="rounded-lg border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                  minHeight: 44,
                }}
              >
                Delete cloned voice
              </button>
            </div>
          ) : (
            <form onSubmit={handleClone} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text)" }}>
                  Audio sample (mp3 / wav / m4a / webm, max 12 MB)
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setCloneFile(e.target.files?.[0] ?? null)}
                  required
                  className="block w-full text-sm"
                  style={{ color: "var(--text-muted)" }}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text)" }}>
                  Label (shown in your voice picker)
                </span>
                <input
                  type="text"
                  value={cloneLabel}
                  onChange={(e) => setCloneLabel(e.target.value)}
                  maxLength={32}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                    minHeight: 44,
                  }}
                />
              </label>

              <label className="flex cursor-pointer items-start gap-2 text-xs" style={{ color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={cloneConsent}
                  onChange={(e) => setCloneConsent(e.target.checked)}
                  required
                  className="mt-0.5"
                  style={{ minHeight: 20, minWidth: 20 }}
                />
                <span>
                  I have the rights to the voice in this sample. I will not upload anyone
                  else&apos;s voice without their explicit, documented permission.
                </span>
              </label>

              {cloneError && (
                <p role="alert" className="text-xs" style={{ color: "var(--error, #c0383c)" }}>
                  {cloneError}
                </p>
              )}

              <button
                type="submit"
                disabled={cloning || !cloneFile || !cloneConsent}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#ffffff",
                  minHeight: 44,
                  minWidth: 120,
                }}
              >
                {cloning ? "Uploading…" : "Clone voice"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
