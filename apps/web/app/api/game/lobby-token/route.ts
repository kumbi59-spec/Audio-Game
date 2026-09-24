import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueLobbyToken, isValidCampaignId } from "@/lib/multiplayer/lobby-token";

// Issues a short-lived lobby token that the API service's verifyLobbyToken()
// accepts (both apps share SESSION_SIGNING_KEY). Generating it here avoids a
// round-trip to the API for credentials. The lobby still requires
// NEXT_PUBLIC_API_URL on the web service so the browser can open the
// /ws/lobby/:campaignId WebSocket on the API host.
//
// Lobby membership is not modelled yet: anyone holding a lobby link may join,
// so the token binds the caller's identity and a short expiry rather than
// proving membership.
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

  return NextResponse.json({
    token: issueLobbyToken(campaignId, session.user.id, signingKey ?? "dev-insecure-change-me"),
  });
}
