import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Accessible D&D Alternative",
  description:
    "Looking for an accessible alternative to D&D you can play solo, by voice, or with a screen reader? EchoQuest delivers narrated, GM-led tabletop adventures without a battle map.",
  alternates: { canonical: `${SITE_URL}/seo/accessible-dnd-alternative` },
  openGraph: {
    title: "Accessible D&D Alternative | EchoQuest",
    description:
      "An accessible, AI-narrated alternative to D&D — solo or with friends, fully playable with a screen reader.",
    url: `${SITE_URL}/seo/accessible-dnd-alternative`,
    type: "article",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/seo` },
    {
      "@type": "ListItem",
      position: 3,
      name: "Accessible D&D alternative",
      item: `${SITE_URL}/seo/accessible-dnd-alternative`,
    },
  ],
};

export default function Page() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          Accessible D&amp;D alternative
        </h1>
        <p className="mt-4 text-base" style={{ color: "var(--text-muted)" }}>
          D&amp;D is built around a battle map, a Dungeon Master, and a table of friends
          who can read minis on a grid. That&rsquo;s a high accessibility bar: no GM, no
          game; can&rsquo;t see the map, can&rsquo;t play. EchoQuest is designed for the
          opposite case &mdash; a single player on any device, any time, who wants the
          narrative depth of a tabletop campaign without the logistics or the visual
          dependency.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          What you get instead of a battle map
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          Combat, exploration, and social encounters are described aloud by an AI Game
          Master powered by Claude. You respond in plain language &mdash; &ldquo;I draw
          my sword and step in front of the priest&rdquo; &mdash; and the GM resolves it
          using the rules of the world you chose. There&rsquo;s no token-pushing, no fog
          of war, no mini you can&rsquo;t see. The rules are still there; they&rsquo;re
          just narrated, not rendered.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          What you don&rsquo;t need
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base" style={{ color: "var(--text-muted)" }}>
          <li>A scheduled session or four other players who all show up.</li>
          <li>A printed rulebook or an experienced DM in the room.</li>
          <li>Vision &mdash; the entire experience is narrated and keyboard-driven.</li>
          <li>A fast computer &mdash; it runs in any modern browser, including on mobile.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          When EchoQuest isn&rsquo;t the right fit
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          If what you love about D&amp;D is the voice acting around a table, the
          friend-time, or the tactile satisfaction of rolling dice in front of people,
          EchoQuest doesn&rsquo;t replace that. It&rsquo;s for the half of tabletop play
          that&rsquo;s about <em>story and choice</em>, available solo, on demand, and
          fully accessible.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Bring your own world
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          On the Storyteller tier and above, you can upload a PDF of your own setting,
          rules, or campaign notes and start playing it immediately. The AI Game Master
          uses your document as its source of truth, so house rules and homebrew worlds
          work the same way official campaigns do.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/campaigns" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            Explore official campaigns
          </Link>
          <Link href="/library" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Open the adventure library
          </Link>
        </div>
      </main>
    </div>
  );
}
