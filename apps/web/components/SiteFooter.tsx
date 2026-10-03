"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdsterraSmartlink } from "@/components/ads/AdsterraSmartlink";

/** Pages that fill the screen and have no room for a footer. */
const NO_FOOTER = ["/play", "/campaign/"];

/** Site-wide footer, so About, Privacy and Terms are reachable from every page. */
export function SiteFooter() {
  const pathname = usePathname() ?? "";
  if (NO_FOOTER.some((p) => pathname === p || pathname.startsWith(p))) return null;
  return (
    <footer className="border-t border-border px-6 py-6 text-center text-xs text-subtle">
      <p className="mb-2">EchoQuest · audio-first interactive stories, narrated by an AI Game Master</p>
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link href="/about" className="inline-flex items-center hover:underline">About</Link>
        <Link href="/library" className="inline-flex items-center hover:underline">Library</Link>
        <Link href="/blog" className="inline-flex items-center hover:underline">Blog</Link>
        <Link href="/settings/display" className="inline-flex items-center hover:underline">Accessibility settings</Link>
        <Link href="/privacy" className="inline-flex items-center hover:underline">Privacy</Link>
        <Link href="/terms" className="inline-flex items-center hover:underline">Terms</Link>
        <Link href="/contact-us" className="inline-flex items-center hover:underline">Contact</Link>
        <AdsterraSmartlink />
      </nav>
    </footer>
  );
}
