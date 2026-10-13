import { NextResponse } from "next/server";
import { z } from "zod";

// Stored cover art (World.imageUrl, BlogPost.coverImageUrl, BlogPostImage.dataUrl)
// is kept as inline data: URLs and served from our own origin by the image
// routes. Anything served there would run on the site's origin, so these
// helpers decide which payloads are allowed in and what goes back out.

/** Types the image routes will serve. SVG is only here for the app's own generated fallback covers. */
const SERVABLE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

// No scripts, no plugins, no same-origin access, even if a stored SVG carries
// a <script> or someone opens the image URL directly as a document.
const IMAGE_SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
  "X-Content-Type-Options": "nosniff",
};

export interface DecodedDataUrl {
  contentType: string;
  bytes: Buffer;
}

/**
 * Decodes a data: URL. Handles both base64 payloads (AI covers,
 * `data:image/webp;base64,...`) and percent-encoded ones (the SVG fallback,
 * `data:image/svg+xml;charset=utf-8,%3Csvg...`). Returns null when the URL is
 * malformed.
 */
export function decodeDataUrl(raw: string): DecodedDataUrl | null {
  if (!raw.startsWith("data:")) return null;
  const commaIdx = raw.indexOf(",");
  if (commaIdx === -1) return null;

  const [mime = "", ...params] = raw.slice("data:".length, commaIdx).split(";").map((p) => p.trim());
  const payload = raw.slice(commaIdx + 1);
  const isBase64 = params.some((p) => p.toLowerCase() === "base64");

  let bytes: Buffer;
  if (isBase64) {
    bytes = Buffer.from(payload, "base64");
  } else {
    try {
      bytes = Buffer.from(decodeURIComponent(payload), "utf-8");
    } catch {
      return null;
    }
  }
  return { contentType: mime.toLowerCase(), bytes };
}

/** Raster type from the file's magic bytes, for covers stored under a generic type. */
function sniffRasterType(bytes: Buffer): string | null {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  const ascii = bytes.subarray(0, 12).toString("latin1");
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return "image/gif";
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  if (ascii.slice(4, 8) === "ftyp" && /^avi[fs]$/.test(ascii.slice(8, 12))) return "image/avif";
  return null;
}

/**
 * Serves a stored data: URL as an image response. Only allowlisted image
 * types go out (anything else, such as data:text/html, is refused with 415),
 * and every response carries a sandboxing CSP and nosniff.
 */
export function dataUrlImageResponse(raw: string | null | undefined, cacheControl: string): NextResponse {
  if (!raw?.startsWith("data:")) {
    return new NextResponse(null, { status: 404, headers: IMAGE_SECURITY_HEADERS });
  }
  const decoded = decodeDataUrl(raw);
  if (!decoded) return new NextResponse(null, { status: 422, headers: IMAGE_SECURITY_HEADERS });

  const contentType = SERVABLE_IMAGE_TYPES.has(decoded.contentType)
    ? decoded.contentType
    : sniffRasterType(decoded.bytes);
  if (!contentType) return new NextResponse(null, { status: 415, headers: IMAGE_SECURITY_HEADERS });

  return new NextResponse(decoded.bytes, {
    headers: {
      ...IMAGE_SECURITY_HEADERS,
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "Content-Length": String(decoded.bytes.byteLength),
    },
  });
}

/** Upper bound on a creator-supplied cover (a ~1.5 MB image as base64). */
export const MAX_COVER_IMAGE_URL_LENGTH = 2_000_000;

const COVER_DATA_URL_RE = /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/;

/** An http(s) link, or a base64 raster image data: URL. */
export function isAllowedCoverImageUrl(value: string): boolean {
  if (value.length > MAX_COVER_IMAGE_URL_LENGTH) return false;
  if (value.startsWith("data:")) return COVER_DATA_URL_RE.test(value);
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/** Optional creator-supplied cover image. An empty string means "generate one". */
export const CoverImageUrlSchema = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || isAllowedCoverImageUrl(v),
    "Cover image must be an https:// link or a PNG, JPEG, WebP, GIF or AVIF image.",
  );
