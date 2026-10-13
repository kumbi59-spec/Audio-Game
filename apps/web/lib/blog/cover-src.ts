/**
 * Image src for a blog post's cover. Inline data: covers are served through
 * /api/blog/cover/[id] so the page HTML carries a short URL instead of the
 * whole base64 image; any other link is used as-is.
 */
export function blogCoverSrc(postId: string, coverImageUrl: string): string {
  return coverImageUrl.startsWith("data:") ? `/api/blog/cover/${postId}` : coverImageUrl;
}
