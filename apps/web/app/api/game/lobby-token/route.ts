import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";
import { auth } from "@/auth";

// Issues an HMAC-signed lobby token identical in format to the one the API
// backend produces. Both apps share SESSION_SIGNING_KEY so the backend's
// verifySessionToken() will accept tokens minted here. Generating the token
// server-side in the web app avoids a round-trip to the API server and means
// the lobby works even when API_URL is not configured in the web environment.
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

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  return NextResponse.json({ token: issueSessionToken(campaignId) });
}
