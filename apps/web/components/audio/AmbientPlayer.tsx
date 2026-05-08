"use client";

import { useEffect } from "react";
import { useAudioStore } from "@/store/audio-store";
import { playAmbient, stopAmbient, setAmbientVolume } from "@/lib/audio/sound-cues";

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

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAmbient();
  }, []);

  return null;
}
