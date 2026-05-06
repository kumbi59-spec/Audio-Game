import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  moderatePlayerInput: vi.fn(),
  moderateGMOutput: vi.fn(),
  streamGMTurn: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/db/queries/users", () => ({
  consumeFreeAiMinute: vi.fn(),
  resetDailyMinutesIfNeeded: vi.fn(),
}));
vi.mock("@/lib/safety/moderator", () => ({
  moderatePlayerInput: mocks.moderatePlayerInput,
  moderateGMOutput: mocks.moderateGMOutput,
  SAFETY_FALLBACK: "fallback",
}));
vi.mock("@/lib/ai/gm-engine", () => ({
  streamGMTurn: mocks.streamGMTurn,
}));

import { POST } from "./route";

const basePayload = {
  action: { type: "free_text", content: "look around" },
  session: {
    id: "s1",
    worldId: "w1",
    characterId: "c1",
    status: "active",
    turnCount: 0,
    currentLocationId: "l1",
    timeOfDay: "morning",
    weather: "clear",
    globalFlags: {},
    npcStates: {},
    memorySummary: "",
    history: [],
    narrationLog: [],
    choices: [],
    isGenerating: false,
  },
  character: {
    id: "c1",
    name: "Hero",
    class: "warrior",
    backstory: "",
    stats: { hp: 10, maxHp: 10, strength: 10, dexterity: 10, intelligence: 10, charisma: 10, level: 1, experience: 0 },
    inventory: [{ id: "i1", name: "Sword", description: "", category: "weapon", quantity: 1, properties: {} }],
    quests: [{ id: "q1", title: "Start", description: "", status: "active", objectives: [{ id: "o1", text: "Go", completed: false }] }],
  },
  world: {
    id: "w1",
    name: "World",
    description: "desc",
    genre: "fantasy",
    tone: "grim",
    systemPrompt: "you are gm",
    isPrebuilt: true,
    locations: [{ id: "l1", name: "Town", description: "desc", shortDesc: "A town", ambientSound: null, connectedTo: [], properties: {} }],
    npcs: [],
  },
};

describe("POST /api/game/action validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
    mocks.findUnique.mockResolvedValue(null);
    mocks.moderatePlayerInput.mockReturnValue({ safe: true });
    mocks.moderateGMOutput.mockReturnValue({ safe: true });
    mocks.streamGMTurn.mockImplementation(async function* () {
      yield { type: "done", data: null };
    });
  });

  it("returns 400 with validation details when character payload is malformed", async () => {
    const req = new Request("http://localhost/api/game/action", {
      method: "POST",
      body: JSON.stringify({
        ...basePayload,
        character: { ...basePayload.character, stats: "oops" },
      }),
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid_request_body");
    expect(body.details[0].path).toEqual(["character", "stats"]);
  });

  it("returns 400 with validation details when world payload is malformed", async () => {
    const req = new Request("http://localhost/api/game/action", {
      method: "POST",
      body: JSON.stringify({
        ...basePayload,
        world: { ...basePayload.world, locations: [{ id: "l1" }] },
      }),
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid_request_body");
    expect(body.details.some((issue: { path: string[] }) => issue.path.join(".").startsWith("world.locations.0"))).toBe(true);
  });
});
