import type { CampaignState, GameBible } from "@audio-rpg/shared";
import type { MemoryStore } from "@audio-rpg/gm-engine";
import type { Session } from "../gm/orchestrator.js";
import { MemoryCampaignStore } from "./memory.js";
import { PostgresCampaignStore } from "./postgres.js";
import type { CampaignStore } from "./types.js";
import { getServerEmbedder } from "../embeddings/voyage.js";

/**
 * Store dispatcher. When DATABASE_URL is set we use Postgres + pgvector;
 * otherwise we fall back to the in-memory store so local dev works
 * without any infrastructure. The rest of the API treats the returned
 * interface as a black box.
 */
let singleton: CampaignStore | null = null;

export function getStore(): CampaignStore {
  if (singleton) return singleton;
  const databaseUrl = process.env["DATABASE_URL"];
  if (databaseUrl) {
    const pg = new PostgresCampaignStore(databaseUrl);
    const { embedder, available } = getServerEmbedder();
    if (available) {
      pg.setQueryEmbedder(async (text) => {
        const [vec] = await embedder.embed([text]);
        return vec ?? null;
      });
      // Embed the bundled official world on the first tick so retrieval
      // works without a manual re-save. Fire-and-forget; any failure
      // just means searches over the sample world return empty.
      void pg.embedOfficialWorldIfMissing((texts) => embedder.embed(texts));
    }
    singleton = pg;
  } else {
    singleton = new MemoryCampaignStore();
  }
  return singleton;
}

export function __resetStoreForTests(): void {
  singleton = null;
}

/**
 * Cleanly release any pooled resources (e.g. Postgres connections). Used
 * by the integration test suite in afterAll so the process exits cleanly
 * in CI.
 */
export async function closeStore(): Promise<void> {
  if (!singleton) return;
  if (singleton instanceof PostgresCampaignStore) {
    await singleton.close();
  }
  singleton = null;
}

// ------------------------------------------------------------------
// Legacy thin wrappers. Existing routes call these instead of holding a
// direct store reference; they remain stable as we swap in Postgres.
// ------------------------------------------------------------------

export async function saveWorld(args: {
  worldId: string;
  kind: "official" | "uploaded" | "created";
  bible: GameBible;
  warnings?: string[];
}) {
  return getStore().saveWorld(args);
}

export async function getWorld(worldId: string) {
  return getStore().getWorld(worldId);
}

export async function listWorlds() {
  return getStore().listWorlds();
}

export async function seedCampaign(args: {
  campaignId: string;
  worldId: string;
  title: string;
  bible: GameBible;
  state: CampaignState;
}) {
  return getStore().seedCampaign(args);
}

export async function getCampaignSummary(campaignId: string) {
  return getStore().getCampaignSummary(campaignId);
}

export async function listCampaigns() {
  return getStore().listCampaigns();
}

export async function loadSession(
  campaignId: string,
  authToken: string,
): Promise<Session> {
  return getStore().loadSession(campaignId, authToken);
}

export function getMemoryStore(): MemoryStore {
  return getStore().memoryStore();
}

export function getPersistence() {
  const store = getStore();
  const { embedder, available } = getServerEmbedder();
  return {
    persistTurn: async (args: Parameters<CampaignStore["persistTurn"]>[0]) => {
      const { turnId } = await store.persistTurn(args);
      if (available && turnId) {
        // Fire-and-forget; do not delay the response.
        void (async () => {
          try {
            const { embedTurn } = await import("../embeddings/runner.js");
            await embedTurn({ store, embedder, turnId, text: args.text });
          } catch {
            /* already logged inside embedTurn */
          }
        })();
      }
    },
    persistState: (campaignId: string, state: CampaignState) =>
      store.persistState(campaignId, state),
    persistPresentedChoices: (
      campaignId: string,
      choices: { id: string; label: string }[],
    ) => store.persistPresentedChoices(campaignId, choices),
    persistSceneSummary: (
      campaignId: string,
      summary: { sceneNumber: number; summary: string; keyEvents: string[] },
    ) => store.persistSceneSummary(campaignId, summary),
  };
}
