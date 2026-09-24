import { NextResponse, type NextRequest } from "next/server";

/**
 * Forwards the request path to server components as `x-pathname`, so the root
 * layout can decide per page whether to write ad scripts into the HTML (it
 * has no other way to know the current route).
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: skip API routes, Next internals and any path with a file extension.
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
