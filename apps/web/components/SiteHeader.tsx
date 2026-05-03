"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Shared top navigation rendered on every non-game, non-auth page so users
 * can move between Library, Blog, My Worlds, Account, Admin from anywhere.
 * Hidden inside the game shell and auth flows where it would be intrusive.
 */
export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin === true;

  function linkStyle(href: string): React.CSSProperties {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return {
      color: active ? "var(--accent)" : "var(--text-muted)",
      fontWeight: active ? 600 : 400,
    };
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3"
      aria-label="Site navigation"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
    >
      <Link
        href="/"
        className="text-lg font-bold hover:underline"
        style={{ color: "var(--text)" }}
        aria-label="EchoQuest home"
      >
        EchoQuest
      </Link>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link href="/library" className="hover:underline" style={linkStyle("/library")}>
          Library
        </Link>
        <Link href="/blog" className="hover:underline" style={linkStyle("/blog")}>
          Blog
        </Link>
        {session?.user ? (
          <>
            <Link href="/my-worlds" className="hover:underline" style={linkStyle("/my-worlds")}>
              My Worlds
            </Link>
            <Link href="/worlds/new" className="hover:underline" style={linkStyle("/worlds/new")}>
              Create
            </Link>
            <Link href="/settings/voice" className="hover:underline" style={linkStyle("/settings")}>
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="hover:underline"
                style={{ ...linkStyle("/admin"), color: "var(--accent)" }}
              >
                Admin
              </Link>
            )}
            <span aria-hidden style={{ opacity: 0.4 }}>|</span>
            <Link
              href="/account"
              className="hover:underline"
              style={linkStyle("/account")}
              aria-label="Account"
            >
              {session.user.name ?? session.user.email ?? "Account"}
            </Link>
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
