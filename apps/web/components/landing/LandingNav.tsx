"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function LandingNav() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-4" aria-label="Site navigation">
      <span className="text-lg font-bold" style={{ color: "var(--text)" }}>EchoQuest</span>
      <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/library" className="hover:underline">Library</Link>
        <Link href="/blog" className="hover:underline">Blog</Link>
        {session?.user ? (
          <>
            <Link href="/my-worlds" className="hover:underline">My Worlds</Link>
            {(session.user as { isAdmin?: boolean }).isAdmin && (
              <Link href="/admin" className="hover:underline" style={{ color: "var(--accent)" }}>Admin</Link>
            )}
            <span style={{ opacity: 0.4 }}>|</span>
            <Link href="/account" className="hover:underline">{session.user.name ?? session.user.email}</Link>
          </>
        ) : (
          <Link
            href="/auth/sign-in"
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
