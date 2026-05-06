import { describe, expect, it } from "vitest";
import { buildSystemPrompt, buildTurnUserPrompt } from "./prompt.js";
import type { CampaignState, GameBible, PlayerInput } from "@audio-rpg/shared";
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
    injectionState: { turnWindow: 2, seenIds: [] },
  };
}

function baseBible(): GameBible {
  return {
    version: 1,
    title: "Test Bible",
    pitch: "A compact test world.",
    tone: { content_rating: "teen", forbidden_topics: [] },
    style_mode: "adventure",
    rules: { hard_constraints: [] },
    entities: [],
    timeline: [],
    character_creation: { origins: [], classes: [], stats: [], starting_items: [] },
    win_states: [],
    fail_states: [],
  };
}

describe("buildSystemPrompt memory directives", () => {
  it("includes memory usage contract and keeps section ordering stable", () => {
    const prompt = buildSystemPrompt(baseBible());

    const continuityIndex = prompt.indexOf("## Continuity rules");
    const memoryContractIndex = prompt.indexOf("## Memory usage contract");
    const styleDirectiveIndex = prompt.indexOf("## Style directive");

    expect(continuityIndex).toBeGreaterThan(-1);
    expect(memoryContractIndex).toBeGreaterThan(-1);
    expect(styleDirectiveIndex).toBeGreaterThan(-1);
    expect(continuityIndex).toBeLessThan(memoryContractIndex);
    expect(memoryContractIndex).toBeLessThan(styleDirectiveIndex);

    expect(prompt).toContain("consult critical continuity facts and retrieved memories");
    expect(prompt).toContain("Do not contradict established relationship history, quest history, or prior commitments.");
    expect(prompt).toContain("labels should clearly signal follow-through on prior commitments");
    expect(prompt).toContain("`memory_anchors_used` (optional, internal only and never narrated/shown to the player)");
  });
});

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
