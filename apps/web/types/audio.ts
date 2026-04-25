export type TTSProviderType = "browser" | "elevenlabs";

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceId?: string;
  onEnd?: () => void;
  onBoundary?: (charIndex: number, charLength: number) => void;
}

export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  provider: TTSProviderType;
}

export interface TTSProvider {
  speak(text: string, options?: TTSOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  getVoices(): TTSVoice[];
  isSupported(): boolean;
  isSpeaking(): boolean;
  isPaused(): boolean;
}

export type AudioQueueEntryType = "tts" | "sound_cue" | "ambient" | "pause";

export interface AudioQueueEntry {
  id: string;
  type: AudioQueueEntryType;
  text?: string;
  file?: string;
  loop?: boolean;
  fadeIn?: number;
  duration?: number;
  priority: number;
}

export type AmbientTrack =
  | "tavern"
  | "forest_day"
  | "forest_night"
  | "dungeon"
  | "ocean"
  | "city_day"
  | "city_night"
  | "cave"
  | "throne_room"
  | "market"
  | "none";

export interface AudioSettings {
  ttsProvider: TTSProviderType;
  ttsVoiceId: string;
  ttsSpeed: number;
  ttsPitch: number;
  volume: number;
  ambientEnabled: boolean;
  ambientVolume: number;
  soundCuesEnabled: boolean;
  currentAmbient: AmbientTrack;
}
