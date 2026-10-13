import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = { id: string; aiMinutesRemaining: number; aiMinutesResetAt: Date };
type Where = {
  id: string;
  aiMinutesResetAt?: { lt: Date };
  aiMinutesRemaining?: { lt: number };
};

const db = vi.hoisted(() => ({ row: null as Row | null, topUps: 0 }));

// An in-memory user row whose queries yield between calls, so concurrent
// callers interleave the way two requests would against Postgres.
vi.mock("@/lib/db", () => {
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  const matches = (row: Row, where: Where) =>
    row.id === where.id &&
    (!where.aiMinutesResetAt || row.aiMinutesResetAt < where.aiMinutesResetAt.lt) &&
    (!where.aiMinutesRemaining || row.aiMinutesRemaining < where.aiMinutesRemaining.lt);
  const write = (data: Partial<Row>) => {
    if (data.aiMinutesRemaining !== undefined) db.topUps += 1;
    Object.assign(db.row!, data);
  };
  return {
    prisma: {
      user: {
        findUnique: async () => {
          await tick();
          return db.row ? { ...db.row } : null;
        },
        update: async ({ data }: { data: Partial<Row> }) => {
          await tick();
          write(data);
          return db.row;
        },
        updateMany: async ({ where, data }: { where: Where; data: Partial<Row> }) => {
          await tick();
          if (!db.row || !matches(db.row, where)) return { count: 0 };
          write(data);
          return { count: 1 };
        },
      },
    },
  };
});
vi.mock("@/lib/admin", () => ({ effectiveTierForUser: (_: unknown, tier: string) => tier }));

import { resetDailyMinutesIfNeeded } from "./users";

const yesterday = () => new Date(Date.now() - 36 * 60 * 60 * 1000);

describe("resetDailyMinutesIfNeeded", () => {
  beforeEach(() => {
    db.topUps = 0;
    db.row = { id: "u1", aiMinutesRemaining: 10, aiMinutesResetAt: yesterday() };
  });

  it("tops a free player up to the daily allowance once per day", async () => {
    await resetDailyMinutesIfNeeded("u1", "free");
    expect(db.row).toMatchObject({ aiMinutesRemaining: 60 });
    expect(db.row!.aiMinutesResetAt.getTime()).toBeGreaterThan(yesterday().getTime());

    db.row!.aiMinutesRemaining = 59;
    await resetDailyMinutesIfNeeded("u1", "free");
    expect(db.row!.aiMinutesRemaining).toBe(59);
  });

  it("lets only one of two concurrent calls top up", async () => {
    await Promise.all([resetDailyMinutesIfNeeded("u1", "free"), resetDailyMinutesIfNeeded("u1", "free")]);
    expect(db.topUps).toBe(1);
    expect(db.row!.aiMinutesRemaining).toBe(60);
  });

  it("keeps purchased minutes above the daily cap but still starts the new day", async () => {
    db.row!.aiMinutesRemaining = 200;
    await resetDailyMinutesIfNeeded("u1", "free");
    expect(db.row!.aiMinutesRemaining).toBe(200);
    expect(db.topUps).toBe(0);
    expect(db.row!.aiMinutesResetAt.getTime()).toBeGreaterThan(yesterday().getTime());
  });

  it("leaves paid tiers alone", async () => {
    await resetDailyMinutesIfNeeded("u1", "storyteller");
    expect(db.row!.aiMinutesRemaining).toBe(10);
  });
});
