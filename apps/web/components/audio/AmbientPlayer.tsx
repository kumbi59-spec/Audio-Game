"use client";

import { useEffect } from "react";
import { useAudioStore } from "@/store/audio-store";
import { playAmbient, stopAmbient, setAmbientVolume } from "@/lib/audio/sound-cues";

// Module-level so the timeout survives a brief unmount/remount of any
// AmbientPlayer instance. A pending stop is cancelled by the next mount.
let pendingStopTimer: ReturnType<typeof setTimeout> | null = null;
const UNMOUNT_GRACE_MS = 200;

interface AmbientPlayerProps {
  isNarratorSpeaking?: boolean;
  isNarratorLoading?: boolean;
}

const NARRATOR_DUCKING_FACTOR = 0.45;

export function AmbientPlayer({
  isNarratorSpeaking = false,
  isNarratorLoading = false,
}: AmbientPlayerProps) {
  // Subscribe to master `volume` too: setAmbientVolume() multiplies its arg
  // by the master, so the volume effect below must re-fire whenever the
  // master changes — otherwise muting the master leaves the ambient bed
  // playing at its previous absolute level until ambientVolume itself changes.
  const { currentAmbient, ambientEnabled, ambientVolume, volume } = useAudioStore();
  const effectiveVolume = isNarratorSpeaking
    ? ambientVolume * NARRATOR_DUCKING_FACTOR
    : isNarratorLoading
      ? Math.min(1, ambientVolume * 1.2)
      : ambientVolume;

  useEffect(() => {
    if (!ambientEnabled || currentAmbient === "none") {
      stopAmbient();
    } else {
      // Start at 0; the volume effect below immediately ramps to effectiveVolume
      // via a smooth GainNode ramp — no node graph restart needed for volume changes.
      playAmbient(currentAmbient, 0);
    }
  // ambientVolume intentionally omitted: volume changes are handled by the
  // setAmbientVolume effect below, not by restarting the audio graph.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAmbient, ambientEnabled]);

  useEffect(() => {
    setAmbientVolume(effectiveVolume);
  }, [effectiveVolume, volume]);

  // Mount cancels any in-flight stop scheduled by a sibling/predecessor
  // unmount, so transient remounts (React StrictMode double-invoke,
  // Suspense, parent tree swaps) don't fade the bed in/out.
  useEffect(() => {
    if (pendingStopTimer !== null) {
      clearTimeout(pendingStopTimer);
      pendingStopTimer = null;
    }
    return () => {
      pendingStopTimer = setTimeout(() => {
        stopAmbient();
        pendingStopTimer = null;
      }, UNMOUNT_GRACE_MS);
    };
  }, []);

  return null;
}
