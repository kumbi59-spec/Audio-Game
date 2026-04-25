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

  // Return a ReadableStream of SSE events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        for await (const evt of streamGMTurn(action, session, character, world)) {
          send(evt.type, evt.data);
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
