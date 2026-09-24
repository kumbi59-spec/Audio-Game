import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createLobby } from "@/lib/multiplayer/lobbies";

// POST /api/game/lobbies — create a multiplayer lobby hosted by the caller.
// Returns the server-generated lobby id and the invite code to share.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to host a multiplayer lobby." }, { status: 401 });
  }

  const decision = await consumeRateLimit({
    key: `lobby:create:user:${session.user.id}`,
    limit: 10,
    windowSeconds: 60 * 60,
  });
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "You're creating lobbies too quickly. Please try again later." },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  const lobby = await createLobby(session.user.id);
  return NextResponse.json(lobby, { status: 201 });
}
