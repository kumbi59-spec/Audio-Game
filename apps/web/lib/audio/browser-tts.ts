import type { TTSOptions, TTSVoice, TTSProvider } from "@/types/audio";

// Chrome's speechSynthesis.cancel() is asynchronous; calling speak() in the
// same tick drops the new utterance ~10% of the time. Wait one tick first.
const CANCEL_GRACE_MS = 50;

// Chrome's network voices stop after ~15s of a single utterance. Rather than
// the old pause()/resume() keepalive (which on Android Chrome and Safari
// cancels the utterance outright, cutting narration off a few seconds in),
// we split long text into short chunks and queue them all at once. The
// engine plays queued utterances back-to-back, so there is no audible gap and
// no single utterance gets near the cutoff.
//
// Budget is ~150 chars at 1x (≈8s of speech), scaled by rate so slow speech
// still stays well under the limit.
const BASE_CHUNK_CHARS = 150;
const MIN_CHUNK_CHARS = 60;
const MAX_CHUNK_CHARS = 300;

export function maxChunkChars(rate: number): number {
  const scaled = Math.round(BASE_CHUNK_CHARS * (Number.isFinite(rate) ? rate : 1));
  return Math.max(MIN_CHUNK_CHARS, Math.min(MAX_CHUNK_CHARS, scaled));
}

export interface TextChunk {
  text: string;
  /** Offset of `text` within the original string (for boundary events). */
  offset: number;
}

/**
 * Split text into chunks no longer than `maxLen`, preferring sentence
 * boundaries, then clause punctuation, then whitespace. Never splits inside
 * a word unless the word itself is longer than `maxLen`.
 */
export function chunkText(text: string, maxLen: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  let pos = 0;
  const n = text.length;

  while (pos < n) {
    // Skip leading whitespace so chunks don't start with a pause.
    while (pos < n && /\s/.test(text[pos]!)) pos++;
    if (pos >= n) break;

    if (n - pos <= maxLen) {
      chunks.push({ text: text.slice(pos).trimEnd(), offset: pos });
      break;
    }

    const slice = text.slice(pos, pos + maxLen + 1);
    let cut = lastBreak(slice, /[.!?…]["'”’)\]]*\s/g);
    if (cut <= 0) cut = lastBreak(slice, /[,;:—–]\s/g);
    if (cut <= 0) cut = lastBreak(slice, /\s/g);
    if (cut <= 0) cut = maxLen;

    const piece = text.slice(pos, pos + cut).trimEnd();
    if (piece) chunks.push({ text: piece, offset: pos });
    pos += cut;
  }

  return chunks;
}

/** Index just past the last match of `re` in `s`, or -1. */
function lastBreak(s: string, re: RegExp): number {
  let idx = -1;
  for (const m of s.matchAll(re)) idx = m.index! + m[0].length;
  return idx;
}

export class BrowserTTS implements TTSProvider {
  // Hold strong references to queued utterances: Chrome can GC an
  // unreferenced utterance mid-speech and never fire its end event.
  private utterances: SpeechSynthesisUtterance[] = [];
  private _speaking = false;
  private _paused = false;
  // Bumped by every speak()/stop(). Async work from an older call checks it
  // and bails, so overlapping speak() calls can't queue duplicate audio or
  // have a stale end event clear the state of the newer narration.
  private generation = 0;
  private pendingResolve: (() => void) | null = null;

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices(): TTSVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices().map((v) => ({
      id: v.voiceURI,
      name: v.name,
      lang: v.lang,
      provider: "browser" as const,
    }));
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported()) return;
    this.stop();
    const gen = this.generation;

    // Give Chrome's async cancel() a tick to settle before queueing the next
    // utterance, otherwise the speak() call is occasionally dropped.
    await new Promise((r) => setTimeout(r, CANCEL_GRACE_MS));
    if (gen !== this.generation) return; // superseded while waiting

    const rate = options.rate ?? 1.0;
    const chunks = chunkText(text, maxChunkChars(rate));
    if (chunks.length === 0) {
      options.onEnd?.();
      return;
    }

    let voice: SpeechSynthesisVoice | undefined;
    if (options.voiceId) {
      voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === options.voiceId);
    }

    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = (completed: boolean) => {
        if (settled) return;
        settled = true;
        if (gen === this.generation) {
          this._speaking = false;
          this._paused = false;
          this.utterances = [];
          this.pendingResolve = null;
        }
        if (completed) options.onEnd?.();
        resolve();
      };
      this.pendingResolve = () => finish(false);

      const last = chunks.length - 1;
      const utterances = chunks.map((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk.text);
        u.rate = rate;
        u.pitch = options.pitch ?? 1.0;
        u.volume = options.volume ?? 1.0;
        if (voice) u.voice = voice;

        if (options.onBoundary) {
          u.onboundary = (e) => {
            if (gen !== this.generation) return;
            options.onBoundary!(chunk.offset + e.charIndex, e.charLength ?? 1);
          };
        }

        if (i === last) {
          u.onend = () => finish(true);
        }
        u.onerror = (e) => {
          // "interrupted"/"canceled" means stop() or a newer speak() cut us
          // off — the whole narration is over. Any other error only loses
          // this chunk; the engine moves on to the next queued one.
          if (e.error === "interrupted" || e.error === "canceled" || i === last) {
            finish(false);
          }
        };
        return u;
      });

      this.utterances = utterances;
      this._speaking = true;
      this._paused = false;
      for (const u of utterances) window.speechSynthesis.speak(u);
    });
  }

  stop(): void {
    if (!this.isSupported()) return;
    this.generation++;
    window.speechSynthesis.cancel();
    this._speaking = false;
    this._paused = false;
    this.utterances = [];
    // Resolve the in-flight speak() directly — Chrome doesn't reliably fire
    // error events for utterances still waiting in the queue.
    const resolvePending = this.pendingResolve;
    this.pendingResolve = null;
    resolvePending?.();
  }

  pause(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.pause();
    this._paused = true;
  }

  resume(): void {
    if (!this.isSupported()) return;
    window.speechSynthesis.resume();
    this._paused = false;
  }

  isSpeaking(): boolean {
    return this._speaking;
  }

  isPaused(): boolean {
    return this._paused;
  }
}
