import { getAnthropicClient, MODEL, MAX_TOKENS } from "./client";
import { buildWorldSystemPrompt } from "./prompts/system";
import {
  buildContextMessages,
  buildCharacterStateBlock,
  buildWorldStateBlock,
} from "./memory/context-window";
import type { InMemorySession, GMResponse, PlayerAction } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";

export interface GMStreamEvent {
  type:
    | "narration_chunk"
    | "choices_ready"
    | "sound_cue"
    | "state_change"
    | "error"
    | "done";
  data?: unknown;
}

// Build the full system prompt for a session
function buildSystemPrompt(
  session: InMemorySession,
  character: CharacterData,
  world: WorldData
): string {
  const worldContext = world.systemPrompt;
  const characterState = buildCharacterStateBlock(character);
  const worldState = buildWorldStateBlock(session, world);
  const memorySummary = session.memorySummary;

  return buildWorldSystemPrompt(worldContext, characterState, worldState, memorySummary);
}

// Convert a player action into the user message content
function buildUserMessage(action: PlayerAction): string {
  if (action.type === "choice") {
    return `I choose option ${(action.choiceIndex ?? 0) + 1}: ${action.content}`;
  }
  return action.content;
}

// Parse the GM's JSON response, tolerating markdown code fences
function parseGMResponse(raw: string): GMResponse {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as GMResponse;
    return {
      narration: parsed.narration ?? "",
      choices: Array.isArray(parsed.choices) ? parsed.choices : [],
      soundCue: parsed.soundCue ?? null,
      stateChanges: parsed.stateChanges ?? undefined,
      npcAction: parsed.npcAction ?? null,
    };
  } catch {
    // If JSON parsing fails, treat entire content as narration
    return {
      narration: raw,
      choices: ["Continue", "Look around", "Do something else"],
      soundCue: null,
    };
  }
}

// Non-streaming: returns a complete GMResponse
export async function runGMTurn(
  action: PlayerAction,
  session: InMemorySession,
  character: CharacterData,
  world: WorldData
): Promise<GMResponse> {
  const client = getAnthropicClient();
  const systemPrompt = buildSystemPrompt(session, character, world);
  const history = buildContextMessages(session, character, world);

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: buildUserMessage(action) },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages,
  });

  const raw =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return parseGMResponse(raw);
}

// Streaming version for the API route
export async function* streamGMTurn(
  action: PlayerAction,
  session: InMemorySession,
  character: CharacterData,
  world: WorldData
): AsyncGenerator<GMStreamEvent> {
  const client = getAnthropicClient();
  const systemPrompt = buildSystemPrompt(session, character, world);
  const history = buildContextMessages(session, character, world);

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: buildUserMessage(action) },
  ];

  let accumulated = "";

  try {
    const stream = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        accumulated += chunk.delta.text;

        // Stream narration chunks as they arrive (before JSON is complete)
        // We yield raw text chunks for the client to buffer
        yield {
          type: "narration_chunk",
          data: { text: chunk.delta.text },
        };
      }
    }

    // Parse the full accumulated response
    const gmResponse = parseGMResponse(accumulated);

    if (gmResponse.soundCue) {
      yield { type: "sound_cue", data: { cue: gmResponse.soundCue } };
    }

    if (gmResponse.stateChanges) {
      yield { type: "state_change", data: gmResponse.stateChanges };
    }

    yield {
      type: "choices_ready",
      data: {
        choices: gmResponse.choices,
        narration: gmResponse.narration,
        npcAction: gmResponse.npcAction,
      },
    };

    yield { type: "done", data: null };
  } catch (err) {
    yield {
      type: "error",
      data: { message: err instanceof Error ? err.message : "GM error" },
    };
  }
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
  };

  const openingAction: PlayerAction = {
    type: "meta",
    content:
      "Begin the adventure. Set the scene for the player's arrival. Welcome them to this world and give them their first choices.",
  };

  return runGMTurn(openingAction, fakeSession, character, world);
}
