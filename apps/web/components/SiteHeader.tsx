"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ButtonLink } from "@/components/ui/Button";

interface NavLink {
  href: string;
  label: string;
  /** Path prefix that marks this link as the current section. */
  section?: string;
}

/**
 * The one site navigation, on every page outside the game and auth flows.
 * Wide screens get a single row; narrow ones a Menu button, so a signed-in
 * player doesn't get several rows of wrapped links. The current page is
 * marked with aria-current.
 */
export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const user = session?.user;
  const isAdmin = (user as { isAdmin?: boolean } | undefined)?.isAdmin === true;

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const links: NavLink[] = [
    { href: "/library", label: "Library" },
    { href: "/blog", label: "Blog" },
    { href: "/discussion", label: "Discussion" },
    ...(user
      ? [
          { href: "/my-worlds", label: "My Worlds" },
          { href: "/worlds/new", label: "Create" },
        ]
      : []),
    { href: "/settings/display", label: "Settings", section: "/settings" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const isCurrent = (link: NavLink) => {
    const section = link.section ?? link.href;
    return pathname === link.href || pathname.startsWith(`${section}/`) || pathname === section;
  };

  const linkClass = (current: boolean) =>
    cn(
      "inline-flex items-center rounded-md px-2 hover:text-foreground hover:underline",
      current ? "font-semibold text-accent" : "text-muted",
    );

  const account = user ? (
    <Link href="/account" className={linkClass(pathname.startsWith("/account"))} aria-current={pathname.startsWith("/account") ? "page" : undefined}>
      {user.name ?? user.email ?? "Account"}
    </Link>
  ) : (
    <ButtonLink href="/auth/sign-in" size="sm">
      Sign in
    </ButtonLink>
  );

  return (
    <header className="border-b border-border bg-bg">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6" aria-label="Site navigation">
        <Link href="/" className="inline-flex items-center text-lg font-bold text-foreground hover:underline" aria-label="EchoQuest home">
          EchoQuest
        </Link>

        <div className="hidden items-center gap-2 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(isCurrent(link))} aria-current={isCurrent(link) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          {account}
        </div>

        <button
          type="button"
          className="inline-flex min-w-[44px] items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-foreground md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>

        {open && (
          <ul id={menuId} className="flex w-full flex-col border-t border-border pt-2 text-base md:hidden">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={cn(linkClass(isCurrent(link)), "w-full")} aria-current={isCurrent(link) ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-border pt-2">{account}</li>
          </ul>
        )}
      </nav>
    </header>
  );
}
