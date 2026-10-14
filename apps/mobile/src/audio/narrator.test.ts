import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("expo-speech", () => ({ speak: vi.fn(), stop: vi.fn(async () => undefined) }));
vi.mock("./elevenlabs", () => ({
  ElevenLabsNarrator: vi.fn(),
  elevenLabsAvailable: vi.fn(async () => false),
}));

import {
  __resetNarratorForTests,
  npcVoiceRole,
  resetNpcVoiceMap,
  updateNpcVoiceMap,
} from "./narrator";

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
