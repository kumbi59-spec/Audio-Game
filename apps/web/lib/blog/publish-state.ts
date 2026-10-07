export type PublishState = "draft" | "scheduled" | "published";

/**
 * Where a post stands for readers. A post with a future `publishedAt` is
 * scheduled: it stays off /blog, the sitemap and the feed, and its page 404s
 * for everyone but admins, until that moment passes.
 */
export function publishState(publishedAt: Date | string | null, now: Date = new Date()): PublishState {
  if (publishedAt === null) return "draft";
  return new Date(publishedAt).getTime() <= now.getTime() ? "published" : "scheduled";
}
