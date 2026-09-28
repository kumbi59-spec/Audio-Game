import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserTTS, chunkText, maxChunkChars } from "./browser-tts";

class FakeUtterance {
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onboundary: ((e: { charIndex: number; charLength?: number }) => void) | null = null;
  constructor(public text: string) {}
}

function installFakeSynth() {
  const queue: FakeUtterance[] = [];
  const synth = {
    queue,
    speak: vi.fn((u: FakeUtterance) => queue.push(u)),
    cancel: vi.fn(() => {
      const dropped = queue.splice(0);
      // Chrome only reports the utterance that was actually playing.
      dropped[0]?.onerror?.({ error: "interrupted" });
    }),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
    /** Simulate the engine finishing the head of the queue. */
    finishNext() {
      const u = queue.shift();
      u?.onend?.();
    },
  };
  vi.stubGlobal("window", { speechSynthesis: synth });
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  return synth;
}

describe("chunkText", () => {
  it("returns short text as a single chunk", () => {
    expect(chunkText("Hello there.", 150)).toEqual([{ text: "Hello there.", offset: 0 }]);
  });

  it("splits on sentence boundaries and keeps every chunk under the limit", () => {
    const sentence = "The rain hammers the cobblestones as you step into the alley. ";
    const text = sentence.repeat(10).trim();
    const chunks = chunkText(text, 150);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(150);
      expect(c.text.endsWith(".")).toBe(true);
      expect(text.slice(c.offset, c.offset + c.text.length)).toBe(c.text);
    }
    expect(chunks.map((c) => c.text).join(" ")).toBe(text);
  });

  it("falls back to whitespace when a sentence is too long", () => {
    const text = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(text, 60);
    for (const c of chunks) expect(c.text.length).toBeLessThanOrEqual(60);
    expect(chunks.map((c) => c.text).join(" ")).toBe(text);
  });

  it("hard-splits a single word longer than the limit", () => {
    const chunks = chunkText("x".repeat(130), 60);
    expect(chunks.map((c) => c.text.length)).toEqual([60, 60, 10]);
  });

  it("ignores whitespace-only input", () => {
    expect(chunkText("   \n ", 60)).toEqual([]);
  });
});

describe("maxChunkChars", () => {
  it("scales with rate and clamps", () => {
    expect(maxChunkChars(1)).toBe(150);
    expect(maxChunkChars(0.5)).toBe(75);
    expect(maxChunkChars(2)).toBe(300);
    expect(maxChunkChars(0.1)).toBe(60);
    expect(maxChunkChars(Number.NaN)).toBe(150);
  });
});

describe("BrowserTTS", () => {
  let synth: ReturnType<typeof installFakeSynth>;

  beforeEach(() => {
    vi.useFakeTimers();
    synth = installFakeSynth();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const longText = "The torchlight flickers across ancient runes carved deep into the wall. ".repeat(8).trim();

  it("queues long narration as several chunks and never calls pause/resume", async () => {
    const tts = new BrowserTTS();
    const onEnd = vi.fn();
    const done = tts.speak(longText, { onEnd });
    await vi.advanceTimersByTimeAsync(60);

    expect(synth.queue.length).toBeGreaterThan(1);
    expect(tts.isSpeaking()).toBe(true);

    // Let a long time pass mid-narration: no keepalive pause/resume fires.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(synth.pause).not.toHaveBeenCalled();
    expect(synth.resume).not.toHaveBeenCalled();

    while (synth.queue.length > 1) synth.finishNext();
    expect(tts.isSpeaking()).toBe(true);
    synth.finishNext();

    await done;
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(tts.isSpeaking()).toBe(false);
  });

  it("a newer speak() supersedes one still in its cancel grace period", async () => {
    const tts = new BrowserTTS();
    const first = tts.speak("First narration.");
    const second = tts.speak("Second narration.");
    await vi.advanceTimersByTimeAsync(60);
    await first;

    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.queue.map((u) => u.text)).toEqual(["Second narration."]);

    synth.finishNext();
    await second;
    expect(tts.isSpeaking()).toBe(false);
  });

  it("stale end events from a cancelled narration don't clear the new one's state", async () => {
    const tts = new BrowserTTS();
    const first = tts.speak(longText);
    await vi.advanceTimersByTimeAsync(60);
    const staleHead = synth.queue[0]!;

    const second = tts.speak("Next scene.");
    await first;
    await vi.advanceTimersByTimeAsync(60);
    expect(tts.isSpeaking()).toBe(true);

    // A late event from the old utterance must not touch the new narration.
    staleHead.onend?.();
    staleHead.onerror?.({ error: "interrupted" });
    expect(tts.isSpeaking()).toBe(true);

    synth.finishNext();
    await second;
    expect(tts.isSpeaking()).toBe(false);
  });

  it("stop() resolves the pending speak() even if the engine reports nothing", async () => {
    const tts = new BrowserTTS();
    const onEnd = vi.fn();
    const done = tts.speak(longText, { onEnd });
    await vi.advanceTimersByTimeAsync(60);
    synth.cancel.mockImplementation(() => synth.queue.splice(0));

    tts.stop();
    await done;
    expect(onEnd).not.toHaveBeenCalled();
    expect(tts.isSpeaking()).toBe(false);
  });

  it("offsets boundary events by the chunk position", async () => {
    const tts = new BrowserTTS();
    const onBoundary = vi.fn();
    const text = Array.from({ length: 12 }, (_, i) => `Sentence number ${i} echoes down the corridor.`).join(" ");
    void tts.speak(text, { onBoundary });
    await vi.advanceTimersByTimeAsync(60);

    const second = synth.queue[1]!;
    second.onboundary?.({ charIndex: 4, charLength: 5 });
    const expectedOffset = text.indexOf(second.text);
    expect(expectedOffset).toBeGreaterThan(0);
    expect(onBoundary).toHaveBeenCalledWith(expectedOffset + 4, 5);
  });
});
