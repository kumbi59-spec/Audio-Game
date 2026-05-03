"use client";

import { useEffect } from "react";
import { useAudioStore } from "@/store/audio-store";
import { playAmbient, stopAmbient, setAmbientVolume } from "@/lib/audio/sound-cues";

export function AmbientPlayer() {
  const { currentAmbient, ambientEnabled, ambientVolume } = useAudioStore();

  useEffect(() => {
    if (!ambientEnabled || currentAmbient === "none") {
      stopAmbient();
    } else {
      playAmbient(currentAmbient, ambientVolume);
    }
  }, [currentAmbient, ambientEnabled]);

  useEffect(() => {
    setAmbientVolume(ambientVolume);
  }, [ambientVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAmbient();
  }, []);

  return null;
}
