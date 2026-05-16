// Blog posts must not carry markdown/HTML images in their body. All
// imagery is BFL-generated and delivered out-of-band:
//   - the hero  → BlogPost.coverImageUrl (rendered above the article)
//   - in-body   → BlogPostImage rows (interleaved between H2 sections)
// Legacy seed runs injected stock `![alt](url)` images into the content
// itself; this strips any such embedded image so only BFL imagery shows.

// Markdown image: ![alt](url "optional title")
const MD_IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
// Raw <img ...> (and any closing tag) that may have been pasted in.
const HTML_IMG_RE = /<img\b[^>]*>(?:\s*<\/img>)?/gi;
// A markdown link that wraps an image: [![alt](img)](href) → drop entirely.
const LINKED_MD_IMAGE_RE = /\[\s*!\[[^\]]*\]\([^)]*\)\s*\]\([^)]*\)/g;

/**
 * Remove every embedded image from blog markdown, then tidy the blank
 * lines the removal leaves behind so paragraphs don't collapse together
 * or sprout 3+ newline gaps.
 */
export function stripContentImages(markdown: string): string {
  return markdown
    .replace(LINKED_MD_IMAGE_RE, "")
    .replace(MD_IMAGE_RE, "")
    .replace(HTML_IMG_RE, "")
    // An image that sat alone on its own line leaves a blank line; collapse
    // any run of 3+ newlines back to the standard paragraph break.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * True if the markdown still contains an embedded image of any form.
 * Uses fresh non-global patterns — `.test()` on a /g regex is stateful
 * (advances lastIndex) and would give wrong answers across calls.
 */
export function hasContentImage(markdown: string): boolean {
  return (
    /!\[[^\]]*\]\([^)]*\)/.test(markdown) ||
    /<img\b[^>]*>/i.test(markdown)
  );
}
