/**
 * Older seed runs injected the built-in world-cover SVGs
 * (/images/worlds/*.svg) into blog post markdown as hero and inline images.
 * They are generic placeholders, not post art (post art comes from BFL via
 * BlogPost.coverImageUrl and BlogPostImage), so strip every one of them.
 */
const PLACEHOLDER_MD_IMAGE = /^[ \t]*!\[[^\]]*\]\(\s*(?:https?:\/\/[^)\s]*)?\/images\/worlds\/[^)\s]*\.svg[^)]*\)[ \t]*$\n?/gim;
const PLACEHOLDER_INLINE_MD_IMAGE = /!\[[^\]]*\]\(\s*(?:https?:\/\/[^)\s]*)?\/images\/worlds\/[^)\s]*\.svg[^)]*\)/gi;
const PLACEHOLDER_HTML_IMAGE = /<img\b[^>]*\bsrc=["'](?:https?:\/\/[^"']*)?\/images\/worlds\/[^"']*\.svg["'][^>]*>/gi;

/** Returns the markdown with every world-cover placeholder image removed (unchanged if none). */
export function stripPlaceholderImages(markdown: string): string {
  const stripped = markdown
    .replace(PLACEHOLDER_MD_IMAGE, "")
    .replace(PLACEHOLDER_INLINE_MD_IMAGE, "")
    .replace(PLACEHOLDER_HTML_IMAGE, "");
  return stripped === markdown ? markdown : stripped.replace(/\n{3,}/g, "\n\n");
}
