"use client";

import { useEffect } from "react";
import { resumeAudioContext, unlockAudioContext } from "@/lib/audio/synth";
import { SILENT_WAV, markAudioUnlocked, narrationAudioElement } from "@/lib/audio/unlock";

/**
 * Mounts once and registers document-level listeners that, on the first
 * user gesture:
 *   1. resume the Web Audio AudioContext (synth path);
 *   2. play a silent clip on the shared narration audio element, which
 *      iOS Safari then allows to play for the rest of the page's life;
 *   3. speak an empty utterance, which unlocks the browser voice on iOS;
 *   4. mark audio unlocked, so narration queued behind a fresh page load
 *      (see whenAudioUnlocked) starts.
 *
 * It also asks for "playback" audio, so the iOS ring/silent switch doesn't
 * mute ambience and cues, and wakes the AudioContext when the page comes back
 * from the background or a phone call.
 */
export function AudioUnlocker() {
  useEffect(() => {
    let primed = false;
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = "playback";
      } catch {
        /* not settable in this browser */
      }
    }

    function unlock() {
      unlockAudioContext();
      if (primed) return;
      primed = true;
      const audio = narrationAudioElement();
      // Only prime it if no narration has claimed it yet.
      if (!audio.src) {
        audio.src = SILENT_WAV;
        audio.play().catch(() => undefined);
      }
      if ("speechSynthesis" in window && !window.speechSynthesis.speaking) {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
      markAudioUnlocked();
    }

    function onVisible() {
      if (document.visibilityState === "visible") resumeAudioContext();
    }

    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
