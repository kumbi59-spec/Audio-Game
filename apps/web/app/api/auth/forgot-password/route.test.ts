import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  consumeRateLimit: vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 120 }),
}));

import { POST } from "./route";

describe("POST /api/auth/forgot-password throttling", () => {
  it("returns 429 when limiter blocks", async () => {
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
  });
});
