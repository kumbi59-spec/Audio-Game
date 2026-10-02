import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import {
  LAUNCH_POSTS,
  SCHEDULED_SEED_POSTS,
  launchPublishDate,
  scheduledPublishDate,
  seedPostSlug,
} from "@/lib/blog/seed-posts";
import { stripPlaceholderImages } from "@/lib/blog/placeholder-images";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Every post is created up front; future publish dates keep a post hidden
  // from /blog, the sitemap, and the feed until its release day.
  const allPosts = [
    ...LAUNCH_POSTS.map((p) => ({ ...p, publishedAt: launchPublishDate(p.daysFromNow) })),
    ...SCHEDULED_SEED_POSTS.map((p) => ({ ...p, publishedAt: scheduledPublishDate(p.publishAt) })),
  ];

  for (const p of allPosts) {
    const slug = seedPostSlug(p.title);
    // Post art comes from BFL (cover + section images), never from markdown.
    const content = stripPlaceholderImages(p.content);
    try {
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (existing) {
        if (!force) { skipped.push(slug); continue; }
        await prisma.blogPost.update({
          where: { slug },
          data: { title: p.title, excerpt: p.excerpt, content },
          select: { id: true },
        });
        updated.push(slug);
        continue;
      }

      await prisma.blogPost.create({
        data: {
          title: p.title,
          slug,
          excerpt: p.excerpt,
          content,
          publishedAt: p.publishedAt,
          authorId: admin.id,
        },
      });
      created.push(slug);
    } catch (err) {
      console.error(`[blog/seed] Failed to create post "${slug}":`, err);
      errors.push(slug);
    }
  }

  if (errors.length > 0 && created.length === 0 && updated.length === 0 && skipped.length === 0) {
    return NextResponse.json({ error: "All posts failed to seed", errors }, { status: 500 });
  }

  return NextResponse.json({ created, updated, skipped, errors });
}
