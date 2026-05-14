import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { generateBlogCoverArt, blogCoverProviderDiagnostic } from "@/lib/ai/blog-cover-gen";

export const dynamic = "force-dynamic";
// Generating 20+ covers in series can blow Render's 30s function timeout,
// so the route processes one post per request and returns the next-id the
// caller should hit. The admin UI loops these calls client-side.
export const maxDuration = 60;

/**
 * GET /api/admin/blog/covers
 *
 * List blog posts with their cover-art status + the provider config
 * health. Used by the admin UI to drive the bulk-generate loop.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, slug: true, coverImageUrl: true, publishedAt: true },
  });

  const summary = {
    total: posts.length,
    withCover: posts.filter((p) => !!p.coverImageUrl).length,
    withoutCover: posts.filter((p) => !p.coverImageUrl).length,
  };

  return NextResponse.json({
    summary,
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      hasCover: !!p.coverImageUrl,
      publishedAt: p.publishedAt,
    })),
    configError: blogCoverProviderDiagnostic(),
  });
}

/**
 * POST /api/admin/blog/covers
 *
 * Generate the next missing cover. Pass `?force=true` to regenerate the
 * next post regardless of existing cover. The route processes one post
 * per call to stay inside the function timeout; the admin UI loops by
 * re-POSTing until the response reports `done: true`.
 *
 * Response includes `nextId` if more work remains so the caller can
 * trigger the next iteration without a separate list call.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configError = blogCoverProviderDiagnostic();
  if (configError) {
    return NextResponse.json({ status: "failed", reason: configError }, { status: 400 });
  }

  const force = new URL(req.url).searchParams.get("force") === "true";

  const next = await prisma.blogPost.findFirst({
    where: force ? {} : { coverImageUrl: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, excerpt: true, content: true },
  });

  if (!next) {
    return NextResponse.json({ status: "ok", done: true, message: "All posts already have covers." });
  }

  const result = await generateBlogCoverArt({
    title: next.title,
    excerpt: next.excerpt,
    contentSnippet: next.content.slice(0, 800),
  });

  if (result.error) {
    return NextResponse.json({
      status: "failed",
      title: next.title,
      id: next.id,
      reason: result.error,
    });
  }

  await prisma.blogPost.update({
    where: { id: next.id },
    data: { coverImageUrl: result.url },
    select: { id: true },
  });

  // Look ahead so the caller doesn't need a separate list call between
  // iterations. nextId === null means we just generated the last one.
  const remaining = await prisma.blogPost.findFirst({
    where: force ? { id: { not: next.id } } : { coverImageUrl: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });

  return NextResponse.json({
    status: "ok",
    title: next.title,
    id: next.id,
    nextId: remaining?.id ?? null,
    nextTitle: remaining?.title ?? null,
    done: !remaining,
  });
}
