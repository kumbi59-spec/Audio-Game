import { openNarrationSession, speechStopCount } from "./tts-provider";

// A sentence end: terminal punctuation, any closing quotes/brackets, then
// whitespace (so we know the sentence is really over, not "3.5").
const SENTENCE_END_RE = /[.!?…]["'”’)\]]*\s+/g;

/**
 * Index just past a sentence boundary in `text` that lies outside any open
 * `"…"` quote, so a `[Name]: "…"` dialogue line is never split between two
 * segments. "first" returns the earliest boundary at or past `minChars`,
 * "last" the latest. Returns -1 when there is none.
 */
export function findSegmentCut(text: string, mode: "first" | "last", minChars = 1): number {
  let best = -1;
  let quotes = 0;
  let counted = 0;
  for (const m of text.matchAll(SENTENCE_END_RE)) {
    const end = m.index! + m[0].length;
    for (; counted < end; counted++) if (text[counted] === '"') quotes++;
    if (end < minChars || quotes % 2 !== 0) continue;
    if (mode === "first") return end;
    best = end;
  }
  return best;
}

export interface StreamingNarratorOptions {
  /** Speaks one segment and resolves when it has finished playing. */
  speakSegment: (text: string, signal: AbortSignal) => Promise<void>;
  /**
   * Whether a segment can be spoken yet (e.g. every NPC in it has a known
   * voice). A held segment waits for more text, nudge(), or finish().
   */
  canSpeak?: (text: string) => boolean;
  /**
   * When canSpeak holds a segment back, how much of it can go now (e.g. the
   * prose before an NPC whose voice isn't settled), so the narrator doesn't
   * fall silent waiting for one line.
   */
  speakableLength?: (text: string) => number;
  /** The first segment waits for at least this much text, ending a sentence. */
  minFirstSegmentChars?: number;
  /**
   * When set, the next segment is cut as soon as it is ready while the
   * current one plays, and handed here so its audio can be fetched ahead.
   */
  prefetchSegment?: (text: string) => void;
  /** Test seams. */
  stopCount?: () => number;
  narrationSession?: { begin: () => void; end: () => void };
}

/**
 * Speaks narration while it is still streaming. Deltas are buffered and cut
 * into whole sentences; the first goes to the speaker as soon as it is
 * complete, and each later segment takes everything ready by the time the
 * previous one has finished playing. Segments are spoken strictly in order.
 *
 * The whole narration runs inside one narration session so isSpeaking() stays
 * true between segments, and a stopSpeech() anywhere ends it.
 */
export class StreamingNarrator {
  private buffer = "";
  private committed = "";
  private finished = false;
  private isCancelled = false;
  private spokeFirst = false;
  private speaking = false;
  // The next segment, already cut (and prefetched) while the current one plays.
  private upNext: string | null = null;
  private wake: (() => void) | null = null;
  private loop: Promise<void> | null = null;
  private readonly controller = new AbortController();
  private readonly stopCount: () => number;
  private readonly initialStopCount: number;

  constructor(private readonly opts: StreamingNarratorOptions) {
    this.stopCount = opts.stopCount ?? speechStopCount;
    this.initialStopCount = this.stopCount();
  }

  /** The streamed text already handed to the speaker, in order. */
  get committedText(): string {
    return this.committed;
  }

  /** True once cancel() ran or speech was stopped (stopSpeech) mid-narration. */
  get cancelled(): boolean {
    return this.isCancelled;
  }

  /** Resolves once everything has been spoken, or the narrator was stopped. */
  get done(): Promise<void> {
    return this.loop ?? Promise.resolve();
  }

  push(delta: string): void {
    if (this.finished || this.isCancelled || !delta) return;
    this.buffer += delta;
    this.start();
    this.lookAhead();
    this.notify();
  }

  /**
   * No more deltas are coming. `rest` replaces whatever hasn't been handed to
   * the speaker yet; it is spoken regardless of canSpeak.
   */
  finish(rest: string): Promise<void> {
    if (!this.isCancelled && !this.finished) {
      this.buffer = rest;
      this.finished = true;
      this.start();
      this.lookAhead();
      this.notify();
    }
    return this.done;
  }

  /** Re-check a held segment (e.g. NPC genders just arrived). */
  nudge(): void {
    this.lookAhead();
    this.notify();
  }

  cancel(): void {
    this.isCancelled = true;
    this.controller.abort();
    this.notify();
  }

  private start(): void {
    if (!this.loop) this.loop = this.run();
  }

  private notify(): void {
    const wake = this.wake;
    this.wake = null;
    wake?.();
  }

  private stopped(): boolean {
    if (!this.isCancelled && this.stopCount() !== this.initialStopCount) this.cancel();
    return this.isCancelled;
  }

  /** While a segment plays, cut the next one as soon as it's ready and prefetch it. */
  private lookAhead(): void {
    if (!this.opts.prefetchSegment || !this.speaking || this.upNext !== null || this.isCancelled) return;
    const next = this.takeSegment();
    if (next === null) return;
    this.upNext = next;
    if (next.trim()) this.opts.prefetchSegment(next.trim());
  }

  private takeSegment(): string | null {
    if (!this.buffer) return null;
    let cut = this.buffer.length;
    if (!this.finished) {
      cut = this.spokeFirst
        ? findSegmentCut(this.buffer, "last")
        : findSegmentCut(this.buffer, "first", this.opts.minFirstSegmentChars ?? 40);
      if (cut <= 0) return null;
      if (this.opts.canSpeak && !this.opts.canSpeak(this.buffer.slice(0, cut))) {
        const ready = this.opts.speakableLength?.(this.buffer.slice(0, cut)) ?? 0;
        if (ready <= 0) return null;
        cut = ready;
      }
    }
    const segment = this.buffer.slice(0, cut);
    this.buffer = this.buffer.slice(cut);
    this.committed += segment;
    this.spokeFirst = true;
    return segment;
  }

  private async run(): Promise<void> {
    let close = () => {};
    const session = this.opts.narrationSession ?? {
      begin: () => {
        close = openNarrationSession();
      },
      end: () => close(),
    };
    session.begin();
    try {
      while (!this.stopped()) {
        const segment = this.upNext ?? this.takeSegment();
        this.upNext = null;
        if (segment === null) {
          if (this.finished) break;
          await new Promise<void>((resolve) => {
            this.wake = resolve;
          });
          continue;
        }
        const text = segment.trim();
        if (!text) continue;
        this.speaking = true;
        this.lookAhead();
        try {
          await this.opts.speakSegment(text, this.controller.signal);
        } catch (err) {
          // One sentence failing to play (a TTS request error) shouldn't
          // silence the rest of the narration.
          console.error("[narrator] segment failed:", err);
        } finally {
          this.speaking = false;
        }
      }
    } finally {
      session.end();
    }
  }
}
