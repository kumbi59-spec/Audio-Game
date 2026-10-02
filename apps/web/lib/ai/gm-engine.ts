import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  getAnthropicClient,
  gmModelParams,
  MODEL,
  MAX_TOKENS,
  classifyProviderError,
  isRetryableProviderError,
  type ProviderErrorClass,
} from "./client";
import { buildSystemBlocks, buildTurnContext } from "./prompts/system";
import {
  buildContextMessages,
  buildCharacterStateBlock,
  buildWorldStateBlock,
} from "./memory/context-window";
import { parseGMResponse } from "./gm-response";
import { NarrationStreamTap } from "./narration-stream";
import type { InMemorySession, GMResponse, PlayerAction, PassiveBonus, SkillCheckResult } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";

export interface GMStreamEvent {
  type:
    // Raw text of the GM's JSON reply, for history.
    | "narration_chunk"
    // Decoded narration prose as it streams, for speaking early.
    | "narration_delta"
    // NPCs who speak in this narration, with genders, sent before the prose.
    | "speakers"
    // Text streamed so far this turn has been discarded (a retry, or a round
    // that ended in a tool call). Clients drop what they buffered.
    | "narration_reset"
    | "skill_check_result"
    | "choices_ready"
    | "sound_cue"
    | "state_change"
    | "error"
    | "done";
  data?: unknown;
}

export const TURN_RELIABILITY_POLICY = {
  // Abort a request when the stream goes this long without an event. Unlike a
  // whole-turn deadline, this never cuts off a long reply that is still
  // arriving.
  idleTimeoutMs: 20_000,
  maxRetries: 2,
  fallback: {
    mode: "safe_continue_choices",
    choices: ["Take a cautious step forward", "Pause and assess", "Ask for a recap"],
  },
} as const;

export interface StreamGMTurnOptions {
  /** Aborted when the player disconnects; stops generation and retries. */
  signal?: AbortSignal;
  /** Source of randomness for dice rolls (tests pass a seeded one). */
  rng?: () => number;
}

class GMTurnTimeoutError extends Error {
  constructor() {
    super("gm_turn_timeout");
  }
}

class GMRefusalError extends Error {
  constructor() {
    super("gm_safety_refusal");
  }
}

// ── Skill checks ────────────────────────────────────────────────────────────

const SKILL_STATS = ["strength", "dexterity", "intelligence", "charisma"] as const satisfies readonly SkillCheckResult["stat"][];

export const SKILL_CHECK_TOOL_NAME = "roll_skill_check";
/** Model requests per turn: the roll, the narration, and one spare. */
const MAX_TOOL_ROUNDS = 3;

const SKILL_CHECK_TOOL: Anthropic.Tool = {
  name: SKILL_CHECK_TOOL_NAME,
  description:
    "Roll a d20 skill check for a player action that carries a meaningful risk of failure. " +
    "Call it BEFORE writing your JSON response. The system rolls d20 + the character's modifier " +
    "against the DC and returns whether the attempt succeeded; narrate exactly that outcome. " +
    "Call it at most once per turn, and never for routine actions.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      stat: {
        type: "string",
        enum: [...SKILL_STATS],
        description:
          "strength = forcing/lifting/melee, dexterity = stealth/acrobatics/ranged, " +
          "intelligence = puzzles/lore/investigation, charisma = persuasion/deception/performance.",
      },
      dc: {
        type: "integer",
        description:
          "Difficulty class: 5 trivial, 8 easy, 12 moderate, 16 hard, 20 very hard, 24 near-impossible.",
      },
      label: {
        type: "string",
        description: "Short description of the attempt, at most 8 words.",
      },
    },
    required: ["stat", "dc", "label"],
    additionalProperties: false,
  },
};

const SkillCheckInputSchema = z.object({
  stat: z.enum(SKILL_STATS),
  dc: z.number().int().transform((dc) => Math.min(30, Math.max(5, dc))),
  label: z.string().transform((label) => label.trim().slice(0, 80)),
});
export type SkillCheckInput = z.infer<typeof SkillCheckInputSchema>;

/**
 * Rolls d20 + stat modifier + applicable passive bonuses against the DC. The
 * passive bonuses are the same ones narrated to the player as "STR granted +2",
 * so what they're told is what the roll uses.
 */
export function resolveSkillCheck(
  input: SkillCheckInput,
  character: CharacterData,
  passiveBonuses: PassiveBonus[],
  rng: () => number = Math.random,
): SkillCheckResult {
  const statValue = character.stats[input.stat];
  const base = typeof statValue === "number" && Number.isFinite(statValue) ? statValue : 10;
  const modifier = Math.floor((base - 10) / 2);
  const bonus = passiveBonuses
    .filter((b) => b.sourceStat === input.stat || b.targetRoll === "general_risk")
    .reduce((sum, b) => sum + b.value, 0);
  const r = Math.min(Math.max(rng(), 0), 0.999999);
  const roll = Math.floor(r * 20) + 1;
  const total = roll + modifier + bonus;
  return {
    stat: input.stat,
    label: input.label,
    dc: input.dc,
    roll,
    modifier,
    bonus,
    total,
    success: total >= input.dc,
  };
}

function skillCheckToolResult(result: SkillCheckResult): string {
  const outcome = result.success ? "SUCCESS" : "FAILURE";
  return [
    JSON.stringify(result),
    `The ${result.stat} check "${result.label}" is a ${outcome} (${result.total} vs DC ${result.dc}).`,
    "Narrate this outcome now in your JSON response. Do not roll again this turn.",
  ].join("\n");
}

function computePassiveBonuses(action: PlayerAction, character: CharacterData) {
  const text = `${action.type} ${action.content}`.toLowerCase();
  const stats = character.stats;
  const customStats = character.customStats ?? {};
  const bonuses: PassiveBonus[] = [];

  const pushBonus = (sourceStat: string, value: number, reason: string, targetRoll: string) => {
    if (value <= 0) return;
    bonuses.push({ sourceStat, value, reason, targetRoll });
  };

  const meleeKeywords = ["attack", "strike", "slash", "melee", "hit"];
  const evadeKeywords = ["dodge", "evade", "avoid", "parry", "duck", "defend"];
  const socialKeywords = ["persuade", "convince", "charm", "negotiate", "deceive"];

  if (meleeKeywords.some((k) => text.includes(k))) {
    pushBonus("strength", Math.max(0, Math.floor((stats.strength - 10) / 3)), "Physical power improves close-quarters attacks", "melee_attack");
  }
  if (evadeKeywords.some((k) => text.includes(k))) {
    pushBonus("dexterity", Math.max(0, Math.floor((stats.dexterity - 10) / 4)), "Quick reflexes improve evasive reactions", "evade");
  }
  if (socialKeywords.some((k) => text.includes(k))) {
    pushBonus("charisma", Math.max(0, Math.floor((stats.charisma - 10) / 4)), "Presence and confidence improve social influence", "social_check");
  }

  for (const [key, val] of Object.entries(customStats)) {
    if (typeof val !== "number") continue;
    if (key.toLowerCase().includes("armor") && text.includes("damage")) {
      pushBonus(key, Math.max(0, Math.floor(val / 5)), "Defensive training softens incoming hits", "damage_taken");
    }
    if (key.toLowerCase().includes("luck")) {
      pushBonus(key, Math.max(0, Math.floor(val / 8)), "Innate luck marginally improves risky outcomes", "general_risk");
    }
  }

  const narration = bonuses.map((bonus) => {
    if (bonus.targetRoll === "damage_taken") {
      return `${bonus.sourceStat} bonus reduced incoming damage by ${bonus.value}.`;
    }
    return `${bonus.sourceStat.toUpperCase()} granted +${bonus.value} on ${bonus.targetRoll.replace(/_/g, " ")}.`;
  });

  return { bonuses, narration };
}

function buildFallbackChoices(character: CharacterData): string[] {
  const classActions: Record<string, string> = {
    warrior: "Search the area for threats",
    rogue: "Scout from the shadows",
    mage: "Study the surroundings for magical traces",
    ranger: "Track movement nearby",
    bard: "Gather information about the situation",
  };
  return [
    classActions[character.class] ?? "Explore carefully",
    "Pause and reassess the situation",
    "Review your inventory and resources",
    "Continue toward your current objective",
  ];
}

function degradedMessage(errorClass: ProviderErrorClass): string {
  if (errorClass === "safety_refusal") {
    return "The narrator couldn't continue the story down that path. Try a different approach.";
  }
  const base = "The narrator connection is unstable, so we switched to a safe fallback turn.";
  if (errorClass === "rate_limit") return `${base} Too many requests are in flight right now.`;
  if (errorClass === "timeout") return `${base} The response took too long.`;
  return base;
}

// Convert a player action into the user message content
function buildUserMessage(action: PlayerAction): string {
  if (action.type === "choice") {
    return `I choose option ${(action.choiceIndex ?? 0) + 1}: ${action.content}`;
  }
  return action.content;
}

/**
 * System prompt and messages for one GM turn, laid out for prompt caching:
 * tools and system never change within a session (breakpoint on the world
 * block), the history only grows (breakpoint on its last message), and the
 * per-turn state rides in the new user message after both breakpoints.
 */
function buildTurnRequest(
  action: PlayerAction,
  session: InMemorySession,
  character: CharacterData,
  world: WorldData,
): { system: Anthropic.TextBlockParam[]; messages: Anthropic.MessageParam[] } {
  const history = buildContextMessages(session, character, world);
  const messages: Anthropic.MessageParam[] = history.map((m, i) =>
    i === history.length - 1
      ? { role: m.role, content: [{ type: "text", text: m.content, cache_control: { type: "ephemeral" } }] }
      : { role: m.role, content: m.content },
  );
  const turnContext = buildTurnContext(
    buildCharacterStateBlock(character),
    buildWorldStateBlock(session, world),
    session.memorySummary,
  );
  messages.push({
    role: "user",
    content: `${turnContext}\n\n---\nPLAYER ACTION:\n${buildUserMessage(action)}`,
  });
  return { system: buildSystemBlocks(world.systemPrompt), messages };
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Non-streaming: returns a complete GMResponse
export async function runGMTurn(
  action: PlayerAction,
  session: InMemorySession,
  character: CharacterData,
  world: WorldData
): Promise<GMResponse> {
  const client = getAnthropicClient();
  const { system, messages } = buildTurnRequest(action, session, character, world);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    ...gmModelParams(),
    system,
    // Same tool list as the turns that follow, so this request warms the
    // tools + system cache they read. No rolls in the opening scene.
    tools: [SKILL_CHECK_TOOL],
    tool_choice: { type: "none" },
    messages,
  });

  return parseGMResponse(textOf(response));
}

/**
 * Streams one model request, yielding raw text deltas as narration_chunk
 * events, and returns the final message. Aborts when the stream goes idle for
 * TURN_RELIABILITY_POLICY.idleTimeoutMs or when `signal` fires.
 */
async function* streamRound(
  params: Anthropic.MessageStreamParams,
  signal: AbortSignal | undefined,
  tap: NarrationStreamTap,
): AsyncGenerator<GMStreamEvent, Anthropic.Message> {
  const stream = getAnthropicClient().messages.stream(params);
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  let finished = false;
  const armIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      timedOut = true;
      stream.abort();
    }, TURN_RELIABILITY_POLICY.idleTimeoutMs);
  };
  const onAbort = () => stream.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  if (signal?.aborted) stream.abort();
  armIdleTimer();

  try {
    for await (const event of stream) {
      armIdleTimer();
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "narration_chunk", data: { text: event.delta.text } };
        for (const evt of tap.onText(event.delta.text)) yield evt;
      }
    }
    const message = await stream.finalMessage();
    finished = true;
    const usage = message.usage;
    if (usage) {
      console.info(
        `[gm] usage model=${params.model} stop=${message.stop_reason} input=${usage.input_tokens} ` +
          `cache_read=${usage.cache_read_input_tokens ?? 0} cache_write=${usage.cache_creation_input_tokens ?? 0} ` +
          `output=${usage.output_tokens}`,
      );
    }
    return message;
  } catch (err) {
    if (timedOut) throw new GMTurnTimeoutError();
    throw err;
  } finally {
    clearTimeout(idleTimer);
    signal?.removeEventListener("abort", onAbort);
    // The consumer stopped early (or an error escaped): don't leave the
    // request generating tokens nobody will read.
    if (!finished) stream.abort();
  }
}

// Streaming version for the API route
export async function* streamGMTurn(
  action: PlayerAction,
  session: InMemorySession,
  character: CharacterData,
  world: WorldData,
  options: StreamGMTurnOptions = {},
): AsyncGenerator<GMStreamEvent> {
  const { signal, rng = Math.random } = options;
  const { system, messages: baseMessages } = buildTurnRequest(action, session, character, world);
  const passive = computePassiveBonuses(action, character);

  let lastErrorClass: ProviderErrorClass = "provider_error";
  for (let attempt = 0; attempt <= TURN_RELIABILITY_POLICY.maxRetries; attempt += 1) {
    if (signal?.aborted) return;
    if (attempt > 0) yield { type: "narration_reset", data: { reason: "retry" } };

    try {
      const messages = [...baseMessages];
      const tap = new NarrationStreamTap();
      let skillCheck: SkillCheckResult | null = null;
      let final: Anthropic.Message | null = null;

      // Round 1 may call roll_skill_check; after a roll the GM writes the
      // narration. tool_choice stays "auto" on the follow-up round because
      // changing it would miss the cached history; a second roll gets an
      // error result, and only a third round is forced to "none".
      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const lastRound = round === MAX_TOOL_ROUNDS - 1;
        final = yield* streamRound(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            ...gmModelParams(),
            system,
            tools: [SKILL_CHECK_TOOL],
            tool_choice: lastRound ? { type: "none" } : { type: "auto", disable_parallel_tool_use: true },
            messages,
          },
          signal,
          tap,
        );

        if (final.stop_reason === "refusal") throw new GMRefusalError();
        if (final.stop_reason !== "tool_use" || lastRound) break;

        // Anything written before the tool call is preamble, not the reply.
        tap.resetText();
        yield { type: "narration_reset", data: { reason: "tool_use" } };

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of final.content) {
          if (block.type !== "tool_use") continue;
          const parsed = block.name === SKILL_CHECK_TOOL_NAME && !skillCheck
            ? SkillCheckInputSchema.safeParse(block.input)
            : null;
          if (parsed?.success) {
            skillCheck = resolveSkillCheck(parsed.data, character, passive.bonuses, rng);
            yield { type: "skill_check_result", data: skillCheck };
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: skillCheckToolResult(skillCheck),
            });
          } else {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              is_error: true,
              content: skillCheck
                ? "The skill check for this turn has already been rolled. Write your JSON response now."
                : "No roll was made. Narrate the action without a skill check.",
            });
          }
        }
        messages.push(
          { role: "assistant", content: final.content },
          { role: "user", content: toolResults },
        );
      }

      const gmResponse = parseGMResponse(final ? textOf(final) : "");

      // Usually already sent while streaming, ahead of the narration.
      if (gmResponse.soundCue && gmResponse.soundCue !== tap.cueSent) {
        yield { type: "sound_cue", data: { cue: gmResponse.soundCue } };
      }

      const mergedStateChanges: Record<string, unknown> = {
        ...(gmResponse.stateChanges ?? {}),
        passiveBonuses: passive.bonuses,
        // Only surface passive bonuses to the player when a skill check is
        // actually being resolved this turn — otherwise every "I attack"
        // turn dumps a "STR granted +X on melee_attack" line into the log
        // even when no roll happens.
        ...(skillCheck && passive.narration.length > 0
          ? { passiveBonusNarration: passive.narration }
          : {}),
      };

      if (skillCheck) {
        mergedStateChanges.flags = {
          ...((mergedStateChanges.flags as Record<string, unknown>) ?? {}),
          last_skill_check: JSON.stringify(skillCheck),
        };
      }

      yield { type: "state_change", data: mergedStateChanges };

      yield {
        type: "choices_ready",
        data: {
          choices: gmResponse.choices,
          narration: gmResponse.narration,
          npcAction: gmResponse.npcAction,
        },
      };

      yield { type: "done", data: null };
      return;
    } catch (err) {
      // The player went away — nobody is listening for a fallback turn.
      if (signal?.aborted) return;
      const refused = err instanceof GMRefusalError;
      lastErrorClass = refused ? "safety_refusal" : classifyProviderError(err);
      const retryable = !refused && isRetryableProviderError(err);
      if (retryable && attempt < TURN_RELIABILITY_POLICY.maxRetries) continue;
      break;
    }
  }

  yield { type: "narration_reset", data: { reason: "fallback" } };
  yield {
    type: "error",
    data: {
      message: degradedMessage(lastErrorClass),
      degraded: true,
      errorClass: lastErrorClass,
      fallbackMode: TURN_RELIABILITY_POLICY.fallback.mode,
    },
  };
  yield {
    type: "choices_ready",
    data: {
      choices: buildFallbackChoices(character),
      narration: degradedMessage(lastErrorClass),
      npcAction: null,
    },
  };
  yield { type: "done", data: null };
}

// Build the opening narration for a new session (first turn)
export async function generateOpeningNarration(
  world: WorldData,
  character: CharacterData
): Promise<GMResponse> {
  const fakeSession: InMemorySession = {
    id: "opening",
    worldId: world.id,
    characterId: character.id,
    status: "active",
    turnCount: 0,
    currentLocationId: world.locations[0]?.id ?? null,
    timeOfDay: "morning",
    weather: "clear",
    globalFlags: {},
    npcStates: {},
    memorySummary: "",
    history: [],
    narrationLog: [],
    choices: [],
    isGenerating: false,
    achievements: [],
    relationships: [],
    codex: [],
  };

  const openingAction: PlayerAction = {
    type: "meta",
    content:
      "Begin the adventure. Set the scene for the player's arrival. Welcome them to this world and give them their first choices.",
  };

  return runGMTurn(openingAction, fakeSession, character, world);
}
