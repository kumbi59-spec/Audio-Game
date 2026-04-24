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
import { generateGmTurn } from "./claude.js";
import { randomUUID } from "node:crypto";

export interface Session {
  campaignId: string;
  worldId: string;
  bible: GameBible;
  state: CampaignState;
  lastPresentedChoices: { id: string; label: string }[];
}

export interface OrchestratorDeps {
  memory: MemoryStore;
  persistTurn: (args: {
    campaignId: string;
    turnNumber: number;
    role: "gm" | "player";
    text: string;
    turn?: GmTurn;
    input?: PlayerInput;
  }) => Promise<void>;
  persistState: (campaignId: string, state: CampaignState) => Promise<void>;
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

  const turn = await generateGmTurn({
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
