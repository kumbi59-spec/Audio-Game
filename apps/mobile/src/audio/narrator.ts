import * as Speech from "expo-speech";
import { ElevenLabsNarrator, elevenLabsAvailable } from "./elevenlabs";

/**
 * Narration playback. Prefers the server-side ElevenLabs proxy when
 * available (expressive, multi-voice) and falls back to on-device TTS
 * via expo-speech when it isn't. Either way, we speak in sentence-sized
 * chunks so the player can interrupt cleanly.
 */

interface NarratorPrefs {
  enabled: boolean;
  rate: number;
  pitch: number;
  voice?: string;
  elevenLabsVoiceId?: string;
}

let prefs: NarratorPrefs = {
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
};

let elevenLabs: ElevenLabsNarrator | null = null;
let probed = false;
let useElevenLabs = false;

export function configureNarrator(next: Partial<NarratorPrefs>): void {
  prefs = { ...prefs, ...next };
  if (elevenLabs && next.elevenLabsVoiceId) {
    elevenLabs.setVoice(next.elevenLabsVoiceId);
  }
}

async function ensureProbed(): Promise<void> {
  if (probed) return;
  probed = true;
  try {
    useElevenLabs = await elevenLabsAvailable();
    if (useElevenLabs) {
      elevenLabs = new ElevenLabsNarrator(prefs.elevenLabsVoiceId);
    }
  } catch {
    useElevenLabs = false;
  }
}

// NPC name → assigned voice role, populated from voice_plan events and
// locally assigned when dialogue is encountered before the plan arrives.
let npcVoiceMap: Record<string, "voice_a" | "voice_b" | "voice_c"> = {};
const ROLE_ORDER: Array<"voice_a" | "voice_b" | "voice_c"> = ["voice_a", "voice_b", "voice_c"];

function npcVoiceKey(npcName: string): string {
  return npcName.trim().replace(/\s+/g, " ").toLowerCase();
}

function assignVoiceRole(npcName: string): "voice_a" | "voice_b" | "voice_c" {
  const key = npcVoiceKey(npcName);
  if (npcVoiceMap[key]) return npcVoiceMap[key];
  const usedCount = Object.keys(npcVoiceMap).length;
  const role = ROLE_ORDER[usedCount % ROLE_ORDER.length] ?? "voice_a";
  npcVoiceMap[key] = role;
  return role;
}

export function updateNpcVoiceMap(
  assignments: Record<string, "voice_a" | "voice_b" | "voice_c">,
): void {
  const normalized: Record<string, "voice_a" | "voice_b" | "voice_c"> = {};
  for (const [name, role] of Object.entries(assignments)) {
    normalized[npcVoiceKey(name)] = role;
  }
  npcVoiceMap = { ...npcVoiceMap, ...normalized };
}

export function resetNpcVoiceMap(): void {
  npcVoiceMap = {};
}

let buffer = "";
let speaking = false;

export function feedNarration(chunk: string, done: boolean): void {
  if (!prefs.enabled) return;
  buffer += chunk;
  if (done) flushAll();
  else flushSentences();
}

export function stopNarration(): void {
  buffer = "";
  speaking = false;
  queue.length = 0;
  void Speech.stop();
  void elevenLabs?.stop();
}

export async function speakOnce(text: string): Promise<void> {
  if (!prefs.enabled || !text.trim()) return;
  await ensureProbed();
  if (useElevenLabs && elevenLabs) {
    elevenLabs.speak(text);
    return;
  }
  await Speech.stop();
  Speech.speak(text, {
    rate: prefs.rate,
    pitch: prefs.pitch,
    voice: prefs.voice,
  });
}

export function speakAfterNarration(text: string): void {
  if (!prefs.enabled || !text.trim()) return;
  enqueue(text);
}

// Pattern matching `[NpcName]: "dialogue"` — captures name and full segment.
const NPC_DIALOGUE_RE = /(\[[^\]]+\]:\s*"[^"]*")/g;

function splitAndEnqueueWithVoices(text: string): void {
  const segments: Array<{ text: string; role?: "voice_a" | "voice_b" | "voice_c" }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  NPC_DIALOGUE_RE.lastIndex = 0;
  while ((m = NPC_DIALOGUE_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, m.index) });
    }
    const segment = m[1] ?? "";
    const nameMatch = /^\[([^\]]+)\]/.exec(segment);
    const npcName = nameMatch?.[1] ?? null;
    segments.push({
      text: segment,
      role: npcName ? assignVoiceRole(npcName) : undefined,
    });
    lastIndex = NPC_DIALOGUE_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }
  for (const seg of segments) {
    if (seg.text.trim()) enqueueWithRole(seg.text, seg.role);
  }
}

function flushSentences(): void {
  const re = /[^.!?]+[.!?]+["')\]]?\s*/g;
  let m: RegExpExecArray | null;
  let lastIndex = 0;
  const sentences: string[] = [];
  while ((m = re.exec(buffer)) !== null) {
    sentences.push(m[0]);
    lastIndex = re.lastIndex;
  }
  if (sentences.length === 0) return;
  buffer = buffer.slice(lastIndex);
  for (const s of sentences) splitAndEnqueueWithVoices(s);
}

function flushAll(): void {
  if (buffer.trim()) {
    splitAndEnqueueWithVoices(buffer);
    buffer = "";
  }
}

interface QueuedItem {
  text: string;
  role?: "voice_a" | "voice_b" | "voice_c";
}

const queue: QueuedItem[] = [];

function enqueueWithRole(
  text: string,
  role?: "voice_a" | "voice_b" | "voice_c",
): void {
  queue.push({ text, role });
  if (!speaking) void drain();
}

function enqueue(text: string): void {
  enqueueWithRole(text, undefined);
}

async function drain(): Promise<void> {
  await ensureProbed();
  const next = queue.shift();
  if (!next) {
    speaking = false;
    return;
  }
  speaking = true;

  if (useElevenLabs && elevenLabs) {
    try {
      elevenLabs.speak(next.text, next.role);
      // ElevenLabs plays the clip internally; its own queue keeps playback
      // ordered. We immediately loop to enqueue the next sentence so the
      // proxy can prefetch while the current one plays.
      speaking = false;
      void drain();
      return;
    } catch {
      // Fall through to expo-speech if the streaming call fails.
      useElevenLabs = false;
    }
  }

  Speech.speak(next.text, {
    rate: prefs.rate,
    pitch: prefs.pitch,
    voice: prefs.voice,
    onDone: () => {
      speaking = false;
      void drain();
    },
    onStopped: () => {
      speaking = false;
    },
    onError: () => {
      speaking = false;
      void drain();
    },
  });
}

export function __resetNarratorForTests(): void {
  probed = false;
  useElevenLabs = false;
  elevenLabs = null;
  buffer = "";
  queue.length = 0;
  speaking = false;
  npcVoiceMap = {};
}
