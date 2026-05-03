import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { issueTierToken } from "../auth/entitlements.js";
import type { UserTier } from "../auth/entitlements.js";
import { createEventEnvelope, type DomainEventBus } from "../events/domain-events.js";

const IssueBody = z.object({
  userId: z.string().min(1).default("dev-user"),
  tier: z.enum(["free", "storyteller", "creator", "enterprise"]).default("free"),
});

export async function registerAuthRoutes(
  app: FastifyInstance,
  domainEvents?: DomainEventBus,
): Promise<void> {
  if (config.NODE_ENV === "production") return;

  app.post("/auth/token", async (req, reply) => {
    const body = IssueBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }
    const tier = body.data.tier as UserTier;
    const token = issueTierToken(tier);
    if (domainEvents) {
      await domainEvents.publish(
        createEventEnvelope({
          eventType: "entitlement.changed",
          aggregateId: body.data.userId,
          version: 1,
          dedupeKey: `entitlement:${body.data.userId}:${tier}`,
          payload: { userId: body.data.userId, tier },
        }),
      );
    }
    return reply.send({ token, tier, expiresIn: "dev-token-never-expires" });
  });
}
