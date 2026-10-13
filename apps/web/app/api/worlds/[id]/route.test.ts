import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  resolvePlayableWorld: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/queries/worlds", () => ({ deleteWorld: vi.fn() }));
vi.mock("@/lib/worlds/resolve-playable-world", () => ({
  resolvePlayableWorld: mocks.resolvePlayableWorld,
}));

import { GET } from "./route";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/worlds/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
  });

  it("returns a public world without its creator's system prompt", async () => {
    mocks.resolvePlayableWorld.mockResolvedValue({
      ok: true,
      world: { id: "w1", name: "Saltbound", systemPrompt: "SECRET GM BRIEFING", locations: [], npcs: [] },
    });

    const res = await GET(new Request("http://localhost/api/worlds/w1"), params("w1"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ id: "w1", name: "Saltbound", systemPrompt: "" });
    expect(JSON.stringify(body)).not.toContain("SECRET GM BRIEFING");
  });

  it("still refuses worlds the caller may not play", async () => {
    mocks.resolvePlayableWorld.mockResolvedValue({ ok: false, status: 403 });

    const res = await GET(new Request("http://localhost/api/worlds/private"), params("private"));

    expect(res.status).toBe(403);
  });
});
