import { beforeEach, describe, expect, it, vi } from "vitest";

const premiumSpeak = vi.fn();
const browserSpeak = vi.fn(async () => undefined);

vi.mock("./elevenlabs-tts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./elevenlabs-tts")>();
  return {
    ...actual,
    ElevenLabsTTS: class {
      speak = premiumSpeak;
      stop() {}
      isSpeaking() { return false; }
    },
  };
});
vi.mock("./browser-tts", () => ({
  BrowserTTS: class {
    speak = browserSpeak;
    stop() {}
    isSpeaking() { return false; }
  },
}));

const { TtsRequestError } = await import("./elevenlabs-tts");
const { speak, onTtsNotice, openNarrationSession, isSpeaking, stopSpeech } = await import("./tts-provider");
const { useAudioStore } = await import("@/store/audio-store");

describe("speak() with premium narration", () => {
  const notices: string[] = [];
  beforeEach(() => {
    premiumSpeak.mockReset();
    browserSpeak.mockClear();
    notices.length = 0;
    useAudioStore.getState().setTTSProvider("elevenlabs");
  });
  onTtsNotice((m) => notices.push(m));

  it("switches to the browser voice for good when the monthly cap is hit", async () => {
    premiumSpeak.mockRejectedValueOnce(new TtsRequestError("tts_cap_reached", "cap"));
    await speak("Line one.");
    expect(browserSpeak).toHaveBeenCalledWith("Line one.", expect.objectContaining({ voiceId: undefined }));
    expect(useAudioStore.getState().ttsProvider).toBe("browser");
    expect(notices).toHaveLength(1);
  });

  it("reads one line in the browser voice when premium fails, and says so once", async () => {
    premiumSpeak.mockRejectedValue(new TtsRequestError("tts_failed", "502"));
    await speak("One.");
    await speak("Two.");
    expect(browserSpeak).toHaveBeenCalledTimes(2);
    expect(useAudioStore.getState().ttsProvider).toBe("elevenlabs");
    expect(notices).toHaveLength(1);
  });
});

describe("narration sessions", () => {
  it("a session that ends after stopSpeech() can't end the next one", () => {
    const closeOld = openNarrationSession();
    stopSpeech();
    const closeNew = openNarrationSession();
    closeOld();
    expect(isSpeaking()).toBe(true);
    closeNew();
    expect(isSpeaking()).toBe(false);
  });
});
