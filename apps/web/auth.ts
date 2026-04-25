import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
          const user = await prisma.user.create({
            data: { email, passwordHash, name: email.split("@")[0] },
          });
          return { id: user.id, email: user.email, name: user.name, tier: user.tier };
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, tier: user.tier };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as { tier?: string }).tier ?? "free";
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
