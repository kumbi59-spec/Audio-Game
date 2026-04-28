import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { effectiveTierForEmail } from "@/lib/admin";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mode: { label: "mode", type: "text" }, // "signin" | "signup"
      },
      async authorize(credentials) {
        const { email, password, mode } = credentials as { email: string; password: string; mode?: string };
        if (!email || !password) return null;

        if (mode === "signup") {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) throw new Error("Email already in use.");
          const passwordHash = await hash(password, 12);
          const tier = effectiveTierForEmail(email, "free");
          const user = await prisma.user.create({
            data: { email, passwordHash, name: email.split("@")[0], tier },
          });
          // Fire-and-forget — don't block sign-in if email fails
          void sendWelcomeEmail(user.email, user.name ?? user.email.split("@")[0]!);
          return { id: user.id, email: user.email, name: user.name, tier };
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as { tier?: string }).tier ?? "free";
        token.tierFetchedAt = Date.now();
      }
      // Re-fetch tier from DB at most once per hour so Stripe upgrades
      // propagate without requiring a sign-out/sign-in cycle.
      const stale = !token.tierFetchedAt || Date.now() - (token.tierFetchedAt as number) > 60 * 60 * 1000;
      if (token.id && (stale || trigger === "update")) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tier: true, email: true },
        });
        if (fresh) {
          token.tier = effectiveTierForEmail(fresh.email, fresh.tier);
          token.tierFetchedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { tier?: string }).tier = token.tier as string;
      return session;
    },
  },
  pages: { signIn: "/auth/sign-in" },
  session: { strategy: "jwt" },
});
