import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/email/verification";
import { effectiveTierForUser, isAdminEmail, isVerifiedAdmin } from "@/lib/admin";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { getPublicOrigin } from "@/lib/site-url";

// NextAuth v5 reads AUTH_SECRET; accept NEXTAUTH_SECRET as a legacy fallback
const secret = process.env["AUTH_SECRET"] ?? process.env["NEXTAUTH_SECRET"];

const MIN_PASSWORD_LENGTH = 8;
const SIGNUP_IP_LIMIT = 10;
const SIGNUP_WINDOW_SECONDS = 60 * 60;
// Sign-in counts failed attempts only, so a player who types their password
// right is never throttled by their own successful sign-ins.
const SIGNIN_IP_FAIL_LIMIT = 50;
const SIGNIN_EMAIL_FAIL_LIMIT = 10;
const SIGNIN_WINDOW_SECONDS = 15 * 60;
const SIGNIN_COOLDOWN_SECONDS = 15 * 60;

/**
 * A sign-in/sign-up failure the form can explain. NextAuth only passes
 * `CredentialsSignin` errors to the client (as `code`); any other thrown error
 * reaches it as a generic "Configuration" failure.
 */
class CredentialsFormError extends CredentialsSignin {
  constructor(code: "email_in_use" | "password_too_short" | "rate_limited") {
    super();
    this.code = code;
  }
}

function signInFailureRules(ip: string, email: string) {
  const shared = {
    windowSeconds: SIGNIN_WINDOW_SECONDS,
    cooldownSeconds: SIGNIN_COOLDOWN_SECONDS,
    incrementOnFailureOnly: true,
  };
  return [
    { key: `auth:signin:ip:${ip}`, limit: SIGNIN_IP_FAIL_LIMIT, ...shared },
    { key: `auth:signin:email:${email}`, limit: SIGNIN_EMAIL_FAIL_LIMIT, ...shared },
  ];
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mode: { label: "mode", type: "text" }, // "signin" | "signup"
        name: { label: "Display name", type: "text" },
      },
      async authorize(credentials, request) {
        const { email: rawEmail, password, mode, name: displayName } = credentials as {
          email: string;
          password: string;
          mode?: string;
          name?: string;
        };
        if (typeof rawEmail !== "string" || typeof password !== "string" || !rawEmail || !password) return null;
        const email = rawEmail.trim().toLowerCase();
        const ip = getClientIp(request);

        try {
          if (mode === "signup") {
            const ipDecision = await consumeRateLimit({
              key: `auth:signup:ip:${ip}`,
              limit: SIGNUP_IP_LIMIT,
              windowSeconds: SIGNUP_WINDOW_SECONDS,
            });
            if (!ipDecision.allowed) throw new CredentialsFormError("rate_limited");
            if (password.length < MIN_PASSWORD_LENGTH) throw new CredentialsFormError("password_too_short");

            // Case-insensitive so `Owner@…` can't be registered next to `owner@…`
            const existing = await prisma.user.findFirst({
              where: { email: { equals: email, mode: "insensitive" } },
              select: { id: true },
            });
            if (existing) throw new CredentialsFormError("email_in_use");
            const passwordHash = await hash(password, 12);
            const resolvedName = (displayName ?? "").trim() || email.split("@")[0];

            // If no email service is configured, mark as verified immediately so
            // the banner never shows and the user isn't stuck. An admin address
            // is never auto-verified: whoever registers it first would become an
            // admin. The operator verifies it with the admin seed script instead.
            const emailVerified = process.env["RESEND_API_KEY"] || isAdminEmail(email) ? null : new Date();

            // Admin elevation is derived from ADMIN_EMAILS when the tier is read,
            // never stored, so it ends once the address leaves the list.
            const user = await prisma.user.create({
              data: { email, passwordHash, name: resolvedName, tier: "free", emailVerified },
              select: { id: true, email: true, name: true, tier: true, emailVerified: true },
            });

            if (!emailVerified) {
              // In NextAuth's authorize callback, `request` is internal
              // (localhost:port), so the link uses the configured public origin.
              const origin = getPublicOrigin(request);
              // Fire-and-forget verification email
              void (async () => {
                try {
                  const token = await createVerificationToken(email);
                  const url = `${origin}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
                  await sendVerificationEmail(user.email, resolvedName, url);
                } catch (err) {
                  console.warn("[auth] Failed to send verification email:", err);
                }
              })();
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              tier: effectiveTierForUser(user, user.tier),
              emailVerified: user.emailVerified,
            };
          }

          const failureRules = signInFailureRules(ip, email);
          for (const rule of failureRules) {
            const decision = await consumeRateLimit({ ...rule, wasFailure: false });
            if (!decision.allowed) throw new CredentialsFormError("rate_limited");
          }

          const select = { id: true, email: true, name: true, tier: true, passwordHash: true, emailVerified: true };
          // Exact match first, then case-insensitive so accounts created with a
          // mixed-case email before signups were normalised still sign in.
          const user =
            (await prisma.user.findUnique({ where: { email: rawEmail.trim() }, select })) ??
            (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select }));
          const valid = user?.passwordHash ? await compare(password, user.passwordHash) : false;
          if (!user || !valid) {
            for (const rule of failureRules) {
              await consumeRateLimit({ ...rule, wasFailure: true });
            }
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: effectiveTierForUser(user, user.tier),
            emailVerified: user.emailVerified,
          };
        } catch (err) {
          // Re-throw known user-facing errors so NextAuth passes the code through
          if (err instanceof CredentialsFormError) throw err;
          // Infrastructure failures (DB unreachable, etc.) — log and fall through to null
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as { tier?: string }).tier ?? "free";
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
        token.isAdmin = isVerifiedAdmin({ email: user.email, emailVerified: token.emailVerified as Date | null });
        token.tierFetchedAt = Date.now();
      }
      // Re-fetch tier + emailVerified from DB at most once every 5 minutes
      const stale = !token.tierFetchedAt || Date.now() - (token.tierFetchedAt as number) > 5 * 60 * 1000;
      if (token.id && (stale || trigger === "update")) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tier: true, email: true, emailVerified: true },
          });
          if (fresh) {
            token.tier = effectiveTierForUser(fresh, fresh.tier);
            token.isAdmin = isVerifiedAdmin(fresh);
            token.emailVerified = fresh.emailVerified ?? null;
            token.tierFetchedAt = Date.now();
          }
        } catch {
          // DB temporarily unavailable — keep stale token data, retry next request
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { tier?: string }).tier = token.tier as string;
      (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean;
      (session.user as { emailVerified?: Date | null }).emailVerified =
        token.emailVerified as Date | null;
      return session;
    },
  },
  pages: { signIn: "/auth/sign-in" },
  session: { strategy: "jwt" },
});
