/**
 * A blog post seeded with an absolute publish date. Posts with a future
 * `publishAt` are created immediately but stay hidden from /blog, the
 * sitemap, and the RSS feed until that date passes (all three filter on
 * `publishedAt <= now`), which is how the daily release schedule works.
 */
export type ScheduledSeedPost = {
  /** YYYY-MM-DD; published at 09:00 UTC on that day. */
  publishAt: string;
  title: string;
  /** Doubles as the meta description — keep it under ~160 characters. */
  excerpt: string;
  content: string;
};

export function scheduledPublishDate(publishAt: string): Date {
  return new Date(`${publishAt}T09:00:00Z`);
}

/**
 * A seeded post's URL slug, derived from its title. Changing a title changes
 * the slug (and breaks existing links), so titles of published posts are fixed.
 */
export function seedPostSlug(title: string): string {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
