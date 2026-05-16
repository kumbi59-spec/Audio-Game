import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Serve a stored BlogPostImage as a real image response so the blog page
// HTML only carries a small <img src> URL, not megabytes of inline base64.
// Same decode pattern as /api/worlds/[id]/image. Immutable + long max-age
// because an image row's bytes never change once generated (regeneration
// creates a new row id).
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
      "Cache-Control": "public, max-age=604800, immutable",
      "Content-Length": String(buffer.byteLength),
    },
  });
}
