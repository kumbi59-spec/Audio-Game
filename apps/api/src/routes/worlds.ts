import type { FastifyInstance } from "fastify";
import type { GameBible as GameBibleT } from "@audio-rpg/shared";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { GameBible } from "@audio-rpg/shared";
import { ingestBibleFromText } from "@audio-rpg/gm-engine";
import { getStore, getWorld, listWorlds, saveWorld } from "../state/store.js";
import { runIngestModel } from "../ingest/runner.js";
import { extractBibleText } from "../ingest/extract.js";
import { embedWorldBible } from "../embeddings/runner.js";
import { getServerEmbedder } from "../embeddings/voyage.js";
import { requireTier } from "../auth/entitlements.js";

/**
 * Kicks the embedding pipeline in the background. Never throws into the
 * route handler — upload responses stay fast, failures go to the logger.
 */
function scheduleBibleEmbedding(
  app: FastifyInstance,
  worldId: string,
  bible: GameBibleT,
): void {
  const { embedder, available } = getServerEmbedder();
  if (!available) return;
  void embedWorldBible({
    store: getStore(),
    embedder,
    worldId,
    bible,
    log: (msg, meta) => app.log.info({ worldId, ...meta }, msg),
  }).catch((err) => {
    app.log.error({ err, worldId }, "world embedding failed");
  });
}

const UploadBody = z.object({
  text: z.string().min(40).max(120_000),
  titleHint: z.string().max(120).optional(),
});

const CreateBody = z.object({
  bible: GameBible,
});

/** Minimal shape of a @fastify/multipart file handle we use here. */
interface FileMultipart {
  filename?: string;
  mimetype?: string;
  toBuffer(): Promise<Buffer>;
}

/**
 * Worlds REST. The ingest path runs the gm-engine ingestion pipeline
 * (currently single-pass Sonnet); the manual create path takes a bible
 * payload from the Create World wizard so it bypasses LLM cost.
 *
 * POST /worlds/upload   -> 202 { worldId, warnings, bible }
 * POST /worlds          -> 201 { worldId, bible }
 * GET  /worlds          -> [{ worldId, kind, title, createdAt }]
 * GET  /worlds/:id      -> { worldId, kind, title, bible, warnings? }
 */
export async function registerWorldRoutes(app: FastifyInstance): Promise<void> {
  app.post("/worlds/upload", { preHandler: requireTier("storyteller") }, async (req, reply) => {
    const body = UploadBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    try {
      const result = await ingestBibleFromText({
        rawText: body.data.text,
        ...(body.data.titleHint ? { titleHint: body.data.titleHint } : {}),
        runModel: runIngestModel,
      });
      const worldId = randomUUID();
      const stored = await saveWorld({
        worldId,
        kind: "uploaded",
        bible: result.bible,
        warnings: result.warnings,
      });
      scheduleBibleEmbedding(app, stored.worldId, stored.bible);
      return reply.status(202).send({
        worldId: stored.worldId,
        title: stored.title,
        bible: stored.bible,
        warnings: stored.warnings ?? [],
      });
    } catch (err) {
      app.log.error({ err }, "ingest failed");
      const message = err instanceof Error ? err.message : "Ingest failed.";
      return reply.status(422).send({ error: "ingest_failed", message });
    }
  });

  app.post("/worlds", { preHandler: requireTier("creator") }, async (req, reply) => {
    const body = CreateBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    const worldId = randomUUID();
    const stored = await saveWorld({
      worldId,
      kind: "created",
      bible: body.data.bible,
    });
    scheduleBibleEmbedding(app, stored.worldId, stored.bible);
    return reply.status(201).send({
      worldId: stored.worldId,
      title: stored.title,
      bible: stored.bible,
    });
  });

  app.post("/worlds/upload-file", { preHandler: requireTier("storyteller") }, async (req, reply) => {
    // Requires @fastify/multipart registered on the server instance.
    const file = await (req as unknown as { file: () => Promise<FileMultipart | undefined> }).file();
    if (!file) {
      return reply.status(400).send({ error: "no_file" });
    }
    try {
      const buffer = await file.toBuffer();
      const extracted = await extractBibleText({
        buffer,
        ...(file.mimetype ? { mimeType: file.mimetype } : {}),
        ...(file.filename ? { filename: file.filename } : {}),
      });
      const titleHint = file.filename?.replace(/\.(pdf|docx|md|txt|json)$/i, "").slice(0, 120);
      const result = await ingestBibleFromText({
        rawText: extracted.text,
        ...(titleHint ? { titleHint } : {}),
        runModel: runIngestModel,
      });
      const worldId = randomUUID();
      const stored = await saveWorld({
        worldId,
        kind: "uploaded",
        bible: result.bible,
        warnings: [
          `Extracted ${extracted.format.toUpperCase()} (${extracted.meta.bytesIn} bytes${extracted.meta.pages ? `, ${extracted.meta.pages} pages` : ""}).`,
          ...result.warnings,
        ],
      });
      scheduleBibleEmbedding(app, stored.worldId, stored.bible);
      return reply.status(202).send({
        worldId: stored.worldId,
        title: stored.title,
        bible: stored.bible,
        warnings: stored.warnings ?? [],
        extracted: { format: extracted.format, meta: extracted.meta },
      });
    } catch (err) {
      app.log.error({ err }, "file ingest failed");
      const message = err instanceof Error ? err.message : "File ingest failed.";
      return reply.status(422).send({ error: "ingest_failed", message });
    }
  });

  app.get("/worlds", async () => listWorlds());

  app.get<{ Params: { id: string } }>("/worlds/:id", async (req, reply) => {
    const w = await getWorld(req.params.id);
    if (!w) return reply.status(404).send({ error: "not_found" });
    return {
      worldId: w.worldId,
      kind: w.kind,
      title: w.title,
      bible: w.bible,
      warnings: w.warnings ?? [],
    };
  });
}
