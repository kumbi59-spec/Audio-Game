import { describe, expect, it, vi } from "vitest";

const consumeMock = vi.fn()
  .mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 })
  .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 900 })
  .mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  consumeRateLimit: consumeMock,
}));

import { POST } from "./route";

describe("POST /api/auth/reset-password throttling", () => {
  it("returns 429 when identifier is in cooldown", async () => {
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", token: "bad", newPassword: "password123" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
  });
});
