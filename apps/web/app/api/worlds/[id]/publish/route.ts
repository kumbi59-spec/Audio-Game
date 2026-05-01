import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { publishWorld, unpublishWorld } from "@/lib/db/queries/worlds";
import { getUserTier } from "@/lib/db/queries/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const { id } = await params;

  const tier = await getUserTier(session.user.id);
  if (tier !== "creator" && tier !== "enterprise") {
    return NextResponse.json({ error: "Publishing requires the Creator plan or above." }, { status: 403 });
  }

  const result = await publishWorld(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "World not found." ? 404 : 403 });
  return NextResponse.json({ published: true });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const { id } = await params;

  const result = await unpublishWorld(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "World not found." ? 404 : 403 });
  return NextResponse.json({ published: false });
}
