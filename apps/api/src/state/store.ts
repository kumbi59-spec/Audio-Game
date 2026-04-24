import type { CampaignState, GameBible } from "@audio-rpg/shared";
import type { MemoryStore } from "@audio-rpg/gm-engine";
import type { Session } from "../gm/orchestrator.js";

/**
 * Persistence layer. The MVP ships against Postgres + pgvector; this file
 * provides the interface and an in-memory implementation that the API
 * starts with so local dev works before the database is wired up.
 *
 * Replace `inMemoryMemory` and `inMemoryPersistence` with real Postgres-
 * backed implementations in apps/api/src/state/postgres.ts when the DB
 * migration lands.
 */

const campaigns = new Map<string, { state: CampaignState; bible: GameBible; worldId: string }>();

export async function loadSession(
  campaignId: string,
  _authToken: string,
): Promise<Session> {
  const existing = campaigns.get(campaignId);
  if (!existing) {
    throw new Error(`Campaign ${campaignId} not found. Start one via POST /campaigns first.`);
  }
  return {
    campaignId,
    worldId: existing.worldId,
    bible: existing.bible,
    state: existing.state,
    lastPresentedChoices: [],
  };
}

export function seedCampaign(args: {
  campaignId: string;
  worldId: string;
  bible: GameBible;
  state: CampaignState;
}): void {
  campaigns.set(args.campaignId, {
    bible: args.bible,
    state: args.state,
    worldId: args.worldId,
  });
}

const memoryStore: MemoryStore = {
  async recentTurns() {
    return [];
  },
  async sceneSummaries() {
    return [];
  },
  async searchTurns() {
    return [];
  },
  async searchBible() {
    return [];
  },
};

export function getMemoryStore(): MemoryStore {
  return memoryStore;
}

export function getPersistence() {
  return {
    async persistTurn() {
      /* TODO: write to turns table in Postgres */
    },
    async persistState(campaignId: string, state: CampaignState) {
      const existing = campaigns.get(campaignId);
      if (existing) existing.state = state;
    },
  };
}
