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

  it("tracks completed quest objectives", () => {
    const facts = extractCriticalFacts(
      [{ op: "quest.update", name: "Find the Amulet", objective: "Talk to Elder Fenn", done: true }],
      5,
    );
    expect(facts.map((f) => f.text)).toContain("QUEST_OBJECTIVE_DONE|Find the Amulet|Talk to Elder Fenn");
    const fact = facts.find((f) => f.text.startsWith("QUEST_OBJECTIVE_DONE"))!;
    expect(fact.importance).toBe(0.72);
    expect(fact.kind).toBe("quest");
  });

  it("does not emit a fact for quest.update when done is false", () => {
    const facts = extractCriticalFacts(
      [{ op: "quest.update", name: "Find the Amulet", objective: "Talk to Elder Fenn", done: false }],
      5,
    );
    expect(facts.map((f) => f.text)).not.toContain(expect.stringMatching(/QUEST_OBJECTIVE_DONE/));
  });

  it("tracks significant stat changes", () => {
    const facts = extractCriticalFacts(
      [
        { op: "stat.adjust", stat: "hp", delta: -10 },
        { op: "stat.adjust", stat: "luck", delta: 3 },
      ],
      5,
    );
    const texts = facts.map((f) => f.text);
    expect(texts).toContain("STAT_CHANGE|hp|LOSS|10");
    expect(texts).not.toContain(expect.stringMatching(/STAT_CHANGE\|luck/));
    const hpFact = facts.find((f) => f.text === "STAT_CHANGE|hp|LOSS|10")!;
    expect(hpFact.importance).toBe(0.70);
  });

  it("does not track minor stat adjustments below threshold", () => {
    const facts = extractCriticalFacts([{ op: "stat.adjust", stat: "hp", delta: -4 }], 5);
    expect(facts.map((f) => f.text)).not.toContain(expect.stringMatching(/STAT_CHANGE/));
  });

  it("appends relationship note to fact text when present", () => {
    const facts = extractCriticalFacts(
      [{ op: "relationship.adjust", npc: "Lyra", delta: 5, note: "helped rescue the merchant" }],
      5,
    );
    const rel = facts.find((f) => f.text.startsWith("RELATIONSHIP_THRESHOLD|Lyra"))!;
    expect(rel).toBeDefined();
    expect(rel.text).toContain("helped rescue the merchant");
  });

  it("omits note fragment when relationship.adjust has no note", () => {
    const facts = extractCriticalFacts([{ op: "relationship.adjust", npc: "Lyra", delta: 5 }], 5);
    const rel = facts.find((f) => f.text.startsWith("RELATIONSHIP_THRESHOLD|Lyra"))!;
    expect(rel.text).toBe("RELATIONSHIP_THRESHOLD|Lyra|POS|5");
  });
});
