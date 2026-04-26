import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { publishWorld, unpublishWorld } from "@/lib/db/queries/worlds";
import { getUserTier } from "@/lib/db/queries/users";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const tier = await getUserTier(session.user.id);
  if (tier !== "creator" && tier !== "enterprise") {
    return NextResponse.json({ error: "Publishing requires the Creator plan." }, { status: 403 });
  }

  const result = await publishWorld(params.id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "World not found." ? 404 : 403 });
  return NextResponse.json({ published: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const result = await unpublishWorld(params.id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "World not found." ? 404 : 403 });
  return NextResponse.json({ published: false });
}
