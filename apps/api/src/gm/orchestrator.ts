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
import { config } from "../config.js";
import type { DomainEventBus } from "../events/domain-events.js";

const SCENE_SUMMARY_EVERY = 15;

type GmTurnOutcome = "success_first_try" | "success_on_retry" | "exhausted_retries";

const gmTurnMetrics = {
  success_first_try: 0,
  success_on_retry: 0,
  exhausted_retries: 0,
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function classifyAttemptError(error: Error): {
  error_code: string;
  category: "timeout" | "provider_error";
} {
  if (error.message === "gm_turn_timeout") {
    return { error_code: "gm_turn_timeout", category: "timeout" };
  }
  return {
    error_code: error.message || "gm_turn_failed",
    category: "provider_error",
  };
}

function recordOutcome(outcome: GmTurnOutcome): void {
  gmTurnMetrics[outcome] += 1;
  console.info(
    JSON.stringify({
      event: "gm_turn_outcome",
      metric: "gm_turn_outcome_total",
      outcome,
      ...gmTurnMetrics,
    }),
  );
}

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
  domainEvents?: DomainEventBus;
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
  let turn: GmTurn | null = null;
  let lastError: Error | null = null;
  const maxAttempts = Math.max(1, config.GM_TURN_MAX_RETRIES + 1);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const attemptNumber = attempt + 1;
    const attemptChunks: string[] = [];
    try {
      const turnPromise = generate({
        bible: session.bible,
        userPrompt,
        onText: (chunk) => {
          attemptChunks.push(chunk);
        },
      });

      turn = await Promise.race([
        turnPromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("gm_turn_timeout")),
            config.GM_TURN_TIMEOUT_MS,
          ),
        ),
      ]);

      for (const chunk of attemptChunks) {
        emit({ type: "narration_chunk", turnId, text: chunk, done: false });
      }
      console.info(
        JSON.stringify({
          event: "gm_turn_attempt",
          attempt: attemptNumber,
          max_attempts: maxAttempts,
          status: "success",
          timeout: false,
          provider_error: false,
        }),
      );
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("gm_turn_failed");
      const { error_code, category } = classifyAttemptError(lastError);
      console.warn(
        JSON.stringify({
          event: "gm_turn_attempt",
          attempt: attemptNumber,
          max_attempts: maxAttempts,
          status: "failure",
          error_code,
          timeout: category === "timeout",
          provider_error: category === "provider_error",
        }),
      );

      const willRetry = attempt < maxAttempts - 1;
      if (willRetry) {
        const backoffMs = attemptNumber * config.GM_TURN_RETRY_BACKOFF_MS;
        if (backoffMs > 0) {
          await sleep(backoffMs);
        }
      }
    }
  }

  if (!turn) {
    recordOutcome("exhausted_retries");
    throw lastError ?? new Error("gm_turn_failed");
  }

  if (maxAttempts === 1) {
    recordOutcome("success_first_try");
  } else if (lastError) {
    recordOutcome("success_on_retry");
  } else {
    recordOutcome("success_first_try");
  }

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
  if (deps.domainEvents) {
    await deps.domainEvents.publish({
      type: "TurnResolved",
      eventId: randomUUID(),
      campaignId: session.campaignId,
      turnNumber: nextState.turn_number,
    });
  }
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

  if (turn.narration_voice_plan.length > 0) {
    const roleOrder = ["voice_a", "voice_b", "voice_c"] as const;
    const npcRoles = new Map<string, "voice_a" | "voice_b" | "voice_c">();
    for (const span of turn.narration_voice_plan) {
      if (span.voice === "narrator" || npcRoles.has(span.voice)) continue;
      const role = roleOrder[npcRoles.size];
      if (role) npcRoles.set(span.voice, role);
    }
    if (npcRoles.size > 0) {
      emit({
        type: "voice_plan",
        turnId,
        assignments: Array.from(npcRoles.entries()).map(([npcName, voiceRole]) => ({
          npcName,
          voiceRole,
        })),
      });
    }
  }

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
