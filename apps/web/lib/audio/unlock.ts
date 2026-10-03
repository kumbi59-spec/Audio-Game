/**
 * Browsers only let a page start sound after the player has interacted with
 * it. This tracks whether that has happened on this page, and hands out the
 * one audio element premium narration plays through, so iOS Safari (which
 * unlocks elements one at a time) only needs it unlocked once.
 */

// 100ms of silence, played inside the first gesture to unlock the element.
export const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

let unlocked = false;
const waiters: Array<() => void> = [];
let sharedAudio: HTMLAudioElement | null = null;

/** The audio element narration plays through, created on first use. */
export function narrationAudioElement(): HTMLAudioElement {
  if (!sharedAudio) sharedAudio = new Audio();
  return sharedAudio;
}

/** Called from inside the first user gesture (see AudioUnlocker). */
export function markAudioUnlocked(): void {
  if (unlocked) return;
  unlocked = true;
  for (const wake of waiters.splice(0)) wake();
}

/** True once sound can start without waiting for a tap or key press. */
export function canPlayAudioNow(): boolean {
  if (unlocked) return true;
  // A page reached by client-side navigation keeps the activation the player
  // gave it earlier; a fresh load (or reload) doesn't have one.
  return typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === true;
}

/** Resolves as soon as sound is allowed to start. */
export function whenAudioUnlocked(): Promise<void> {
  if (canPlayAudioNow()) return Promise.resolve();
  return new Promise((resolve) => waiters.push(resolve));
}
