import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueLobbyToken, isValidCampaignId } from "@/lib/multiplayer/lobby-token";
import { authorizeLobbyAccess } from "@/lib/multiplayer/lobbies";

// Issues a short-lived lobby token that the API service's verifyLobbyToken()
// accepts (both apps share SESSION_SIGNING_KEY). Generating it here avoids a
// round-trip to the API for credentials. The lobby still requires
// NEXT_PUBLIC_API_URL on the web service so the browser can open the
// /ws/lobby/:campaignId WebSocket on the API host.
//
// Tokens are only issued to lobby members. A non-member becomes one by
// presenting the lobby's invite code (?invite=, from the host's invite link).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // The api server uses its own SESSION_SIGNING_KEY to verify these tokens.
  // If the web service falls back to the dev default in production, every
  // token will be rejected with "Invalid auth token" — fail loudly here
  // instead of issuing a token the api will refuse.
  const signingKey = process.env["SESSION_SIGNING_KEY"];
  if (process.env.NODE_ENV === "production" && !signingKey) {
    return NextResponse.json(
      { error: "Multiplayer is not configured: SESSION_SIGNING_KEY is unset on the web service." },
      { status: 503 },
    );
  }

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }
  if (!isValidCampaignId(campaignId)) {
    return NextResponse.json({ error: "Invalid campaignId" }, { status: 400 });
  }

  const access = await authorizeLobbyAccess(
    campaignId,
    session.user.id,
    req.nextUrl.searchParams.get("invite"),
  );
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  return NextResponse.json({
    token: issueLobbyToken(campaignId, session.user.id, signingKey ?? "dev-insecure-change-me"),
    // Members may share the invite link with others.
    inviteCode: access.inviteCode,
  });
}
