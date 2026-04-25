import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamGMTurn } from "@/lib/ai/gm-engine";
import type { InMemorySession, PlayerAction } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";

const ActionSchema = z.object({
  action: z.object({
    type: z.enum(["choice", "free_text", "voice_command", "meta"]),
    content: z.string().min(1).max(2000),
    choiceIndex: z.number().optional(),
  }),
  session: z.object({
    id: z.string(),
    worldId: z.string(),
    characterId: z.string(),
    status: z.string(),
    turnCount: z.number(),
    currentLocationId: z.string().nullable(),
    timeOfDay: z.string(),
    weather: z.string(),
    globalFlags: z.record(z.unknown()),
    npcStates: z.record(z.unknown()),
    memorySummary: z.string(),
    history: z.array(
      z.object({ role: z.enum(["user", "assistant"]), content: z.string() })
    ),
    narrationLog: z.array(z.unknown()),
    choices: z.array(z.string()),
    isGenerating: z.boolean(),
  }),
  character: z.unknown(),
  world: z.unknown(),
  // Optional: if present, persist each turn to the DB session
  dbSessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof ActionSchema>;
  try {
    body = ActionSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = body.action as PlayerAction;
  const session = body.session as InMemorySession;
  const character = body.character as CharacterData;
  const world = body.world as WorldData;
  const dbSessionId = body.dbSessionId;

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

          // Collect the full narration for DB persistence
          if (evt.type === "narration_chunk" && typeof evt.data === "string") {
            fullNarration += evt.data;
          }
          if (evt.type === "state_change" && evt.data && typeof evt.data === "object") {
            stateChanges = { ...stateChanges, ...(evt.data as Record<string, unknown>) };
          }
        }

        // Persist to DB if a DB session ID was provided
        if (dbSessionId) {
          try {
            const { persistTurn, updateGameState, incrementTurnCount, countHistoryEntries } =
              await import("@/lib/db/queries/sessions");
            const { summarizeHistory, SUMMARIZE_THRESHOLD, ENTRIES_TO_COMPRESS } =
              await import("@/lib/ai/memory/summarizer");
            const { updateGameState: updateStateInDb } = await import("@/lib/db/queries/sessions");

            const newTurn = session.turnCount + 1;

            await Promise.all([
              persistTurn(dbSessionId, newTurn, "user", action.content, action.type),
              fullNarration
                ? persistTurn(dbSessionId, newTurn, "assistant", fullNarration)
                : Promise.resolve(),
              incrementTurnCount(dbSessionId),
            ]);

            // Apply state changes to DB
            if (Object.keys(stateChanges).length > 0 || session.currentLocationId !== null) {
              const flagPatch = (stateChanges as { flags?: Record<string, unknown> }).flags;
              await updateStateInDb(dbSessionId, {
                currentLocationId: (stateChanges as { locationId?: string }).locationId ?? session.currentLocationId,
                timeOfDay: (stateChanges as { timeOfDay?: string }).timeOfDay ?? session.timeOfDay,
                weather: (stateChanges as { weather?: string }).weather ?? session.weather,
                globalFlags: flagPatch
                  ? { ...session.globalFlags, ...flagPatch }
                  : undefined,
              });
            }

            // Check if we should summarize old history
            const historyCount = await countHistoryEntries(dbSessionId);
            if (historyCount >= SUMMARIZE_THRESHOLD) {
              const { getOldestHistoryEntries } = await import("@/lib/db/queries/sessions");
              const oldEntries = await getOldestHistoryEntries(dbSessionId, ENTRIES_TO_COMPRESS);
              const summary = await summarizeHistory(
                oldEntries.map((e) => ({
                  role: e.role as "user" | "assistant",
                  content: e.content,
                  turnNumber: e.turnNumber,
                })),
                session.memorySummary,
                world.name
              );
              await updateGameState(dbSessionId, { memorySummary: summary });
              send("memory_summary", { summary });
            }
          } catch (dbErr) {
            // DB persistence is best-effort — don't fail the game turn
            console.error("DB persistence error:", dbErr);
          }
        }
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
