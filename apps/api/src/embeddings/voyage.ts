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
const MAX_RETRIES = 3;

export function createVoyageEmbedder(apiKey: string): Embedder {
  return {
    dimensions: DIMS,
    async embed(texts) {
      if (texts.length === 0) return [];
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH) {
        const batch = texts.slice(i, i + BATCH);
        const batchVectors = await embedBatch(apiKey, batch);
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

export function getServerEmbedder(): { embedder: Embedder; available: boolean } {
  const key = process.env["VOYAGE_API_KEY"];
  if (!key) {
    return { embedder: createNoopEmbedder(), available: false };
  }
  return { embedder: createVoyageEmbedder(key), available: true };
}

async function embedBatch(apiKey: string, texts: readonly string[]): Promise<number[][]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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
          input_type: "document",
        }),
      });
      if (!res.ok) {
        if (res.status >= 500 || res.status === 429) {
          lastErr = new Error(`voyage ${res.status}: ${await res.text().catch(() => "")}`);
          await sleep(250 * Math.pow(2, attempt));
          continue;
        }
        throw new Error(`voyage ${res.status}: ${await res.text().catch(() => "")}`);
      }
      const body = (await res.json()) as {
        data: { embedding: number[] }[];
      };
      return body.data.map((d) => d.embedding);
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_RETRIES - 1) break;
      await sleep(250 * Math.pow(2, attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("voyage request failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
