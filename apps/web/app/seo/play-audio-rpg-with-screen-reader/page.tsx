import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Play Audio RPG with Screen Reader",
  description: "EchoQuest is an audio-first AI RPG designed for screen readers, keyboard navigation, and voice-driven play.",
  alternates: { canonical: `${SITE_URL}/seo/play-audio-rpg-with-screen-reader` },
};

export default function SeoLandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Play an audio RPG with a screen reader</h1>
        <p className="mt-4" style={{ color: "var(--text-muted)" }}>
          EchoQuest is a fully narrated AI tabletop experience built for blind and visually impaired players.
          Every menu works with keyboard navigation, and every scene can be played by voice.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6" style={{ color: "var(--text-muted)" }}>
          <li>Intent match: accessible D&amp;D alternative</li>
          <li>Intent match: AI text adventure with voice controls</li>
          <li>Intent match: screen reader friendly RPG</li>
        </ul>
        <div className="mt-8 flex gap-3">
          <Link href="/campaigns" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            Browse campaign worlds
          </Link>
          <Link href="/library" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Open adventure library
          </Link>
        </div>
      </main>
    </div>
  );
}
