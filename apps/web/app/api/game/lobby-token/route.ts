import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";
import { auth } from "@/auth";

// Issues an HMAC-signed lobby token identical in format to the one the API
// backend produces. Both apps share SESSION_SIGNING_KEY so the backend's
// verifySessionToken() will accept tokens minted here. Generating the token
// server-side in the web app avoids a round-trip to the API for credentials.
// The lobby still requires NEXT_PUBLIC_API_URL on the web service so the
// browser can open the /ws/lobby/:campaignId WebSocket on the API host.
function issueSessionToken(campaignId: string): string {
  const key = process.env["SESSION_SIGNING_KEY"] ?? "dev-insecure-change-me";
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${campaignId}.${nonce}`;
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // The api server uses its own SESSION_SIGNING_KEY to verify these tokens.
  // If the web service falls back to the dev default in production, every
  // token will be rejected with "Invalid auth token" — fail loudly here
  // instead of issuing a token the api will refuse.
  if (process.env.NODE_ENV === "production" && !process.env["SESSION_SIGNING_KEY"]) {
    return NextResponse.json(
      { error: "Multiplayer is not configured: SESSION_SIGNING_KEY is unset on the web service." },
      { status: 503 },
    );
  }

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  return NextResponse.json({ token: issueSessionToken(campaignId) });
}
