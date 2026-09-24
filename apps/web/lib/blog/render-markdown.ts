import { Marked } from "marked";

/**
 * Markdown renderer for blog posts. Post bodies are stored in the database and
 * rendered with dangerouslySetInnerHTML, so this renderer is the XSS boundary:
 *
 * - raw HTML (block and inline) is escaped and shown as text, never emitted;
 * - link and image URLs must use an allowlisted scheme (or be relative);
 *   anything else is rendered as plain text.
 */

const SAFE_LINK_SCHEMES = new Set(["http", "https", "mailto"]);
const SAFE_IMAGE_SCHEMES = new Set(["http", "https"]);
const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function urlScheme(url: string): string | null {
  // Browsers ignore ASCII whitespace and control characters inside a scheme
  // ("java\tscript:"), so strip them before looking for one.
  // eslint-disable-next-line no-control-regex
  const compact = url.replace(/[\u0000- \u007f]/g, "").toLowerCase();
  const match = /^([a-z][a-z0-9+.-]*):/.exec(compact);
  return match ? match[1]! : null;
}

export function isSafeUrl(url: string, kind: "link" | "image"): boolean {
  if (!url) return false;
  // Character references could smuggle a scheme past the check below
  // ("&#106;avascript:"); legitimate post URLs don't need them.
  if (/&(#|colon;|tab;|newline;)/i.test(url)) return false;
  if (kind === "image" && SAFE_DATA_IMAGE.test(url.trim())) return true;
  const scheme = urlScheme(url);
  if (scheme === null) return true; // relative URL, fragment or path
  return (kind === "link" ? SAFE_LINK_SCHEMES : SAFE_IMAGE_SCHEMES).has(scheme);
}

const blogMarked = new Marked({
  renderer: {
    html(html: string) {
      return escapeHtml(html);
    },
    link(href: string, _title: string | null | undefined, text: string) {
      // `false` falls back to marked's default rendering.
      return isSafeUrl(href, "link") ? false : text;
    },
    image(href: string, _title: string | null, text: string) {
      // marked has already escaped the alt text.
      return isSafeUrl(href, "image") ? false : text;
    },
  },
});

export async function renderBlogMarkdown(markdown: string): Promise<string> {
  return blogMarked.parse(markdown, { async: true });
}

/**
 * Serialises JSON-LD for an inline <script> tag. JSON.stringify leaves "<"
 * as-is, so a value containing "</script>" would end the tag early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
