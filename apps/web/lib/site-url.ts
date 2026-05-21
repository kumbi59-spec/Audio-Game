const DEFAULT_SITE_URL = "https://echoquest.us";

export function getSiteUrl(): string {
  return process.env["NEXT_PUBLIC_SITE_URL"] ?? DEFAULT_SITE_URL;
}
