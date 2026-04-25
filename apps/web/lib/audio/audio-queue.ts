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

  constructor(private options: AudioQueueOptions = {}) {}

  enqueue(entry: Omit<AudioQueueEntry, "id">): void {
    this.queue.push({ ...entry, id: Math.random().toString(36).slice(2) });
    if (!this.processing && !this.stopped) {
      this.process();
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
    this.processing = false;
    stopSpeech();
  }

  resume(): void {
    this.stopped = false;
    if (!this.processing && this.queue.length > 0) {
      this.process();
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

    while (this.queue.length > 0 && !this.stopped) {
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

    this.processing = false;
    if (!this.stopped) {
      this.options.onComplete?.();
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sentence splitter — used to stream Claude output sentence-by-sentence into TTS
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
