import type { SoundCue } from "@/types/game";
import type { AmbientTrack } from "@/types/audio";
import {
  synthPlayCue,
  synthPlayAmbient,
  synthStopAmbient,
  synthSetAmbientVolume,
} from "./synth";
import { useAudioStore } from "@/store/audio-store";

/**
 * Read the master volume from the audio store. The store's `volume` is the
 * single user-facing master gain — it scales narration, ambient, and cues
 * uniformly, so a 0 setting is true silence.
 */
function masterVolume(): number {
  if (typeof window === "undefined") return 1;
  return useAudioStore.getState().volume;
}

export function playSoundCue(cue: SoundCue, volume = 0.6): void {
  synthPlayCue(cue, volume * masterVolume());
}

export function playAmbient(track: string, volume = 0.25): void {
  synthPlayAmbient(track as AmbientTrack, volume * masterVolume());
}

export function stopAmbient(): void {
  synthStopAmbient();
}

export function setAmbientVolume(volume: number): void {
  synthSetAmbientVolume(volume * masterVolume());
}
