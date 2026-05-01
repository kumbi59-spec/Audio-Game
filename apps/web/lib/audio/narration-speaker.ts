import { speak } from "./tts-provider";
import { splitIntoSentences } from "./audio-queue";
import { useAudioStore } from "@/store/audio-store";

/**
 * Parsed segment of narration text.
 * "narrator" = GM prose; "character" = player character speaks;
 * "npc" = named NPC speaks (slotted round-robin into A/B/C voices).
 */
interface NarrationSegment {
  text: string;
  speaker: "narrator" | "character" | "npc";
  npcName?: string;
}

// Matches: [Some Name]: "dialogue text"
// Also handles single quotes and multi-line quoted text.
const DIALOGUE_RE = /\[([^\]]+)\]:\s*["']([\s\S]*?)["']/g;

/**
 * Splits narration text into segments keyed by speaker.
 * Plain prose between dialogue tags is "narrator".
 */
export function parseNarrationSegments(
  text: string,
  characterName: string,
): NarrationSegment[] {
  const segments: NarrationSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  DIALOGUE_RE.lastIndex = 0;

  while ((match = DIALOGUE_RE.exec(text)) !== null) {
    const [fullMatch, speakerName = "", dialogue = ""] = match;
    const matchStart = match.index;

    // Prose before this dialogue tag
    const prose = text.slice(lastIndex, matchStart).trim();
    if (prose) {
      segments.push({ text: prose, speaker: "narrator" });
    }

    // Determine speaker type
    const isCharacter =
      speakerName.toLowerCase() === characterName.toLowerCase() ||
      speakerName.toLowerCase() === "you" ||
      speakerName.toLowerCase() === "player";

    segments.push({
      text: dialogue.trim(),
      speaker: isCharacter ? "character" : "npc",
      npcName: isCharacter ? undefined : speakerName,
    });

    lastIndex = matchStart + fullMatch.length;
  }

  // Remaining prose after the last dialogue tag
  const tail = text.slice(lastIndex).trim();
  if (tail) segments.push({ text: tail, speaker: "narrator" });

  return segments;
}

/**
 * Round-robin assignment of NPC names → voice slots (A/B/C).
 * Returns the same slot for the same name within a session.
 */
export function resolveNpcVoiceId(
  npcName: string,
  npcVoiceMap: Map<string, "A" | "B" | "C">,
): "A" | "B" | "C" {
  if (npcVoiceMap.has(npcName)) return npcVoiceMap.get(npcName)!;
  const size = npcVoiceMap.size;
  const slot: "A" | "B" | "C" = size % 3 === 0 ? "A" : size % 3 === 1 ? "B" : "C";
  npcVoiceMap.set(npcName, slot);
  return slot;
}

/**
 * Speaks a full narration string using per-speaker voices.
 *
 * - Narrator lines use the default narrator voice (ttsVoiceId).
 * - Named NPCs rotate through npcVoiceA/B/C, remembered for the session.
 * - The player character uses characterVoiceId.
 * - Falls back to narrator voice for any empty slot.
 *
 * When `premiumTts` is false (free tier) the feature is skipped and
 * the caller should just use plain `speakText` instead.
 *
 * @param narration - Full narration text from the GM.
 * @param characterName - Player character's name (to detect their dialogue).
 * @param npcVoiceMap - Mutable map shared for the session; updated in-place.
 * @param signal - AbortSignal to stop mid-playback.
 * @param speakFn - Injected so tests and callers can override.
 */
export async function speakNarrationMultiVoice(
  narration: string,
  characterName: string,
  npcVoiceMap: Map<string, "A" | "B" | "C">,
  signal: AbortSignal,
  speakFn: typeof speak = speak,
): Promise<void> {
  const audio = useAudioStore.getState();
  const { ttsSpeed, ttsPitch, volume, ttsVoiceId, characterVoiceId, npcVoiceA, npcVoiceB, npcVoiceC } = audio;

  const segments = parseNarrationSegments(narration, characterName);

  function voiceForSegment(seg: NarrationSegment): string | undefined {
    if (seg.speaker === "character") return characterVoiceId || ttsVoiceId || undefined;
    if (seg.speaker === "npc" && seg.npcName) {
      const slot = resolveNpcVoiceId(seg.npcName, npcVoiceMap);
      const slotVoice = slot === "A" ? npcVoiceA : slot === "B" ? npcVoiceB : npcVoiceC;
      return slotVoice || ttsVoiceId || undefined;
    }
    return ttsVoiceId || undefined;
  }

  for (const seg of segments) {
    if (signal.aborted) break;

    const voiceId = voiceForSegment(seg);
    const sentences = splitIntoSentences(seg.text);

    for (const sentence of sentences) {
      if (signal.aborted) break;
      await speakFn(sentence, { rate: ttsSpeed, pitch: ttsPitch, volume, voiceId });
    }
  }
}
