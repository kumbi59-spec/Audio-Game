import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { issueTierToken } from "../auth/entitlements.js";
import type { UserTier } from "../auth/entitlements.js";

const IssueBody = z.object({
  tier: z.enum(["free", "storyteller", "creator", "enterprise"]).default("free"),
});

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  if (config.NODE_ENV === "production") return;

  app.post("/auth/token", async (req, reply) => {
    const body = IssueBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    const tier = body.data.tier as UserTier;
    const token = issueTierToken(tier);
    return reply.send({ token, tier, expiresIn: "dev-token-never-expires" });
  });
}
