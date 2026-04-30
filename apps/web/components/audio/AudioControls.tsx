"use client";

import { useEffect, useState } from "react";
import { useAudioStore } from "@/store/audio-store";
import { useEntitlementsStore } from "@/store/entitlements-store";
import { pauseSpeech, resumeSpeech, stopSpeech, isSpeaking, isPaused, getVoices } from "@/lib/audio/tts-provider";
import type { TTSVoice } from "@/types/audio";

interface AudioControlsProps {
  onReplayLast: () => void;
  id?: string;
}

export function AudioControls({ onReplayLast, id = "audio-controls" }: AudioControlsProps) {
  const {
    ttsSpeed,
    ttsVoiceId,
    volume,
    ambientEnabled,
    ambientVolume,
    soundCuesEnabled,
    setTTSSpeed,
    setTTSVoiceId,
    setVolume,
    setAmbientEnabled,
    setAmbientVolume,
    setSoundCuesEnabled,
  } = useAudioStore();

  const { entitlements } = useEntitlementsStore();
  const isPremium = entitlements.premiumTts;

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<TTSVoice[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeaking(isSpeaking());
      setPaused(isPaused());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const load = () => setVoices(getVoices());
      window.speechSynthesis.addEventListener("voiceschanged", load);
      load();
      return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
    }
  }, []);

  function togglePlay() {
    if (paused) {
      resumeSpeech();
      setPaused(false);
    } else if (speaking) {
      pauseSpeech();
      setPaused(true);
    }
  }

  return (
    <section
      id={id}
      aria-label="Audio controls"
      className="rounded-xl border border-border bg-muted/30 p-3"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Narration controls
        </p>
        <span className="sr-only" aria-live="polite">
          {paused ? "Narration paused" : speaking ? "Narration playing" : "Narration idle"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={togglePlay}
          aria-label={paused ? "Resume narration (Space)" : "Pause narration (Space)"}
          disabled={!speaking && !paused}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>

        <button
          onClick={stopSpeech}
          aria-label="Stop narration"
          disabled={!speaking && !paused}
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          ⏹ Stop
        </button>

        <button
          onClick={onReplayLast}
          aria-label="Replay last narration (R)"
          className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          🔁 Replay
        </button>
      </div>

      <details className="mt-3 rounded-lg border border-border/80 bg-background/50 p-2">
        <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Fine-tune audio settings
        </summary>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span id="speed-label">Speed</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={ttsSpeed}
              onChange={(e) => setTTSSpeed(parseFloat(e.target.value))}
              aria-labelledby="speed-label"
              aria-valuetext={`${ttsSpeed.toFixed(1)}x`}
              className="w-full accent-primary"
            />
            <span aria-hidden="true">{ttsSpeed.toFixed(1)}×</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span id="vol-label">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-labelledby="vol-label"
              aria-valuetext={`${Math.round(volume * 100)}%`}
              className="w-full accent-primary"
            />
          </label>

          {/* Voice selector — premium only */}
          {isPremium && voices.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
              <span>Voice</span>
              <select
                value={ttsVoiceId}
                onChange={(e) => setTTSVoiceId(e.target.value)}
                aria-label="Select narration voice"
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Default</option>
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={ambientEnabled}
              onChange={(e) => setAmbientEnabled(e.target.checked)}
              aria-label="Toggle ambient sounds (M)"
              className="h-4 w-4 accent-primary"
            />
            <span>Ambient sound</span>
          </label>

          {ambientEnabled && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span id="amb-vol-label" className="whitespace-nowrap">Ambient vol</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                aria-labelledby="amb-vol-label"
                aria-valuetext={`${Math.round(ambientVolume * 100)}%`}
                className="w-full accent-primary"
              />
              <span aria-hidden="true" className="w-8 text-right">{Math.round(ambientVolume * 100)}%</span>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={soundCuesEnabled}
              onChange={(e) => setSoundCuesEnabled(e.target.checked)}
              aria-label="Toggle sound cues"
              className="h-4 w-4 accent-primary"
            />
            <span>Sound cues</span>
          </label>
        </div>
      </details>
    </section>
  );
}
