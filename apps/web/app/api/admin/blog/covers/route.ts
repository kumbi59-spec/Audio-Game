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
 * Generate one cover per call. The route processes one post and returns
 * the next-id so the caller can re-POST without a separate list call.
 *
 * Two cursoring strategies, picked by query params:
 *
 *   ?id=<postId>
 *     Process this specific post. Required for the `force=true` loop —
 *     without it the server keeps re-finding the oldest post by
 *     createdAt and regenerates it over and over.
 *
 *   ?force=true       (no id)
 *     First iteration only — process the oldest post overall. Subsequent
 *     calls in the loop must pass the nextId from the prior response.
 *
 *   (no params)
 *     Process the oldest post whose coverImageUrl is null. Self-cursoring
 *     because each successful generation flips the cover, so the next
 *     "oldest null" is a different post.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const configError = blogCoverProviderDiagnostic();
  if (configError) {
    return NextResponse.json({ status: "failed", reason: configError }, { status: 400 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";
  const explicitId = url.searchParams.get("id");

  let target: { id: string; title: string; excerpt: string; content: string } | null;
  if (explicitId) {
    target = await prisma.blogPost.findUnique({
      where: { id: explicitId },
      select: { id: true, title: true, excerpt: true, content: true },
    });
    if (!target) {
      return NextResponse.json({ status: "failed", reason: `No blog post with id=${explicitId}` }, { status: 404 });
    }
  } else {
    target = await prisma.blogPost.findFirst({
      where: force ? {} : { coverImageUrl: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, excerpt: true, content: true },
    });
  }

  if (!target) {
    return NextResponse.json({ status: "ok", done: true, message: "All posts already have covers." });
  }

  const result = await generateBlogCoverArt({
    title: target.title,
    excerpt: target.excerpt,
    contentSnippet: target.content.slice(0, 800),
  });

  if (result.error) {
    return NextResponse.json({
      status: "failed",
      title: target.title,
      id: target.id,
      reason: result.error,
    });
  }

  // Capture the createdAt of the just-processed post so we can advance
  // past it on the next force iteration. Required because force mode
  // doesn't have the "coverImageUrl is null" predicate to self-advance.
  const processed = await prisma.blogPost.update({
    where: { id: target.id },
    data: { coverImageUrl: result.url },
    select: { id: true, createdAt: true },
  });

  const remaining = await prisma.blogPost.findFirst({
    where: force
      ? { createdAt: { gt: processed.createdAt }, id: { not: processed.id } }
      : { coverImageUrl: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });

  return NextResponse.json({
    status: "ok",
    title: target.title,
    id: target.id,
    nextId: remaining?.id ?? null,
    nextTitle: remaining?.title ?? null,
    done: !remaining,
  });
}
