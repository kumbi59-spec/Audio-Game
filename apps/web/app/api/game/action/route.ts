import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamGMTurn } from "@/lib/ai/gm-engine";
import { moderatePlayerInput, moderateGMOutput, SAFETY_FALLBACK } from "@/lib/safety/moderator";
import type { InMemorySession, PlayerAction } from "@/types/game";
import type { CharacterData } from "@/types/character";
import { resolvePlayer, playerErrorResponse, withPlayerCookie } from "@/lib/auth/player-identity";
import { authorizeAiUsage, aiUsageDenialResponse } from "@/lib/ai/usage-guard";
import { resolvePlayableWorld } from "@/lib/worlds/resolve-playable-world";
import { getOwnedSession } from "@/lib/db/queries/sessions";
import {
  CharacterSchema,
  LegacyGuestIdSchema,
  SessionSnapshotSchema,
  WorldRefSchema,
} from "@/lib/game/request-schemas";

const ActionSchema = z.object({
  action: z.object({
    type: z.enum(["choice", "free_text", "voice_command", "meta"]),
    content: z.string().min(1).max(2000),
    choiceIndex: z.number().optional(),
  }),
  session: SessionSnapshotSchema,
  character: CharacterSchema,
  world: WorldRefSchema,
  dbSessionId: z.string().max(200).nullish(),
  guestId: LegacyGuestIdSchema,
});

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof ActionSchema>;
  try {
    body = ActionSchema.parse(await req.json());
  } catch (err) {
    const details = err instanceof z.ZodError ? err.issues : [];
    console.error("[action] Zod validation failed:", JSON.stringify(details, null, 2));
    return NextResponse.json(
      { error: "invalid_request_body", details },
      { status: 400 }
    );
  }

  const identity = await resolvePlayer(req, {
    allowGuestCreation: true,
    legacyGuestId: body.guestId,
  });
  if (!identity.ok) return playerErrorResponse(identity);
  const { player, setCookie } = identity;
  const respond = (res: Response) => withPlayerCookie(res, setCookie);

  const action: PlayerAction = body.action;
  const character = body.character as CharacterData;
  const dbSessionId = body.dbSessionId;

  const inputCheck = moderatePlayerInput(action.content);
  if (!inputCheck.safe) {
    return respond(NextResponse.json(
      { error: "content_policy", message: SAFETY_FALLBACK },
      { status: 422 }
    ));
  }

  // The world (and its system prompt) is loaded server-side; the client only
  // names which world it is playing.
  const worldResult = await resolvePlayableWorld(body.world.id, player.userId);
  if (!worldResult.ok) {
    return respond(NextResponse.json(
      { error: worldResult.status === 404 ? "world_not_found" : "world_forbidden" },
      { status: worldResult.status }
    ));
  }
  const world = worldResult.world;

  // A persisted session must belong to the caller before anything is
  // generated or written. Its stored state is authoritative over the
  // client snapshot.
  const ownedSession = dbSessionId ? await getOwnedSession(dbSessionId, player.userId) : null;
  if (dbSessionId && !ownedSession) {
    return respond(NextResponse.json({ error: "session_not_found" }, { status: 404 }));
  }
  if (ownedSession && ownedSession.worldId !== world.id) {
    return respond(NextResponse.json({ error: "session_world_mismatch" }, { status: 409 }));
  }

  const storedState = ownedSession?.gameState ?? null;
  const storedNpcStates = parseJson<Record<string, unknown>>(storedState?.npcStates, {});
  const {
    _achievements: storedAchievements,
    _relationships: storedRelationships,
    _codex: storedCodex,
    ...storedNpcStateRest
  } = storedNpcStates as {
    _achievements?: unknown[];
    _relationships?: unknown[];
    _codex?: unknown[];
    [key: string]: unknown;
  };

  const clientSession = body.session as InMemorySession;
  const session: InMemorySession = storedState
    ? {
      ...clientSession,
      turnCount: ownedSession!.turnCount,
      currentLocationId: storedState.currentLocationId ?? clientSession.currentLocationId,
      timeOfDay: storedState.timeOfDay,
      weather: storedState.weather,
      globalFlags: parseJson<Record<string, unknown>>(storedState.globalFlags, {}),
      npcStates: storedNpcStateRest,
      memorySummary: storedState.memorySummary,
      achievements: (storedAchievements ?? []) as InMemorySession["achievements"],
      relationships: (storedRelationships ?? []) as InMemorySession["relationships"],
      codex: (storedCodex ?? []) as InMemorySession["codex"],
    }
    : clientSession;

  const usage = await authorizeAiUsage(req, player, "turn");
  if (!usage.ok) return respond(aiUsageDenialResponse(usage.denial));
  const { grant } = usage;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      let fullNarration = "";
      let stateChanges: Record<string, unknown> = {};

      try {
        for await (const evt of streamGMTurn(action, session, character, world)) {
          send(evt.type, evt.data);

          if (evt.type === "narration_chunk" && evt.data && typeof (evt.data as { text?: string }).text === "string") {
            fullNarration += (evt.data as { text: string }).text;
          }
          if (evt.type === "state_change" && evt.data && typeof evt.data === "object") {
            stateChanges = { ...stateChanges, ...(evt.data as Record<string, unknown>) };
          }
        }

        if (fullNarration) {
          const outputCheck = moderateGMOutput(fullNarration);
          if (!outputCheck.safe) {
            send("content_warning", { reason: outputCheck.reason, fallback: SAFETY_FALLBACK });
          }
        }

        if (ownedSession) {
          try {
            const { persistTurn, updateGameState, incrementTurnCount, countHistoryEntries, getOldestHistoryEntries } =
              await import("@/lib/db/queries/sessions");
            const { summarizeHistory, SUMMARIZE_THRESHOLD, ENTRIES_TO_COMPRESS } =
              await import("@/lib/ai/memory/summarizer");
            const sessionId = ownedSession.id;
            const ownerId = player.userId;

            // Turn numbers come from the stored session, never the client.
            const newTurn = await incrementTurnCount(sessionId, ownerId);
            if (newTurn === null) throw new Error("Session is no longer owned by the caller");

            await Promise.all([
              persistTurn(sessionId, ownerId, newTurn, "user", action.content, action.type),
              fullNarration
                ? persistTurn(sessionId, ownerId, newTurn, "assistant", fullNarration)
                : Promise.resolve(),
            ]);

            if (Object.keys(stateChanges).length > 0 || session.currentLocationId !== null) {
              const flagPatch = (stateChanges as { flags?: Record<string, unknown> }).flags;

              // Merge new achievements/relationships/codex from this turn onto
              // the stored (server-side) values.
              const prevAch = session.achievements as unknown[];
              const newAch = ((stateChanges as { achievementUnlocks?: unknown[] }).achievementUnlocks ?? []) as Array<{ key: string }>;
              const mergedAch = [...prevAch, ...newAch.filter((a) => !prevAch.some((e) => (e as { key: string }).key === a.key))];

              const prevRels = session.relationships as unknown[];
              const relChanges = ((stateChanges as { npcRelationshipChanges?: unknown[] }).npcRelationshipChanges ?? []) as Array<{ npcId: string; name: string; standing: number; notes?: string }>;
              const mergedRels = relChanges.reduce((acc: unknown[], rel) => {
                const idx = acc.findIndex((r) => (r as { npcId: string }).npcId === rel.npcId);
                if (idx >= 0) {
                  const updated = [...acc];
                  updated[idx] = { ...acc[idx] as object, standing: rel.standing, notes: rel.notes };
                  return updated;
                }
                return [...acc, rel];
              }, [...prevRels]);

              const prevCodex = session.codex as unknown[];
              const newCodex = ((stateChanges as { codexEntries?: unknown[] }).codexEntries ?? []) as Array<{ key: string }>;
              const mergedCodex = [...prevCodex, ...newCodex.filter((c) => !prevCodex.some((e) => (e as { key: string }).key === c.key))];

              await updateGameState(sessionId, ownerId, {
                currentLocationId: (stateChanges as { locationId?: string }).locationId ?? session.currentLocationId,
                timeOfDay: (stateChanges as { timeOfDay?: string }).timeOfDay ?? session.timeOfDay,
                weather: (stateChanges as { weather?: string }).weather ?? session.weather,
                globalFlags: flagPatch
                  ? { ...session.globalFlags, ...flagPatch }
                  : undefined,
                npcStates: storedNpcStateRest,
                achievements: mergedAch,
                relationships: mergedRels,
                codex: mergedCodex,
              });
            }

            const historyCount = await countHistoryEntries(sessionId);
            if (historyCount >= SUMMARIZE_THRESHOLD) {
              const oldEntries = await getOldestHistoryEntries(sessionId, ENTRIES_TO_COMPRESS);
              const summary = await summarizeHistory(
                oldEntries.map((e) => ({
                  role: e.role as "user" | "assistant",
                  content: e.content,
                  turnNumber: e.turnNumber,
                })),
                session.memorySummary,
                world.name
              );
              await updateGameState(sessionId, ownerId, { memorySummary: summary });
              send("memory_summary", { summary });
            }
          } catch (dbErr) {
            // DB persistence is best-effort — don't fail the game turn
            console.error("DB persistence error:", dbErr);
          }
        }
      } catch (err) {
        try {
          send("error", {
            message: err instanceof Error ? err.message : "Unknown error",
          });
        } catch {
          // Stream already closed by the client.
        }
      } finally {
        grant.release();
        try {
          controller.close();
        } catch {
          // Stream already closed by the client.
        }
      }
    },
  });

  return respond(new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  }));
}
