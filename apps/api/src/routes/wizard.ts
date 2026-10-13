import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { generateWizardSuggestions } from "../gm/claude.js";
import { requireTier } from "../auth/entitlements.js";

const SuggestBody = z.object({
  stepId: z.string(),
  draft: z.record(z.string(), z.string()).default({}),
});

export async function registerWizardRoutes(app: FastifyInstance): Promise<void> {
  // Matches the worldWizard entitlement, which storyteller includes.
  app.post("/wizard/suggest", { preHandler: requireTier("storyteller") }, async (req, reply) => {
    const body = SuggestBody.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.message });
    }

    try {
      const suggestions = await generateWizardSuggestions({
        stepId: body.data.stepId,
        draft: body.data.draft,
      });
      return reply.send({ suggestions });
    } catch (err) {
      app.log.warn({ err }, "wizard suggest failed");
      return reply.status(200).send({ suggestions: [] });
    }
  });
}
