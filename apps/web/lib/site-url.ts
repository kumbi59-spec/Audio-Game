const DEFAULT_SITE_URL = "https://echoquest.us";

export function getSiteUrl(): string {
  return process.env["NEXT_PUBLIC_SITE_URL"] ?? DEFAULT_SITE_URL;
}

/**
 * Canonical public origin for URLs handed to third parties or sent by email
 * (Stripe return URLs, password-reset and verification links). It never comes
 * from Host/Origin/X-Forwarded-* headers in production, since those are
 * request-controlled; the request's own origin is only used in development
 * when no site URL is configured.
 */
export function getPublicOrigin(req: Request): string {
  const configured = process.env["NEXT_PUBLIC_SITE_URL"] ?? process.env["NEXTAUTH_URL"];
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV === "production") return new URL(DEFAULT_SITE_URL).origin;
  return new URL(req.url).origin;
}

function toOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Origins the site is legitimately served from: the configured site URL and
 * NEXTAUTH_URL (e.g. the custom domain and the Render URL), their www/apex
 * twins, and any extra origins listed in SITE_ORIGIN_ALLOWLIST.
 */
export function getAllowedSiteOrigins(req: Request): Set<string> {
  const origins = new Set<string>([getPublicOrigin(req)]);
  const sources = [
    process.env["NEXT_PUBLIC_SITE_URL"],
    process.env["NEXTAUTH_URL"],
    ...(process.env["SITE_ORIGIN_ALLOWLIST"] ?? "").split(","),
  ];
  for (const source of sources) {
    const origin = source?.trim() ? toOrigin(source.trim()) : null;
    if (!origin) continue;
    origins.add(origin);
    const url = new URL(origin);
    url.hostname = url.hostname.startsWith("www.") ? url.hostname.slice(4) : `www.${url.hostname}`;
    origins.add(url.origin);
  }
  return origins;
}

/** True when the browser-supplied Origin header is one of our own origins. */
export function isSameSiteOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  return origin !== null && getAllowedSiteOrigins(req).has(origin);
}
