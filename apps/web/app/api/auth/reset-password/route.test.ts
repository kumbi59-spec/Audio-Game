import { beforeEach, describe, expect, it, vi } from "vitest";

const { consumeMock, validateMock } = vi.hoisted(() => ({
  consumeMock: vi.fn(),
  validateMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "1.2.3.4",
  consumeRateLimit: consumeMock,
}));
vi.mock("@/lib/email/password-reset", () => ({
  validatePasswordResetToken: validateMock,
  deletePasswordResetToken: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { POST } from "./route";

function resetRequest(body: string) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/reset-password throttling", () => {
  beforeEach(() => {
    consumeMock.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    validateMock.mockReset();
  });

  it("returns 429 when identifier is in cooldown", async () => {
    consumeMock
      .mockResolvedValueOnce({ allowed: true, retryAfterSeconds: 0 })
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 900 });
    const res = await POST(resetRequest(JSON.stringify({ email: "user@example.com", token: "bad", newPassword: "password123" })));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
  });

  it("counts failures per email, never putting the reset token in the bucket key", async () => {
    validateMock.mockResolvedValue("invalid");
    const token = "a1b2c3d4e5f6";
    const res = await POST(resetRequest(JSON.stringify({ email: " User@Example.com ", token, newPassword: "password123" })));
    expect(res.status).toBe(400);

    const keys = consumeMock.mock.calls.map(([rule]) => (rule as { key: string }).key);
    expect(keys.some((key) => key.includes(token))).toBe(false);
    expect(consumeMock).toHaveBeenCalledWith(
      expect.objectContaining({ key: "auth:reset:email:user@example.com", wasFailure: true }),
    );
  });

  it("rejects a malformed JSON body with 400", async () => {
    const res = await POST(resetRequest("{not json"));
    expect(res.status).toBe(400);
    expect(consumeMock).not.toHaveBeenCalled();
  });
});
