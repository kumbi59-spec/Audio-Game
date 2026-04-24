import type { GameBible } from "@audio-rpg/shared";
import { chunkBible, type Embedder } from "@audio-rpg/gm-engine";
import type { CampaignStore } from "../state/types.js";

/**
 * Chunk a bible, embed the chunks, and write them into world_chunks.
 * Called inline after saveWorld so the initial upload is immediately
 * searchable. For very large bibles this is the only expensive step —
 * we run it fire-and-forget from the route handler so uploads remain
 * responsive.
 */
export async function embedWorldBible(args: {
  store: CampaignStore;
  embedder: Embedder;
  worldId: string;
  bible: GameBible;
  log?: (msg: string, meta?: Record<string, unknown>) => void;
}): Promise<{ chunksWritten: number }> {
  const { store, embedder, worldId, bible, log } = args;
  if (store.kind !== "postgres") return { chunksWritten: 0 };

  const drafts = chunkBible(bible);
  if (drafts.length === 0) return { chunksWritten: 0 };

  const vectors = await embedder.embed(drafts.map((d) => d.text));
  if (vectors.length !== drafts.length) {
    log?.("embed count mismatch", {
      expected: drafts.length,
      got: vectors.length,
      worldId,
    });
    return { chunksWritten: 0 };
  }

  const enriched = drafts.map((d, i) => ({
    text: d.text,
    categories: d.categories,
    metadata: d.metadata,
    embedding: vectors[i]!,
  }));
  await store.storeWorldChunks(worldId, enriched);
  log?.("embedded world bible", { worldId, chunks: enriched.length });
  return { chunksWritten: enriched.length };
}

/**
 * Embed a single turn (GM narration or player input) and attach it to
 * the `turns.embedding` column. Called after persistTurn resolves; if
 * it fails we swallow the error — the turn itself is already saved.
 */
export async function embedTurn(args: {
  store: CampaignStore;
  embedder: Embedder;
  turnId: string;
  text: string;
  log?: (msg: string, meta?: Record<string, unknown>) => void;
}): Promise<void> {
  const { store, embedder, turnId, text, log } = args;
  if (store.kind !== "postgres") return;
  if (!text.trim()) return;
  try {
    const [vector] = await embedder.embed([text]);
    if (!vector) return;
    await store.storeTurnEmbedding(turnId, vector);
  } catch (err) {
    log?.("turn embed failed", {
      turnId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
