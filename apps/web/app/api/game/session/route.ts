import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { characterFromRow, createSessionCharacter } from "@/lib/db/queries/characters";
import { createDbSession, getSessionWithHistory, listUserSessions } from "@/lib/db/queries/sessions";
import { resolvePlayer, playerErrorResponse, withPlayerCookie } from "@/lib/auth/player-identity";
import { resolvePlayableWorld } from "@/lib/worlds/resolve-playable-world";
import { CharacterSchema, LegacyGuestIdSchema } from "@/lib/game/request-schemas";
import { parseGMResponse } from "@/lib/ai/gm-response";
import type { CharacterData } from "@/types/character";
import type { NarrationEntry } from "@/types/game";

const CreateSchema = z.object({
  // Legacy browser-generated guest id; identity now comes from the session
  // or the server-issued guest cookie.
  guestId: LegacyGuestIdSchema,
  worldId: z.string().min(1).max(200),
  character: CharacterSchema,
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

    const dbCharacter = await createSessionCharacter(userId, body.character as CharacterData);
    const startingLocationId = world.locations[0]?.id ?? null;

    const session = await createDbSession(
      world.id,
      userId,
      dbCharacter.id,
      startingLocationId
    );

    return respond(NextResponse.json({ sessionId: session.id, characterId: dbCharacter.id }));
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

    // Prebuilt worlds live in code, so load the world the way the game
    // routes do rather than from the session's relation.
    const worldResult = await resolvePlayableWorld(session.worldId, userId);
    if (!worldResult.ok) {
      return NextResponse.json({ error: "World unavailable" }, { status: worldResult.status });
    }

    const state = session.gameState;
    const rawNpcStates: Record<string, unknown> = state?.npcStates ? JSON.parse(state.npcStates) : {};
    const { _achievements, _relationships, _codex, ...npcStates } = rawNpcStates as {
      _achievements?: unknown[];
      _relationships?: unknown[];
      _codex?: unknown[];
      [key: string]: unknown;
    };

    // Rebuild the story log and the current choices from the stored turns
    // (the GM's replies are stored as its raw JSON).
    const narrationLog: NarrationEntry[] = [];
    let choices: string[] = [];
    for (const entry of history) {
      if (entry.role === "user") {
        narrationLog.push({ id: `h-${entry.id}`, text: entry.content, type: "player_action", timestamp: entry.createdAt });
      } else {
        const reply = parseGMResponse(entry.content);
        if (reply.narration) {
          narrationLog.push({ id: `h-${entry.id}`, text: reply.narration, type: "narration", timestamp: entry.createdAt });
        }
        choices = reply.choices;
      }
    }

    const character = characterFromRow(session.character);
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
        history: history.map((h) => ({ role: h.role, content: h.content })),
        narrationLog,
        choices,
        isGenerating: false,
      },
      // The game routes load the world (and its prompt) server-side; a
      // creator's system prompt never needs to reach the browser.
      world: { ...worldResult.world, systemPrompt: "" },
      character,
    });
  } catch (err) {
    console.error("Session load error:", err);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
