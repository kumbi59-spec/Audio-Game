import { create } from "zustand";
import { configureNarrator } from "../audio/narrator";
import { setCuePreferences } from "../audio/cues";

/**
 * Accessibility preferences. Owned in one place so the narrator, cue
 * dispatcher, and any future renderers all read from the same source of
 * truth. Persistence (AsyncStorage / IndexedDB) is a Phase 3 polish task.
 */

export interface PrefsSlice {
  narratorEnabled: boolean;
  speechRate: number; // 0.5 .. 2.0
  soundCuesEnabled: boolean;
  hapticsEnabled: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  audioOnly: boolean;

  setNarratorEnabled: (v: boolean) => void;
  setSpeechRate: (v: number) => void;
  setSoundCuesEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setAudioOnly: (v: boolean) => void;
}

function applyAudio(narratorEnabled: boolean, speechRate: number, sound: boolean, haptics: boolean): void {
  configureNarrator({ enabled: narratorEnabled, rate: speechRate });
  setCuePreferences({ soundEnabled: sound, hapticsEnabled: haptics });
}

export const usePrefs = create<PrefsSlice>((set, get) => ({
  narratorEnabled: true,
  speechRate: 1.0,
  soundCuesEnabled: true,
  hapticsEnabled: true,
  highContrast: false,
  reduceMotion: false,
  audioOnly: false,

  setNarratorEnabled(v) {
    set({ narratorEnabled: v });
    const s = get();
    applyAudio(v, s.speechRate, s.soundCuesEnabled, s.hapticsEnabled);
  },
  setSpeechRate(v) {
    const clamped = Math.max(0.5, Math.min(2.0, v));
    set({ speechRate: clamped });
    const s = get();
    applyAudio(s.narratorEnabled, clamped, s.soundCuesEnabled, s.hapticsEnabled);
  },
  setSoundCuesEnabled(v) {
    set({ soundCuesEnabled: v });
    const s = get();
    applyAudio(s.narratorEnabled, s.speechRate, v, s.hapticsEnabled);
  },
  setHapticsEnabled(v) {
    set({ hapticsEnabled: v });
    const s = get();
    applyAudio(s.narratorEnabled, s.speechRate, s.soundCuesEnabled, v);
  },
  setHighContrast(v) {
    set({ highContrast: v });
  },
  setReduceMotion(v) {
    set({ reduceMotion: v });
  },
  setAudioOnly(v) {
    set({ audioOnly: v });
  },
}));

// Apply defaults on module load so the narrator/cue dispatcher start in sync.
applyAudio(true, 1.0, true, true);
