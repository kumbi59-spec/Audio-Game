import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AudioSettings, AmbientTrack, TTSProviderType } from "@/types/audio";

interface AudioStore extends AudioSettings {
  setTTSProvider: (provider: TTSProviderType) => void;
  setTTSVoiceId: (voiceId: string) => void;
  setTTSSpeed: (speed: number) => void;
  setTTSPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  setAmbientEnabled: (enabled: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  setSoundCuesEnabled: (enabled: boolean) => void;
  setCurrentAmbient: (track: AmbientTrack) => void;
  setCharacterVoiceId: (voiceId: string) => void;
  setEnabledNpcVoiceIds: (ids: string[]) => void;
  hydrateFromServer: (prefs: Partial<AudioSettings>) => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      ttsProvider: "browser",
      ttsVoiceId: "",
      ttsSpeed: 1.0,
      ttsPitch: 1.0,
      volume: 1.0,
      ambientEnabled: true,
      ambientVolume: 0.3,
      soundCuesEnabled: true,
      currentAmbient: "none",
      characterVoiceId: "",
      // Empty = "use the whole catalog". Users can narrow the pool from the
      // settings page if they only like a subset of the available voices.
      enabledNpcVoiceIds: [],

      setTTSProvider: (provider) => set({ ttsProvider: provider }),
      setTTSVoiceId: (voiceId) => set({ ttsVoiceId: voiceId }),
      setTTSSpeed: (speed) => set({ ttsSpeed: Math.max(0.5, Math.min(2.0, speed)) }),
      setTTSPitch: (pitch) => set({ ttsPitch: Math.max(0.5, Math.min(2.0, pitch)) }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setAmbientEnabled: (enabled) => set({ ambientEnabled: enabled }),
      setAmbientVolume: (volume) => set({ ambientVolume: Math.max(0, Math.min(1, volume)) }),
      setSoundCuesEnabled: (enabled) => set({ soundCuesEnabled: enabled }),
      setCurrentAmbient: (track) => set({ currentAmbient: track }),
      setCharacterVoiceId: (voiceId) => set({ characterVoiceId: voiceId }),
      setEnabledNpcVoiceIds: (ids) => set({ enabledNpcVoiceIds: ids }),
      hydrateFromServer: (prefs) => set((state) => ({ ...state, ...prefs })),
    }),
    {
      name: "audio-game-audio",
      version: 2,
      // v1 had npcVoiceA/B/C. Drop them; the new auto-assigner uses the full
      // catalog via enabledNpcVoiceIds and server-side per-NPC assignments.
      migrate: (persisted, version) => {
        if (version < 2 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          delete p.npcVoiceA;
          delete p.npcVoiceB;
          delete p.npcVoiceC;
          if (!Array.isArray(p.enabledNpcVoiceIds)) p.enabledNpcVoiceIds = [];
        }
        return persisted as Partial<AudioStore>;
      },
    }
  )
);
