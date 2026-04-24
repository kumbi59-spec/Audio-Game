import type { FastifyInstance } from "fastify";
import { ClientEvent, ServerEvent } from "@audio-rpg/shared";
import { runTurn } from "../gm/orchestrator.js";
import { loadSession, getMemoryStore, getPersistence } from "../state/store.js";

/**
 * Per-campaign WebSocket. The client sends `join` + `player_input` events,
 * the server streams `narration_chunk`, `choice_list`, `state_delta`,
 * `sound_cue`, `turn_complete`. Audio is fetched separately from the TTS
 * proxy keyed by turnId.
 */
export async function registerSessionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/session", { websocket: true }, async (socket, req) => {
    app.log.info({ ip: req.ip }, "session connected");
    let session: Awaited<ReturnType<typeof loadSession>> | null = null;

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
          emit({
            type: "session_ready",
            campaignId: event.campaignId,
            turnNumber: session.state.turn_number,
          });
        } catch (err) {
          emit({
            type: "error",
            code: "join_failed",
            message: err instanceof Error ? err.message : "Could not join session.",
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
        try {
          session = await runTurn(
            session,
            event.input,
            { memory: getMemoryStore(), ...getPersistence() },
            emit,
          );
        } catch (err) {
          app.log.error({ err }, "turn failed");
          emit({
            type: "error",
            code: "turn_failed",
            message: "The GM couldn't respond. Your input was saved.",
            recoverable: true,
          });
        }
        return;
      }

      if (event.type === "leave") {
        socket.close();
      }
    });

    socket.on("close", () => {
      app.log.info("session closed");
    });
  });
}
