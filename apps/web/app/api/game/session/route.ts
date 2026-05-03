import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ensureGuestUser, createDbCharacter } from "@/lib/db/queries/users";
import { createDbSession, getSessionWithHistory, listUserSessions } from "@/lib/db/queries/sessions";
import { getWorldById } from "@/lib/db/queries/worlds";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

const CreateSchema = z.object({
  guestId: z.string().min(1),
  worldId: z.string().min(1),
  character: z.object({
    id: z.string(),
    name: z.string(),
    class: z.string(),
    backstory: z.string(),
    stats: z.record(z.unknown()),
    inventory: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        category: z.string(),
        quantity: z.number(),
        properties: z.record(z.unknown()),
      })
    ),
  }),
});

// POST /api/game/session — create a new session in the DB
export async function POST(req: NextRequest) {
  let body: z.infer<typeof CreateSchema>;
  try {
    body = CreateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Prefer the authenticated user's id when present so logged-in players'
  // sessions are attributed to their real account (not their guest cookie).
  // Only fall back to the client-provided guestId for unauthenticated play.
  const authSession = await auth();
  const authUserId = authSession?.user?.id as string | undefined;
  const userId = authUserId ?? body.guestId;

  try {
    if (!authUserId) {
      await ensureGuestUser(body.guestId);
    }

    const dbCharacter = await createDbCharacter(userId, body.character);

    const world =
      PREBUILT_WORLDS.find((w) => w.id === body.worldId)
      ?? (await getWorldById(body.worldId))
      ?? PREBUILT_WORLDS[0];
    const startingLocationId = world.locations[0]?.id ?? null;

    const session = await createDbSession(
      body.worldId,
      userId,
      dbCharacter.id,
      startingLocationId
    );

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("Session create error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

// GET /api/game/session?sessionId=...&guestId=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("sessionId");
  const guestId = searchParams.get("guestId");

  // Same auth-first resolution as POST: prefer the logged-in user's id.
  const authSession = await auth();
  const authUserId = authSession?.user?.id as string | undefined;
  const userId = authUserId ?? guestId;

  // List sessions for the current user
  if (!sessionId && userId) {
    try {
      const sessions = await listUserSessions(userId);
      return NextResponse.json(
        sessions.map((s) => ({
          id: s.id,
          worldId: s.worldId,
          worldName: s.world.name,
          worldGenre: s.world.genre,
          lastPlayedAt: s.lastPlayedAt,
          turnCount: s.turnCount,
        }))
      );
    } catch {
      return NextResponse.json([]);
    }
  }

  if (!sessionId || !userId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const { session, history } = await getSessionWithHistory(sessionId);
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const state = session.gameState;
    return NextResponse.json({
      session: {
        id: session.id,
        worldId: session.worldId,
        characterId: session.characterId,
        status: session.status,
        turnCount: session.turnCount,
        currentLocationId: state?.currentLocationId ?? null,
        timeOfDay: state?.timeOfDay ?? "morning",
        weather: state?.weather ?? "clear",
        globalFlags: state?.globalFlags ? JSON.parse(state.globalFlags) : {},
        npcStates: state?.npcStates ? JSON.parse(state.npcStates) : {},
        memorySummary: state?.memorySummary ?? "",
      },
      history: history.map((h) => ({ role: h.role, content: h.content })),
      world: session.world,
      character: {
        ...session.character,
        stats: session.character.stats ? JSON.parse(session.character.stats) : {},
        inventory: session.character.inventory.map((item) => ({
          ...item,
          properties: JSON.parse(item.properties),
        })),
        quests: session.character.quests,
      },
    });
  } catch (err) {
    console.error("Session load error:", err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
