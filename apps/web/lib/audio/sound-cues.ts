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
 * Read the master volume from the audio store and apply a perceptual curve.
 *
 * The slider stores a linear 0..1 value, but human loudness perception is
 * roughly logarithmic, so a linear gain feels like "loud almost everywhere
 * except very near zero." Squaring (a simple x² approximation of an x³ or
 * log curve, sufficient at 0..1) gives the slider an even feel: 0.5 sounds
 * like the midpoint between silence and full instead of ~80%.
 *
 * Returns 0 exactly at 0 so muting is true silence, and 1 exactly at 1
 * so the curve doesn't reduce the achievable peak.
 */
function masterVolume(): number {
  if (typeof window === "undefined") return 1;
  const linear = useAudioStore.getState().volume;
  if (linear <= 0) return 0;
  if (linear >= 1) return 1;
  return linear * linear;
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
