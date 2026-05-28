export type TTSProviderType = "browser" | "elevenlabs";

/** Voice gender used for NPC voice matching. "neutral" covers ambiguous /
 *  non-binary / non-human voices that should be available regardless of
 *  the speaker's stated gender. */
export type VoiceGender = "male" | "female" | "neutral";

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
  /** Optional — only set on curated catalog voices (ElevenLabs presets).
   *  Browser TTS voices don't carry gender metadata, so this stays undefined. */
  gender?: VoiceGender;
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
  | "desert"
  | "space_station"
  | "cyberpunk_rain"
  | "cosmic_void"
  | "forge"
  | "storm"
  | "underwater"
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
  /** Storyteller+: voice for the player's own character's dialogue */
  characterVoiceId: string;
  /** Storyteller+: voice IDs from the catalog that the NPC auto-assigner is
   *  allowed to pick from. Empty array = "all catalog voices allowed". Stable
   *  per-NPC assignments are stored server-side keyed by (userId, worldId,
   *  npcKey) — see /api/me/npc-voices. */
  enabledNpcVoiceIds: string[];
}
