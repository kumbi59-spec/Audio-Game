import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOpeningNarration } from "@/lib/ai/gm-engine";
import type { CharacterData } from "@/types/character";
import { resolvePlayer, playerErrorResponse, withPlayerCookie } from "@/lib/auth/player-identity";
import { authorizeAiUsage, aiUsageDenialResponse } from "@/lib/ai/usage-guard";
import { resolvePlayableWorld } from "@/lib/worlds/resolve-playable-world";
import { CharacterSchema, LegacyGuestIdSchema, WorldRefSchema } from "@/lib/game/request-schemas";
import { getOwnedSession, persistTurn } from "@/lib/db/queries/sessions";

const Schema = z.object({
  world: WorldRefSchema,
  character: CharacterSchema,
  guestId: LegacyGuestIdSchema,
  /** The saved session this opening belongs to, so a resumed game starts with it. */
  dbSessionId: z.string().max(200).nullish(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const identity = await resolvePlayer(req, {
    allowGuestCreation: true,
    legacyGuestId: body.guestId,
  });
  if (!identity.ok) return playerErrorResponse(identity);
  const { player, setCookie } = identity;
  const respond = (res: Response) => withPlayerCookie(res, setCookie);

  const worldResult = await resolvePlayableWorld(body.world.id, player.userId);
  if (!worldResult.ok) {
    return respond(NextResponse.json(
      { error: worldResult.status === 404 ? "world_not_found" : "world_forbidden" },
      { status: worldResult.status }
    ));
  }

  const usage = await authorizeAiUsage(req, player, "opening");
  if (!usage.ok) return respond(aiUsageDenialResponse(usage.denial));

  try {
    const opening = await generateOpeningNarration(
      worldResult.world,
      body.character as CharacterData
    );
    if (body.dbSessionId) {
      // Stored as turn 0 so the opening scene is there when the game is
      // resumed. Best-effort, and only into the caller's own fresh session.
      try {
        const owned = await getOwnedSession(body.dbSessionId, player.userId);
        if (owned && owned.worldId === worldResult.world.id && owned.turnCount === 0) {
          await persistTurn(owned.id, player.userId, 0, "assistant", JSON.stringify(opening));
        }
      } catch (err) {
        console.error("[opening] could not store opening:", err);
      }
    }
    return respond(NextResponse.json(opening));
  } catch (err) {
    console.error("[opening] GM error:", err);
    return respond(NextResponse.json({ error: "GM error" }, { status: 500 }));
  } finally {
    usage.grant.release();
  }
}
