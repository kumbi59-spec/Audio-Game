import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelUtterance,
  captureUtterance,
  setRecognizer,
  UTTERANCE_MAX_MS,
  type SpeechRecognizer,
} from "./stt";

async function flush(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

/** Recognizer double whose utterance ends when the test says so. */
function waitingRecognizer(transcript: string | null) {
  const calls: string[] = [];
  let endUtterance: () => void = () => {};
  const recognizer: SpeechRecognizer = {
    start: vi.fn(async () => {
      calls.push("start");
    }),
    waitForUtterance: vi.fn((maxMs: number) => {
      calls.push(`wait:${maxMs}`);
      return new Promise<void>((resolve) => {
        endUtterance = resolve;
      });
    }),
    stop: vi.fn(async () => {
      calls.push("stop");
      return transcript;
    }),
    isListening: () => false,
  };
  return { recognizer, calls, endUtterance: () => endUtterance() };
}

describe("captureUtterance", () => {
  afterEach(() => {
    setRecognizer({ start: async () => {}, stop: async () => null, isListening: () => false });
  });

  it("waits for the utterance to end before stopping the recognizer", async () => {
    const { recognizer, calls, endUtterance } = waitingRecognizer("open the door");
    setRecognizer(recognizer);

    const pending = captureUtterance();
    await flush();
    expect(calls).toEqual(["start", `wait:${UTTERANCE_MAX_MS}`]);
    expect(recognizer.stop).not.toHaveBeenCalled();

    endUtterance();
    await expect(pending).resolves.toBe("open the door");
    expect(calls).toEqual(["start", `wait:${UTTERANCE_MAX_MS}`, "stop"]);
  });

  it("stops right away for a recognizer that can't wait", async () => {
    const stop = vi.fn(async () => "two");
    setRecognizer({ start: async () => {}, stop, isListening: () => false });
    await expect(captureUtterance()).resolves.toBe("two");
    expect(stop).toHaveBeenCalledOnce();
  });

  it("returns null and stops when start fails", async () => {
    const stop = vi.fn(async () => null);
    setRecognizer({
      start: async () => {
        throw new Error("Microphone permission denied.");
      },
      stop,
      isListening: () => false,
    });
    await expect(captureUtterance()).resolves.toBeNull();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("returns null when the capture is cancelled mid-utterance", async () => {
    const { recognizer } = waitingRecognizer("half a sentence");
    setRecognizer(recognizer);

    const pending = captureUtterance();
    await flush();
    cancelUtterance();
    await expect(pending).resolves.toBeNull();
    // The recognizer is still stopped so the mic and socket are released.
    expect(recognizer.stop).toHaveBeenCalledOnce();
  });
});
