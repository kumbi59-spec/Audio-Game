import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";
export const metadata: Metadata = {
  title: "AI Text Adventure with Voice",
  description: "Play an AI text adventure with voice input, live narration, and adaptive story outcomes.",
  alternates: { canonical: `${SITE_URL}/seo/ai-text-adventure-with-voice` },
};

export default function Page() { return <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}><SiteHeader /><main className="mx-auto max-w-3xl px-6 py-10"><h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>AI text adventure with voice</h1><p className="mt-4" style={{ color: "var(--text-muted)" }}>Speak actions naturally, or play by keyboard. EchoQuest converts your choices into narrated story beats in real time.</p><Link href="/library" className="mt-6 inline-block hover:underline" style={{ color: "var(--accent)" }}>Start free in the library →</Link></main></div>; }
