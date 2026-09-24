import { auth } from "@/auth";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

const LIMITS = {
  thread: { user: 5, ip: 10, windowSeconds: 60 * 60 },
  comment: { user: 30, ip: 60, windowSeconds: 60 * 60 },
} as const;

/**
 * Shared gate for discussion writes: a verified signed-in author, then
 * per-user and per-IP rate limits.
 */
export async function authorizeDiscussionWrite(
  req: Request,
  kind: keyof typeof LIMITS,
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const emailVerified = Boolean((session.user as { emailVerified?: Date | null }).emailVerified);
  if (!emailVerified) {
    return { ok: false, response: Response.json({ error: "Email not verified" }, { status: 403 }) };
  }

  const limits = LIMITS[kind];
  for (const key of [`discussion:${kind}:user:${session.user.id}`, `discussion:${kind}:ip:${getClientIp(req)}`]) {
    const limit = key.includes(":user:") ? limits.user : limits.ip;
    const decision = await consumeRateLimit({ key, limit, windowSeconds: limits.windowSeconds });
    if (!decision.allowed) {
      return {
        ok: false,
        response: Response.json(
          { error: "You're posting too quickly. Please try again later." },
          { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
        ),
      };
    }
  }
  return { ok: true, userId: session.user.id };
}
