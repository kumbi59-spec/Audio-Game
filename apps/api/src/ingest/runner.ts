import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!config.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * The runModel callback shape the gm-engine ingest module expects.
 * Wired against Sonnet because the structuring task benefits from longer
 * reasoning, but small enough to fit a single message turn.
 */
export async function runIngestModel(args: {
  system: string;
  user: string;
}): Promise<string> {
  const result = await getClient().messages.create({
    model: config.CLAUDE_GM_MODEL,
    max_tokens: 4000,
    temperature: 0.2,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });
  return result.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
