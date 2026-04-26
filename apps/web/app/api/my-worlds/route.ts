import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserWorlds } from "@/lib/db/queries/worlds";
import { getWorldsAnalytics } from "@/lib/db/queries/analytics";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const tier = ((session.user as { tier?: string }).tier ?? "free") as keyof typeof TIER_ENTITLEMENTS;
  const worlds = await getUserWorlds(session.user.id);

  const worldIds = worlds.map((w) => w.id);
  const analyticsRows = TIER_ENTITLEMENTS[tier]?.publicPublishing
    ? await getWorldsAnalytics(worldIds)
    : [];

  const analyticsMap = new Map(analyticsRows.map((r) => [r.worldId, r]));

  return NextResponse.json(
    worlds.map((w) => {
      const analytics = analyticsMap.get(w.id);
      return {
        id: w.id,
        name: w.name,
        description: w.description,
        genre: w.genre,
        tone: w.tone,
        isPublic: w.isPublic,
        difficulty: w.libraryItem?.difficulty ?? "beginner",
        tags: w.libraryItem?.tags.split(",").map((t) => t.trim()).filter(Boolean) ?? [w.genre, w.tone],
        analytics: analytics
          ? {
              sessionCount: analytics.sessionCount,
              totalTurns: analytics.totalTurns,
              uniquePlayers: analytics.uniquePlayers,
            }
          : null,
      };
    })
  );
}
