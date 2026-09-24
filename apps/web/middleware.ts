import { NextResponse, type NextRequest } from "next/server";
import { buildScriptPolicy, cspHeaderName, cspMode, generateNonce } from "@/lib/security/csp";

/**
 * Per-request page headers:
 * - `x-pathname`, so the root layout can decide per page whether to write ad
 *   scripts into the HTML (it has no other way to know the current route);
 * - a fresh CSP nonce (`x-nonce`) and the nonce-based script policy (see
 *   lib/security/csp.ts). The policy is also set on the request so Next.js
 *   applies the nonce to its own scripts.
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);

  const mode = cspMode();
  if (mode === "off") {
    return NextResponse.next({ request: { headers } });
  }

  const nonce = generateNonce();
  const policy = buildScriptPolicy(nonce, { dev: process.env.NODE_ENV === "development" });
  const headerName = cspHeaderName(mode);
  headers.set("x-nonce", nonce);
  headers.set(headerName, policy);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set(headerName, policy);
  return res;
}

export const config = {
  // Pages only: skip API routes, Next internals and any path with a file extension.
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
