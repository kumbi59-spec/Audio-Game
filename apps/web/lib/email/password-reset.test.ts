import { createHash } from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

type VerificationTokenRecord = {
  identifier: string;
  token: string;
  expires: Date;
};

const records: VerificationTokenRecord[] = [];

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      verificationToken: {
        async deleteMany({ where }: any) {
          for (let i = records.length - 1; i >= 0; i -= 1) {
            const r = records[i];
            const identifierMatch =
              where?.identifier === undefined ||
              (typeof where.identifier === "string" && r.identifier === where.identifier) ||
              (where.identifier?.startsWith && r.identifier.startsWith(where.identifier.startsWith));
            const tokenMatch =
              where?.token === undefined ||
              (typeof where.token === "string" && r.token === where.token) ||
              (where.token?.not?.startsWith && !r.token.startsWith(where.token.not.startsWith));
            if (identifierMatch && tokenMatch) {
              records.splice(i, 1);
            }
          }
          return { count: 0 };
        },
        async create({ data }: any) {
          records.push({ ...data });
          return data;
        },
        async findFirst({ where }: any) {
          return (
            records.find((r) => r.identifier === where.identifier && (where.token === undefined || r.token === where.token)) ?? null
          );
        },
      },
    },
  };
});

import { createPasswordResetToken, validatePasswordResetToken } from "./password-reset";

beforeEach(() => {
  records.length = 0;
});

function hashLikeProduction(token: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  return `v2:${createHash("sha256").update(`${secret}:${token}`).digest("hex")}`;
}

describe("password-reset hashed token mode", () => {
  it("accepts a valid token and stores only hash", async () => {
    const token = await createPasswordResetToken("User@Example.com");

    expect(records).toHaveLength(1);
    expect(records[0].token).toMatch(/^v2:[a-f0-9]{64}$/);
    expect(records[0].token).not.toBe(token);

    await expect(validatePasswordResetToken("user@example.com", token)).resolves.toBe("ok");
  });

  it("rejects an invalid token", async () => {
    await createPasswordResetToken("user@example.com");

    await expect(validatePasswordResetToken("user@example.com", "wrong-token")).resolves.toBe("invalid");
  });

  it("rejects expired token and clears outstanding reset", async () => {
    const token = await createPasswordResetToken("user@example.com");
    records[0].expires = new Date(Date.now() - 1000);

    await expect(validatePasswordResetToken("user@example.com", token)).resolves.toBe("expired");
    expect(records).toHaveLength(0);
  });

  it("invalidates legacy outstanding reset tokens", async () => {
    records.push({
      identifier: "pwreset:legacy@example.com",
      token: "a".repeat(64),
      expires: new Date(Date.now() + 60_000),
    });

    await expect(validatePasswordResetToken("legacy@example.com", "any")).resolves.toBe("invalid");
    expect(records).toHaveLength(0);
  });

  it("remains deterministic when duplicate identifier rows exist", async () => {
    const identifier = "pwreset:user@example.com";
    records.push({ identifier, token: hashLikeProduction("first"), expires: new Date(Date.now() + 60_000) });
    records.push({ identifier, token: hashLikeProduction("second"), expires: new Date(Date.now() + 60_000) });

    await expect(validatePasswordResetToken("user@example.com", "second")).resolves.toBe("ok");
  });
});
