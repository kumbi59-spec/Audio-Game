import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";
export const metadata: Metadata = {
  title: "Accessible D&D Alternative",
  description: "Looking for an accessible D&D alternative? EchoQuest delivers narrated, voice-ready tabletop adventures.",
  alternates: { canonical: `${SITE_URL}/seo/accessible-dnd-alternative` },
};

export default function Page() { return <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}><SiteHeader /><main className="mx-auto max-w-3xl px-6 py-10"><h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Accessible D&amp;D alternative</h1><p className="mt-4" style={{ color: "var(--text-muted)" }}>EchoQuest gives you GM-style narration, open-ended choices, and screen-reader friendly controls without needing a visual battle map.</p><Link href="/campaigns" className="mt-6 inline-block hover:underline" style={{ color: "var(--accent)" }}>Explore campaigns →</Link></main></div>; }
