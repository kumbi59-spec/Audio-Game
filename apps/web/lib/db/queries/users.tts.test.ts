import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = { id: string; ttsCharsUsedThisMonth: number; ttsCharsResetAt: Date };
type Where = {
  id: string;
  ttsCharsResetAt?: { lt?: Date; gte?: Date };
  ttsCharsUsedThisMonth?: { lte?: number; gte?: number };
};
type Data = {
  ttsCharsUsedThisMonth?: number | { increment?: number; decrement?: number };
  ttsCharsResetAt?: Date;
};

const db = vi.hoisted(() => ({ row: null as Row | null }));

// An in-memory user row whose updates yield before running, so concurrent
// callers interleave the way parallel requests would. Each updateMany then
// checks and writes in one step, as a single conditional UPDATE does.
vi.mock("@/lib/db", () => {
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  const matches = (row: Row, where: Where) => {
    const at = row.ttsCharsResetAt;
    const used = row.ttsCharsUsedThisMonth;
    return (
      row.id === where.id &&
      (where.ttsCharsResetAt?.lt === undefined || at < where.ttsCharsResetAt.lt) &&
      (where.ttsCharsResetAt?.gte === undefined || at >= where.ttsCharsResetAt.gte) &&
      (where.ttsCharsUsedThisMonth?.lte === undefined || used <= where.ttsCharsUsedThisMonth.lte) &&
      (where.ttsCharsUsedThisMonth?.gte === undefined || used >= where.ttsCharsUsedThisMonth.gte)
    );
  };
  return {
    prisma: {
      user: {
        updateMany: async ({ where, data }: { where: Where; data: Data }) => {
          await tick();
          const row = db.row;
          if (!row || !matches(row, where)) return { count: 0 };
          const used = data.ttsCharsUsedThisMonth;
          if (typeof used === "number") row.ttsCharsUsedThisMonth = used;
          else if (used) row.ttsCharsUsedThisMonth += (used.increment ?? 0) - (used.decrement ?? 0);
          if (data.ttsCharsResetAt) row.ttsCharsResetAt = data.ttsCharsResetAt;
          return { count: 1 };
        },
      },
    },
  };
});
vi.mock("@/lib/admin", () => ({
  effectiveTierForUser: (_: unknown, tier: string) => tier,
  effectiveTierForEmail: (_: unknown, tier: string) => tier,
}));

import { refundTtsChars, reserveTtsChars } from "./users";

const now = new Date(2026, 9, 13, 12);
const earlierThisMonth = new Date(2026, 9, 2);
const lastMonth = new Date(2026, 8, 20);

describe("reserveTtsChars", () => {
  beforeEach(() => {
    db.row = { id: "u1", ttsCharsUsedThisMonth: 60, ttsCharsResetAt: earlierThisMonth };
  });

  it("adds to this month's count while it stays within the cap", async () => {
    expect(await reserveTtsChars("u1", 40, 100, now)).toBe(true);
    expect(db.row!.ttsCharsUsedThisMonth).toBe(100);
    expect(await reserveTtsChars("u1", 1, 100, now)).toBe(false);
    expect(db.row!.ttsCharsUsedThisMonth).toBe(100);
  });

  it("lets only as many parallel requests through as the cap allows", async () => {
    const results = await Promise.all([1, 2, 3].map(() => reserveTtsChars("u1", 30, 100, now)));
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(db.row!.ttsCharsUsedThisMonth).toBe(90);
  });

  it("starts a new month's count once, even for parallel requests", async () => {
    db.row = { id: "u1", ttsCharsUsedThisMonth: 100, ttsCharsResetAt: lastMonth };
    const results = await Promise.all([reserveTtsChars("u1", 60, 100, now), reserveTtsChars("u1", 60, 100, now)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(db.row!.ttsCharsUsedThisMonth).toBe(60);
    expect(db.row!.ttsCharsResetAt).toEqual(now);
  });

  it("refuses a single request larger than the cap", async () => {
    db.row = { id: "u1", ttsCharsUsedThisMonth: 0, ttsCharsResetAt: lastMonth };
    expect(await reserveTtsChars("u1", 101, 100, now)).toBe(false);
    expect(db.row!.ttsCharsResetAt).toEqual(lastMonth);
  });
});

describe("refundTtsChars", () => {
  it("gives back a failed request's reservation", async () => {
    db.row = { id: "u1", ttsCharsUsedThisMonth: 60, ttsCharsResetAt: earlierThisMonth };
    await reserveTtsChars("u1", 30, 100, now);
    await refundTtsChars("u1", 30, now);
    expect(db.row!.ttsCharsUsedThisMonth).toBe(60);
  });

  it("leaves a later month's count alone", async () => {
    const nextMonth = new Date(2026, 10, 1, 0, 5);
    db.row = { id: "u1", ttsCharsUsedThisMonth: 10, ttsCharsResetAt: nextMonth };
    await refundTtsChars("u1", 30, now);
    expect(db.row!.ttsCharsUsedThisMonth).toBe(10);
  });
});
