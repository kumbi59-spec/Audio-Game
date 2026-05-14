import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { generateBlogCoverArt, blogCoverProviderDiagnostic } from "@/lib/ai/blog-cover-gen";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/blog/[id]/cover
 *
 * Generate (or regenerate) a cover image for a single blog post. The
 * resulting base64 data: URL is written to BlogPost.coverImageUrl. Stays
 * inside Render's 30s function budget — BFL flux-dev typically lands in
 * 10–20s; flux-schnell on Replicate in <5s.
 *
 * Response shape mirrors the /admin/worlds/covers endpoint so the admin
 * UI can share a single "result" renderer.
 */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configError = blogCoverProviderDiagnostic();
  if (configError) {
    return NextResponse.json({ status: "failed", reason: configError }, { status: 400 });
  }

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, title: true, excerpt: true, content: true },
  });
  if (!post) return NextResponse.json({ error: "Blog post not found" }, { status: 404 });

  const result = await generateBlogCoverArt({
    title: post.title,
    excerpt: post.excerpt,
    contentSnippet: post.content.slice(0, 800),
  });

  if (result.error) {
    return NextResponse.json({ status: "failed", title: post.title, reason: result.error });
  }

  await prisma.blogPost.update({
    where: { id: post.id },
    data: { coverImageUrl: result.url },
    select: { id: true },
  });

  return NextResponse.json({ status: "ok", title: post.title });
}
