import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import { characterFromRow, characterProgressData, characterSnapshotFromRow } from "./characters";

const stats = { hp: 6, maxHp: 12, strength: 11, dexterity: 10, intelligence: 9, charisma: 13, level: 2, experience: 140 };

describe("stored characters", () => {
  it("round-trips progress through the snapshot, keeping the row's id", () => {
    const character = {
      id: "client-id",
      name: "Mara",
      class: "rogue" as const,
      backstory: "b",
      roleTitle: "Smuggler",
      stats,
      customStats: { luck: 3 },
      inventory: [{ id: "i1", name: "Key", description: "", category: "key" as const, quantity: 1, properties: {} }],
      quests: [],
    };
    const { snapshot } = characterProgressData(character);
    expect(JSON.parse(snapshot).id).toBeUndefined();
    expect(characterSnapshotFromRow({ id: "row-id", snapshot })).toEqual({ ...character, id: "row-id" });
  });

  it("returns no snapshot when none was stored or it is unreadable", () => {
    expect(characterSnapshotFromRow({ id: "r", snapshot: null })).toBeNull();
    expect(characterSnapshotFromRow({ id: "r", snapshot: "{not json" })).toBeNull();
    expect(characterSnapshotFromRow({ id: "r", snapshot: JSON.stringify({ name: "x" }) })).toBeNull();
  });

  it("rebuilds a pre-snapshot character from its columns", () => {
    const character = characterFromRow({
      id: "r",
      name: "Old",
      class: "bard",
      backstory: "",
      stats: JSON.stringify(stats),
      snapshot: null,
      inventory: [{ id: "i", name: "Lute", description: "", category: "weird", quantity: 1, properties: "{}" }],
      quests: [{ id: "q", title: "Sing", description: "", status: "active", objectives: JSON.stringify([{ id: "o", text: "Sing", completed: false }]), reward: null }],
    });
    expect(character.stats).toEqual(stats);
    expect(character.inventory[0]).toMatchObject({ name: "Lute", category: "misc", properties: {} });
    expect(character.quests[0]!.objectives).toEqual([{ id: "o", text: "Sing", completed: false }]);
  });
});
