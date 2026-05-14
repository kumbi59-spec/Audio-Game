import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

// Stable build-time timestamp for routes whose source content doesn't change
// per-request. Using `new Date()` here would emit a fresh "now" on every
// sitemap fetch and signal Google that nothing is ever stable.
const BUILD_DATE = new Date("2026-05-08");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: BUILD_DATE, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/library`, lastModified: BUILD_DATE, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/blog`, lastModified: BUILD_DATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/campaigns`, lastModified: BUILD_DATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/discussion`, lastModified: BUILD_DATE, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/forks`, lastModified: BUILD_DATE, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/about`, lastModified: BUILD_DATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contact-us`, lastModified: BUILD_DATE, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, lastModified: BUILD_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: BUILD_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/seo`, lastModified: BUILD_DATE, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/seo/play-audio-rpg-with-screen-reader`, lastModified: BUILD_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/seo/accessible-dnd-alternative`, lastModified: BUILD_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/seo/ai-text-adventure-with-voice`, lastModified: BUILD_DATE, changeFrequency: "monthly", priority: 0.7 },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { publishedAt: { not: null, lte: new Date() } },
      select: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    blogRoutes = posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unavailable during static build — skip blog routes
  }

  const campaignRoutes = ["long-watch", "crimson-sands", "accessible-dd-alternative"].map((slug) => ({
    url: `${siteUrl}/campaigns/${slug}`,
    lastModified: BUILD_DATE,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...campaignRoutes, ...blogRoutes];
}
