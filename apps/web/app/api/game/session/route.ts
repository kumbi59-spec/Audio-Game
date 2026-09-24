import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDbCharacter } from "@/lib/db/queries/users";
import { createDbSession, getSessionWithHistory, listUserSessions } from "@/lib/db/queries/sessions";
import { resolvePlayer, playerErrorResponse, withPlayerCookie } from "@/lib/auth/player-identity";
import { resolvePlayableWorld } from "@/lib/worlds/resolve-playable-world";
import { LegacyGuestIdSchema } from "@/lib/game/request-schemas";

const CreateSchema = z.object({
  // Legacy browser-generated guest id; identity now comes from the session
  // or the server-issued guest cookie.
  guestId: LegacyGuestIdSchema,
  worldId: z.string().min(1).max(200),
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

  const identity = await resolvePlayer(req, {
    allowGuestCreation: true,
    legacyGuestId: body.guestId,
  });
  if (!identity.ok) return playerErrorResponse(identity);
  const { player, setCookie } = identity;
  const respond = (res: Response) => withPlayerCookie(res, setCookie);
  const userId = player.userId;

  try {
    const worldResult = await resolvePlayableWorld(body.worldId, userId);
    if (!worldResult.ok) {
      return respond(NextResponse.json(
        { error: worldResult.status === 404 ? "World not found" : "Not allowed to play this world" },
        { status: worldResult.status }
      ));
    }
    const world = worldResult.world;

    const dbCharacter = await createDbCharacter(userId, body.character);
    const startingLocationId = world.locations[0]?.id ?? null;

    const session = await createDbSession(
      world.id,
      userId,
      dbCharacter.id,
      startingLocationId
    );

    return respond(NextResponse.json({ sessionId: session.id }));
  } catch (err) {
    console.error("Session create error:", err);
    return respond(NextResponse.json({ error: "Failed to create session" }, { status: 500 }));
  }
}

// GET /api/game/session?sessionId=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("sessionId");

  const identity = await resolvePlayer(req, { legacyGuestId: searchParams.get("guestId") });
  if (!identity.ok) {
    return sessionId ? playerErrorResponse(identity) : NextResponse.json([]);
  }
  return withPlayerCookie(await loadForPlayer(identity.player.userId, sessionId), identity.setCookie);
}

async function loadForPlayer(userId: string, sessionId: string | null): Promise<Response> {
  // List sessions for the current user
  if (!sessionId) {
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

  try {
    const { session, history } = await getSessionWithHistory(sessionId);
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const state = session.gameState;
    const rawNpcStates: Record<string, unknown> = state?.npcStates ? JSON.parse(state.npcStates) : {};
    const { _achievements, _relationships, _codex, ...npcStates } = rawNpcStates as {
      _achievements?: unknown[];
      _relationships?: unknown[];
      _codex?: unknown[];
      [key: string]: unknown;
    };
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
        npcStates,
        memorySummary: state?.memorySummary ?? "",
        achievements: _achievements ?? [],
        relationships: _relationships ?? [],
        codex: _codex ?? [],
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
