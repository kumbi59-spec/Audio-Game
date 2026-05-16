import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Serve a stored BlogPostImage as a real image response so the blog page
// HTML only carries a small <img src> URL, not megabytes of inline base64.
// Same decode pattern as /api/worlds/[id]/image.
//
// NOT immutable: the admin force-regen path upserts BlogPostImage.dataUrl
// in place (stable id, new bytes), so a given /api/blog/image/{id} URL can
// serve different bytes after a regen. Cache TTL is aligned to the blog
// page's own `revalidate = 60` so a regenerated image propagates to
// readers within ~a minute; stale-while-revalidate keeps it fast in the
// meantime without ever pinning a week-old image.
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const image = await prisma.blogPostImage.findUnique({
    where: { id },
    select: { dataUrl: true },
  });

  const raw = image?.dataUrl;
  if (!raw?.startsWith("data:")) {
    return new NextResponse(null, { status: 404 });
  }

  const commaIdx = raw.indexOf(",");
  if (commaIdx === -1) return new NextResponse(null, { status: 422 });

  const header = raw.slice(0, commaIdx); // e.g. "data:image/webp;base64"
  const b64 = raw.slice(commaIdx + 1);
  const contentType = header.replace("data:", "").replace(";base64", "") || "image/webp";
  const buffer = Buffer.from(b64, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
      "Content-Length": String(buffer.byteLength),
    },
  });
}
