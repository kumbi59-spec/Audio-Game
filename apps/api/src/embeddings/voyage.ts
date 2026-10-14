import type { Embedder } from "@audio-rpg/gm-engine";

/**
 * Voyage AI embedder. `voyage-3` produces 1024-dim vectors that match the
 * pgvector column defined in state/schema.sql. We pick Voyage because it
 * is Anthropic's recommended embedding partner and the native dimension
 * matches our schema without projection.
 *
 * If VOYAGE_API_KEY is unset we expose a no-op embedder. That keeps the
 * write path flowing (no chunks are written, no pgvector rows are
 * inserted) without special-casing at the call site — searchTurns /
 * searchBible simply return empty results.
 */

const MODEL = "voyage-3";
const DIMS = 1024;
const BATCH = 32;

/** Voyage tunes vectors for what they're used for: stored text or a search query. */
export type VoyageInputType = "document" | "query";

/** Per-request timeout and attempt count, so a hung Voyage call can't stall a turn. */
const REQUEST_POLICY: Record<VoyageInputType, { timeoutMs: number; attempts: number }> = {
  // Document embeds run in the background and can wait out a blip.
  document: { timeoutMs: 10_000, attempts: 3 },
  // A query embed runs inside the turn deadline, so it gets one short try.
  query: { timeoutMs: 2_500, attempts: 1 },
};

/** A response Voyage will reject again on retry (bad key, bad input). */
class VoyageClientError extends Error {}

export function createVoyageEmbedder(
  apiKey: string,
  inputType: VoyageInputType = "document",
): Embedder {
  return {
    dimensions: DIMS,
    async embed(texts) {
      if (texts.length === 0) return [];
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH) {
        const batch = texts.slice(i, i + BATCH);
        const batchVectors = await embedBatch(apiKey, batch, inputType);
        vectors.push(...batchVectors);
      }
      return vectors;
    },
  };
}

export function createNoopEmbedder(): Embedder {
  return {
    dimensions: DIMS,
    async embed() {
      return [];
    },
  };
}

export function getServerEmbedder(
  inputType: VoyageInputType = "document",
): { embedder: Embedder; available: boolean } {
  const key = process.env["VOYAGE_API_KEY"];
  if (!key) {
    return { embedder: createNoopEmbedder(), available: false };
  }
  return { embedder: createVoyageEmbedder(key, inputType), available: true };
}

async function embedBatch(
  apiKey: string,
  texts: readonly string[],
  inputType: VoyageInputType,
): Promise<number[][]> {
  const { timeoutMs, attempts } = REQUEST_POLICY[inputType];
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: MODEL,
          input_type: inputType,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        if (res.status >= 500 || res.status === 429) {
          lastErr = new Error(`voyage ${res.status}: ${await res.text().catch(() => "")}`);
          if (attempt < attempts - 1) await sleep(250 * Math.pow(2, attempt));
          continue;
        }
        throw new VoyageClientError(`voyage ${res.status}: ${await res.text().catch(() => "")}`);
      }
      const body = (await res.json()) as {
        data: { embedding: number[] }[];
      };
      return body.data.map((d) => d.embedding);
    } catch (err) {
      if (err instanceof VoyageClientError) throw err;
      lastErr = err;
      if (attempt === attempts - 1) break;
      await sleep(250 * Math.pow(2, attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("voyage request failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
