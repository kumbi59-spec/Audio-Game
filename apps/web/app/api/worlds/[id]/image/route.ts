import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { dataUrlImageResponse } from "@/lib/worlds/data-url";

export const dynamic = "force-dynamic";

// NOT immutable: regenerating a cover rewrites World.imageUrl in place, so
// this URL can serve different bytes later. Same short TTL as the blog image
// route, with stale-while-revalidate to keep it fast in the meantime.
const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=86400";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const world = await prisma.world.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  return dataUrlImageResponse(world?.imageUrl, CACHE_CONTROL);
}
