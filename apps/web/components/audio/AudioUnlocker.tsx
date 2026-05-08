"use client";

import { useEffect } from "react";
import { unlockAudioContext } from "@/lib/audio/synth";

// 100ms of silent audio, base64-encoded — used to prime the HTMLAudioElement
// path on the first user gesture so later dynamic `new Audio()` instances
// (ElevenLabs narration) can play() without tripping Safari's autoplay
// policy. Decoded once on mount.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

/**
 * Mounts once and registers document-level listeners that, on the first
 * user gesture:
 *   1. resume the Web Audio AudioContext (synth path); and
 *   2. play a silent clip on an HTMLAudioElement, which "unlocks" the
 *      audio element path for subsequent dynamic creations on iOS Safari.
 *
 * Without (2), the first ElevenLabs narration after a fresh page load can
 * be rejected by Safari because the play() call doesn't directly trace
 * back to the originating gesture.
 */
export function AudioUnlocker() {
  useEffect(() => {
    let primed = false;
    const primer = new Audio(SILENT_WAV);
    primer.muted = true;
    primer.preload = "auto";

    function unlock() {
      unlockAudioContext();
      if (!primed) {
        primed = true;
        // Calling play() inside the gesture handler unlocks the Audio
        // element path for the rest of the document's lifetime on iOS.
        // Subsequent failures (e.g. unmounted page) are harmless.
        primer.play().catch(() => undefined);
      }
    }

    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
      primer.pause();
      primer.src = "";
    };
  }, []);
  return null;
}
