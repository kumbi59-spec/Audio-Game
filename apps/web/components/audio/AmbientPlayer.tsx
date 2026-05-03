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
  const { currentAmbient, ambientEnabled, ambientVolume } = useAudioStore();
  const effectiveVolume = isNarratorSpeaking
    ? ambientVolume * NARRATOR_DUCKING_FACTOR
    : isNarratorLoading
      ? Math.min(1, ambientVolume * 1.2)
      : ambientVolume;

  useEffect(() => {
    if (!ambientEnabled || currentAmbient === "none") {
      stopAmbient();
    } else {
      playAmbient(currentAmbient, effectiveVolume);
    }
  }, [currentAmbient, ambientEnabled, effectiveVolume]);

  useEffect(() => {
    setAmbientVolume(effectiveVolume);
  }, [effectiveVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAmbient();
  }, []);

  return null;
}
