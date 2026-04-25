import type {
  CampaignState,
  ClientEvent,
  GameBible,
  GmTurn,
  PlayerInput,
  ServerEvent,
} from "@audio-rpg/shared";
import {
  applyMutations,
  buildMemoryBundle,
  buildTurnUserPrompt,
  type MemoryStore,
} from "@audio-rpg/gm-engine";
import { generateGmTurn, generateSceneSummary } from "./claude.js";
import { randomUUID } from "node:crypto";

const SCENE_SUMMARY_EVERY = 15;

export type TurnGenerator = (args: {
  bible: GameBible;
  userPrompt: string;
  onText?: (chunk: string) => void;
}) => Promise<GmTurn>;

export interface Session {
  campaignId: string;
  worldId: string;
  bible: GameBible;
  state: CampaignState;
  lastPresentedChoices: { id: string; label: string }[];
}

export interface OrchestratorDeps {
  memory: MemoryStore;
  /**
   * Produces the next GM turn. Defaults to the real Claude-backed
   * generator; tests inject a deterministic fake so the WebSocket
   * path can be exercised without an Anthropic key.
   */
  generateTurn?: TurnGenerator;
  persistTurn: (args: {
    campaignId: string;
    turnNumber: number;
    role: "gm" | "player";
    text: string;
    turn?: GmTurn;
    input?: PlayerInput;
  }) => Promise<void>;
  persistState: (campaignId: string, state: CampaignState) => Promise<void>;
  persistPresentedChoices?: (
    campaignId: string,
    choices: { id: string; label: string }[],
  ) => Promise<void>;
  persistSceneSummary?: (
    campaignId: string,
    summary: { sceneNumber: number; summary: string; keyEvents: string[] },
  ) => Promise<void>;
}

/**
 * Advance the campaign by one GM turn. Pure orchestration — I/O lives
 * behind the memory/persist interfaces so this can be exercised in tests
 * with in-memory fakes.
 */
export async function runTurn(
  session: Session,
  input: PlayerInput,
  deps: OrchestratorDeps,
  emit: (e: ServerEvent) => void,
): Promise<Session> {
  const turnId = randomUUID();
  const inputText =
    input.kind === "choice"
      ? `choice:${input.choiceId}`
      : input.kind === "freeform"
        ? input.text
        : `utility:${input.command}`;

  await deps.persistTurn({
    campaignId: session.campaignId,
    turnNumber: session.state.turn_number,
    role: "player",
    text: inputText,
    input,
  });

  const memory = await buildMemoryBundle(deps.memory, {
    campaignId: session.campaignId,
    worldId: session.worldId,
    query: inputText,
  });

  const userPrompt = buildTurnUserPrompt({
    state: session.state,
    memory,
    input,
    presentedChoices: session.lastPresentedChoices,
  });

  const generate = deps.generateTurn ?? generateGmTurn;
  const turn = await generate({
    bible: session.bible,
    userPrompt,
    onText: (chunk) => {
      emit({ type: "narration_chunk", turnId, text: chunk, done: false });
    },
  });

  emit({ type: "narration_chunk", turnId, text: "", done: true });
  emit({
    type: "choice_list",
    turnId,
    choices: turn.presented_choices,
    acceptsFreeform: turn.accepts_freeform,
  });
  if (turn.state_mutations.length) {
    emit({ type: "state_delta", turnId, mutations: turn.state_mutations });
  }
  for (const cue of turn.sound_cues) emit({ type: "sound_cue", cue });

  const nextState = applyMutations(
    { ...session.state, turn_number: session.state.turn_number + 1 },
    turn.state_mutations,
  );

  await deps.persistTurn({
    campaignId: session.campaignId,
    turnNumber: nextState.turn_number,
    role: "gm",
    text: turn.narration,
    turn,
  });
  await deps.persistState(session.campaignId, nextState);
  if (deps.persistPresentedChoices) {
    await deps.persistPresentedChoices(session.campaignId, turn.presented_choices);
  }

  // Periodically compress old turns into a scene summary to keep the active
  // context window lean on long campaigns. Fire-and-forget so the player
  // isn't blocked waiting for a second Claude call.
  if (
    deps.persistSceneSummary &&
    nextState.turn_number > 0 &&
    nextState.turn_number % SCENE_SUMMARY_EVERY === 0
  ) {
    void (async () => {
      try {
        const sceneNumber = Math.floor(nextState.turn_number / SCENE_SUMMARY_EVERY);
        const batch = await deps.memory.recentTurns(
          session.campaignId,
          SCENE_SUMMARY_EVERY * 2,
        );
        const turnsToSummarize = batch.slice(0, SCENE_SUMMARY_EVERY);
        if (turnsToSummarize.length === 0) return;
        const result = await generateSceneSummary({
          sceneName: nextState.scene.name,
          sceneNumber,
          turns: turnsToSummarize,
        });
        await deps.persistSceneSummary!(session.campaignId, {
          sceneNumber,
          summary: result.summary,
          keyEvents: result.keyEvents,
        });
      } catch {
        // Summarization is best-effort; never crash the game loop.
      }
    })();
  }

  emit({
    type: "turn_complete",
    turnId,
    turnNumber: nextState.turn_number,
  });

  return {
    ...session,
    state: nextState,
    lastPresentedChoices: turn.presented_choices,
  };
}

export function isClientEvent(value: unknown): value is ClientEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as { type: unknown }).type === "string"
  );
}
