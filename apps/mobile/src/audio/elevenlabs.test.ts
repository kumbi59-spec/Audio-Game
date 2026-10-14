import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("expo-av", () => ({ Audio: { Sound: { createAsync: vi.fn() } } }));

import { ElevenLabsNarrator, elevenLabsAvailable } from "./elevenlabs";

async function flush(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
}

describe("ElevenLabsNarrator", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, blob: async () => new Blob() })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hands the refused clip and the rest of the queue to the fallback", async () => {
    const onFallback = vi.fn();
    const narrator = new ElevenLabsNarrator(undefined, onFallback);
    narrator.speak("The door creaks.");
    narrator.speak('[Mira]: "Who goes there?"', "voice_a");
    await flush();
    expect(onFallback).toHaveBeenCalledWith([
      { text: "The door creaks." },
      { text: '[Mira]: "Who goes there?"', voiceRole: "voice_a" },
    ]);
  });

  it("is not left stuck playing after a failed clip", async () => {
    const onFallback = vi.fn();
    const narrator = new ElevenLabsNarrator(undefined, onFallback);
    narrator.speak("First.");
    await flush();
    narrator.speak("Second.");
    await flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(onFallback).toHaveBeenLastCalledWith([{ text: "Second." }]);
  });

  it("drops queued clips when stopped mid-fetch", async () => {
    let release: (value: unknown) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((resolve) => (release = resolve))),
    );
    const onFallback = vi.fn();
    const narrator = new ElevenLabsNarrator(undefined, onFallback);
    narrator.speak("First.");
    narrator.speak("Second.");
    await flush();
    await narrator.stop();
    release({ ok: false, status: 500, blob: async () => new Blob() });
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(onFallback).not.toHaveBeenCalled();
  });
});

describe("elevenLabsAvailable", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("probes the voice list instead of synthesizing a clip", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(elevenLabsAvailable()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/tts\/voices$/), { method: "GET" });
  });
});
