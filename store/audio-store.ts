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

      setTTSProvider: (provider) => set({ ttsProvider: provider }),
      setTTSVoiceId: (voiceId) => set({ ttsVoiceId: voiceId }),
      setTTSSpeed: (speed) => set({ ttsSpeed: Math.max(0.5, Math.min(2.0, speed)) }),
      setTTSPitch: (pitch) => set({ ttsPitch: Math.max(0.5, Math.min(2.0, pitch)) }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setAmbientEnabled: (enabled) => set({ ambientEnabled: enabled }),
      setAmbientVolume: (volume) => set({ ambientVolume: Math.max(0, Math.min(1, volume)) }),
      setSoundCuesEnabled: (enabled) => set({ soundCuesEnabled: enabled }),
      setCurrentAmbient: (track) => set({ currentAmbient: track }),
    }),
    { name: "audio-game-audio" }
  )
);
