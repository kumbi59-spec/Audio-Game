import Anthropic from "@anthropic-ai/sdk";
import type { CampaignState, GameBible, GmTurn } from "@audio-rpg/shared";
import { GmTurn as GmTurnSchema } from "@audio-rpg/shared";
import { STYLE_PROFILES, buildSystemPrompt } from "@audio-rpg/gm-engine";
import type { MemoryTurn } from "@audio-rpg/gm-engine";
import { config } from "../config.js";
import { resolveModelPolicy } from "./model-policy.js";

let client: Anthropic | null = null;
const modelPolicy = resolveModelPolicy();

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
    model: modelPolicy.gmTurnModel,
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

/**
 * Compresses a batch of turns into a scene summary. Called every N turns by
 * the orchestrator to keep the active context window small.
 */
export async function generateSceneSummary(args: {
  sceneName: string;
  sceneNumber: number;
  turns: MemoryTurn[];
}): Promise<{ summary: string; keyEvents: string[] }> {
  const lines = [
    `Scene: ${args.sceneName}`,
    `Turns to summarize:`,
    ...args.turns.map((t) => `[${t.role} t${t.turnNumber}] ${t.text}`),
    "",
    'Write a 2-3 sentence factual summary of what happened in this scene. Then list up to 5 key events as short bullet points. Respond as JSON: {"summary": "...", "keyEvents": ["...", ...]}',
  ];

  const response = await getClient().messages.create({
    model: modelPolicy.summaryModel,
    max_tokens: 300,
    messages: [{ role: "user", content: lines.join("\n") }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  try {
    const parsed = JSON.parse(text) as { summary: string; keyEvents: string[] };
    return {
      summary: parsed.summary ?? text,
      keyEvents: parsed.keyEvents ?? [],
    };
  } catch {
    return { summary: text.slice(0, 300), keyEvents: [] };
  }
}

/**
 * Generates a short spoken recap of the current campaign state. Uses a
 * lightweight prompt — no JSON schema, just 2-3 sentences of plain prose the
 * player can immediately hear via TTS.
 */
export async function generateRecap(args: {
  state: CampaignState;
  recentTurns: MemoryTurn[];
}): Promise<string> {
  const { state, recentTurns } = args;
  const lines: string[] = [
    `You are summarizing an audio RPG session for the player "${state.character.name}".`,
    `Current scene: ${state.scene.name}.`,
    state.scene.summary ? `Scene so far: ${state.scene.summary}` : "",
    state.inventory.length
      ? `Inventory: ${state.inventory.map((i) => `${i.name} x${i.quantity}`).join(", ")}.`
      : "",
    state.quests.filter((q) => q.status === "active").length
      ? `Active quests: ${state.quests
          .filter((q) => q.status === "active")
          .map((q) => q.name)
          .join(", ")}.`
      : "",
  ].filter(Boolean);

  if (recentTurns.length) {
    lines.push("Recent events:");
    for (const t of recentTurns.slice(-6)) {
      lines.push(`${t.role === "gm" ? "GM" : "Player"}: ${t.text}`);
    }
  }

  lines.push(
    "\nWrite a 2-3 sentence spoken recap for the player. Be concise and use past tense. Do not list choices. Speak directly to the player as 'you'.",
  );

  const response = await getClient().messages.create({
    model: modelPolicy.summaryModel,
    max_tokens: 200,
    messages: [{ role: "user", content: lines.join("\n") }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return text || `You are in ${state.scene.name}. Turn ${state.turn_number}.`;
}

/**
 * Generates 3 short, contextually-aware suggestions for the current wizard
 * step, based on what the user has already filled in. Called while the user
 * is typing so the chips are ready before they finish.
 */
export async function generateWizardSuggestions(args: {
  stepId: string;
  draft: Record<string, string>;
}): Promise<string[]> {
  const { stepId, draft } = args;
  const ctx: string[] = [];
  if (draft.title) ctx.push(`World title: "${draft.title}"`);
  if (draft.pitch) ctx.push(`Pitch: "${draft.pitch}"`);
  if (draft.genre) ctx.push(`Genre: "${draft.genre}"`);
  if (draft.setting) ctx.push(`Setting: "${draft.setting}"`);
  if (draft.toneVoice) ctx.push(`Narrator tone: "${draft.toneVoice}"`);

  const prompts: Record<string, string> = {
    title:
      "Suggest 3 short, evocative world names for an audio RPG. Each should be 2-4 words and feel like a place or an era. No explanation.",
    pitch: `${ctx.join(". ")}.\nSuggest 3 one-sentence pitches that describe this world's central conflict or atmosphere. Each should be under 20 words.`,
    genre: `${ctx.join(". ")}.\nSuggest 3 genre labels that fit this world. Examples: dark fantasy, cosmic horror, space opera, folk horror, heist noir. Short labels only.`,
    setting: `${ctx.join(". ")}.\nSuggest 3 interesting settings (place + era) for this world. Examples: "a rain-soaked 1920s port city", "a frozen steppe where gods still walk". Under 12 words each.`,
    toneVoice: `${ctx.join(". ")}.\nSuggest 3 narrator tone descriptions, each exactly 3 adjectives joined by "and". Examples: "hushed and watchful", "brash and witty and dry". Exactly 3 adjectives each.`,
    hardConstraint: `${ctx.join(". ")}.\nSuggest 3 hard world rules the game master must always respect. Examples: "no firearms exist", "magic always costs blood", "the dead never stay dead". Under 10 words each.`,
    startingScenario: `${ctx.join(". ")}.\nSuggest 3 opening scenarios that drop the player immediately into action or intrigue. 1-2 sentences each, under 30 words.`,
    characterName: `${ctx.join(". ")}.\nSuggest 3 character names that fit the world's tone and genre. Just the names, nothing else.`,
  };

  const prompt = prompts[stepId];
  if (!prompt) return [];

  const response = await getClient().messages.create({
    model: modelPolicy.gmTurnModel,
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nRespond with exactly 3 suggestions as a JSON array of strings: ["suggestion 1", "suggestion 2", "suggestion 3"]. No markdown, no explanation.`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  try {
    const arr = JSON.parse(text) as string[];
    if (Array.isArray(arr)) return arr.slice(0, 3).map((s) => String(s).trim());
  } catch {
    // Try to extract array from fenced block
    const m = text.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        const arr = JSON.parse(m[0]) as string[];
        if (Array.isArray(arr))
          return arr.slice(0, 3).map((s) => String(s).trim());
      } catch {
        /* fall through */
      }
    }
  }
  return [];
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
