import type { FastifyInstance } from "fastify";
import { ServerEvent, type SessionState, canTransition } from "@audio-rpg/shared";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import { runTurn, type TurnGenerator } from "../gm/orchestrator.js";
import { generateRecap } from "../gm/claude.js";
import { loadSession, getMemoryStore, getPersistence } from "../state/store.js";
import { tierFromToken } from "../auth/entitlements.js";
import { incrementSessionMetric } from "../observability/session-metrics.js";
import type { DomainEventBus } from "../events/domain-events.js";
import {
  normalizeClientEventV1,
  serializeServerEvent,
  UnsupportedClientEventVersionError,
} from "./session-compat.js";

export interface SessionRouteOptions {
  /** Injected GM turn generator; defaults to the real Claude path. */
  turnGenerator?: TurnGenerator;
  /** Shared domain event bus instance from API bootstrapping. */
  domainEvents?: DomainEventBus;
}

/**
 * Per-campaign WebSocket. The client sends `join` + `player_input` events,
 * the server streams `narration_chunk`, `choice_list`, `state_delta`,
 * `sound_cue`, `turn_complete`. Audio is fetched separately from the TTS
 * proxy keyed by turnId.
 */
export async function registerSessionRoutes(
  app: FastifyInstance,
  options: SessionRouteOptions = {},
): Promise<void> {
  app.get("/session", { websocket: true }, async (socket, req) => {
    app.log.info({ ip: req.ip }, "session connected");
    incrementSessionMetric("connectionsOpened");
    let sessionState: SessionState = "connected";
    let session: Awaited<ReturnType<typeof loadSession>> | null = null;
    let turnLimit: number | null = null;
    const handledEventIds = new Set<string>();

    const emit = (evt: ServerEvent): void => {
      const parsed = ServerEvent.safeParse(evt);
      if (!parsed.success) {
        app.log.error({ evt, error: parsed.error }, "invalid server event");
        return;
      }
      socket.send(serializeServerEvent(parsed.data));
    };

    const emitInvalidTransition = (
      from: SessionState,
      to: SessionState,
      trigger: string,
    ): void => {
      app.log.warn(
        { currentState: from, targetState: to, trigger },
        "session state transition rejected",
      );
      emit({
        type: "error",
        code: "invalid_state_transition",
        message: `Invalid session state transition from '${from}' to '${to}' via '${trigger}'.`,
        recoverable: true,
      });
    };

    const transitionState = (to: SessionState, trigger: string): boolean => {
      if (!canTransition(sessionState, to)) {
        emitInvalidTransition(sessionState, to, trigger);
        return false;
      }
      sessionState = to;
      return true;
    };

    socket.on("message", async (raw: Buffer) => {
      let msg: unknown;
      try {
        msg = JSON.parse(raw.toString("utf8"));
      } catch {
        emit({
          type: "error",
          code: "bad_json",
          message: "Message was not JSON.",
          recoverable: true,
        });
        return;
      }

      let event;
      try {
        event = normalizeClientEventV1(msg);
      } catch (err) {
        if (err instanceof UnsupportedClientEventVersionError) {
          emit({
            type: "error",
            code: err.code,
            message: err.message,
            recoverable: err.recoverable,
          });
          return;
        }

        emit({
          type: "error",
          code: "bad_event",
          message:
            err instanceof Error ? err.message : "Invalid event.",
          recoverable: true,
        });
        return;
      }

      if (event.type === "join") {
        if (!transitionState("joined", "join")) {
          return;
        }
        try {
          session = await loadSession(event.campaignId, event.authToken);
          const tier = event.tierToken
            ? tierFromToken(event.tierToken)
            : "free";
          turnLimit = TIER_ENTITLEMENTS[tier].sessionTurnLimit;
          emit({
            type: "session_ready",
            campaignId: event.campaignId,
            turnNumber: session.state.turn_number,
          });
        } catch (err) {
          sessionState = "closed";
          emit({
            type: "error",
            code: "join_failed",
            message:
              err instanceof Error ? err.message : "Could not join session.",
            recoverable: false,
          });
          socket.close();
        }
        return;
      }

      if (!session) {
        emitInvalidTransition(sessionState, "awaiting_gm", event.type);
        emit({
          type: "error",
          code: "not_joined",
          message: "Send a 'join' event first.",
          recoverable: true,
        });
        return;
      }

      if (event.type === "player_input") {
        const stateBeforeTurn = sessionState;
        if (!transitionState("awaiting_gm", "player_input")) {
          return;
        }
        if (event.eventId && handledEventIds.has(event.eventId)) {
          sessionState = stateBeforeTurn;
          incrementSessionMetric("duplicateInputs");
          emit({
            type: "error",
            code: "duplicate_event",
            message: "Duplicate player input ignored.",
            recoverable: true,
            eventId: event.eventId,
          });
          return;
        }
        if (turnLimit !== null && session.state.turn_number >= turnLimit) {
          sessionState = stateBeforeTurn;
          incrementSessionMetric("turnLimitRejected");
          emit({
            type: "error",
            code: "turn_limit_reached",
            message: `You've reached the ${turnLimit}-turn limit for the free plan. Upgrade to Storyteller for unlimited play.`,
            recoverable: false,
            eventId: event.eventId,
          });
          return;
        }
        try {
          incrementSessionMetric("turnRequests");
          if (event.eventId) handledEventIds.add(event.eventId);
          session = await runTurn(
            session,
            event.input,
            {
              memory: getMemoryStore(),
              ...getPersistence(),
              ...(options.domainEvents
                ? { domainEvents: options.domainEvents }
                : {}),
              ...(options.turnGenerator
                ? { generateTurn: options.turnGenerator }
                : {}),
            },
            emit,
          );
          if (!transitionState("turn_complete", "turn_completed")) {
            return;
          }
        } catch (err) {
          sessionState = stateBeforeTurn;
          app.log.error({ err }, "turn failed");
          incrementSessionMetric("turnFailures");
          emit({
            type: "error",
            code: "turn_failed",
            message: "The GM couldn't respond. Your input was saved.",
            recoverable: true,
            eventId: event.eventId,
          });
        }
        return;
      }

      if (event.type === "request_recap") {
        if (!transitionState(sessionState, "request_recap")) {
          return;
        }
        const memory = getMemoryStore();
        incrementSessionMetric("recapRequests");
        try {
          const recentTurns = await memory.recentTurns(session.campaignId, 6);
          const summary = await generateRecap({
            state: session.state,
            recentTurns,
          });
          emit({ type: "recap_ready", summary });
        } catch (err) {
          app.log.error({ err }, "recap generation failed");
          incrementSessionMetric("recapFailures");
          emit({
            type: "recap_ready",
            summary: `You are in ${session.state.scene.name}, turn ${session.state.turn_number}.`,
          });
        }
        if (!transitionState(sessionState, "recap_completed")) {
          return;
        }
        return;
      }

      if (event.type === "pause") {
        if (!transitionState("closed", "pause")) {
          return;
        }
        // State is persisted after every turn — nothing extra to do.
        socket.close();
        return;
      }

      if (event.type === "leave") {
        if (!transitionState("closed", "leave")) {
          return;
        }
        socket.close();
      }
    });

    socket.on("close", () => {
      incrementSessionMetric("connectionsClosed");
      app.log.info("session closed");
    });
  });
}
