import type { SoundCue } from "@/types/game";
import type { AmbientTrack } from "@/types/audio";
import {
  synthPlayCue,
  synthPlayAmbient,
  synthStopAmbient,
  synthSetAmbientVolume,
} from "./synth";

export function playSoundCue(cue: SoundCue, volume = 0.6): void {
  synthPlayCue(cue, volume);
}

export function playAmbient(track: string, volume = 0.25): void {
  synthPlayAmbient(track as AmbientTrack, volume);
}

export function stopAmbient(): void {
  synthStopAmbient();
}

export function setAmbientVolume(volume: number): void {
  synthSetAmbientVolume(volume);
}
