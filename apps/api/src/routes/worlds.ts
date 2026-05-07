import type { FastifyInstance } from "fastify";
import type { GameBible as GameBibleT } from "@audio-rpg/shared";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { GameBible } from "@audio-rpg/shared";
import { ingestBibleFromText } from "@audio-rpg/gm-engine";
import { getStore, getWorld, getWorldAnalytics, listWorlds, saveWorld } from "../state/store.js";
import { runIngestModel } from "../ingest/runner.js";
import { extractBibleText } from "../ingest/extract.js";
import { embedWorldBible } from "../embeddings/runner.js";
import { getServerEmbedder } from "../embeddings/voyage.js";
import { requireTier } from "../auth/entitlements.js";

const IMPORT_NOTES_PROMPT = `You are a game master assistant. Extract structured world-building information from the provided tabletop campaign session notes.

Return a JSON object with ONLY the fields you can confidently extract. Omit fields you cannot determine.

Fields (all optional):
- title: string — world or campaign name (2-5 words)
- pitch: string — one-sentence premise
- genre: string — genre label (e.g. "dark fantasy")
- setting: string — where and when (5-15 words)
- toneVoice: string — narrator tone in three words
- hardConstraint: string — one hard rule the GM must never break
- startingScenario: string — 1-2 sentence opening scene

Reply with ONLY valid JSON, no markdown fences.`;

const ImportNotesBody = z.object({
  notes: z.string().min(20).max(40_000),
});

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

  app.post("/worlds/import-notes", async (req, reply) => {
    const body = ImportNotesBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    try {
      const raw = await runIngestModel({
        system: IMPORT_NOTES_PROMPT,
        user: `--- SESSION NOTES ---\n${body.data.notes.slice(0, 12_000)}`,
      });
      let extracted: Record<string, string>;
      try {
        extracted = JSON.parse(raw.trim()) as Record<string, string>;
      } catch {
        return reply.status(502).send({ error: "AI returned non-JSON response" });
      }
      const allowed = new Set(["title", "pitch", "genre", "setting", "toneVoice", "hardConstraint", "startingScenario"]);
      const draft: Record<string, string> = {};
      for (const [k, v] of Object.entries(extracted)) {
        if (allowed.has(k) && typeof v === "string" && v.trim()) {
          draft[k] = v.trim().slice(0, 500);
        }
      }
      return reply.send({ draft });
    } catch (err) {
      app.log.error({ err }, "import-notes extraction failed");
      return reply.status(500).send({ error: "Extraction failed. Please try again." });
    }
  });

  app.get("/worlds", async () => listWorlds());

  app.get<{ Querystring: { ids?: string } }>("/worlds/analytics", async (req, reply) => {
    const raw = req.query.ids ?? "";
    const worldIds = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (worldIds.length === 0) {
      return reply.status(400).send({ error: "ids_required", message: "Provide ?ids=id1,id2" });
    }
    if (worldIds.length > 50) {
      return reply.status(400).send({ error: "too_many_ids", message: "Maximum 50 world IDs per request" });
    }
    return getWorldAnalytics(worldIds);
  });

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
