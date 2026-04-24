import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  SUNKEN_BELL_BIBLE,
  sunkenBellStartingState,
} from "@audio-rpg/shared";
import { getCampaignSummary, seedCampaign } from "../state/store.js";
import { issueSessionToken } from "../state/tokens.js";

const CreateBody = z.object({
  world: z.enum(["sunken_bell"]).default("sunken_bell"),
  characterName: z.string().min(1).max(60).default("Wren"),
});

/**
 * Phase 1 REST surface. Creates a seeded campaign and hands back a signed
 * session token that the mobile client presents when joining the
 * `/session` WebSocket. Kept tiny so Postgres can slot in behind the same
 * endpoints later.
 */
export async function registerCampaignRoutes(app: FastifyInstance): Promise<void> {
  app.post("/campaigns", async (req, reply) => {
    const body = CreateBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    const campaignId = randomUUID();
    const bible = SUNKEN_BELL_BIBLE;
    const state = sunkenBellStartingState(body.data.characterName);

    seedCampaign({
      campaignId,
      worldId: "sunken_bell",
      title: bible.title,
      bible,
      state,
    });

    return {
      campaignId,
      title: bible.title,
      worldId: "sunken_bell",
      authToken: issueSessionToken(campaignId),
      state,
    };
  });

  app.get<{ Params: { id: string } }>("/campaigns/:id", async (req, reply) => {
    const summary = getCampaignSummary(req.params.id);
    if (!summary) return reply.status(404).send({ error: "not_found" });
    return summary;
  });
}
