import type { CampaignState, GameBible } from "@audio-rpg/shared";
import type { MemoryStore } from "@audio-rpg/gm-engine";
import type { Session } from "../gm/orchestrator.js";
import { verifySessionToken } from "./tokens.js";

/**
 * Persistence layer. The MVP ships against Postgres + pgvector; this file
 * provides the interface and an in-memory implementation that the API
 * starts with so local dev works before the database is wired up.
 *
 * Replace `inMemoryMemory` and `inMemoryPersistence` with real Postgres-
 * backed implementations in apps/api/src/state/postgres.ts when the DB
 * migration lands.
 */

interface StoredCampaign {
  state: CampaignState;
  bible: GameBible;
  worldId: string;
  title: string;
  lastPresentedChoices: { id: string; label: string }[];
  narrationLog: { turnNumber: number; role: "gm" | "player"; text: string }[];
}

const campaigns = new Map<string, StoredCampaign>();

export async function loadSession(
  campaignId: string,
  authToken: string,
): Promise<Session> {
  if (!verifySessionToken(authToken, campaignId)) {
    throw new Error("Invalid or expired session token.");
  }
  const existing = campaigns.get(campaignId);
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

export function seedCampaign(args: {
  campaignId: string;
  worldId: string;
  title: string;
  bible: GameBible;
  state: CampaignState;
}): void {
  campaigns.set(args.campaignId, {
    bible: args.bible,
    state: args.state,
    worldId: args.worldId,
    title: args.title,
    lastPresentedChoices: [],
    narrationLog: [],
  });
}

export function getCampaignSummary(campaignId: string) {
  const c = campaigns.get(campaignId);
  if (!c) return null;
  return {
    campaignId,
    worldId: c.worldId,
    title: c.title,
    state: c.state,
  };
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
    async persistTurn(args: {
      campaignId: string;
      turnNumber: number;
      role: "gm" | "player";
      text: string;
    }) {
      const c = campaigns.get(args.campaignId);
      if (!c) return;
      c.narrationLog.push({
        turnNumber: args.turnNumber,
        role: args.role,
        text: args.text,
      });
      if (c.narrationLog.length > 200) {
        c.narrationLog.splice(0, c.narrationLog.length - 200);
      }
    },
    async persistState(campaignId: string, state: CampaignState) {
      const existing = campaigns.get(campaignId);
      if (existing) existing.state = state;
    },
    async persistPresentedChoices(
      campaignId: string,
      choices: { id: string; label: string }[],
    ) {
      setLastPresentedChoices(campaignId, choices);
    },
  };
}

export function setLastPresentedChoices(
  campaignId: string,
  choices: { id: string; label: string }[],
): void {
  const c = campaigns.get(campaignId);
  if (c) c.lastPresentedChoices = choices;
}
