import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElevenLabsTTS, TtsRequestError } from "./elevenlabs-tts";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "./voices-catalog";

class FakeAudio {
  static played: string[] = [];
  /** When false, clips play until stopped (onended never fires by itself). */
  static autoEnd = true;
  src = "";
  volume = 1;
  playbackRate = 1;
  preservesPitch = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play() {
    FakeAudio.played.push(this.src);
    if (FakeAudio.autoEnd) setTimeout(() => this.onended?.(), 0);
    return Promise.resolve();
  }
  pause() {}
  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }
  load() {}
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
    FakeAudio.autoEnd = true;
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

  it("does not play a clip that was stopped while it downloaded", async () => {
    let releaseBlob!: () => void;
    const slow = {
      ok: true,
      status: 200,
      body: { cancel: () => Promise.resolve() },
      blob: () => new Promise<Blob>((resolve) => { releaseBlob = () => resolve(new Blob(["late"])); }),
    } as unknown as Response;
    fetchMock.mockResolvedValueOnce(slow);
    const tts = new ElevenLabsTTS();
    const speaking = tts.speak("Downloading.");
    await new Promise((r) => setTimeout(r, 0));
    tts.stop();
    releaseBlob();
    await speaking;
    expect(FakeAudio.played).toEqual([]);
  });

  it("resolves a playing clip's speak() when stopped", async () => {
    FakeAudio.autoEnd = false;
    const tts = new ElevenLabsTTS();
    const speaking = tts.speak("A long line.");
    await new Promise((r) => setTimeout(r, 0));
    expect(FakeAudio.played).toHaveLength(1);
    tts.stop();
    await expect(speaking).resolves.toBeUndefined();
    expect(tts.isSpeaking()).toBe(false);
  });

  it("sends the default voice when the picker's Default (empty id) is selected", async () => {
    const tts = new ElevenLabsTTS();
    await tts.speak("Hello.", { voiceId: "" });
    const sent = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string) as { voiceId: string };
    expect(sent.voiceId).toBe(DEFAULT_ELEVENLABS_VOICE_ID);
  });

  it("holds a pause made between two sentences until resume()", async () => {
    FakeAudio.autoEnd = false;
    const tts = new ElevenLabsTTS();
    tts.pause();
    const speaking = tts.speak("Next sentence.");
    await new Promise((r) => setTimeout(r, 0));
    expect(FakeAudio.played).toEqual([]);
    tts.resume();
    await new Promise((r) => setTimeout(r, 0));
    expect(FakeAudio.played).toHaveLength(1);
    tts.stop();
    await speaking;
  });

  it("reports why a clip failed with a code the provider router understands", async () => {
    const tts = new ElevenLabsTTS();
    fetchMock.mockResolvedValueOnce(Response.json({ error: "tts_cap_reached", message: "Monthly limit" }, { status: 429 }));
    await expect(tts.speak("a")).rejects.toMatchObject({ code: "tts_cap_reached", detail: "Monthly limit" });
    fetchMock.mockResolvedValueOnce(Response.json({ error: "ElevenLabs requires a paid plan" }, { status: 403 }));
    await expect(tts.speak("b")).rejects.toMatchObject({ code: "tts_plan_required" });
    fetchMock.mockResolvedValueOnce(Response.json({ error: "boom" }, { status: 500 }));
    await expect(tts.speak("c")).rejects.toBeInstanceOf(TtsRequestError);
  });
});

