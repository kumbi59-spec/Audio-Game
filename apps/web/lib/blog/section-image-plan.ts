// Single source of truth for which H2 sections of a post get an
// AI-generated illustration. Both the generator (admin endpoint) and the
// renderer (/blog/[slug]) import this so an image generated for heading
// index N is placed after the matching section at render time.

export const MAX_SECTION_IMAGES = 3;

/** Extract H2 heading text (markdown `## ...` lines) in document order. */
export function extractH2Headings(markdown: string): string[] {
  const re = /^##\s+(.+?)\s*$/gm;
  const headings: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    if (m[1]) headings.push(m[1].trim());
  }
  return headings;
}

/**
 * Given the number of H2 headings in a post, return the 0-based heading
 * indices that should get an illustration. We start at heading index 1
 * (skip the first section so the article opens with prose, not an image)
 * and take every other heading, capped at MAX_SECTION_IMAGES. The
 * returned array's position is the image's stored `idx`.
 */
export function sectionImageHeadingIndices(headingCount: number): number[] {
  const out: number[] = [];
  for (let h = 1; h < headingCount && out.length < MAX_SECTION_IMAGES; h += 2) {
    out.push(h);
  }
  return out;
}

/** Convenience: full plan (idx → heading text) for a post's markdown. */
export function planSectionImages(markdown: string): { idx: number; heading: string; headingIndex: number }[] {
  const headings = extractH2Headings(markdown);
  return sectionImageHeadingIndices(headings.length).map((headingIndex, idx) => ({
    idx,
    headingIndex,
    heading: headings[headingIndex] ?? `Section ${headingIndex + 1}`,
  }));
}
