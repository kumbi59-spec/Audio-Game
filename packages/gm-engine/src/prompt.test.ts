import { describe, expect, it } from "vitest";
import { buildTurnUserPrompt } from "./prompt.js";
import type { CampaignState, PlayerInput } from "@audio-rpg/shared";
import type { MemoryBundle } from "./memory.js";

function baseState(): CampaignState {
  return {
    scene: { name: "Dock", summary: "" },
    turn_number: 42,
    character: { name: "Rue", stats: {}, background: {} },
    inventory: [], quests: [], relationships: [], codex: [], flags: {},
  };
}

function saturatedMemory(): MemoryBundle {
  return {
    criticalFacts: Array.from({ length: 20 }, (_, i) => ({ turnNumber: i + 1, text: `critical ${i} `.repeat(20) })),
    recent: Array.from({ length: 30 }, (_, i) => ({ turnNumber: i + 1, role: "gm", text: `recent-${i}` })),
    retrieved: Array.from({ length: 30 }, (_, i) => ({ turnNumber: i + 1, role: "player", text: `retrieved-${i}` })),
    scenes: Array.from({ length: 10 }, (_, i) => ({ sceneNumber: i + 1, summary: `scene-${i}`, keyEvents: [] })),
    bibleHits: Array.from({ length: 10 }, (_, i) => ({ categories: ["lore"], text: `bible-${i}`, score: 1 })),
  };
}

describe("buildTurnUserPrompt critical facts", () => {
  it("includes critical facts section before last turns when context windows are saturated", () => {
    const prompt = buildTurnUserPrompt({
      state: baseState(),
      memory: saturatedMemory(),
      input: { kind: "freeform", text: "Check the sigil" } as PlayerInput,
    });

    const criticalIndex = prompt.indexOf("## Critical continuity facts");
    const lastTurnsIndex = prompt.indexOf("## Last turns");

    expect(criticalIndex).toBeGreaterThan(-1);
    expect(lastTurnsIndex).toBeGreaterThan(-1);
    expect(criticalIndex).toBeLessThan(lastTurnsIndex);

    const bulletCount = (prompt.match(/^- \[t\d+\]/gm) ?? []).length;
    expect(bulletCount).toBe(10);
  });
});
