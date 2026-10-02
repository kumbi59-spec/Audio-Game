import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolvePlayer, playerErrorResponse, withPlayerCookie } from "@/lib/auth/player-identity";
import { undoLastTurn } from "@/lib/db/queries/sessions";

const Schema = z.object({ dbSessionId: z.string().min(1).max(200) });

// POST /api/game/undo — roll a saved session back to before its last turn.
export async function POST(req: NextRequest) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_request_body" }, { status: 400 });
  }

  const identity = await resolvePlayer(req);
  if (!identity.ok) return playerErrorResponse(identity);
  const respond = (res: Response) => withPlayerCookie(res, identity.setCookie);

  try {
    const result = await undoLastTurn(body.dbSessionId, identity.player.userId);
    if (!result.ok) {
      return respond(NextResponse.json(
        { error: result.reason },
        { status: result.reason === "not_found" ? 404 : 409 },
      ));
    }
    return respond(NextResponse.json({ ok: true, character: result.character }));
  } catch (err) {
    console.error("[undo] failed:", err);
    return respond(NextResponse.json({ error: "undo_failed" }, { status: 500 }));
  }
}
