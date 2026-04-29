import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import type { PoolClient } from "pg";
const { Pool } = pg;
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
    // The Sunken Bell is the only out-of-the-box world; seed idempotently.
    const { SUNKEN_BELL_BIBLE } = await import("@audio-rpg/shared");
    await client.query(
      `INSERT INTO worlds (world_id, kind, title, bible)
       VALUES ($1, 'official', $2, $3::jsonb)
       ON CONFLICT (world_id) DO NOTHING`,
      ["sunken_bell", SUNKEN_BELL_BIBLE.title, JSON.stringify(SUNKEN_BELL_BIBLE)],
    );
    // Note: embedding the official world is handled on first server tick
    // via embedOfficialWorldIfMissing(), so bootstrap doesn't block on an
    // embedding provider call.
  }

  async embedOfficialWorldIfMissing(
    embed: (chunks: readonly string[]) => Promise<number[][]>,
  ): Promise<void> {
    await this.ready;
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT count(*) FROM world_chunks WHERE world_id = 'sunken_bell'`,
    );
    if (Number(rows[0]?.count ?? 0) > 0) return;
    const { SUNKEN_BELL_BIBLE, } = await import("@audio-rpg/shared");
    const { chunkBible } = await import("@audio-rpg/gm-engine");
    const drafts = chunkBible(SUNKEN_BELL_BIBLE);
    if (drafts.length === 0) return;
    const vectors = await embed(drafts.map((d) => d.text));
    if (vectors.length !== drafts.length) return;
    await this.storeWorldChunks(
      "sunken_bell",
      drafts.map((d, i) => ({
        text: d.text,
        categories: d.categories,
        metadata: d.metadata,
        embedding: vectors[i]!,
      })),
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

  async persistTurn(args: PersistTurnArgs): Promise<{ turnId: string | null }> {
    await this.ready;
    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO turns (campaign_id, turn_number, role, text)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [args.campaignId, args.turnNumber, args.role, args.text],
    );
    return { turnId: rows[0]?.id ?? null };
  }

  async storeWorldChunks(
    worldId: string,
    chunks: {
      text: string;
      categories: string[];
      metadata: Record<string, unknown>;
      embedding: number[];
    }[],
  ): Promise<void> {
    await this.ready;
    if (chunks.length === 0) return;
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // Replace any previous chunks for this world so re-embedding is
      // idempotent and never duplicates.
      await client.query(`DELETE FROM world_chunks WHERE world_id = $1`, [worldId]);
      for (const c of chunks) {
        await client.query(
          `INSERT INTO world_chunks (world_id, chunk_text, categories, embedding, metadata)
           VALUES ($1, $2, $3, $4::vector, $5::jsonb)`,
          [
            worldId,
            c.text,
            c.categories,
            toVectorLiteral(c.embedding),
            JSON.stringify(c.metadata),
          ],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async storeTurnEmbedding(turnId: string, embedding: number[]): Promise<void> {
    await this.ready;
    await this.pool.query(
      `UPDATE turns SET embedding = $2::vector WHERE id = $1`,
      [turnId, toVectorLiteral(embedding)],
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

  async persistSceneSummary(
    campaignId: string,
    summary: { sceneNumber: number; summary: string; keyEvents: string[] },
  ): Promise<void> {
    await this.ready;
    await this.pool.query(
      `INSERT INTO scene_summaries (campaign_id, scene_number, summary, key_events)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (campaign_id, scene_number)
       DO UPDATE SET summary = EXCLUDED.summary, key_events = EXCLUDED.key_events`,
      [campaignId, summary.sceneNumber, summary.summary, JSON.stringify(summary.keyEvents)],
    );
  }

  /**
   * Inject an embedder after construction. We can't take one in the ctor
   * because DATABASE_URL is known before credentials are resolved; any
   * queries that arrive before this is wired up return empty results.
   */
  setQueryEmbedder(embed: (text: string) => Promise<number[] | null>): void {
    this.embedQuery = embed;
  }

  private embedQuery: (text: string) => Promise<number[] | null> = async () => null;

  memoryStore(): MemoryStore {
    return {
      recentTurns: (campaignId, n) => this.recentTurns(campaignId, n),
      sceneSummaries: (campaignId) => this.sceneSummaries(campaignId),
      searchTurns: (campaignId, query, k) => this.searchTurns(campaignId, query, k),
      searchBible: (worldId, query, k) => this.searchBible(worldId, query, k),
    };
  }

  private async searchTurns(
    campaignId: string,
    query: string,
    k: number,
  ): Promise<MemoryTurn[]> {
    await this.ready;
    const vector = await this.embedQuery(query);
    if (!vector) return [];
    // Hybrid score: 0.7 cosine similarity + 0.3 recency (0..1 over the
    // last 200 turns). Cheap to compute in SQL and keeps older-but-
    // highly-relevant memories retrievable.
    const { rows } = await this.pool.query<{
      turn_number: number;
      role: "gm" | "player";
      text: string;
    }>(
      `WITH recent AS (
         SELECT MAX(turn_number) AS latest FROM turns WHERE campaign_id = $1
       )
       SELECT t.turn_number, t.role, t.text
         FROM turns t, recent r
        WHERE t.campaign_id = $1
          AND t.embedding IS NOT NULL
     ORDER BY (0.7 * (1 - (t.embedding <=> $2::vector)))
            + (0.3 * GREATEST(0, 1 - ((r.latest - t.turn_number) / 200.0))) DESC
        LIMIT $3`,
      [campaignId, toVectorLiteral(vector), k],
    );
    return rows.map((r) => ({
      turnNumber: r.turn_number,
      role: r.role,
      text: r.text,
    }));
  }

  private async searchBible(
    worldId: string,
    query: string,
    k: number,
  ): Promise<BibleChunk[]> {
    await this.ready;
    const vector = await this.embedQuery(query);
    if (!vector) return [];
    const { rows } = await this.pool.query<{
      categories: string[];
      chunk_text: string;
      similarity: number;
    }>(
      `SELECT categories, chunk_text,
              1 - (embedding <=> $2::vector) AS similarity
         FROM world_chunks
        WHERE world_id = $1
          AND embedding IS NOT NULL
     ORDER BY embedding <=> $2::vector
        LIMIT $3`,
      [worldId, toVectorLiteral(vector), k],
    );
    return rows.map((r) => ({
      categories: r.categories,
      text: r.chunk_text,
      score: r.similarity,
    }));
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

/** pgvector wants `[1,2,3]` text; node-postgres has no native adapter. */
function toVectorLiteral(v: readonly number[]): string {
  return `[${v.map((x) => (Number.isFinite(x) ? x.toString() : "0")).join(",")}]`;
}
