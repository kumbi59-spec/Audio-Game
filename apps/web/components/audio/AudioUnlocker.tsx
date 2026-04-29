"use client";

import { useEffect } from "react";
import { unlockAudioContext } from "@/lib/audio/synth";

/**
 * Mounts once and registers document-level listeners that resume the
 * Web Audio API AudioContext on the first user gesture. Mobile browsers
 * (Chrome Android, Safari iOS) start the context in "suspended" state
 * and require a touch/click/keydown to unlock it.
 */
export function AudioUnlocker() {
  useEffect(() => {
    function unlock() {
      unlockAudioContext();
    }
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);
  return null;
}
