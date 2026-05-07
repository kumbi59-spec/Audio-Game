import type { FastifyInstance } from "fastify";
import {
  ServerEvent,
  type SessionState,
  type SessionTrigger,
} from "@audio-rpg/shared";
import { evaluateTransportTransition } from "../transport/state-machine.js";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import { runTurn, type TurnGenerator } from "../gm/orchestrator.js";
import { generateRecap } from "../gm/claude.js";
import { loadSession, getMemoryStore, getPersistence } from "../state/store.js";
import { tierFromToken } from "../auth/entitlements.js";
import {
  incrementSessionMetric,
  recordSessionTransition,
} from "../observability/session-metrics.js";
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

// ── Multiplayer campaign rooms ─────────────────────────────────────────────
// Maps campaignId → set of per-socket emit functions so that any turn result
// is broadcast to every player connected to the same campaign.

type EmitFn = (evt: ServerEvent) => void;
const campaignEmitters = new Map<string, Set<EmitFn>>();
// Prevents two players from simultaneously driving a GM turn for the same campaign.
const campaignTurnLock = new Map<string, boolean>();

function broadcastToCampaign(campaignId: string, evt: ServerEvent): void {
  for (const emitter of campaignEmitters.get(campaignId) ?? []) {
    emitter(evt);
  }
}

function registerEmitter(campaignId: string, emit: EmitFn): void {
  if (!campaignEmitters.has(campaignId)) campaignEmitters.set(campaignId, new Set());
  campaignEmitters.get(campaignId)!.add(emit);
}

function unregisterEmitter(campaignId: string, emit: EmitFn): void {
  const set = campaignEmitters.get(campaignId);
  if (!set) return;
  set.delete(emit);
  if (set.size === 0) {
    campaignEmitters.delete(campaignId);
    campaignTurnLock.delete(campaignId);
  }
}

/** Exposed for test teardown only. */
export function clearCampaignRooms(): void {
  campaignEmitters.clear();
  campaignTurnLock.clear();
}

// ── Route ─────────────────────────────────────────────────────────────────

/**
 * Per-campaign WebSocket. All players who join the same campaignId share the
 * same GM turn stream — narration, choices, and state deltas broadcast to
 * every connected socket. Only one turn runs at a time; additional player_input
 * events are rejected while a turn is in progress.
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
    let currentCampaignId: string | null = null;
    const handledEventIds = new Set<string>();

    // Local emit — sends to this socket only (used for join ACK, errors).
    const localEmit = (evt: ServerEvent): void => {
      const parsed = ServerEvent.safeParse(evt);
      if (!parsed.success) {
        app.log.error({ evt, error: parsed.error }, "invalid server event");
        return;
      }
      socket.send(serializeServerEvent(parsed.data));
    };

    // After joining, emit broadcasts to the whole campaign room.
    let emit: EmitFn = localEmit;

    const emitInvalidTransition = (
      from: SessionState,
      to: SessionState,
      trigger: SessionTrigger,
      rejectionReason: string,
    ): void => {
      recordSessionTransition({
        from_state: from,
        to_state: to,
        trigger,
        accepted: false,
        rejection_reason: rejectionReason,
      });
      app.log.warn(
        { currentState: from, targetState: to, trigger, rejectionReason },
        "session state transition rejected",
      );
      localEmit({
        type: "error",
        code: "invalid_state_transition",
        message: `Invalid session state transition from '${from}' to '${to}' via '${trigger}'.`,
        recoverable: true,
      });
    };

    const transitionState = (trigger: SessionTrigger): boolean => {
      const result = evaluateTransportTransition({ from: sessionState, trigger, context: { hasSession: Boolean(session) } });
      if (!result.ok) {
        emitInvalidTransition(result.from, result.to, result.trigger, result.reason);
        return false;
      }
      sessionState = result.to;
      recordSessionTransition({
        from_state: result.from,
        to_state: result.to,
        trigger: result.trigger,
        accepted: true,
      });
      return true;
    };

    socket.on("message", async (raw: Buffer) => {
      let msg: unknown;
      try {
        msg = JSON.parse(raw.toString("utf8"));
      } catch {
        localEmit({
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
          localEmit({
            type: "error",
            code: err.code,
            message: err.message,
            recoverable: err.recoverable,
          });
          return;
        }

        localEmit({
          type: "error",
          code: "bad_event",
          message:
            err instanceof Error ? err.message : "Invalid event.",
          recoverable: true,
        });
        return;
      }

      if (event.type === "join") {
        if (!transitionState("join")) {
          return;
        }
        try {
          session = await loadSession(event.campaignId, event.authToken);
          const tier = event.tierToken
            ? tierFromToken(event.tierToken)
            : "free";
          turnLimit = TIER_ENTITLEMENTS[tier].sessionTurnLimit;

          // Register this socket in the campaign room so turns broadcast to all players.
          currentCampaignId = event.campaignId;
          registerEmitter(currentCampaignId, localEmit);
          emit = (evt) => broadcastToCampaign(currentCampaignId!, evt);

          localEmit({
            type: "session_ready",
            campaignId: event.campaignId,
            turnNumber: session.state.turn_number,
          });
        } catch (err) {
          transitionState("join_failed");
          localEmit({
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
        emitInvalidTransition(sessionState, "awaiting_gm", "player_input", "state_mismatch");
        localEmit({
          type: "error",
          code: "not_joined",
          message: "Send a 'join' event first.",
          recoverable: true,
        });
        return;
      }

      if (event.type === "player_input") {
        // Reject if another player is already driving a turn for this campaign.
        if (currentCampaignId && campaignTurnLock.get(currentCampaignId)) {
          localEmit({
            type: "error",
            code: "turn_in_progress",
            message: "Another player's turn is in progress. Please wait.",
            recoverable: true,
            eventId: event.eventId,
          });
          return;
        }

        const stateBeforeTurn = sessionState;
        if (!transitionState("player_input")) {
          return;
        }
        if (event.eventId && handledEventIds.has(event.eventId)) {
          sessionState = stateBeforeTurn;
          incrementSessionMetric("duplicateInputs");
          localEmit({
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
          localEmit({
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
          if (currentCampaignId) campaignTurnLock.set(currentCampaignId, true);
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
          if (!transitionState("turn_completed")) {
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
        } finally {
          if (currentCampaignId) campaignTurnLock.set(currentCampaignId, false);
        }
        return;
      }

      if (event.type === "request_recap") {
        const recapReturnState: SessionState | null =
          sessionState === "turn_complete"
            ? "turn_complete"
            : sessionState === "joined"
              ? "joined"
              : null;

        if (!recapReturnState) {
          emitInvalidTransition(sessionState, "awaiting_recap", "request_recap", "state_mismatch");
          return;
        }

        if (!transitionState("request_recap")) {
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
          localEmit({ type: "recap_ready", summary });
        } catch (err) {
          app.log.error({ err }, "recap generation failed");
          incrementSessionMetric("recapFailures");
          localEmit({
            type: "recap_ready",
            summary: `You are in ${session.state.scene.name}, turn ${session.state.turn_number}.`,
          });
        }

        if (recapReturnState === "turn_complete") {
          transitionState("recap_completed_to_turn_complete");
        } else {
          transitionState("recap_completed");
        }
        return;
      }

      if (event.type === "pause") {
        if (!transitionState("pause")) {
          return;
        }
        // State is persisted after every turn — nothing extra to do.
        socket.close();
        return;
      }

      if (event.type === "leave") {
        if (!transitionState("leave")) {
          return;
        }
        socket.close();
      }
    });

    socket.on("close", () => {
      if (currentCampaignId) {
        unregisterEmitter(currentCampaignId, localEmit);
        if (campaignTurnLock.get(currentCampaignId)) {
          campaignTurnLock.set(currentCampaignId, false);
        }
      }
      incrementSessionMetric("connectionsClosed");
      app.log.info("session closed");
    });
  });
}
