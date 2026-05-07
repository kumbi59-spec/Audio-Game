import type { CampaignState, GameBible } from "@audio-rpg/shared";
import { SUNKEN_BELL_BIBLE } from "@audio-rpg/shared";
import type { MemoryStore } from "@audio-rpg/gm-engine";
import type { Session } from "../gm/orchestrator.js";
import { verifySessionToken } from "./tokens.js";
import type {
  CampaignStore,
  CriticalFactRecord,
  PersistTurnArgs,
  StoredCampaign,
  StoredCampaignSummary,
  StoredWorld,
} from "./types.js";

interface MemCampaign extends StoredCampaign {
  bible: GameBible;
  lastPresentedChoices: { id: string; label: string }[];
  narrationLog: { turnNumber: number; role: "gm" | "player"; text: string }[];
  sceneSummaries: { sceneNumber: number; summary: string; keyEvents: string[] }[];
  criticalFacts: CriticalFactRecord[];
}

/**
 * In-memory implementation used in local dev and unit tests. Matches the
 * CampaignStore interface exactly so the Postgres implementation can be a
 * drop-in replacement gated on DATABASE_URL.
 */
export class MemoryCampaignStore implements CampaignStore {
  readonly kind = "memory";
  private worlds = new Map<string, StoredWorld>();
  private campaigns = new Map<string, MemCampaign>();

  constructor() {
    this.worlds.set("sunken_bell", {
      worldId: "sunken_bell",
      kind: "official",
      title: SUNKEN_BELL_BIBLE.title,
      bible: SUNKEN_BELL_BIBLE,
      createdAt: 0,
    });
  }

  async saveWorld(args: {
    worldId: string;
    kind: StoredWorld["kind"];
    bible: GameBible;
    warnings?: string[];
  }): Promise<StoredWorld> {
    const stored: StoredWorld = {
      worldId: args.worldId,
      kind: args.kind,
      title: args.bible.title,
      bible: args.bible,
      createdAt: Date.now(),
      ...(args.warnings && args.warnings.length ? { warnings: args.warnings } : {}),
    };
    this.worlds.set(args.worldId, stored);
    return stored;
  }

  async getWorld(worldId: string): Promise<StoredWorld | null> {
    return this.worlds.get(worldId) ?? null;
  }

  async listWorlds(): Promise<
    Pick<StoredWorld, "worldId" | "kind" | "title" | "createdAt">[]
  > {
    return Array.from(this.worlds.values())
      .map(({ worldId, kind, title, createdAt }) => ({ worldId, kind, title, createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async seedCampaign(args: {
    campaignId: string;
    worldId: string;
    title: string;
    bible: GameBible;
    state: CampaignState;
  }): Promise<void> {
    this.campaigns.set(args.campaignId, {
      campaignId: args.campaignId,
      worldId: args.worldId,
      title: args.title,
      sceneName: args.state.scene.name,
      turnNumber: args.state.turn_number,
      state: args.state,
      bible: args.bible,
      createdAt: Date.now(),
      lastPresentedChoices: [],
      narrationLog: [],
      sceneSummaries: [],
      criticalFacts: [],
    });
  }

  async getCampaignSummary(campaignId: string): Promise<StoredCampaign | null> {
    const c = this.campaigns.get(campaignId);
    if (!c) return null;
    const { bible: _bible, lastPresentedChoices: _lpc, narrationLog: _log, ...rest } = c;
    return { ...rest, sceneName: c.state.scene.name, turnNumber: c.state.turn_number };
  }

  async listCampaigns(): Promise<StoredCampaignSummary[]> {
    return Array.from(this.campaigns.values())
      .map((c) => ({
        campaignId: c.campaignId,
        worldId: c.worldId,
        title: c.title,
        sceneName: c.state.scene.name,
        turnNumber: c.state.turn_number,
        createdAt: c.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async loadSession(campaignId: string, authToken: string): Promise<Session> {
    if (!verifySessionToken(authToken, campaignId)) {
      throw new Error("Invalid or expired session token.");
    }
    const existing = this.campaigns.get(campaignId);
    if (!existing) {
      throw new Error(`Campaign ${campaignId} not found.`);
    }
    return {
      campaignId,
      worldId: existing.worldId,
      bible: existing.bible,
      state: existing.state,
      lastPresentedChoices: existing.lastPresentedChoices,
    };
  }

  async persistTurn(args: PersistTurnArgs): Promise<{ turnId: string | null }> {
    const c = this.campaigns.get(args.campaignId);
    if (!c) return { turnId: null };
    c.narrationLog.push({
      turnNumber: args.turnNumber,
      role: args.role,
      text: args.text,
    });
    if (c.narrationLog.length > 200) {
      const discardCount = c.narrationLog.length - 200;
      c.narrationLog.splice(0, discardCount);
      console.debug(JSON.stringify({
        event: "narration_log_trimmed",
        campaignId: args.campaignId,
        discardCount,
      }));
    }
    return { turnId: null };
  }

  async storeWorldChunks(): Promise<void> {
    /* no-op in the in-memory store; pgvector writes only make sense in
       the Postgres implementation. */
  }

  async storeTurnEmbedding(): Promise<void> {
    /* no-op */
  }

  async persistState(campaignId: string, state: CampaignState): Promise<void> {
    const existing = this.campaigns.get(campaignId);
    if (existing) existing.state = state;
  }

  async persistPresentedChoices(
    campaignId: string,
    choices: { id: string; label: string }[],
  ): Promise<void> {
    const existing = this.campaigns.get(campaignId);
    if (existing) existing.lastPresentedChoices = choices;
  }

  async persistSceneSummary(
    campaignId: string,
    summary: { sceneNumber: number; summary: string; keyEvents: string[] },
  ): Promise<void> {
    const existing = this.campaigns.get(campaignId);
    if (!existing) return;
    const idx = existing.sceneSummaries.findIndex(
      (s) => s.sceneNumber === summary.sceneNumber,
    );
    if (idx >= 0) {
      existing.sceneSummaries[idx] = summary;
    } else {
      existing.sceneSummaries.push(summary);
    }
  }

  async persistCriticalFacts(campaignId: string, facts: CriticalFactRecord[]): Promise<void> {
    const existing = this.campaigns.get(campaignId);
    if (!existing || facts.length === 0) return;
    existing.criticalFacts = normalizeAndTrimCriticalFacts([...existing.criticalFacts, ...facts], 200);
  }

  memoryStore(): MemoryStore {
    const self = this;
    return {
      async recentTurns(campaignId: string, n: number) {
        const c = self.campaigns.get(campaignId);
        if (!c) return [];
        return c.narrationLog.slice(-n).map((t) => ({
          turnNumber: t.turnNumber,
          role: t.role,
          text: t.text,
        }));
      },
      async sceneSummaries(campaignId: string) {
        const c = self.campaigns.get(campaignId);
        if (!c) return [];
        return c.sceneSummaries.map((s) => ({
          sceneNumber: s.sceneNumber,
          summary: s.summary,
          keyEvents: s.keyEvents,
        }));
      },
      /**
       * Local/dev fallback retrieval for parity with Postgres vector memory.
       * This is intentionally lightweight and deterministic (not embedding-grade):
       * lexical overlap + a recency blend over the in-memory narration log.
       */
      async searchTurns(campaignId: string, query: string, k: number) {
        const c = self.campaigns.get(campaignId);
        if (!c || k <= 0) return [];
        const scored = scoreNarrationTurns(c.narrationLog, query).slice(0, k);
        return scored.map(({ turnNumber, role, text }) => ({ turnNumber, role, text }));
      },
      async searchBible() {
        return [];
      },
      async criticalFacts(campaignId: string, n: number) {
        const c = self.campaigns.get(campaignId);
        if (!c) return [];
        return c.criticalFacts.slice(-n).map(({ turnNumber, text, importance }) => ({ turnNumber, text, importance }));
      },
    };
  }
}

function semanticKey(fact: CriticalFactRecord): string {
  const normalizedText = fact.text.trim().toLowerCase().replace(/\s+/g, " ");
  const refs = Array.from(new Set(fact.entityRefs.map((ref) => ref.trim().toLowerCase()).filter(Boolean))).sort();
  return `${fact.kind}|${normalizedText}|${refs.join(",")}`;
}

function normalizeAndTrimCriticalFacts(facts: CriticalFactRecord[], maxFacts: number): CriticalFactRecord[] {
  const deduped = new Map<string, CriticalFactRecord>();
  for (const fact of facts) {
    if (!fact.text?.trim()) continue;
    const normalized: CriticalFactRecord = {
      turnNumber: Math.max(0, Number.isFinite(fact.turnNumber) ? fact.turnNumber : 0),
      text: fact.text.trim(),
      kind: fact.kind,
      importance: Number.isFinite(fact.importance) ? fact.importance : 0,
      entityRefs: Array.from(new Set((fact.entityRefs ?? []).map((r) => r.trim()).filter(Boolean))),
      sourceMutation: typeof fact.sourceMutation === "string" && fact.sourceMutation.trim() ? fact.sourceMutation : "unknown",
    };
    const key = semanticKey(normalized);
    const existing = deduped.get(key);
    if (!existing || normalized.importance > existing.importance || (normalized.importance === existing.importance && normalized.turnNumber >= existing.turnNumber)) {
      deduped.set(key, normalized);
    }
  }
  return Array.from(deduped.values())
    .sort((a, b) => (a.importance === b.importance ? b.turnNumber - a.turnNumber : b.importance - a.importance))
    .slice(0, maxFacts)
    .sort((a, b) => a.turnNumber - b.turnNumber);
}

function scoreNarrationTurns(
  turns: { turnNumber: number; role: "gm" | "player"; text: string }[],
  query: string,
): { turnNumber: number; role: "gm" | "player"; text: string }[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0 || turns.length === 0) return [];
  const qUnique = new Set(qTokens);
  const latestTurn = Math.max(...turns.map((t) => t.turnNumber));
  const lexWeight = 0.75;
  const recencyWeight = 0.25;
  const byScore = turns
    .map((turn) => {
      const tTokens = tokenize(turn.text);
      const tUnique = new Set(tTokens);
      const overlap = Array.from(qUnique).filter((token) => tUnique.has(token)).length;
      const lexicalScore = overlap / Math.max(qUnique.size, 1);
      const recencyScore = Math.max(0, 1 - (latestTurn - turn.turnNumber) / 200);
      return {
        ...turn,
        score: lexWeight * lexicalScore + recencyWeight * recencyScore,
      };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.turnNumber !== a.turnNumber) return b.turnNumber - a.turnNumber;
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return a.text.localeCompare(b.text);
    });
  return byScore.map(({ turnNumber, role, text }) => ({ turnNumber, role, text }));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}
