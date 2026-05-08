import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const apiBase = process.env["API_URL"] ?? "http://localhost:3001";
  let upstream: Response;
  try {
    upstream = await fetch(
      `${apiBase}/campaigns/${encodeURIComponent(campaignId)}/join-token`,
    );
  } catch {
    return NextResponse.json({ error: "API server unreachable" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: "Failed to issue lobby token" }, { status: 502 });
  }

  const data = (await upstream.json()) as { token: string };
  return NextResponse.json({ token: data.token });
}
