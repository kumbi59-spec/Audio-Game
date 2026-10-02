import { describe, expect, it } from "vitest";
import { GM_VOICE_GUIDE } from "@audio-rpg/shared";
import { CORE_GM_IDENTITY, buildSystemBlocks } from "./system";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

describe("CORE_GM_IDENTITY", () => {
  it("carries the shared GM voice guide", () => {
    expect(CORE_GM_IDENTITY).toContain(GM_VOICE_GUIDE);
  });

  it("contains no em dashes, since the prompt's style leaks into the narration", () => {
    expect(CORE_GM_IDENTITY).not.toContain("—");
  });

  it("leaves levelling to the game", () => {
    expect(CORE_GM_IDENTITY).toContain('never emit "level"');
    expect(CORE_GM_IDENTITY).not.toMatch(/set "level": 1/);
  });

  it("tells the GM what a downed character means", () => {
    expect(CORE_GM_IDENTITY).toContain("Condition: DOWN");
  });
});

describe("prebuilt world prompts", () => {
  it.each(PREBUILT_WORLDS.map((w) => [w.name, w] as const))("%s has no em dashes and some real-world texture", (_, world) => {
    const [, worldBlock] = buildSystemBlocks(world.systemPrompt);
    expect(worldBlock!.text).not.toContain("—");
    expect(world.systemPrompt).toContain("Real-World Texture");
    for (const loc of world.locations) expect(loc.name).not.toContain("—");
  });
});
