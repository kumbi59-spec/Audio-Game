import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { dataUrlImageResponse } from "@/lib/worlds/data-url";

// Serves BlogPost.coverImageUrl so the /blog index and post hero carry a
// small <img src> instead of the inline base64 cover. Published posts only,
// so a draft's artwork can't be fetched before it goes live. Same cache
// policy as /api/blog/image/[id]: a cover regenerate rewrites it in place.
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { id, publishedAt: { not: null, lte: new Date() } },
    select: { coverImageUrl: true },
  });

  return dataUrlImageResponse(post?.coverImageUrl, "public, max-age=60, stale-while-revalidate=86400");
}
