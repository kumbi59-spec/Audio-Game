import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Accessible Audio TTRPG Guides",
  description:
    "Guides to EchoQuest TTRPG: audio games for blind players, playing an RPG with an AI Game Master, screen-reader play and audio tabletop adventures.",
  alternates: { canonical: `${getSiteUrl()}/seo` },
};

const pages = [
  { href: "/seo/audio-games-for-the-blind", label: "Audio games for the blind: an accessible TTRPG" },
  { href: "/seo/ai-game-master-rpg", label: "AI Game Master RPG: play a TTRPG without a DM" },
  { href: "/seo/audio-tabletop-rpg", label: "Audio tabletop RPG: interactive audio stories you play" },
  { href: "/seo/play-audio-rpg-with-screen-reader", label: "Play audio RPG with screen reader" },
  { href: "/seo/accessible-dnd-alternative", label: "Accessible D&D alternative" },
  { href: "/seo/ai-text-adventure-with-voice", label: "AI text adventure with voice" },
];

export default function SeoIndexPage() {
  return <div className="min-h-screen bg-bg"><SiteHeader /><main id="main-content" className="mx-auto max-w-3xl px-6 py-10"><h1 className="text-3xl font-bold text-foreground">Accessible Audio TTRPG Guides</h1><ul className="mt-6 space-y-3">{pages.map((page) => <li key={page.href}><Link className="hover:underline text-accent" href={page.href}>{page.label}</Link></li>)}</ul></main></div>;
}
