import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool, type PoolClient } from "pg";
import type { CampaignState, GameBible } from "@audio-rpg/shared";
import type {
  BibleChunk,
  MemoryStore,
  MemoryTurn,
  SceneSummary,
} from "@audio-rpg/gm-engine";
import type { Session } from "../gm/orchestrator.js";
import { verifySessionToken } from "./tokens.js";
import type {
  CampaignStore,
  PersistTurnArgs,
  StoredCampaign,
  StoredCampaignSummary,
  StoredWorld,
} from "./types.js";

/**
 * Postgres-backed CampaignStore. Every world, campaign, turn, and scene
 * summary lives in Postgres; semantic retrieval uses pgvector via the
 * embeddings written by the ingest + turn pipelines (embeddings wiring
 * lands in Phase 4 — the columns are already defined so that work is
 * additive, not migratory).
 */
export class PostgresCampaignStore implements CampaignStore {
  readonly kind = "postgres";
  private pool: Pool;
  private ready: Promise<void>;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
    this.ready = this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    const here = dirname(fileURLToPath(import.meta.url));
    const schemaPath = join(here, "schema.sql");
    const sql = await readFile(schemaPath, "utf8");
    const client = await this.pool.connect();
    try {
      await client.query(sql);
      await this.seedOfficial(client);
    } finally {
      client.release();
    }
  }

  private async seedOfficial(client: PoolClient): Promise<void> {
    // The Sunken Bible is the only out-of-the-box world; seed idempotently.
    const { SUNKEN_BELL_BIBLE } = await import("@audio-rpg/shared");
    await client.query(
      `INSERT INTO worlds (world_id, kind, title, bible)
       VALUES ($1, 'official', $2, $3::jsonb)
       ON CONFLICT (world_id) DO NOTHING`,
      ["sunken_bell", SUNKEN_BELL_BIBLE.title, JSON.stringify(SUNKEN_BELL_BIBLE)],
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async saveWorld(args: {
    worldId: string;
    kind: StoredWorld["kind"];
    bible: GameBible;
    warnings?: string[];
  }): Promise<StoredWorld> {
    await this.ready;
    const warnings = args.warnings ?? [];
    const { rows } = await this.pool.query<{
      world_id: string;
      kind: StoredWorld["kind"];
      title: string;
      bible: GameBible;
      warnings: string[];
      created_at: Date;
    }>(
      `INSERT INTO worlds (world_id, kind, title, bible, warnings)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
       RETURNING world_id, kind, title, bible, warnings, created_at`,
      [
        args.worldId,
        args.kind,
        args.bible.title,
        JSON.stringify(args.bible),
        JSON.stringify(warnings),
      ],
    );
    const row = rows[0];
    if (!row) throw new Error("Failed to insert world.");
    return {
      worldId: row.world_id,
      kind: row.kind,
      title: row.title,
      bible: row.bible,
      createdAt: row.created_at.getTime(),
      ...(warnings.length ? { warnings } : {}),
    };
  }

  async getWorld(worldId: string): Promise<StoredWorld | null> {
    await this.ready;
    const { rows } = await this.pool.query<{
      world_id: string;
      kind: StoredWorld["kind"];
      title: string;
      bible: GameBible;
      warnings: string[];
      created_at: Date;
    }>(`SELECT world_id, kind, title, bible, warnings, created_at FROM worlds WHERE world_id = $1`, [worldId]);
    const row = rows[0];
    if (!row) return null;
    return {
      worldId: row.world_id,
      kind: row.kind,
      title: row.title,
      bible: row.bible,
      createdAt: row.created_at.getTime(),
      ...(row.warnings?.length ? { warnings: row.warnings } : {}),
    };
  }

  async listWorlds(): Promise<
    Pick<StoredWorld, "worldId" | "kind" | "title" | "createdAt">[]
  > {
    await this.ready;
    const { rows } = await this.pool.query<{
      world_id: string;
      kind: StoredWorld["kind"];
      title: string;
      created_at: Date;
    }>(`SELECT world_id, kind, title, created_at FROM worlds ORDER BY created_at DESC`);
    return rows.map((r) => ({
      worldId: r.world_id,
      kind: r.kind,
      title: r.title,
      createdAt: r.created_at.getTime(),
    }));
  }

  async seedCampaign(args: {
    campaignId: string;
    worldId: string;
    title: string;
    bible: GameBible;
    state: CampaignState;
  }): Promise<void> {
    await this.ready;
    await this.pool.query(
      `INSERT INTO campaigns (campaign_id, world_id, title, state)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [args.campaignId, args.worldId, args.title, JSON.stringify(args.state)],
    );
  }

  async getCampaignSummary(campaignId: string): Promise<StoredCampaign | null> {
    await this.ready;
    const { rows } = await this.pool.query<{
      campaign_id: string;
      world_id: string;
      title: string;
      state: CampaignState;
      created_at: Date;
    }>(
      `SELECT campaign_id, world_id, title, state, created_at FROM campaigns WHERE campaign_id = $1`,
      [campaignId],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      campaignId: row.campaign_id,
      worldId: row.world_id,
      title: row.title,
      state: row.state,
      sceneName: row.state.scene.name,
      turnNumber: row.state.turn_number,
      createdAt: row.created_at.getTime(),
    };
  }

  async listCampaigns(): Promise<StoredCampaignSummary[]> {
    await this.ready;
    const { rows } = await this.pool.query<{
      campaign_id: string;
      world_id: string;
      title: string;
      state: CampaignState;
      created_at: Date;
    }>(
      `SELECT campaign_id, world_id, title, state, created_at FROM campaigns ORDER BY last_played_at DESC`,
    );
    return rows.map((r) => ({
      campaignId: r.campaign_id,
      worldId: r.world_id,
      title: r.title,
      sceneName: r.state.scene.name,
      turnNumber: r.state.turn_number,
      createdAt: r.created_at.getTime(),
    }));
  }

  async loadSession(campaignId: string, authToken: string): Promise<Session> {
    await this.ready;
    if (!verifySessionToken(authToken, campaignId)) {
      throw new Error("Invalid or expired session token.");
    }
    const { rows } = await this.pool.query<{
      world_id: string;
      state: CampaignState;
      presented_choices: { id: string; label: string }[];
      bible: GameBible;
    }>(
      `SELECT c.world_id, c.state, c.presented_choices, w.bible
         FROM campaigns c JOIN worlds w ON w.world_id = c.world_id
        WHERE c.campaign_id = $1`,
      [campaignId],
    );
    const row = rows[0];
    if (!row) throw new Error(`Campaign ${campaignId} not found.`);
    return {
      campaignId,
      worldId: row.world_id,
      bible: row.bible,
      state: row.state,
      lastPresentedChoices: row.presented_choices ?? [],
    };
  }

  async persistTurn(args: PersistTurnArgs): Promise<void> {
    await this.ready;
    await this.pool.query(
      `INSERT INTO turns (campaign_id, turn_number, role, text) VALUES ($1, $2, $3, $4)`,
      [args.campaignId, args.turnNumber, args.role, args.text],
    );
  }

  async persistState(campaignId: string, state: CampaignState): Promise<void> {
    await this.ready;
    await this.pool.query(
      `UPDATE campaigns
          SET state = $2::jsonb,
              last_played_at = now()
        WHERE campaign_id = $1`,
      [campaignId, JSON.stringify(state)],
    );
  }

  async persistPresentedChoices(
    campaignId: string,
    choices: { id: string; label: string }[],
  ): Promise<void> {
    await this.ready;
    await this.pool.query(
      `UPDATE campaigns SET presented_choices = $2::jsonb WHERE campaign_id = $1`,
      [campaignId, JSON.stringify(choices)],
    );
  }

  memoryStore(): MemoryStore {
    return {
      recentTurns: (campaignId, n) => this.recentTurns(campaignId, n),
      sceneSummaries: (campaignId) => this.sceneSummaries(campaignId),
      searchTurns: async () => [],
      searchBible: async () => [],
    };
  }

  private async recentTurns(campaignId: string, n: number): Promise<MemoryTurn[]> {
    await this.ready;
    const { rows } = await this.pool.query<{
      turn_number: number;
      role: "gm" | "player";
      text: string;
    }>(
      `SELECT turn_number, role, text FROM turns
        WHERE campaign_id = $1
     ORDER BY turn_number DESC, id DESC
        LIMIT $2`,
      [campaignId, n],
    );
    return rows
      .map((r) => ({ turnNumber: r.turn_number, role: r.role, text: r.text }))
      .reverse();
  }

  private async sceneSummaries(campaignId: string): Promise<SceneSummary[]> {
    await this.ready;
    const { rows } = await this.pool.query<{
      scene_number: number;
      summary: string;
      key_events: string[];
    }>(
      `SELECT scene_number, summary, key_events FROM scene_summaries
        WHERE campaign_id = $1
     ORDER BY scene_number ASC`,
      [campaignId],
    );
    return rows.map((r) => ({
      sceneNumber: r.scene_number,
      summary: r.summary,
      keyEvents: r.key_events ?? [],
    }));
  }
}

/**
 * Imported here only to satisfy tsc when the BibleChunk type is referenced
 * in the MemoryStore return shape without being used.
 */
export type _StrictUnused = BibleChunk;
