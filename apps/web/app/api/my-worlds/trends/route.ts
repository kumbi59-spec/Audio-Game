import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserWorlds } from "@/lib/db/queries/worlds";
import { getWorldsEngagementTrends } from "@/lib/db/queries/engagement-trends";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const tier = ((session.user as { tier?: string }).tier ?? "free") as keyof typeof TIER_ENTITLEMENTS;
  if (!TIER_ENTITLEMENTS[tier]?.publicPublishing) {
    return NextResponse.json({ error: "Creator plan required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysParam) ? Math.min(Math.max(7, daysParam), 90) : 30;

  const worlds = await getUserWorlds(session.user.id);
  const trends = await getWorldsEngagementTrends(
    worlds.map((w) => w.id),
    days,
  );

  return NextResponse.json({ days, trends });
}
