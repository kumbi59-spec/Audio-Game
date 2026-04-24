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
  for (const s of sentences) enqueue(s);
}

function flushAll(): void {
  if (buffer.trim()) {
    enqueue(buffer);
    buffer = "";
  }
}

const queue: string[] = [];

function enqueue(text: string): void {
  queue.push(text);
  if (!speaking) void drain();
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
      elevenLabs.speak(next);
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

  Speech.speak(next, {
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
}
