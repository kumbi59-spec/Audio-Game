import { NextResponse } from "next/server";
import { parseCspReports } from "@/lib/security/csp-report";

/**
 * Receives CSP violation reports (report-uri; legacy `application/csp-report`
 * bodies and Reporting API `application/reports+json` arrays) and logs a
 * compact summary, so the nonce-based script policy can be checked against
 * real traffic — including whatever the ad networks load — before it is
 * enforced (CSP_SCRIPT_POLICY=enforce). Logging is capped per instance so a
 * noisy page or a spammer can't flood the logs.
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_LOGS_PER_MINUTE = 120;
let windowStart = 0;
let loggedInWindow = 0;

function mayLog(): boolean {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    loggedInWindow = 0;
  }
  return loggedInWindow++ < MAX_LOGS_PER_MINUTE;
}

export async function POST(req: Request) {
  const length = Number(req.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  for (const violation of parseCspReports(body)) {
    if (!mayLog()) break;
    console.warn("[csp-violation]", JSON.stringify(violation));
  }
  return new NextResponse(null, { status: 204 });
}
