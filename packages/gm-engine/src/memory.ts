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

export interface MemoryBudget {
  earlyGameMaxTurn: number;
  midGameMaxTurn: number;
  estimatedPromptTokens: number;
  maxPromptTokens: number;
  recentTurns: { early: number; mid: number; late: number };
  retrievedTurns: { early: number; mid: number; late: number };
  sceneSummaries: { early: number; mid: number; late: number };
  bibleHits: { early: number; mid: number; late: number };
  tokenThresholds: { warning: number; critical: number };
  reductionStep: number;
  minimums: { recentTurns: number; retrievedTurns: number; sceneSummaries: number; bibleHits: number };
}

export const DEFAULT_MEMORY_BUDGET: MemoryBudget = {
  earlyGameMaxTurn: 6,
  midGameMaxTurn: 20,
  estimatedPromptTokens: 0,
  maxPromptTokens: 8_000,
  recentTurns: { early: 4, mid: 6, late: 8 },
  retrievedTurns: { early: 2, mid: 4, late: 5 },
  sceneSummaries: { early: 1, mid: 2, late: 3 },
  bibleHits: { early: 7, mid: 5, late: 3 },
  tokenThresholds: { warning: 0.75, critical: 0.9 },
  reductionStep: 1,
  minimums: { recentTurns: 2, retrievedTurns: 1, sceneSummaries: 1, bibleHits: 1 },
};

/**
 * Compose the memory bundle we inject into each GM turn. Keeps the hot
 * context small enough to live alongside the cached Bible without
 * blowing the token budget.
 */
export async function buildMemoryBundle(
  store: MemoryStore,
  opts: { campaignId: string; worldId: string; query: string; turnCount?: number; budget?: MemoryBudget },
): Promise<MemoryBundle> {
  const budget = opts.budget ?? DEFAULT_MEMORY_BUDGET;
  const phase = getCampaignPhase(opts.turnCount ?? 0, budget);
  const sizes = applyTokenClamp(
    {
      recent: budget.recentTurns[phase],
      retrieved: budget.retrievedTurns[phase],
      scenes: budget.sceneSummaries[phase],
      bibleHits: budget.bibleHits[phase],
    },
    budget,
  );
  const [recent, scenes, retrieved, bibleHits] = await Promise.all([
    store.recentTurns(opts.campaignId, sizes.recent),
    store.sceneSummaries(opts.campaignId),
    store.searchTurns(opts.campaignId, opts.query, sizes.retrieved),
    store.searchBible(opts.worldId, opts.query, sizes.bibleHits),
  ]);
  return { recent, scenes: scenes.slice(-sizes.scenes), retrieved, bibleHits };
}

function getCampaignPhase(turnCount: number, budget: MemoryBudget): "early" | "mid" | "late" {
  if (turnCount <= budget.earlyGameMaxTurn) return "early";
  if (turnCount <= budget.midGameMaxTurn) return "mid";
  return "late";
}

function applyTokenClamp(
  sizes: { recent: number; retrieved: number; scenes: number; bibleHits: number },
  budget: MemoryBudget,
): { recent: number; retrieved: number; scenes: number; bibleHits: number } {
  const ratio = budget.maxPromptTokens > 0 ? budget.estimatedPromptTokens / budget.maxPromptTokens : 1;
  if (ratio < budget.tokenThresholds.warning) return sizes;

  const reductions = ratio >= budget.tokenThresholds.critical ? budget.reductionStep * 2 : budget.reductionStep;
  return {
    recent: Math.max(budget.minimums.recentTurns, sizes.recent - reductions),
    retrieved: Math.max(budget.minimums.retrievedTurns, sizes.retrieved - reductions),
    scenes: Math.max(budget.minimums.sceneSummaries, sizes.scenes - reductions),
    bibleHits: Math.max(budget.minimums.bibleHits, sizes.bibleHits - reductions),
  };
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
