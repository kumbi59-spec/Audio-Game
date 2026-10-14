import { beforeEach, describe, expect, it, vi } from "vitest";

const premiumSpeak = vi.fn();
const browserSpeak = vi.fn(async () => undefined);

// A voice whose speaking/paused state the tests set directly.
const FakeVoice = vi.hoisted(() => class {
  speaking = false;
  paused = false;
  pause = vi.fn(() => { this.paused = true; });
  resume = vi.fn(() => { this.paused = false; });
  stop() { this.speaking = false; this.paused = false; }
  isSpeaking() { return this.speaking; }
  isPaused() { return this.paused; }
});

vi.mock("./elevenlabs-tts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./elevenlabs-tts")>();
  return {
    ...actual,
    ElevenLabsTTS: class extends FakeVoice {
      speak = premiumSpeak;
    },
  };
});
vi.mock("./browser-tts", () => ({
  BrowserTTS: class extends FakeVoice {
    speak = browserSpeak;
  },
}));

const { TtsRequestError } = await import("./elevenlabs-tts");
const {
  speak, onTtsNotice, openNarrationSession, isSpeaking, isPaused, pauseSpeech, resumeSpeech, stopSpeech, getTTSProvider,
} = await import("./tts-provider");
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

describe("pause and resume with a fallback line playing", () => {
  const premium = () => getTTSProvider("elevenlabs") as unknown as InstanceType<typeof FakeVoice>;
  const browser = () => getTTSProvider("browser") as unknown as InstanceType<typeof FakeVoice>;
  beforeEach(() => {
    stopSpeech();
    premium().pause.mockClear();
    premium().resume.mockClear();
    browser().pause.mockClear();
    browser().resume.mockClear();
  });

  it("counts the browser voice reading a line for premium narration as speaking", () => {
    useAudioStore.getState().setTTSProvider("elevenlabs");
    browser().speaking = true;
    expect(isSpeaking()).toBe(true);
  });

  it("pauses and resumes the browser voice when it's the one talking", () => {
    useAudioStore.getState().setTTSProvider("elevenlabs");
    browser().speaking = true;

    pauseSpeech();
    expect(browser().pause).toHaveBeenCalledTimes(1);
    expect(isPaused()).toBe(true);

    resumeSpeech();
    expect(browser().resume).toHaveBeenCalledTimes(1);
    expect(isPaused()).toBe(false);
  });

  it("holds premium narration paused between sentences", () => {
    useAudioStore.getState().setTTSProvider("elevenlabs");
    pauseSpeech();
    expect(premium().pause).toHaveBeenCalledTimes(1);
    expect(browser().pause).not.toHaveBeenCalled();
  });

  it("never pauses an idle browser voice", () => {
    useAudioStore.getState().setTTSProvider("browser");
    pauseSpeech();
    expect(browser().pause).not.toHaveBeenCalled();
    expect(premium().pause).not.toHaveBeenCalled();
    expect(isPaused()).toBe(false);
  });
});
