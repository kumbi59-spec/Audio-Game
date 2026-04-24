import * as Speech from "expo-speech";

/**
 * Narration playback. Phase 1 uses on-device TTS via expo-speech as the
 * always-available fallback. When the API has ELEVENLABS_API_KEY set we
 * stream MP3 from `/tts/stream` instead — that wiring lives in
 * `audio/elevenlabs.ts` and is dropped in once credentials are configured.
 *
 * We speak in sentence-sized chunks so the player can interrupt cleanly
 * with "repeat" or a new mic press without waiting for a long buffer.
 */

interface NarratorPrefs {
  enabled: boolean;
  rate: number;
  pitch: number;
  voice?: string;
}

let prefs: NarratorPrefs = {
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
};

export function configureNarrator(next: Partial<NarratorPrefs>): void {
  prefs = { ...prefs, ...next };
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
  void Speech.stop();
}

export async function speakOnce(text: string): Promise<void> {
  if (!prefs.enabled || !text.trim()) return;
  await Speech.stop();
  Speech.speak(text, {
    rate: prefs.rate,
    pitch: prefs.pitch,
    voice: prefs.voice,
  });
}

function flushSentences(): void {
  // Split on terminal punctuation but keep the punctuation attached.
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
  if (!speaking) drain();
}

function drain(): void {
  const next = queue.shift();
  if (!next) {
    speaking = false;
    return;
  }
  speaking = true;
  Speech.speak(next, {
    rate: prefs.rate,
    pitch: prefs.pitch,
    voice: prefs.voice,
    onDone: drain,
    onStopped: () => {
      speaking = false;
    },
    onError: drain,
  });
}
