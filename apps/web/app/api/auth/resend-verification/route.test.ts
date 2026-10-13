import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendVerificationEmail: vi.fn() }));

vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: "u1" } }) }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: async () => ({ email: "new@example.com", name: "New", emailVerified: null }) } },
}));
vi.mock("@/lib/email/verification", () => ({ createVerificationToken: async () => "tok" }));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: mocks.sendVerificationEmail }));

import { POST } from "./route";

describe("POST /api/auth/resend-verification", () => {
  it("builds the link from the public site origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://echoquest.us");
    vi.stubEnv("NEXTAUTH_URL", "");

    const res = await POST(new Request("http://localhost:10000/api/auth/resend-verification", { method: "POST" }));

    expect(res.status).toBe(200);
    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith(
      "new@example.com",
      "New",
      "https://echoquest.us/api/auth/verify-email?token=tok&email=new%40example.com",
    );
  });
});
