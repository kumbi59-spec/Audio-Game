import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tx: {
    verificationToken: { findUnique: vi.fn(), delete: vi.fn() },
    user: { findFirst: vi.fn(), update: vi.fn() },
  },
  transaction: vi.fn(),
  sendWelcomeEmail: vi.fn(),
}));

// Only `$transaction` exists on the client, so any write made outside the
// transaction would throw.
vi.mock("@/lib/db", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/email", () => ({ sendWelcomeEmail: mocks.sendWelcomeEmail }));

import { NextRequest } from "next/server";
import { GET } from "./route";

function verify(token = "tok", email = "new@example.com") {
  return GET(new NextRequest(`http://localhost/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`));
}

describe("GET /api/auth/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://echoquest.us");
    mocks.transaction.mockImplementation(async (fn: (tx: typeof mocks.tx) => unknown) => fn(mocks.tx));
    mocks.tx.verificationToken.findUnique.mockResolvedValue({
      identifier: "new@example.com",
      token: "tok",
      expires: new Date(Date.now() + 60_000),
    });
    mocks.tx.user.findFirst.mockResolvedValue({ id: "u1", name: "New", email: "new@example.com" });
    mocks.tx.user.update.mockResolvedValue({ id: "u1" });
    mocks.sendWelcomeEmail.mockResolvedValue(undefined);
  });

  it("consumes the token and writes emailVerified in one transaction", async () => {
    const res = await verify();

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.verificationToken.delete).toHaveBeenCalledWith({ where: { token: "tok" } });
    expect(mocks.tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" }, data: { emailVerified: expect.any(Date) } }),
    );
    expect(res.headers.get("location")).toBe("https://echoquest.us/?verified=1");
  });

  it("redirects with an error, not as verified, when the write fails", async () => {
    mocks.tx.user.update.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await verify();

    expect(res.headers.get("location")).toBe("https://echoquest.us/auth/sign-in?verify_error=failed");
    expect(mocks.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("rejects a token issued for another email", async () => {
    const res = await verify("tok", "someone-else@example.com");

    expect(res.headers.get("location")).toBe("https://echoquest.us/auth/sign-in?verify_error=invalid");
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("handles a failed welcome email instead of leaving the rejection unhandled", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.sendWelcomeEmail.mockRejectedValue(new Error("resend down"));

    const res = await verify();

    expect(res.headers.get("location")).toBe("https://echoquest.us/?verified=1");
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
  });
});
