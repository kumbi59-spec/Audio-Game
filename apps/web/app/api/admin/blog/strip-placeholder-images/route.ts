import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { stripPlaceholderImages } from "@/lib/blog/placeholder-images";

export const dynamic = "force-dynamic";

/**
 * POST — permanently removes the generic world-cover SVG images that older
 * seed runs baked into post markdown, across every post (published or
 * scheduled). BFL covers and section images are stored separately and are
 * not touched. Idempotent.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.blogPost.findMany({ select: { id: true, slug: true, content: true } });
  const updated: string[] = [];

  for (const post of posts) {
    const content = stripPlaceholderImages(post.content);
    if (content !== post.content) {
      await prisma.blogPost.update({ where: { id: post.id }, data: { content } });
      updated.push(post.slug);
    }
  }

  return NextResponse.json({ ok: true, checked: posts.length, updatedCount: updated.length, updated });
}
