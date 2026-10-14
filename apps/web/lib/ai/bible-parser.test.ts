import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), worldCreate: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { world: { create: mocks.worldCreate } } }));
vi.mock("@/lib/worlds/cover-art-resolver", () => ({
  resolveWorldCoverImage: vi.fn().mockResolvedValue("data:image/png;base64,AAAA"),
}));
vi.mock("@/lib/ai/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/client")>()),
  getAnthropicClient: () => ({ messages: { create: mocks.create } }),
}));

import {
  buildSystemPromptFromBible,
  createWorldFromBible,
  normalizeParsedBible,
  parseGameBible,
} from "./bible-parser";

type CreatedWorld = {
  data: {
    locations: { create: Array<{ id: string; name: string; connectedTo: string }> };
    npcs: { create: Array<{ name: string; locationId: string | null }> };
  };
};

function createdWorld(): CreatedWorld["data"] {
  return (mocks.worldCreate.mock.calls[0]![0] as CreatedWorld).data;
}

describe("normalizeParsedBible", () => {
  it("fills in fields the model left out and drops nameless entries", () => {
    const bible = normalizeParsedBible({
      worldName: "Saltglass",
      locations: [
        { name: "The Docks", description: "Wet planks." },
        { description: "A place with no name." },
        "not an object",
      ],
      npcs: [{ name: "Mara", role: "smuggler", homeLocation: "The Docks" }, { name: "  " }],
      factions: "the guild",
      campaignHooks: ["Find the map", 42],
      statRules: { perStatMax: 5, totalPointPool: "lots" },
    });

    expect(bible.locations).toEqual([
      { name: "The Docks", description: "Wet planks.", shortDesc: "", ambientMood: "", connections: [] },
    ]);
    expect(bible.npcs).toEqual([
      { name: "Mara", role: "smuggler", personality: "", voiceDescription: "", homeLocation: "The Docks" },
    ]);
    expect(bible.factions).toEqual([]);
    expect(bible.campaignHooks).toEqual(["Find the map"]);
    expect(bible.classes).toEqual([]);
    expect(bible.backgrounds).toEqual([]);
    expect(bible.importantItems).toEqual([]);
    expect(bible.synopsis).toBe("");
    expect(bible.rulesNotes).toBe("");
    expect(bible.statRules).toEqual({ perStatMax: 5 });
  });

  it("names an unnamed world and accepts a reply that isn't an object", () => {
    expect(normalizeParsedBible({}).worldName).toBe("Untitled World");
    expect(normalizeParsedBible(["oops"]).locations).toEqual([]);
  });
});

describe("parseGameBible", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a bible the system prompt builder can use, even from an incomplete reply", async () => {
    mocks.create.mockResolvedValue({
      stop_reason: "end_turn",
      content: [{ type: "text", text: '```json\n{"worldName":"Saltglass","npcs":[{"name":"Mara"}]}\n```' }],
    });

    const bible = await parseGameBible("A long enough game bible about a salt sea.");

    expect(bible.worldName).toBe("Saltglass");
    expect(() => buildSystemPromptFromBible(bible)).not.toThrow();
    expect(buildSystemPromptFromBible(bible)).toContain("- Mara (): ");
  });
});

describe("createWorldFromBible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.worldCreate.mockResolvedValue({});
  });

  it("gives duplicate location names their own ids and points the name at the first", async () => {
    const bible = normalizeParsedBible({
      worldName: "Saltglass",
      locations: [
        { name: "Market", connections: ["Harbor"] },
        { name: "Harbor", connections: ["Market"] },
        { name: "Market", connections: [] },
      ],
      npcs: [{ name: "Mara", homeLocation: "Market" }],
    });

    await createWorldFromBible(bible, "owner-1", "bible-1");

    const { locations, npcs } = createdWorld();
    const ids = locations.create.map((l) => l.id);
    expect(new Set(ids).size).toBe(3);
    expect(npcs.create[0]!.locationId).toBe(ids[0]);
    expect(JSON.parse(locations.create[1]!.connectedTo)).toEqual([ids[0]]);
  });

  it("puts the starting location first, with ids that sort in creation order", async () => {
    const bible = normalizeParsedBible({
      worldName: "Saltglass",
      startingLocation: "the lighthouse",
      locations: Array.from({ length: 12 }, (_, i) => ({ name: i === 7 ? "The Lighthouse" : `Place ${i}` })),
    });

    await createWorldFromBible(bible, "owner-1", "bible-1");

    const created = createdWorld().locations.create;
    expect(created[0]!.name).toBe("The Lighthouse");
    const ids = created.map((l) => l.id);
    expect([...ids].sort()).toEqual(ids);
  });

  it("doesn't reuse ids across worlds created in the same millisecond", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    try {
      const bible = normalizeParsedBible({ worldName: "Saltglass", locations: [{ name: "Market" }] });

      const first = await createWorldFromBible(bible, "owner-1", "bible-1");
      const second = await createWorldFromBible(bible, "owner-1", "bible-2");

      expect(first).not.toBe(second);
    } finally {
      now.mockRestore();
    }
  });
});
