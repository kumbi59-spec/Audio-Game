import { speak, stopSpeech } from "./tts-provider";
import { playSoundCue } from "./sound-cues";
import type { AudioQueueEntry, TTSOptions } from "@/types/audio";
import type { SoundCue } from "@/types/game";

interface AudioQueueOptions {
  ttsOptions?: TTSOptions;
  onEntry?: (entry: AudioQueueEntry) => void;
  onComplete?: () => void;
}

export class AudioQueue {
  private queue: AudioQueueEntry[] = [];
  private processing = false;
  private stopped = false;
  // Bumped on every stop() so any in-flight process() loop can detect that
  // its generation has been superseded and bail out without racing a newer
  // loop on this.queue.shift().
  private generation = 0;

  constructor(private options: AudioQueueOptions = {}) {}

  enqueue(entry: Omit<AudioQueueEntry, "id">): void {
    this.queue.push({ ...entry, id: crypto.randomUUID() });
    if (!this.processing && !this.stopped) {
      void this.process();
    }
  }

  enqueueTTS(text: string, priority = 0): void {
    this.enqueue({ type: "tts", text, priority });
  }

  enqueueSoundCue(cue: SoundCue, priority = 1): void {
    this.enqueue({ type: "sound_cue", file: cue, priority });
  }

  stop(): void {
    this.stopped = true;
    this.queue = [];
    this.generation++;
    // Don't touch processing here; the in-flight loop will observe the
    // generation bump on its next iteration and exit cleanly.
    stopSpeech();
  }

  resume(): void {
    if (!this.stopped) return;
    this.stopped = false;
    if (!this.processing && this.queue.length > 0) {
      void this.process();
    }
  }

  clear(): void {
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }

  private async process(): Promise<void> {
    if (this.processing || this.stopped) return;
    this.processing = true;
    const gen = this.generation;

    try {
      while (this.queue.length > 0 && !this.stopped && gen === this.generation) {
        const entry = this.queue.shift()!;
        this.options.onEntry?.(entry);

        if (entry.type === "tts" && entry.text) {
          await speak(entry.text, this.options.ttsOptions);
        } else if (entry.type === "sound_cue" && entry.file) {
          playSoundCue(entry.file as SoundCue);
          await delay(400);
        } else if (entry.type === "pause" && entry.duration) {
          await delay(entry.duration);
        }
      }
    } finally {
      // Only release the processing flag if we're still the active generation.
      // If stop() bumped gen mid-loop, a subsequent resume() may have already
      // started a fresh process() that owns the flag now.
      if (gen === this.generation) {
        this.processing = false;
        if (!this.stopped) this.options.onComplete?.();
      }
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sentence splitter — used to stream Claude output sentence-by-sentence into TTS
export function splitIntoSentences(text: string): string[] {
  // Protect common abbreviations from triggering false sentence splits.
  // Replace their trailing period with a private-use sentinel character,
  // split on sentence-ending punctuation, then restore the periods.
  const ABBREV_RE =
    /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|No|Vol|Dept|Corp|Inc|Ltd|LLC)\./gi;
  const SENTINEL = "";
  const protected_ = text.replace(ABBREV_RE, (_, abbr: string) => `${abbr}${SENTINEL}`);
  return protected_
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(new RegExp(SENTINEL, "g"), ".").trim())
    .filter((s) => s.length > 0);
}
