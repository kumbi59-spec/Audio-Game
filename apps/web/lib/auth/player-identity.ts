import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Server-issued player identity for game routes.
 *
 * Signed-in players are identified by their NextAuth session. Guests are
 * identified by an httpOnly cookie holding a server-generated guest id plus an
 * HMAC over it, so a client can never choose (or guess its way into) another
 * account's id. Previously the browser generated the guest id and sent it in
 * request bodies, which let any caller act as any user id.
 */

export const GUEST_COOKIE = "eq_guest";
const GUEST_ID_PREFIX = "guest_";
const GUEST_EMAIL_SUFFIX = "@echoquest.local";
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Guest ids minted by the browser before server-issued identities existed.
// They are only honoured once, to bind an existing guest row to a cookie, and
// only for rows created before this cut-off so new ids can't be claimed.
const LEGACY_GUEST_CUTOFF = new Date("2026-10-01T00:00:00Z");

const GUEST_CREATE_LIMIT = { limit: 5, windowSeconds: 60 * 60 };

export type Player = {
  userId: string;
  kind: "user" | "guest";
  tier: string;
  isAdmin: boolean;
};

export type ResolvePlayerResult =
  | { ok: true; player: Player; setCookie: string | null }
  | { ok: false; status: number; error: string; retryAfterSeconds?: number };

function signingKey(): string {
  const key = process.env["AUTH_SECRET"] ?? process.env["NEXTAUTH_SECRET"];
  if (key) return key;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set to issue guest identities");
  }
  return "dev-insecure-guest-key";
}

function sign(value: string): string {
  return createHmac("sha256", signingKey()).update(`guest:${value}`).digest("base64url");
}

export function encodeGuestCookieValue(guestId: string): string {
  return `${guestId}.${sign(guestId)}`;
}

export function decodeGuestCookieValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const guestId = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(guestId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return guestId;
}

export function guestCookieHeader(guestId: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GUEST_COOKIE}=${encodeGuestCookieValue(guestId)}; Path=/; Max-Age=${GUEST_COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

function isGuestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(GUEST_EMAIL_SUFFIX));
}

async function loadGuest(guestId: string): Promise<Player | null> {
  const row = await prisma.user.findUnique({
    where: { id: guestId },
    select: { id: true, email: true, tier: true, passwordHash: true, createdAt: true },
  });
  // A guest cookie must never resolve to a real account.
  if (!row || !isGuestEmail(row.email) || row.passwordHash) return null;
  return { userId: row.id, kind: "guest", tier: row.tier, isAdmin: false };
}

async function claimLegacyGuest(legacyGuestId: string): Promise<Player | null> {
  if (legacyGuestId.startsWith(GUEST_ID_PREFIX) || legacyGuestId.length > 64) return null;
  const row = await prisma.user.findUnique({
    where: { id: legacyGuestId },
    select: { id: true, email: true, tier: true, passwordHash: true, createdAt: true },
  });
  if (!row || !isGuestEmail(row.email) || row.passwordHash) return null;
  if (row.createdAt >= LEGACY_GUEST_CUTOFF) return null;
  return { userId: row.id, kind: "guest", tier: row.tier, isAdmin: false };
}

/**
 * Resolves the caller to a signed-in user or a server-issued guest.
 *
 * - `allowGuestCreation`: mint a new guest (rate-limited per client IP) when
 *   the caller has no identity yet. The caller must attach `setCookie`.
 * - `legacyGuestId`: a browser-generated guest id from before server-issued
 *   identities; honoured only to re-bind a pre-existing guest row.
 */
export async function resolvePlayer(
  req: Request,
  opts: { allowGuestCreation?: boolean; legacyGuestId?: string | null } = {},
): Promise<ResolvePlayerResult> {
  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (sessionUserId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, tier: true, email: true },
    });
    if (!user) return { ok: false, status: 401, error: "authentication_required" };
    const isAdmin =
      isAdminEmail(user.email) || (session.user as { isAdmin?: boolean }).isAdmin === true;
    return { ok: true, player: { userId: user.id, kind: "user", tier: user.tier, isAdmin }, setCookie: null };
  }

  const cookieGuestId = decodeGuestCookieValue(readCookie(req, GUEST_COOKIE));
  if (cookieGuestId) {
    const guest = await loadGuest(cookieGuestId);
    if (guest) return { ok: true, player: guest, setCookie: null };
  }

  if (opts.legacyGuestId) {
    const legacy = await claimLegacyGuest(opts.legacyGuestId);
    if (legacy) return { ok: true, player: legacy, setCookie: guestCookieHeader(legacy.userId) };
  }

  if (!opts.allowGuestCreation) {
    return { ok: false, status: 401, error: "identity_required" };
  }

  const ip = getClientIp(req);
  const decision = await consumeRateLimit({ key: `guest-create:ip:${ip}`, ...GUEST_CREATE_LIMIT });
  if (!decision.allowed) {
    return {
      ok: false,
      status: 429,
      error: "rate_limited",
      retryAfterSeconds: decision.retryAfterSeconds,
    };
  }

  const guestId = `${GUEST_ID_PREFIX}${randomUUID()}`;
  const created = await prisma.user.create({
    data: { id: guestId, email: `guest-${guestId}${GUEST_EMAIL_SUFFIX}`, name: "Guest Adventurer" },
    select: { id: true, tier: true },
  });
  return {
    ok: true,
    player: { userId: created.id, kind: "guest", tier: created.tier, isAdmin: false },
    setCookie: guestCookieHeader(created.id),
  };
}

/** JSON error response for a failed `resolvePlayer`. */
export function playerErrorResponse(result: Extract<ResolvePlayerResult, { ok: false }>): Response {
  const headers: Record<string, string> = {};
  if (result.retryAfterSeconds) headers["Retry-After"] = String(result.retryAfterSeconds);
  return Response.json({ error: result.error }, { status: result.status, headers });
}

/** Attaches the guest cookie (if a new one was issued) to a response. */
export function withPlayerCookie<T extends Response>(res: T, setCookie: string | null): T {
  if (setCookie) res.headers.append("Set-Cookie", setCookie);
  return res;
}
