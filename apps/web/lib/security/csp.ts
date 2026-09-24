/**
 * Strict, nonce-based script policy (https://csp.withgoogle.com/docs/strict-csp.html).
 *
 * Every page gets a fresh nonce from middleware. Next.js applies it to its own
 * scripts; the root layout passes it to ours (including the ad snippets and
 * the srcdoc ad iframes, which inherit this policy). 'strict-dynamic' lets
 * trusted scripts load further scripts, which ad networks rely on; the
 * `https:` and 'unsafe-inline' entries are ignored by CSP3 browsers and only
 * keep older browsers working.
 *
 * CSP_SCRIPT_POLICY controls rollout:
 *   "report-only" (default) — sent as Content-Security-Policy-Report-Only;
 *                             violations go to /api/csp-report
 *   "enforce"               — sent as Content-Security-Policy
 *   "off"                   — not sent
 */

export type CspMode = "report-only" | "enforce" | "off";

export const CSP_REPORT_PATH = "/api/csp-report";

export function cspMode(): CspMode {
  const raw = process.env["CSP_SCRIPT_POLICY"]?.trim().toLowerCase();
  return raw === "enforce" || raw === "off" ? raw : "report-only";
}

export function cspHeaderName(mode: Exclude<CspMode, "off">): string {
  return mode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
}

export function buildScriptPolicy(nonce: string, { dev = false }: { dev?: boolean } = {}): string {
  return [
    // React dev tooling needs eval; production builds don't.
    `script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    `report-uri ${CSP_REPORT_PATH}`,
  ].join("; ");
}

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
