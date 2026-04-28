/**
 * Curated catalog of ElevenLabs voices we expose in the picker. The IDs
 * are the public preset voices ElevenLabs ships with every account so
 * they work without per-user voice setup.
 *
 * Browser voices are dynamic (window.speechSynthesis.getVoices) so they
 * are NOT enumerated here — the settings page reads them at render time.
 */
import type { TTSVoice } from "@/types/audio";

export const ELEVENLABS_PRESET_VOICES: TTSVoice[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel — warm, conversational", lang: "en-US", provider: "elevenlabs" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi — confident, clear", lang: "en-US", provider: "elevenlabs" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella — soft, narrator", lang: "en-US", provider: "elevenlabs" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni — measured, authoritative", lang: "en-US", provider: "elevenlabs" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli — bright, engaging", lang: "en-US", provider: "elevenlabs" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh — deep, theatrical", lang: "en-US", provider: "elevenlabs" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold — gravelly, character", lang: "en-US", provider: "elevenlabs" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam — neutral, journalistic", lang: "en-US", provider: "elevenlabs" },
];

export const DEFAULT_ELEVENLABS_VOICE_ID = ELEVENLABS_PRESET_VOICES[0]!.id;
