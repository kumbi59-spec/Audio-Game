import type { SoundCue } from "@/types/game";

const SOUND_CUE_FILES: Record<SoundCue, string> = {
  combat_start: "/sounds/cues/combat-start.mp3",
  combat_end: "/sounds/cues/combat-end.mp3",
  level_up: "/sounds/cues/level-up.mp3",
  item_pickup: "/sounds/cues/item-pickup.mp3",
  door_open: "/sounds/cues/door-open.mp3",
  door_locked: "/sounds/cues/door-locked.mp3",
  discovery: "/sounds/cues/discovery.mp3",
  danger_near: "/sounds/cues/danger-near.mp3",
  npc_friendly: "/sounds/cues/npc-friendly.mp3",
  npc_hostile: "/sounds/cues/npc-hostile.mp3",
  quest_complete: "/sounds/cues/quest-complete.mp3",
  quest_fail: "/sounds/cues/quest-fail.mp3",
  magic_cast: "/sounds/cues/magic-cast.mp3",
  spell_fail: "/sounds/cues/spell-fail.mp3",
  treasure_found: "/sounds/cues/treasure-found.mp3",
  death_nearby: "/sounds/cues/death-nearby.mp3",
  success: "/sounds/ui/success.mp3",
  error: "/sounds/ui/error.mp3",
  click: "/sounds/ui/click.mp3",
};

const AMBIENT_FILES: Record<string, string> = {
  tavern: "/sounds/ambient/tavern.mp3",
  forest_day: "/sounds/ambient/forest-day.mp3",
  forest_night: "/sounds/ambient/forest-night.mp3",
  dungeon: "/sounds/ambient/dungeon.mp3",
  ocean: "/sounds/ambient/ocean.mp3",
  city_day: "/sounds/ambient/city-day.mp3",
  city_night: "/sounds/ambient/city-night.mp3",
  cave: "/sounds/ambient/cave.mp3",
  throne_room: "/sounds/ambient/throne-room.mp3",
  market: "/sounds/ambient/market.mp3",
};

let cueAudio: HTMLAudioElement | null = null;
let ambientAudio: HTMLAudioElement | null = null;

export function playSoundCue(cue: SoundCue, volume = 0.6): void {
  if (typeof window === "undefined") return;
  const file = SOUND_CUE_FILES[cue];
  if (!file) return;

  try {
    if (cueAudio) {
      cueAudio.pause();
      cueAudio.currentTime = 0;
    }
    cueAudio = new Audio(file);
    cueAudio.volume = volume;
    cueAudio.play().catch(() => {});
  } catch {
    // Audio playback blocked or unsupported
  }
}

export function playAmbient(track: string, volume = 0.25): void {
  if (typeof window === "undefined" || track === "none") {
    stopAmbient();
    return;
  }
  const file = AMBIENT_FILES[track];
  if (!file) return;

  if (ambientAudio && !ambientAudio.paused) return;

  try {
    stopAmbient();
    ambientAudio = new Audio(file);
    ambientAudio.loop = true;
    ambientAudio.volume = volume;
    ambientAudio.play().catch(() => {});
  } catch {
    // Blocked
  }
}

export function stopAmbient(): void {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio = null;
  }
}

export function setAmbientVolume(volume: number): void {
  if (ambientAudio) {
    ambientAudio.volume = Math.max(0, Math.min(1, volume));
  }
}
