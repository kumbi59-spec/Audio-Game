"use client";

import { useCallback, useEffect, useState } from "react";
import { useAudioStore } from "@/store/audio-store";
import { pauseSpeech, resumeSpeech, stopSpeech, isSpeaking, isPaused, getVoices } from "@/lib/audio/tts-provider";
import { setAmbientVolume } from "@/lib/audio/sound-cues";
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

  const handleAmbientVolume = useCallback((v: number) => {
    setAmbientVolume(v);
    setAmbientVolume(v);
    setAmbientVolume(v); // also updates HTML audio element
    setAmbientVolume(v);
    // Update live ambient if playing
    setAmbientVolume(v);
    setAmbientVolume(v);
    setAmbientVolume(v);
  }, [setAmbientVolume]);

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
    <div
      id={id}
      role="region"
      aria-label="Audio controls"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm"
    >
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        aria-label={paused ? "Resume narration (Space)" : "Pause narration (Space)"}
        disabled={!speaking && !paused}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        {paused ? "▶ Resume" : "⏸ Pause"}
      </button>

      {/* Stop */}
      <button
        onClick={stopSpeech}
        aria-label="Stop narration"
        disabled={!speaking && !paused}
        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        ⏹ Stop
      </button>

      {/* Replay last */}
      <button
        onClick={onReplayLast}
        aria-label="Replay last narration (R)"
        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        🔁 Replay
      </button>

      {/* Speed */}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
          className="w-20 accent-primary"
        />
        <span aria-hidden="true">{ttsSpeed.toFixed(1)}×</span>
      </label>

      {/* Volume */}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
          className="w-20 accent-primary"
        />
      </label>

      {/* Voice selector */}
      {voices.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Voice</span>
          <select
            value={ttsVoiceId}
            onChange={(e) => setTTSVoiceId(e.target.value)}
            aria-label="Select narration voice"
            className="rounded border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {/* Ambient toggle */}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={ambientEnabled}
          onChange={(e) => setAmbientEnabled(e.target.checked)}
          aria-label="Toggle ambient sounds (M)"
          className="h-4 w-4 accent-primary"
        />
        <span>Ambient</span>
      </label>

      {/* Sound cues toggle */}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
  );
}
