import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 600;

function escape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = getSiteUrl();

  let posts: { title: string; slug: string; excerpt: string; publishedAt: Date | null; updatedAt: Date }[] = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { publishedAt: { not: null, lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { title: true, slug: true, excerpt: true, publishedAt: true, updatedAt: true },
    });
  } catch {
    // DB unavailable — emit an empty but valid feed
  }

  const lastBuildDate = posts[0]?.updatedAt ?? new Date();

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}`;
      const pubDate = (post.publishedAt ?? post.updatedAt).toUTCString();
      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escape(post.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>EchoQuest Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Tips, updates, world-building guides, and stories from the EchoQuest team.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
