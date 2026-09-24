import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  consumeRateLimit: vi.fn(),
  consumeFreeAiMinute: vi.fn(),
  resolvePlayableWorld: vi.fn(),
  generateOpeningNarration: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: mocks.userFindUnique, create: mocks.userCreate } },
}));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/db/queries/users", () => ({
  consumeFreeAiMinute: mocks.consumeFreeAiMinute,
  resetDailyMinutesIfNeeded: vi.fn(),
}));
vi.mock("@/lib/worlds/resolve-playable-world", () => ({
  resolvePlayableWorld: mocks.resolvePlayableWorld,
}));
vi.mock("@/lib/ai/gm-engine", () => ({
  generateOpeningNarration: mocks.generateOpeningNarration,
}));

import { POST } from "./route";
import { __resetActiveStreamsForTests } from "@/lib/ai/usage-guard";

const character = {
  id: "c1",
  name: "Hero",
  class: "warrior",
  backstory: "",
  stats: { hp: 10, maxHp: 10, strength: 10, dexterity: 10, intelligence: 10, charisma: 10, level: 1, experience: 0 },
  inventory: [],
  quests: [],
};

function request(body: unknown) {
  return new Request("http://localhost/api/game/opening", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/game/opening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetActiveStreamsForTests();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.userFindUnique.mockResolvedValue({ id: "user-1", tier: "free", email: "p@example.com" });
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.consumeFreeAiMinute.mockResolvedValue(true);
    mocks.resolvePlayableWorld.mockResolvedValue({ ok: true, world: { id: "w1", systemPrompt: "server" } });
    mocks.generateOpeningNarration.mockResolvedValue({ narration: "Once upon a time", choices: [] });
  });

  it("rejects arbitrary world/character payloads", async () => {
    const res = await POST(request({ world: { anything: true }, character: { prompt: "x" } }) as never);
    expect(res.status).toBe(400);
    expect(mocks.generateOpeningNarration).not.toHaveBeenCalled();
  });

  it("generates from the server-side world and debits the free quota", async () => {
    const res = await POST(request({ world: { id: "w1", systemPrompt: "client prompt" }, character }) as never);
    expect(res.status).toBe(200);
    expect(mocks.resolvePlayableWorld).toHaveBeenCalledWith("w1", "user-1");
    expect(mocks.generateOpeningNarration.mock.calls[0]![0]).toEqual({ id: "w1", systemPrompt: "server" });
    expect(mocks.consumeFreeAiMinute).toHaveBeenCalledWith("user-1");
  });

  it("rejects anonymous callers once guest creation is rate limited", async () => {
    mocks.auth.mockResolvedValue(null);
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 60 });
    const res = await POST(request({ world: { id: "w1" }, character }) as never);
    expect(res.status).toBe(429);
    expect(mocks.generateOpeningNarration).not.toHaveBeenCalled();
  });

  it("returns 402 without calling the model when AI minutes are exhausted", async () => {
    mocks.consumeFreeAiMinute.mockResolvedValue(false);
    const res = await POST(request({ world: { id: "w1" }, character }) as never);
    expect(res.status).toBe(402);
    expect(mocks.generateOpeningNarration).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown world without calling the model", async () => {
    mocks.resolvePlayableWorld.mockResolvedValue({ ok: false, status: 404 });
    const res = await POST(request({ world: { id: "nope" }, character }) as never);
    expect(res.status).toBe(404);
    expect(mocks.generateOpeningNarration).not.toHaveBeenCalled();
  });
});
