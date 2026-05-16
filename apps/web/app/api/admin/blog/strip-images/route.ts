import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { stripContentImages, hasContentImage } from "@/lib/blog/strip-images";

export const dynamic = "force-dynamic";

/**
 * GET — how many posts still carry legacy embedded images.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.blogPost.findMany({ select: { content: true } });
  const withImages = posts.filter((p) => hasContentImage(p.content)).length;
  return NextResponse.json({ total: posts.length, withImages });
}

/**
 * POST — strip every embedded ![](…) / <img> from stored post bodies.
 *
 * Unlike a force re-seed (which overwrites title/excerpt/content from the
 * canonical POSTS array and would clobber manual edits), this only removes
 * images and leaves all other content untouched. Idempotent: posts with no
 * embedded image are skipped, so it's safe to run repeatedly.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.blogPost.findMany({ select: { id: true, content: true } });

  let cleaned = 0;
  for (const p of posts) {
    if (!hasContentImage(p.content)) continue;
    const stripped = stripContentImages(p.content);
    if (stripped === p.content) continue;
    await prisma.blogPost.update({
      where: { id: p.id },
      data: { content: stripped },
      select: { id: true },
    });
    cleaned += 1;
  }

  return NextResponse.json({ status: "ok", total: posts.length, cleaned });
}
