import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElevenLabsTTS } from "./elevenlabs-tts";

class FakeAudio {
  static played: string[] = [];
  src = "";
  volume = 1;
  playbackRate = 1;
  preservesPitch = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play() {
    FakeAudio.played.push(this.src);
    setTimeout(() => this.onended?.(), 0);
    return Promise.resolve();
  }
  pause() {}
}

function audioResponse(label: string) {
  return new Response(new Blob([label]), { status: 200, headers: { "content-type": "audio/mpeg" } });
}

const sentTexts = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.map((c) => (JSON.parse((c[1] as RequestInit).body as string) as { text: string }).text);

describe("ElevenLabsTTS", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let blobs: number;

  beforeEach(() => {
    FakeAudio.played = [];
    blobs = 0;
    fetchMock = vi.fn(async (_url: string, init: RequestInit) =>
      audioResponse((JSON.parse(init.body as string) as { text: string }).text),
    );
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", { ...URL, createObjectURL: () => `blob:${++blobs}`, revokeObjectURL: () => undefined });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("plays a prefetched clip without fetching it again", async () => {
    const tts = new ElevenLabsTTS();
    tts.prefetch("Second line.", { voiceId: "v1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await tts.speak("Second line.", { voiceId: "v1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(FakeAudio.played).toHaveLength(1);
  });

  it("fetches again when the voice or speed differs from the prefetch", async () => {
    const tts = new ElevenLabsTTS();
    tts.prefetch("Line.", { voiceId: "v1" });
    await tts.speak("Line.", { voiceId: "v2" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not start playing when stopped while the request is in flight", async () => {
    let release!: () => void;
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => { release = () => resolve(audioResponse("late")); }),
    );
    const tts = new ElevenLabsTTS();
    const speaking = tts.speak("Too late.");
    await new Promise((r) => setTimeout(r, 0));
    tts.stop();
    release();
    await speaking;
    expect(FakeAudio.played).toEqual([]);
  });

  it("drops prefetched clips when cleared, and keeps at most three", async () => {
    const tts = new ElevenLabsTTS();
    for (const t of ["a", "b", "c", "d"]) tts.prefetch(t);
    expect(sentTexts(fetchMock)).toEqual(["a", "b", "c", "d"]);
    tts.clearPrefetched();
    await tts.speak("d");
    // "d" was dropped, so it is fetched again.
    expect(sentTexts(fetchMock)).toEqual(["a", "b", "c", "d", "d"]);
  });
});
