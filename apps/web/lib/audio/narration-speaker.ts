import { speak, beginNarrationSession, endNarrationSession } from "./tts-provider";
import { ELEVENLABS_PRESET_VOICES } from "./voices-catalog";
import { useAudioStore } from "@/store/audio-store";
import type { VoiceGender } from "@/types/audio";

/**
 * Parsed segment of narration text.
 * "narrator" = GM prose; "character" = player character speaks;
 * "npc" = named NPC speaks (gets a stable voice from the full catalog).
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
 * Normalize a display name into a stable key. The GM is inconsistent about
 * capitalization and titles ("Village Doctor" vs "village doctor" vs "the
 * Village Doctor"), so we lowercase and strip a leading article. This is the
 * key used to look up existing assignments and to persist new ones, so
 * "Village Doctor" and "the village doctor" share one voice.
 */
export function npcKeyFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(the|a|an)\s+/, "")
    .replace(/\s+/g, " ");
}

export interface NpcVoiceAssignment {
  voiceId: string;
  gender: VoiceGender;
}

/**
 * Pick a voice for an NPC the assigner hasn't seen yet. The picker:
 *   1. Filters the catalog to voices whose gender matches the NPC, plus
 *      neutral-gendered voices, which are always eligible.
 *   2. Within that set, picks the voice used by the FEWEST existing
 *      assignments — so a session with three female NPCs uses three
 *      distinct female voices before any one of them repeats.
 *   3. Excludes the narrator and player-character voices when other catalog
 *      voices remain, so NPCs don't sound identical to the narrator.
 *
 * `enabledVoiceIds` lets the user narrow the catalog to a chosen subset.
 * Empty array means "all catalog voices".
 */
export function pickVoiceForNpc(
  gender: VoiceGender,
  existingAssignments: Map<string, NpcVoiceAssignment>,
  enabledVoiceIds: string[],
  excludeIds: string[] = [],
): string {
  const allowedPool = enabledVoiceIds.length > 0
    ? ELEVENLABS_PRESET_VOICES.filter((v) => enabledVoiceIds.includes(v.id))
    : ELEVENLABS_PRESET_VOICES;

  const genderMatch = allowedPool.filter((v) => {
    if (!v.gender) return true;
    if (gender === "neutral") return true;
    return v.gender === gender || v.gender === "neutral";
  });
  const baseCandidates = genderMatch.length > 0 ? genderMatch : allowedPool;

  // First pass: also exclude the narrator/player voices so NPCs sound
  // distinct. If that empties the set (small pool, lots of excludes), fall
  // back to the full gender-matched set so we always return *some* voice.
  const filtered = baseCandidates.filter((v) => !excludeIds.includes(v.id));
  const candidates = filtered.length > 0 ? filtered : baseCandidates;

  const usageCount = new Map<string, number>();
  for (const assignment of existingAssignments.values()) {
    usageCount.set(assignment.voiceId, (usageCount.get(assignment.voiceId) ?? 0) + 1);
  }

  let best = candidates[0]!;
  let bestCount = usageCount.get(best.id) ?? Number.POSITIVE_INFINITY;
  for (const v of candidates) {
    const count = usageCount.get(v.id) ?? 0;
    if (count < bestCount) {
      best = v;
      bestCount = count;
    }
  }
  return best.id;
}

/**
 * Resolves a voice for an NPC, reusing the existing assignment if there is
 * one. Otherwise picks a new voice via pickVoiceForNpc and mutates the
 * assignment map in place. Returns the assignment and whether it was newly
 * created so the caller can persist it server-side.
 */
export function resolveNpcVoiceAssignment(
  npcName: string,
  gender: VoiceGender,
  assignments: Map<string, NpcVoiceAssignment>,
  enabledVoiceIds: string[],
  excludeIds: string[] = [],
): { key: string; voiceId: string; gender: VoiceGender; isNew: boolean } {
  const key = npcKeyFromName(npcName);
  const existing = assignments.get(key);
  if (existing) {
    return { key, voiceId: existing.voiceId, gender: existing.gender, isNew: false };
  }
  const voiceId = pickVoiceForNpc(gender, assignments, enabledVoiceIds, excludeIds);
  assignments.set(key, { voiceId, gender });
  return { key, voiceId, gender, isNew: true };
}

export type NpcGenderLookup = (npcName: string) => VoiceGender;

/**
 * Speaks a full narration string using per-speaker voices.
 *
 * - Narrator prose uses the default narrator voice (ttsVoiceId).
 * - The player character uses characterVoiceId.
 * - Named NPCs get a stable voice from the full catalog, gender-matched and
 *   biased toward least-used voices. The mapping is keyed by a normalized
 *   form of the name (see npcKeyFromName) so capitalization changes don't
 *   reassign mid-session. New assignments are reported via onNewAssignment
 *   so the caller can persist them server-side (cross-device memory).
 *
 * When `premiumTts` is false (free tier) the feature is skipped and the
 * caller should just use plain `speakText` instead.
 */
export async function speakNarrationMultiVoice(
  narration: string,
  characterName: string,
  assignments: Map<string, NpcVoiceAssignment>,
  genderLookup: NpcGenderLookup,
  onNewAssignment: (entry: { key: string; voiceId: string; gender: VoiceGender; displayName: string }) => void,
  signal: AbortSignal,
  speakFn: typeof speak = speak,
): Promise<void> {
  const audio = useAudioStore.getState();
  const { ttsSpeed, ttsPitch, volume, ttsVoiceId, characterVoiceId, enabledNpcVoiceIds } = audio;

  const segments = parseNarrationSegments(narration, characterName);
  const excludeIds = [ttsVoiceId, characterVoiceId].filter((v): v is string => Boolean(v));

  function voiceForSegment(seg: NarrationSegment): string | undefined {
    if (seg.speaker === "character") return characterVoiceId || ttsVoiceId || undefined;
    if (seg.speaker === "npc" && seg.npcName) {
      const gender = genderLookup(seg.npcName);
      const result = resolveNpcVoiceAssignment(
        seg.npcName,
        gender,
        assignments,
        enabledNpcVoiceIds,
        excludeIds,
      );
      if (result.isNew) {
        onNewAssignment({
          key: result.key,
          voiceId: result.voiceId,
          gender: result.gender,
          displayName: seg.npcName,
        });
      }
      return result.voiceId || ttsVoiceId || undefined;
    }
    return ttsVoiceId || undefined;
  }

  // Coalesce adjacent segments that resolve to the same voice into one TTS
  // request — fewer HTTP gaps means fewer audible voice flips between groups.
  const grouped: { voiceId: string | undefined; text: string }[] = [];
  for (const seg of segments) {
    const voiceId = voiceForSegment(seg);
    const last = grouped[grouped.length - 1];
    if (last && last.voiceId === voiceId) {
      last.text += " " + seg.text;
    } else {
      grouped.push({ voiceId, text: seg.text });
    }
  }

  // Open a narration session so isSpeaking() stays true across the per-voice
  // HTTP gaps between groups — keeps ambient ducking and choice focus stable.
  beginNarrationSession();
  try {
    for (const group of grouped) {
      if (signal.aborted) break;
      await speakFn(group.text, { rate: ttsSpeed, pitch: ttsPitch, volume, voiceId: group.voiceId });
    }
  } finally {
    endNarrationSession();
  }
}
