"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useAudioStore } from "@/store/audio-store";
import { useEntitlementsStore } from "@/store/entitlements-store";
import { speak, stopSpeech } from "@/lib/audio/tts-provider";
import { ELEVENLABS_PRESET_VOICES, DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/audio/voices-catalog";
import type { TTSProviderType, TTSVoice } from "@/types/audio";

const PREVIEW_TEXT =
  "The fog rolls in off the cliffs. Somewhere a bell tolls the watch change. Tonight, the city is yours.";

export default function VoiceSettingsPage() {
  const router = useRouter();
  const { status } = useSession();
  const store = useAudioStore();
  const { entitlements } = useEntitlementsStore();
  const isPremium = entitlements.premiumTts;

  const [browserVoices, setBrowserVoices] = useState<TTSVoice[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const dirtyRef = useRef(false);

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
    return store.ttsProvider === "elevenlabs" ? ELEVENLABS_PRESET_VOICES : browserVoices;
  }, [store.ttsProvider, browserVoices]);

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
    setPreviewError(null);
    try {
      stopSpeech();
      await speak(PREVIEW_TEXT);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Preview failed";
      const friendly = msg.includes("not configured")
        ? "ElevenLabs is not configured on this server. Contact the site owner or switch to Browser narrator."
        : msg.includes("detected_unusual_activity") || msg.includes("Free Tier usage disabled") || msg.includes("unusual activity")
        ? "ElevenLabs has disabled free-tier access from this server (detected as proxy traffic). A paid ElevenLabs plan is required. Switch to Browser narrator for free narration."
        : msg.includes("subscription_required") || msg.includes("free tier")
        ? "This ElevenLabs feature requires a paid plan. Switch to Browser narrator or upgrade your ElevenLabs account."
        : msg;
      setPreviewError(friendly);
    } finally {
      setPreviewing(false);
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
            <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:opacity-90">
              <input
                type="radio"
                name="provider"
                value="browser"
                checked={store.ttsProvider === "browser"}
                onChange={() => markDirty(store.setTTSProvider)("browser")}
                className="mt-1"
                style={{ minHeight: 20, minWidth: 20 }}
              />
              <span>
                <span className="block text-sm font-medium" style={{ color: "var(--text)" }}>
                  Browser narrator
                </span>
                <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                  Uses your device's built-in voices. Free, instant, offline-friendly.
                </span>
              </span>
            </label>

            {isPremium ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:opacity-90">
                <input
                  type="radio"
                  name="provider"
                  value="elevenlabs"
                  checked={store.ttsProvider === "elevenlabs"}
                  onChange={() => markDirty(store.setTTSProvider)("elevenlabs")}
                  className="mt-1"
                  style={{ minHeight: 20, minWidth: 20 }}
                />
                <span>
                  <span className="block text-sm font-medium" style={{ color: "var(--text)" }}>
                    ElevenLabs (premium)
                  </span>
                  <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                    Studio-quality narration. Requires ElevenLabs to be configured server-side.
                  </span>
                </span>
              </label>
            ) : (
              <div
                className="flex items-start gap-3 rounded-lg p-2 opacity-60"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="mt-1 inline-block h-5 w-5 flex-shrink-0 rounded-full border-2" style={{ borderColor: "var(--border)" }} />
                <span>
                  <span className="block text-sm font-medium" style={{ color: "var(--text)" }}>
                    ElevenLabs (premium) 🔒
                  </span>
                  <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                    Studio-quality narration. Upgrade to Storyteller to unlock.{" "}
                    <Link href="/account" className="underline" style={{ color: "var(--accent)" }}>
                      Upgrade
                    </Link>
                  </span>
                </span>
              </div>
            )}
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

        <section
          aria-label="Ambient sound"
          className="mb-6 rounded-xl border p-5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>
            Ambient sound
          </h2>

          <label className="mb-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={store.ambientEnabled}
              onChange={(e) => { dirtyRef.current = true; store.setAmbientEnabled(e.target.checked); }}
              aria-label="Enable ambient sound"
              className="h-5 w-5"
              style={{ minHeight: 20, minWidth: 20 }}
            />
            <span className="text-sm" style={{ color: "var(--text)" }}>Enable ambient sound</span>
          </label>

          <label className="block" style={{ opacity: store.ambientEnabled ? 1 : 0.4 }}>
            <span className="mb-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Ambient volume</span>
              <span aria-hidden="true">{Math.round(store.ambientVolume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={store.ambientVolume}
              onChange={(e) => { dirtyRef.current = true; store.setAmbientVolume(Number(e.target.value)); }}
              disabled={!store.ambientEnabled}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={store.ambientVolume}
              aria-label="Ambient sound volume"
              className="w-full"
              style={{ minHeight: 44 }}
            />
          </label>
        </section>

        <div className="flex items-center gap-3">
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
        {previewError && (
          <p className="mt-2 text-xs" style={{ color: "var(--error, #dc2626)" }} role="alert">
            {previewError}
          </p>
        )}
      </main>
    </div>
  );
}
