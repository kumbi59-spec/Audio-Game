import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Accessible Audio RPG Guides",
  description: "Long-tail landing pages for accessible audio RPG and AI voice adventure intent.",
};

const pages = [
  { href: "/seo/play-audio-rpg-with-screen-reader", label: "Play audio RPG with screen reader" },
  { href: "/seo/accessible-dnd-alternative", label: "Accessible D&D alternative" },
  { href: "/seo/ai-text-adventure-with-voice", label: "AI text adventure with voice" },
];

export default function SeoIndexPage() {
  return <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}><SiteHeader /><main className="mx-auto max-w-3xl px-6 py-10"><h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Accessible Audio RPG Guides</h1><ul className="mt-6 space-y-3">{pages.map((page) => <li key={page.href}><Link className="hover:underline" style={{ color: "var(--accent)" }} href={page.href}>{page.label}</Link></li>)}</ul></main></div>;
}
