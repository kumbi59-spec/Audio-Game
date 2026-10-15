import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND_TTRPG } from "@/lib/seo/brand";
import { getSiteUrl } from "@/lib/site-url";
import { socialMetadata } from "@/lib/seo/social";

const SITE_URL = getSiteUrl();
const TITLE = "Accessible Audio TTRPG Guides";
const DESCRIPTION = `Guides to ${BRAND_TTRPG}: playing an audio tabletop RPG with a screen reader, audio games for blind players, and running a TTRPG with an AI Game Master.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/seo` },
  ...socialMetadata({
    title: `${TITLE} | ${BRAND_TTRPG}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/seo`,
    type: "website",
  }),
};

const pages = [
  { href: "/seo/audio-games-for-the-blind", label: "Audio games for the blind" },
  { href: "/seo/ai-game-master-rpg", label: "Play a TTRPG with an AI Game Master" },
  { href: "/seo/audio-tabletop-rpg", label: "Audio tabletop RPG" },
  { href: "/seo/play-audio-rpg-with-screen-reader", label: "Play audio RPG with screen reader" },
  { href: "/seo/accessible-dnd-alternative", label: "Accessible D&D alternative" },
  { href: "/seo/ai-text-adventure-with-voice", label: "AI text adventure with voice" },
];

export default function SeoIndexPage() {
  return <div className="min-h-screen bg-bg"><SiteHeader /><main id="main-content" className="mx-auto max-w-3xl px-6 py-10"><h1 className="text-3xl font-bold text-foreground">Accessible Audio TTRPG Guides</h1><ul className="mt-6 space-y-3">{pages.map((page) => <li key={page.href}><Link className="hover:underline text-accent" href={page.href}>{page.label}</Link></li>)}</ul></main></div>;
}
