import type { CampaignState, GameBible } from "@audio-rpg/shared";
import { SUNKEN_BELL_BIBLE } from "@audio-rpg/shared";
import type { MemoryStore } from "@audio-rpg/gm-engine";
import type { Session } from "../gm/orchestrator.js";
import { verifySessionToken } from "./tokens.js";
import type {
  CampaignStore,
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
      c.narrationLog.splice(0, c.narrationLog.length - 200);
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
      async searchTurns() {
        return [];
      },
      async searchBible() {
        return [];
      },
    };
  }
}
