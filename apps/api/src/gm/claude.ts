import Anthropic from "@anthropic-ai/sdk";
import type { GameBible, GmTurn } from "@audio-rpg/shared";
import { GmTurn as GmTurnSchema } from "@audio-rpg/shared";
import { STYLE_PROFILES, buildSystemPrompt } from "@audio-rpg/gm-engine";
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

export interface GenerateTurnArgs {
  bible: GameBible;
  userPrompt: string;
  onText?: (chunk: string) => void;
}

/**
 * Calls Claude with the cacheable system prompt (bible + invariant rules)
 * and the dynamic user prompt (state + memory + player input).
 * Streams text chunks via onText so the client can start TTS early.
 * Parses and validates the final message into a GmTurn.
 */
export async function generateGmTurn(args: GenerateTurnArgs): Promise<GmTurn> {
  const system = buildSystemPrompt(args.bible);
  const temperature = STYLE_PROFILES[args.bible.style_mode].temperature;

  const stream = await getClient().messages.stream({
    model: config.CLAUDE_GM_MODEL,
    max_tokens: 1600,
    temperature,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: args.userPrompt }],
  });

  if (args.onText) {
    stream.on("text", args.onText);
  }

  const final = await stream.finalMessage();
  const text = final.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const json = extractJson(text);
  return GmTurnSchema.parse(json);
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fence?.[1]) return JSON.parse(fence[1]);
  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart >= 0 && braceEnd > braceStart) {
    return JSON.parse(trimmed.slice(braceStart, braceEnd + 1));
  }
  throw new Error("No JSON object found in model response");
}
