import type { GameBible } from "@audio-rpg/shared";

/**
 * Retrieval interface. The API implements this against pgvector + Redis.
 * Keeping it abstract lets the engine stay pure TS for testability.
 */
export interface MemoryStore {
  /** Last N turn records in chronological order (role = "gm" or "player"). */
  recentTurns(campaignId: string, n: number): Promise<MemoryTurn[]>;
  /** Rolling per-scene summaries (warm memory). */
  sceneSummaries(campaignId: string): Promise<SceneSummary[]>;
  /** Hybrid similarity + recency search over cold memory. */
  searchTurns(campaignId: string, query: string, k: number): Promise<MemoryTurn[]>;
  /** Retrieve the most relevant Game Bible chunks for a query. */
  searchBible(worldId: string, query: string, k: number): Promise<BibleChunk[]>;
}

export interface MemoryTurn {
  turnNumber: number;
  role: "gm" | "player";
  text: string;
}

export interface SceneSummary {
  sceneNumber: number;
  summary: string;
  keyEvents: string[];
}

export interface BibleChunk {
  categories: string[];
  text: string;
  score: number;
}

/**
 * Compose the memory bundle we inject into each GM turn. Keeps the hot
 * context small enough to live alongside the cached Bible without
 * blowing the token budget.
 */
export async function buildMemoryBundle(
  store: MemoryStore,
  opts: { campaignId: string; worldId: string; query: string },
): Promise<MemoryBundle> {
  const [recent, scenes, retrieved, bibleHits] = await Promise.all([
    store.recentTurns(opts.campaignId, 8),
    store.sceneSummaries(opts.campaignId),
    store.searchTurns(opts.campaignId, opts.query, 4),
    store.searchBible(opts.worldId, opts.query, 5),
  ]);
  return { recent, scenes, retrieved, bibleHits };
}

export interface MemoryBundle {
  recent: MemoryTurn[];
  scenes: SceneSummary[];
  retrieved: MemoryTurn[];
  bibleHits: BibleChunk[];
}

/** Truncate a bible down to a size safe to put in a cached system block. */
export function summarizeBibleForSystem(bible: GameBible): string {
  const lines: string[] = [];
  lines.push(`# World: ${bible.title}`);
  if (bible.pitch) lines.push(`Pitch: ${bible.pitch}`);
  if (bible.genre) lines.push(`Genre: ${bible.genre}`);
  if (bible.setting) lines.push(`Setting: ${bible.setting}`);
  lines.push(`Style: ${bible.style_mode}`);
  lines.push(`Content rating: ${bible.tone.content_rating}`);

  if (bible.tone.forbidden_topics.length) {
    lines.push(`Forbidden: ${bible.tone.forbidden_topics.join(", ")}`);
  }
  if (bible.rules.hard_constraints.length) {
    lines.push("Hard constraints:");
    for (const c of bible.rules.hard_constraints) lines.push(`  - ${c}`);
  }
  if (bible.rules.combat) lines.push(`Combat: ${bible.rules.combat}`);
  if (bible.rules.magic) lines.push(`Magic: ${bible.rules.magic}`);
  if (bible.rules.skill_checks) lines.push(`Checks: ${bible.rules.skill_checks}`);

  if (bible.entities.length) {
    lines.push("Key entities:");
    for (const e of bible.entities.slice(0, 40)) {
      lines.push(`  - [${e.kind}] ${e.name}: ${e.description}`);
    }
  }
  if (bible.starting_scenario) {
    lines.push(`Starting scenario: ${bible.starting_scenario}`);
  }
  return lines.join("\n");
}
