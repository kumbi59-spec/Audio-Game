import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("expo-speech", () => ({ speak: vi.fn(), stop: vi.fn(async () => undefined) }));
vi.mock("./elevenlabs", () => ({
  ElevenLabsNarrator: vi.fn(),
  elevenLabsAvailable: vi.fn(async () => false),
}));

import * as Speech from "expo-speech";
import { useEntitlements } from "@/entitlements/store";
import { ElevenLabsNarrator, elevenLabsAvailable, type UnplayedClip } from "./elevenlabs";
import {
  __resetNarratorForTests,
  feedNarration,
  npcVoiceRole,
  resetNpcVoiceMap,
  speakOnce,
  updateNpcVoiceMap,
} from "./narrator";

async function flush(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
}

type SpeakOptions = { onDone?: () => void; onStopped?: () => void };

/** Text of every expo-speech utterance so far. */
function spoken(): string[] {
  return vi.mocked(Speech.speak).mock.calls.map(([text]) => text);
}

/** Finishes the most recent expo-speech utterance. */
function finishLastUtterance(): void {
  const calls = vi.mocked(Speech.speak).mock.calls;
  (calls[calls.length - 1]?.[1] as SpeakOptions | undefined)?.onDone?.();
}

describe("NPC voice map", () => {
  beforeEach(() => {
    __resetNarratorForTests();
  });

  it("keeps an NPC's first voice when a later plan assigns another", () => {
    updateNpcVoiceMap({ Mira: "voice_a", Bran: "voice_b" });
    // The server numbers roles per turn, so when Bran speaks first in a
    // later turn the plan gives him voice_a.
    updateNpcVoiceMap({ " bran ": "voice_a" });
    expect(npcVoiceRole("Bran")).toBe("voice_b");
    expect(npcVoiceRole("Mira")).toBe("voice_a");
  });

  it("adds NPCs that aren't mapped yet", () => {
    updateNpcVoiceMap({ Mira: "voice_a" });
    updateNpcVoiceMap({ Oskar: "voice_c" });
    expect(npcVoiceRole("oskar")).toBe("voice_c");
  });

  it("forgets every assignment on reset", () => {
    updateNpcVoiceMap({ Mira: "voice_a" });
    resetNpcVoiceMap();
    updateNpcVoiceMap({ Mira: "voice_b" });
    expect(npcVoiceRole("Mira")).toBe("voice_b");
  });
});

describe("narration playback", () => {
  beforeEach(() => {
    __resetNarratorForTests();
    vi.mocked(Speech.speak).mockClear();
    vi.mocked(elevenLabsAvailable).mockClear();
    vi.mocked(elevenLabsAvailable).mockResolvedValue(false);
    useEntitlements.getState().setTier("free");
  });

  it("never probes premium TTS without the premiumTts entitlement", async () => {
    vi.mocked(elevenLabsAvailable).mockResolvedValue(true);
    feedNarration("The bell tolls.", true);
    await flush();
    expect(elevenLabsAvailable).not.toHaveBeenCalled();
    expect(spoken()).toEqual(["The bell tolls."]);
  });

  it("speaks refused premium clips on-device and stays there for the session", async () => {
    let fallback: (clips: UnplayedClip[]) => void = () => {};
    const premiumSpeak = vi.fn();
    vi.mocked(ElevenLabsNarrator).mockImplementation(function (
      this: unknown,
      _voiceId?: string,
      onFallback?: (clips: UnplayedClip[]) => void,
    ) {
      if (onFallback) fallback = onFallback;
      return { speak: premiumSpeak, setRate: vi.fn(), setVoice: vi.fn(), stop: vi.fn() };
    } as never);
    vi.mocked(elevenLabsAvailable).mockResolvedValue(true);
    useEntitlements.getState().setTier("storyteller");

    feedNarration("The bell tolls.", true);
    await flush();
    expect(premiumSpeak).toHaveBeenCalledWith("The bell tolls.", undefined);

    // The proxy answers 403 without a storyteller tier token.
    fallback([{ text: "The bell tolls." }]);
    await flush();
    expect(spoken()).toEqual(["The bell tolls."]);

    finishLastUtterance();
    feedNarration("Water rises.", true);
    await flush();
    expect(premiumSpeak).toHaveBeenCalledTimes(1);
    expect(spoken()).toEqual(["The bell tolls.", "Water rises."]);
  });

  it("resumes queued narration after a speakOnce interrupts it", async () => {
    feedNarration("One. ", false);
    await flush();
    // Arrives while "One." is playing, so it waits in the queue.
    feedNarration("Two. ", false);
    await flush();
    expect(spoken()).toEqual(["One. "]);

    // speakOnce stops the sentence in progress, as expo-speech reports.
    vi.mocked(Speech.stop).mockImplementationOnce(async () => {
      const first = vi.mocked(Speech.speak).mock.calls[0]?.[1] as SpeakOptions | undefined;
      first?.onStopped?.();
    });
    await speakOnce("Listening.");
    expect(spoken()).toEqual(["One. ", "Listening."]);

    finishLastUtterance();
    await flush();
    expect(spoken()).toEqual(["One. ", "Listening.", "Two. "]);
  });
});

