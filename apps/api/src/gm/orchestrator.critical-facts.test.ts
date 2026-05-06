import { describe, expect, it } from "vitest";
import type { StateMutation } from "@audio-rpg/shared";
import { extractCriticalFacts } from "./orchestrator.js";

describe("extractCriticalFacts", () => {
  it("covers continuity classes with canonical templates", () => {
    const mutations: StateMutation[] = [
      { op: "scene.set", name: "Ruined Gate" },
      { op: "codex.unlock", key: "codex:gate", title: "Gate Lore", body: "..." },
      { op: "flag.set", key: "injury_broken_arm", value: true },
      { op: "flag.set", key: "oath_to_mara", value: true },
      { op: "flag.set", key: "boss_dead_kraken", value: true },
      { op: "relationship.adjust", npc: "Mara", delta: -8 },
    ];

    const facts = extractCriticalFacts(mutations, 12);
    expect(facts.map((f) => f.text)).toEqual(
      expect.arrayContaining([
        "SCENE_CHANGE|Ruined Gate",
        "CODEX_UNLOCK|codex:gate|Gate Lore",
        "CONDITION_STATE|injury_broken_arm|true",
        "OATH_OR_DEBT_CREATED|oath_to_mara",
        "IRREVERSIBLE_LOSS|boss_dead_kraken",
        "RELATIONSHIP_THRESHOLD|Mara|NEG|8",
      ]),
    );
    expect(facts.every((f) => f.turnNumber === 12)).toBe(true);
    expect(facts.every((f) => f.sourceMutation.length > 0)).toBe(true);
  });

  it("ranks major irreversible events above routine item gains", () => {
    const facts = extractCriticalFacts(
      [
        { op: "inventory.add", item: "Torch", quantity: 1 },
        { op: "inventory.remove", item: "Relic", quantity: 1 },
        { op: "flag.set", key: "boss_dead_kraken", value: true },
      ],
      3,
    );

    const byText = new Map(facts.map((fact) => [fact.text, fact.importance]));
    expect(byText.get("IRREVERSIBLE_LOSS|boss_dead_kraken")).toBeGreaterThan(byText.get("ITEM_GAIN|Torch|x1") ?? 0);
    expect(byText.get("IRREVERSIBLE_LOSS|boss_dead_kraken")).toBeGreaterThan(byText.get("ITEM_LOSS|Relic|x1") ?? 0);
  });
});
