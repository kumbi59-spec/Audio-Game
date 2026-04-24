import type { CampaignState, GameBible } from "@audio-rpg/shared";
import type { MemoryStore } from "@audio-rpg/gm-engine";
import type { Session } from "../gm/orchestrator.js";

export interface StoredWorld {
  worldId: string;
  kind: "official" | "uploaded" | "created";
  title: string;
  bible: GameBible;
  createdAt: number;
  warnings?: string[];
}

export interface StoredCampaignSummary {
  campaignId: string;
  worldId: string;
  title: string;
  sceneName: string;
  turnNumber: number;
  createdAt: number;
}

export interface StoredCampaign extends StoredCampaignSummary {
  state: CampaignState;
}

export interface PersistTurnArgs {
  campaignId: string;
  turnNumber: number;
  role: "gm" | "player";
  text: string;
}

/**
 * Single source of truth contract every storage backend implements.
 * In-memory for local dev and tests; Postgres when DATABASE_URL is set.
 * Memory/retrieval queries pile through a separate MemoryStore so the
 * vector search can be swapped without touching domain code.
 */
export interface CampaignStore {
  kind: "memory" | "postgres";

  saveWorld(args: {
    worldId: string;
    kind: StoredWorld["kind"];
    bible: GameBible;
    warnings?: string[];
  }): Promise<StoredWorld>;
  getWorld(worldId: string): Promise<StoredWorld | null>;
  listWorlds(): Promise<Pick<StoredWorld, "worldId" | "kind" | "title" | "createdAt">[]>;

  seedCampaign(args: {
    campaignId: string;
    worldId: string;
    title: string;
    bible: GameBible;
    state: CampaignState;
  }): Promise<void>;
  getCampaignSummary(campaignId: string): Promise<StoredCampaign | null>;
  listCampaigns(): Promise<StoredCampaignSummary[]>;
  loadSession(campaignId: string, authToken: string): Promise<Session>;

  persistTurn(args: PersistTurnArgs): Promise<void>;
  persistState(campaignId: string, state: CampaignState): Promise<void>;
  persistPresentedChoices(
    campaignId: string,
    choices: { id: string; label: string }[],
  ): Promise<void>;

  memoryStore(): MemoryStore;
}
