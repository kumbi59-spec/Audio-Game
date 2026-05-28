"use client";

import { useEffect, useRef } from "react";
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

  // Stash the live effective volume in a ref so the play effect (which only
  // re-runs on track/enabled changes) can read the current value without
  // adding effectiveVolume to its deps and restarting the graph on every duck.
  const effectiveVolumeRef = useRef(effectiveVolume);
  effectiveVolumeRef.current = effectiveVolume;

  useEffect(() => {
    if (!ambientEnabled || currentAmbient === "none") {
      stopAmbient();
    } else {
      // Pass the actual effective volume so synthPlayAmbient schedules its
      // 1.5s fade-in to the right target. Previously this was 0 with the idea
      // that the setAmbientVolume effect below would ramp it up — but on
      // mobile the AudioContext is suspended until first gesture, so the play
      // request gets queued at 0 and flushed at 0 on unlock, with no follow-up
      // setAmbientVolume call. Result: the bed stayed silent forever.
      playAmbient(currentAmbient, effectiveVolumeRef.current);
    }
  // effectiveVolume / ambientVolume intentionally omitted: volume changes are
  // handled by the setAmbientVolume effect below, not by restarting the audio
  // graph. We read effectiveVolumeRef.current so the latest value is captured
  // without re-running this effect.
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
