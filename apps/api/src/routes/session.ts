import type { FastifyInstance } from "fastify";
import { ClientEvent, ServerEvent } from "@audio-rpg/shared";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";
import { runTurn, type TurnGenerator } from "../gm/orchestrator.js";
import { generateRecap } from "../gm/claude.js";
import { loadSession, getMemoryStore, getPersistence } from "../state/store.js";
import { tierFromToken } from "../auth/entitlements.js";
import { incrementSessionMetric } from "../observability/session-metrics.js";

export interface SessionRouteOptions {
  /** Injected GM turn generator; defaults to the real Claude path. */
  turnGenerator?: TurnGenerator;
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
    let session: Awaited<ReturnType<typeof loadSession>> | null = null;
    let turnLimit: number | null = null;
    const handledEventIds = new Set<string>();

    const emit = (evt: ServerEvent): void => {
      const parsed = ServerEvent.safeParse(evt);
      if (!parsed.success) {
        app.log.error({ evt, error: parsed.error }, "invalid server event");
        return;
      }
      socket.send(JSON.stringify(parsed.data));
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

      const parsed = ClientEvent.safeParse(msg);
      if (!parsed.success) {
        emit({
          type: "error",
          code: "bad_event",
          message: parsed.error.issues[0]?.message ?? "Invalid event.",
          recoverable: true,
        });
        return;
      }

      const event = parsed.data;

      if (event.type === "join") {
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
        emit({
          type: "error",
          code: "not_joined",
          message: "Send a 'join' event first.",
          recoverable: true,
        });
        return;
      }

      if (event.type === "player_input") {
        if (event.eventId && handledEventIds.has(event.eventId)) {
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
              ...(options.turnGenerator
                ? { generateTurn: options.turnGenerator }
                : {}),
            },
            emit,
          );
        } catch (err) {
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
        return;
      }

      if (event.type === "pause") {
        // State is persisted after every turn — nothing extra to do.
        socket.close();
        return;
      }

      if (event.type === "leave") {
        socket.close();
      }
    });

    socket.on("close", () => {
      incrementSessionMetric("connectionsClosed");
      app.log.info("session closed");
    });
  });
}
