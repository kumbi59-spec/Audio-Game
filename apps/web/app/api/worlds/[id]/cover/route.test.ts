import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  consumeRateLimit: vi.fn(),
  generateAICoverArt: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/db", () => ({ prisma: { world: { findUnique: mocks.findUnique, update: vi.fn() } } }));
vi.mock("@/lib/ai/cover-art-gen", () => ({ generateAICoverArt: mocks.generateAICoverArt }));

import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/worlds/[id]/cover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1", tier: "creator" } });
  });

  it("turns a player away once they're over the authoring rate limit", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 30 });

    const res = await POST(new NextRequest("http://localhost/api/worlds/w1/cover", { method: "POST" }), {
      params: Promise.resolve({ id: "w1" }),
    });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(mocks.generateAICoverArt).not.toHaveBeenCalled();
  });
});
