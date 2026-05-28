/**
 * Curated catalog of ElevenLabs voices we expose in the picker. The IDs
 * are the public preset voices ElevenLabs ships with every account so
 * they work without per-user voice setup.
 *
 * Each entry carries a `gender` hint used by the NPC voice auto-assigner
 * so a male NPC gets a male voice (etc.). "neutral" is the fallback bucket
 * used whenever an NPC's gender is unknown or non-binary.
 *
 * Browser voices are dynamic (window.speechSynthesis.getVoices) so they
 * are NOT enumerated here — the settings page reads them at render time.
 */
import type { TTSVoice, VoiceGender } from "@/types/audio";

export const ELEVENLABS_PRESET_VOICES: TTSVoice[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel — warm, conversational", lang: "en-US", provider: "elevenlabs", gender: "female" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi — confident, clear", lang: "en-US", provider: "elevenlabs", gender: "female" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella — soft, narrator", lang: "en-US", provider: "elevenlabs", gender: "female" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni — measured, authoritative", lang: "en-US", provider: "elevenlabs", gender: "male" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli — bright, engaging", lang: "en-US", provider: "elevenlabs", gender: "female" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh — deep, theatrical", lang: "en-US", provider: "elevenlabs", gender: "male" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold — gravelly, character", lang: "en-US", provider: "elevenlabs", gender: "male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam — neutral, journalistic", lang: "en-US", provider: "elevenlabs", gender: "male" },
];

export const DEFAULT_ELEVENLABS_VOICE_ID = ELEVENLABS_PRESET_VOICES[0]!.id;

/** Look up a catalog voice's gender by ID. Returns "neutral" when the voice
 *  isn't in the catalog (e.g. a browser-provided voice with no metadata),
 *  which lets the matcher fall through to "any voice" semantics. */
export function getVoiceGender(voiceId: string): VoiceGender {
  return ELEVENLABS_PRESET_VOICES.find((v) => v.id === voiceId)?.gender ?? "neutral";
}
