import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { GameBible } from "@audio-rpg/shared";
import { ingestBibleFromText } from "@audio-rpg/gm-engine";
import { getWorld, listWorlds, saveWorld } from "../state/store.js";
import { runIngestModel } from "../ingest/runner.js";

const UploadBody = z.object({
  text: z.string().min(40).max(120_000),
  titleHint: z.string().max(120).optional(),
});

const CreateBody = z.object({
  bible: GameBible,
});

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
  app.post("/worlds/upload", async (req, reply) => {
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
      const stored = saveWorld({
        worldId,
        kind: "uploaded",
        bible: result.bible,
        warnings: result.warnings,
      });
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

  app.post("/worlds", async (req, reply) => {
    const body = CreateBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    const worldId = randomUUID();
    const stored = saveWorld({
      worldId,
      kind: "created",
      bible: body.data.bible,
    });
    return reply.status(201).send({
      worldId: stored.worldId,
      title: stored.title,
      bible: stored.bible,
    });
  });

  app.get("/worlds", async () => listWorlds());

  app.get<{ Params: { id: string } }>("/worlds/:id", async (req, reply) => {
    const w = getWorld(req.params.id);
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
