import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteWorld } from "@/lib/db/queries/worlds";
import { resolvePlayableWorld } from "@/lib/worlds/resolve-playable-world";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  const result = await resolvePlayableWorld(id, session?.user?.id ?? null);
  if (!result.ok) {
    const error = result.status === 404 ? "World not found." : "Not allowed to play this world.";
    return NextResponse.json({ error }, { status: result.status });
  }
  return NextResponse.json(result.world);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await deleteWorld(id, session.user.id);
  if (!result.ok) {
    const status = result.error === "World not found." ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }
  return new NextResponse(null, { status: 204 });
}
