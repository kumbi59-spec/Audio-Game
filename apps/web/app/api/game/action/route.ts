import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamGMTurn } from "@/lib/ai/gm-engine";
import { moderatePlayerInput, moderateGMOutput, SAFETY_FALLBACK } from "@/lib/safety/moderator";
import type { InMemorySession, PlayerAction } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { consumeFreeAiMinute, resetDailyMinutesIfNeeded } from "@/lib/db/queries/users";

const CharacterSchema: z.ZodType<CharacterData> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  class: z.enum(["warrior", "rogue", "mage", "ranger", "bard"]),
  roleTitle: z.string().nullish(),
  backstory: z.string(),
  stats: z.object({
    hp: z.number(),
    maxHp: z.number(),
    strength: z.number(),
    dexterity: z.number(),
    intelligence: z.number(),
    charisma: z.number(),
    level: z.number(),
    experience: z.number(),
  }),
  customStats: z.record(z.number()).optional(),
  inventory: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string(),
      category: z.enum(["weapon", "armor", "consumable", "key", "misc"]),
      quantity: z.number(),
      properties: z.record(z.unknown()),
    })
  ),
  quests: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      description: z.string(),
      status: z.enum(["active", "completed", "failed", "abandoned"]),
      objectives: z.array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
          completed: z.boolean(),
        })
      ),
      reward: z.string().nullish(),
    })
  ),
  pronouns: z.string().nullish(),
  age: z.number().nullish(),
  shortDescription: z.string().nullish(),
});

const WorldSchema: z.ZodType<WorldData> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  genre: z.string(),
  tone: z.string(),
  systemPrompt: z.string(),
  isPrebuilt: z.boolean(),
  locations: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string(),
      shortDesc: z.string(),
      ambientSound: z.string().nullish(),
      connectedTo: z.array(z.string()),
      properties: z.record(z.unknown()),
    })
  ),
  npcs: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      role: z.string(),
      personality: z.string(),
      voiceDescription: z.string(),
      relationship: z.enum(["friendly", "hostile", "neutral", "allied"]),
      isAlive: z.boolean(),
      locationId: z.string().nullish(),
    })
  ),
  classes: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
  backgrounds: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
  rulesNotes: z.string().optional(),
  imageUrl: z.string().nullish().optional(),
});

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
    status: z.string().default("active"),
    turnCount: z.number().default(0),
    currentLocationId: z.string().nullish(),
    timeOfDay: z.string().default("morning"),
    weather: z.string().default("clear"),
    globalFlags: z.record(z.unknown()).default({}),
    npcStates: z.record(z.unknown()).default({}),
    memorySummary: z.string().default(""),
    history: z.array(
      z.object({ role: z.enum(["user", "assistant"]), content: z.string() })
    ).default([]),
    narrationLog: z.array(z.unknown()).default([]),
    choices: z.array(z.string()).default([]),
    isGenerating: z.boolean().default(false),
  }),
  character: CharacterSchema,
  world: WorldSchema,
  dbSessionId: z.string().nullish(),
});

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

  const action: PlayerAction = body.action;
  const session: InMemorySession = body.session as InMemorySession;
  const character = body.character;
  const world = body.world;
  const dbSessionId = body.dbSessionId;

  const authSession = await auth();
  const user = authSession?.user?.id
    ? await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: { tier: true },
    })
    : null;

  const inputCheck = moderatePlayerInput(action.content);
  if (!inputCheck.safe) {
    return NextResponse.json(
      { error: "content_policy", message: SAFETY_FALLBACK },
      { status: 422 }
    );
  }

  if (authSession?.user?.id && user?.tier === "free") {
    await resetDailyMinutesIfNeeded(authSession.user.id, user.tier);
    const consumed = await consumeFreeAiMinute(authSession.user.id);
    if (!consumed) {
      return NextResponse.json(
        {
          error: "ai_minutes_exhausted",
          message: "You have used all free AI minutes for today. Upgrade or buy extra minutes to continue.",
        },
        { status: 402 },
      );
    }
  }
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
