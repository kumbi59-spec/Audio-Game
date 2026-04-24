import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  sunkenBellStartingState,
  type CampaignState,
  type GameBible,
} from "@audio-rpg/shared";
import {
  getCampaignSummary,
  getWorld,
  listCampaigns,
  seedCampaign,
} from "../state/store.js";
import { issueSessionToken } from "../state/tokens.js";

const CreateBody = z.object({
  worldId: z.string().min(1).default("sunken_bell"),
  characterName: z.string().min(1).max(60).default("Wren"),
});

/**
 * Phase 2 REST surface. A campaign is always anchored to a world (official
 * sample, uploaded bible, or wizard-created bible). The starting state is
 * derived from the world: official worlds have hand-authored seed states,
 * everything else gets a generic seed.
 */
export async function registerCampaignRoutes(app: FastifyInstance): Promise<void> {
  app.post("/campaigns", async (req, reply) => {
    const body = CreateBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    const world = getWorld(body.data.worldId);
    if (!world) {
      return reply
        .status(404)
        .send({ error: "world_not_found", worldId: body.data.worldId });
    }

    const campaignId = randomUUID();
    const state = startingStateForWorld(world.bible, body.data.worldId, body.data.characterName);
    seedCampaign({
      campaignId,
      worldId: world.worldId,
      title: world.bible.title,
      bible: world.bible,
      state,
    });

    return {
      campaignId,
      title: world.bible.title,
      worldId: world.worldId,
      authToken: issueSessionToken(campaignId),
      state,
    };
  });

  app.get("/campaigns", async () => listCampaigns());

  app.get<{ Params: { id: string } }>("/campaigns/:id", async (req, reply) => {
    const summary = getCampaignSummary(req.params.id);
    if (!summary) return reply.status(404).send({ error: "not_found" });
    return summary;
  });
}

function startingStateForWorld(
  bible: GameBible,
  worldId: string,
  characterName: string,
): CampaignState {
  if (worldId === "sunken_bell") return sunkenBellStartingState(characterName);
  // Generic starter: empty inventory + opening scene from the bible.
  return {
    scene: {
      name: "Opening",
      summary: bible.starting_scenario ?? bible.pitch ?? "",
    },
    turn_number: 0,
    character: {
      name: characterName,
      stats: {},
      background: {},
    },
    inventory: bible.character_creation.starting_items.map((name) => ({
      name,
      quantity: 1,
      tags: [],
    })),
    quests: [],
    relationships: [],
    codex: [],
    flags: {},
  };
}
