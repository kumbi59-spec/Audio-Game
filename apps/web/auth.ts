import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/email/verification";
import { effectiveTierForEmail } from "@/lib/admin";

const APP_URL = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";

// NextAuth v5 reads AUTH_SECRET; accept NEXTAUTH_SECRET as a legacy fallback
const secret = process.env["AUTH_SECRET"] ?? process.env["NEXTAUTH_SECRET"];

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
      async authorize(credentials) {
        const { email, password, mode, name: displayName } = credentials as {
          email: string;
          password: string;
          mode?: string;
          name?: string;
        };
        if (!email || !password) return null;

        try {
          if (mode === "signup") {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) throw new Error("Email already in use.");
            const passwordHash = await hash(password, 12);
            const tier = effectiveTierForEmail(email, "free");
            const resolvedName = (displayName ?? "").trim() || email.split("@")[0];

            // If no email service is configured, mark as verified immediately so
            // the banner never shows and the user isn't stuck.
            const emailVerified = process.env["RESEND_API_KEY"] ? null : new Date();

            const user = await prisma.user.create({
              data: { email, passwordHash, name: resolvedName, tier, emailVerified },
            });

            if (!emailVerified) {
              // Fire-and-forget verification email
              void (async () => {
                try {
                  const token = await createVerificationToken(email);
                  const url = `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
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
              tier,
              emailVerified: user.emailVerified,
            };
          }

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;
          const valid = await compare(password, user.passwordHash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: effectiveTierForEmail(user.email, user.tier),
            emailVerified: user.emailVerified,
          };
        } catch (err) {
          // Re-throw known user-facing errors so NextAuth passes the message through
          if (err instanceof Error && err.message === "Email already in use.") throw err;
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
        token.tierFetchedAt = Date.now();
      }
      // Re-fetch tier + emailVerified from DB at most once per hour
      const stale = !token.tierFetchedAt || Date.now() - (token.tierFetchedAt as number) > 60 * 60 * 1000;
      if (token.id && (stale || trigger === "update")) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tier: true, email: true, emailVerified: true },
        });
        if (fresh) {
          token.tier = effectiveTierForEmail(fresh.email, fresh.tier);
          token.emailVerified = fresh.emailVerified ?? null;
          token.tierFetchedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { tier?: string }).tier = token.tier as string;
      (session.user as { emailVerified?: Date | null }).emailVerified =
        token.emailVerified as Date | null;
      return session;
    },
  },
  pages: { signIn: "/auth/sign-in" },
  session: { strategy: "jwt" },
});
