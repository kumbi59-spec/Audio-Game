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
  /** Deterministic high-priority continuity anchors. */
  criticalFacts(campaignId: string, n: number): Promise<CriticalFact[]>;
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

export interface CriticalFact {
  turnNumber: number;
  text: string;
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
  memoryScoring: {
    semanticWeight: number;
    importanceWeight: number;
    recencyWeight: number;
    noveltyPenaltyWeight: number;
    recencyHalfLifeTurns: number;
    sourceMinimums: { criticalFacts: number; sceneSummaries: number };
  };
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
  memoryScoring: {
    semanticWeight: 0.45,
    importanceWeight: 0.3,
    recencyWeight: 0.25,
    noveltyPenaltyWeight: 0.2,
    recencyHalfLifeTurns: 12,
    sourceMinimums: { criticalFacts: 2, sceneSummaries: 1 },
  },
};

type MemorySource = "recent" | "retrieved" | "scene" | "critical";

interface UnifiedMemoryCandidate {
  id: string;
  source: MemorySource;
  text: string;
  turnNumber: number;
  semanticRelevance: number;
  intrinsicImportance: number;
  recency: number;
  noveltyPenalty: number;
  repetitionPenalty: number;
  relevanceBoost: number;
  unresolvedBoost: number;
  fallbackOverride: boolean;
  blendedScore: number;
  payload: MemoryTurn | SceneSummary | CriticalFact;
}

export interface MemoryInjectionState {
  turnWindow: number;
  seenIds: string[];
}

export interface MemorySelectionOptions {
  injectedState?: MemoryInjectionState;
  criticalRepeatIds?: string[];
}

/**
 * Compose the memory bundle we inject into each GM turn. Keeps the hot
 * context small enough to live alongside the cached Bible without
 * blowing the token budget.
 */
export async function buildMemoryBundle(
  store: MemoryStore,
  opts: {
    campaignId: string;
    worldId: string;
    query: string;
    turnCount?: number;
    budget?: MemoryBudget;
    selection?: MemorySelectionOptions;
  },
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
  const memoryBudgetK = sizes.recent + sizes.retrieved + sizes.scenes;
  const [recent, scenes, retrieved, bibleHits, criticalFacts] = await Promise.all([
    store.recentTurns(opts.campaignId, Math.max(sizes.recent * 2, sizes.recent)),
    store.sceneSummaries(opts.campaignId),
    store.searchTurns(opts.campaignId, opts.query, Math.max(sizes.retrieved * 2, sizes.retrieved)),
    store.searchBible(opts.worldId, opts.query, sizes.bibleHits),
    store.criticalFacts(opts.campaignId, 10),
  ]);

  const selected = selectTopMemoryCandidates(
    { recent, scenes, retrieved, criticalFacts },
    opts.turnCount ?? 0,
    memoryBudgetK,
    budget,
    opts.selection,
  );

  return {
    recent: selected.recent,
    scenes: selected.scenes,
    retrieved: selected.retrieved,
    bibleHits,
    criticalFacts: selected.criticalFacts,
    injectionState: selected.injectionState,
  };
}

function selectTopMemoryCandidates(
  inputs: { recent: MemoryTurn[]; scenes: SceneSummary[]; retrieved: MemoryTurn[]; criticalFacts: CriticalFact[] },
  turnCount: number,
  totalK: number,
  budget: MemoryBudget,
  selection?: MemorySelectionOptions,
): Pick<MemoryBundle, "recent" | "retrieved" | "scenes" | "criticalFacts" | "injectionState"> {
  const candidates = buildCandidates(inputs, turnCount, budget, selection);
  const sorted = candidates.sort((a, b) => b.blendedScore - a.blendedScore);

  const selected: UnifiedMemoryCandidate[] = [];
  const minCritical = Math.min(budget.memoryScoring.sourceMinimums.criticalFacts, totalK);
  const minScenes = Math.min(budget.memoryScoring.sourceMinimums.sceneSummaries, Math.max(0, totalK - minCritical));

  pickSourceMinimum(sorted, selected, "critical", minCritical);
  pickSourceMinimum(sorted, selected, "scene", minScenes);

  for (const candidate of sorted) {
    if (selected.length >= totalK) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }

  return {
    recent: selected.filter((c): c is UnifiedMemoryCandidate & { payload: MemoryTurn } => c.source === "recent").map((c) => c.payload),
    retrieved: selected
      .filter((c): c is UnifiedMemoryCandidate & { payload: MemoryTurn } => c.source === "retrieved")
      .map((c) => c.payload),
    scenes: selected
      .filter((c): c is UnifiedMemoryCandidate & { payload: SceneSummary } => c.source === "scene")
      .map((c) => c.payload),
    criticalFacts: selected
      .filter((c): c is UnifiedMemoryCandidate & { payload: CriticalFact } => c.source === "critical")
      .map((c) => c.payload),
    injectionState: buildNextInjectionState(selected, selection?.injectedState),
  };
}

function pickSourceMinimum(
  sorted: UnifiedMemoryCandidate[],
  selected: UnifiedMemoryCandidate[],
  source: MemorySource,
  minimum: number,
): void {
  if (minimum <= 0) return;
  for (const candidate of sorted) {
    if (selected.length >= minimum && selected.filter((c) => c.source === source).length >= minimum) break;
    if (candidate.source !== source || selected.includes(candidate)) continue;
    selected.push(candidate);
  }
}

function buildCandidates(
  inputs: { recent: MemoryTurn[]; scenes: SceneSummary[]; retrieved: MemoryTurn[]; criticalFacts: CriticalFact[] },
  turnCount: number,
  budget: MemoryBudget,
  selection?: MemorySelectionOptions,
): UnifiedMemoryCandidate[] {
  const seen = new Set(selection?.injectedState?.seenIds ?? []);
  const forced = new Set(selection?.criticalRepeatIds ?? []);
  const recentCandidates = inputs.recent.map((turn) =>
    makeCandidate("recent", turn.text, turn.turnNumber, turn, 0.45, 0.4, turnCount, budget, seen, forced),
  );
  const retrievedCandidates = inputs.retrieved.map((turn, idx) =>
    makeCandidate(
      "retrieved",
      turn.text,
      turn.turnNumber,
      turn,
      Math.max(0.3, 1 - idx * 0.1),
      0.6,
      turnCount,
      budget,
      seen,
      forced,
    ),
  );
  const sceneCandidates = inputs.scenes.map((scene, idx) =>
    makeCandidate(
      "scene",
      `${scene.summary} ${scene.keyEvents.join(" ")}`,
      scene.sceneNumber,
      scene,
      Math.max(0.3, 0.8 - idx * 0.08),
      0.8,
      turnCount,
      budget,
      seen,
      forced,
    ),
  );
  const criticalCandidates = inputs.criticalFacts.map((fact, idx) =>
    makeCandidate(
      "critical",
      fact.text,
      fact.turnNumber,
      fact,
      Math.max(0.4, 0.9 - idx * 0.06),
      1,
      turnCount,
      budget,
      seen,
      forced,
    ),
  );

  return [...recentCandidates, ...retrievedCandidates, ...sceneCandidates, ...criticalCandidates];
}

function makeCandidate<T extends MemoryTurn | SceneSummary | CriticalFact>(
  source: MemorySource,
  text: string,
  turnNumber: number,
  payload: T,
  semanticRelevance: number,
  intrinsicImportance: number,
  currentTurn: number,
  budget: MemoryBudget,
  recentlyInjected: Set<string>,
  forceAllowRepeat: Set<string>,
): UnifiedMemoryCandidate {
  const id = `${source}:${turnNumber}:${hashText(text)}`;
  const recencyAge = Math.max(0, currentTurn - turnNumber);
  const recency = Math.exp((-Math.LN2 * recencyAge) / Math.max(1, budget.memoryScoring.recencyHalfLifeTurns));
  const noveltyPenalty = Math.min(0.8, Math.max(0, text.length > 140 ? 0 : 0.15));
  const repeated = recentlyInjected.has(id);
  const fallbackOverride = repeated && forceAllowRepeat.has(id);
  const repetitionPenalty = repeated && !fallbackOverride ? 0.35 : 0;
  const unresolvedBoost = source === "critical" ? 0.2 : 0;
  const relevanceBoost = repeated ? 0 : source === "retrieved" ? 0.12 : source === "scene" ? 0.08 : 0;
  const blendedScore =
    budget.memoryScoring.semanticWeight * semanticRelevance +
    budget.memoryScoring.importanceWeight * intrinsicImportance +
    budget.memoryScoring.recencyWeight * recency -
    budget.memoryScoring.noveltyPenaltyWeight * noveltyPenalty -
    repetitionPenalty +
    unresolvedBoost +
    relevanceBoost;

  return {
    id,
    source,
    text,
    turnNumber,
    semanticRelevance,
    intrinsicImportance,
    recency,
    noveltyPenalty,
    repetitionPenalty,
    relevanceBoost,
    unresolvedBoost,
    fallbackOverride,
    blendedScore,
    payload,
  };
}

function buildNextInjectionState(selected: UnifiedMemoryCandidate[], existing?: MemoryInjectionState): MemoryInjectionState {
  const turnWindow = Math.max(1, existing?.turnWindow ?? 2);
  const maxSize = turnWindow * Math.max(1, selected.length);
  const merged = [...(existing?.seenIds ?? []), ...selected.map((candidate) => candidate.id)];
  return { turnWindow, seenIds: merged.slice(-maxSize) };
}

function hashText(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
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
  criticalFacts: CriticalFact[];
  injectionState: MemoryInjectionState;
}

/** Truncate a bible down to a size safe to put in a cached system block. */
export function summarizeBibleForSystem(bible: GameBible): string { /* unchanged */
  const lines: string[] = [];
  lines.push(`# World: ${bible.title}`);
  if (bible.pitch) lines.push(`Pitch: ${bible.pitch}`);
  if (bible.genre) lines.push(`Genre: ${bible.genre}`);
  if (bible.setting) lines.push(`Setting: ${bible.setting}`);
  lines.push(`Style: ${bible.style_mode}`);
  lines.push(`Content rating: ${bible.tone.content_rating}`);
  if (bible.tone.forbidden_topics.length) lines.push(`Forbidden: ${bible.tone.forbidden_topics.join(", ")}`);
  if (bible.rules.hard_constraints.length) {
    lines.push("Hard constraints:");
    for (const c of bible.rules.hard_constraints) lines.push(`  - ${c}`);
  }
  if (bible.rules.combat) lines.push(`Combat: ${bible.rules.combat}`);
  if (bible.rules.magic) lines.push(`Magic: ${bible.rules.magic}`);
  if (bible.rules.skill_checks) lines.push(`Checks: ${bible.rules.skill_checks}`);
  if (bible.entities.length) {
    lines.push("Key entities:");
    for (const e of bible.entities.slice(0, 40)) lines.push(`  - [${e.kind}] ${e.name}: ${e.description}`);
  }
  if (bible.starting_scenario) lines.push(`Starting scenario: ${bible.starting_scenario}`);
  return lines.join("\n");
}
