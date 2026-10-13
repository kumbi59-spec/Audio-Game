import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostgresCampaignStore } from "./postgres.js";
import type { CriticalFactRecord } from "./types.js";

/**
 * Exercises PostgresCampaignStore against a fake pg.Pool, so the SQL it
 * sends and the rows it reads can be checked without a database.
 */
type Rows = { rows: unknown[] };

const fake = vi.hoisted(() => ({
  pools: [] as {
    queries: { sql: string; params: unknown[] }[];
    listeners: Map<string, ((...args: unknown[]) => void)[]>;
  }[],
  /** Connect failures for the next pool created; other stores' pools are unaffected. */
  nextPoolConnectFailures: 0,
  respond: (_sql: string, _params: unknown[]): Rows => ({ rows: [] }),
}));

vi.mock("pg", () => {
  class Pool {
    queries: { sql: string; params: unknown[] }[] = [];
    listeners = new Map<string, ((...args: unknown[]) => void)[]>();
    private connectFailures = fake.nextPoolConnectFailures;
    constructor() {
      fake.nextPoolConnectFailures = 0;
      fake.pools.push(this);
    }
    on(event: string, listener: (...args: unknown[]) => void) {
      this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
      return this;
    }
    async connect() {
      if (this.connectFailures > 0) {
        this.connectFailures -= 1;
        throw new Error("connect ECONNREFUSED");
      }
      return { query: (sql: string, params?: unknown[]) => this.query(sql, params), release: () => undefined };
    }
    async query(sql: string, params: unknown[] = []): Promise<Rows> {
      this.queries.push({ sql, params });
      return fake.respond(sql, params);
    }
    async end() {}
  }
  // postgres.ts default-imports pg (a CommonJS module under Node ESM).
  return { default: { Pool }, Pool };
});

function latestPool() {
  const pool = fake.pools.at(-1);
  if (!pool) throw new Error("no pool created");
  return pool;
}

function fact(turnNumber: number, text: string, kind: CriticalFactRecord["kind"], importance: number): CriticalFactRecord {
  return { turnNumber, text, kind, importance, entityRefs: [], sourceMutation: "flag.set" };
}

beforeEach(() => {
  fake.nextPoolConnectFailures = 0;
  fake.respond = () => ({ rows: [] });
});

describe("PostgresCampaignStore", () => {
  it("listens for pool errors so a dropped idle client can't crash the process", () => {
    new PostgresCampaignStore("postgres://test");
    const listeners = latestPool().listeners.get("error") ?? [];
    expect(listeners).toHaveLength(1);
    expect(() => listeners[0]!(new Error("terminating connection due to administrator command"))).not.toThrow();
  });

  it("retries migrations after a failed boot instead of failing every query", async () => {
    fake.nextPoolConnectFailures = 1;
    const store = new PostgresCampaignStore("postgres://test");
    await expect(store.listWorlds()).rejects.toThrow("ECONNREFUSED");
    await expect(store.listWorlds()).resolves.toEqual([]);
  });

  it("orders recent turns by turn, then insert time, oldest first", async () => {
    const store = new PostgresCampaignStore("postgres://test");
    fake.respond = (sql) =>
      sql.includes("SELECT turn_number, role, text FROM turns")
        ? {
            rows: [
              { turn_number: 2, role: "gm", text: "gm 2" },
              { turn_number: 1, role: "gm", text: "gm 1" },
              { turn_number: 1, role: "player", text: "player 1" },
            ],
          }
        : { rows: [] };

    const turns = await store.memoryStore().recentTurns("c1", 3);
    expect(turns.map((t) => t.text)).toEqual(["player 1", "gm 1", "gm 2"]);
    const query = latestPool().queries.find((q) => q.sql.includes("SELECT turn_number, role, text FROM turns"));
    expect(query?.sql).toMatch(/ORDER BY turn_number DESC, created_at DESC, id DESC/);
  });

  it("returns the most important critical facts in story order, without the skill-check roll", async () => {
    const store = new PostgresCampaignStore("postgres://test");
    fake.respond = (sql) =>
      sql.includes("SELECT critical_facts, state FROM campaigns")
        ? {
            rows: [
              {
                state: {},
                critical_facts: [
                  fact(1, "QUEST_COMPLETE|Bell", "quest", 0.97),
                  fact(2, "ITEM_GAIN|Torch|x1", "item", 0.56),
                  fact(3, 'FLAG_SET|last_skill_check|{"roll":20}', "flag", 0.99),
                  fact(4, "IRREVERSIBLE_LOSS|boss_dead_kraken", "loss", 0.95),
                  fact(5, "ITEM_GAIN|Rope|x1", "item", 0.56),
                ],
              },
            ],
          }
        : { rows: [] };

    const facts = await store.memoryStore().criticalFacts("c1", 2);
    expect(facts.map((f) => f.text)).toEqual(["QUEST_COMPLETE|Bell", "IRREVERSIBLE_LOSS|boss_dead_kraken"]);
  });

  it("supersedes a condition fact with the newest one for the same key", async () => {
    const store = new PostgresCampaignStore("postgres://test");
    fake.respond = (sql) =>
      sql.includes("FOR UPDATE")
        ? { rows: [{ critical_facts: [fact(2, "CONDITION_STATE|poisoned|true", "condition", 0.9)] }] }
        : { rows: [] };

    await store.persistCriticalFacts("c1", [fact(6, "CONDITION_STATE|poisoned|false", "condition", 0.9)]);
    const update = latestPool().queries.find((q) => q.sql.includes("SET critical_facts"));
    const stored = JSON.parse(String(update?.params[1])) as CriticalFactRecord[];
    expect(stored.map((f) => f.text)).toEqual(["CONDITION_STATE|poisoned|false"]);
  });

  it("returns no retrieval results when the query embedder fails", async () => {
    const store = new PostgresCampaignStore("postgres://test");
    store.setQueryEmbedder(async () => {
      throw new Error("voyage 503");
    });
    await expect(store.memoryStore().searchTurns("c1", "lantern", 3)).resolves.toEqual([]);
    await expect(store.memoryStore().searchBible("w1", "lantern", 3)).resolves.toEqual([]);
  });

  it("counts only GM rows as world turns", async () => {
    const store = new PostgresCampaignStore("postgres://test");
    await store.getWorldAnalytics(["w1"]);
    const query = latestPool().queries.find((q) => q.sql.includes("AS total_turns"));
    expect(query?.sql).toMatch(/LEFT JOIN turns t ON t\.campaign_id = c\.campaign_id AND t\.role = 'gm'/);
  });
});
