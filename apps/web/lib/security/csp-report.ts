/** Normalises CSP violation reports into a compact, query-free summary. */

export type CspViolation = {
  directive: string;
  blocked: string;
  document: string;
  source: string;
  disposition: string;
};

function str(v: unknown, max = 300): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

// Report paths/hosts only: query strings can carry tokens or personal data.
function stripQuery(url: string): string {
  const q = url.search(/[?#]/);
  return q >= 0 ? url.slice(0, q) : url;
}

function toCspViolation(r: Record<string, unknown>): CspViolation {
  return {
    directive: str(r["effective-directive"] ?? r["effectiveDirective"] ?? r["violated-directive"], 100),
    blocked: stripQuery(str(r["blocked-uri"] ?? r["blockedURL"])),
    document: stripQuery(str(r["document-uri"] ?? r["documentURL"])),
    source: stripQuery(str(r["source-file"] ?? r["sourceFile"])),
    disposition: str(r["disposition"], 20),
  };
}

export function parseCspReports(body: unknown): CspViolation[] {
  if (Array.isArray(body)) {
    return body
      .slice(0, 20)
      .map((entry) => (entry as { body?: unknown })?.body)
      .filter((b): b is Record<string, unknown> => Boolean(b) && typeof b === "object")
      .map(toCspViolation);
  }
  const report = (body as { "csp-report"?: unknown } | null)?.["csp-report"];
  return report && typeof report === "object" ? [toCspViolation(report as Record<string, unknown>)] : [];
}
