import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SEO_CAMPAIGNS } from "@/lib/seo-campaigns";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "Campaign Worlds",
  description: "Indexable campaign pages with sample AI narration transcripts and story hooks.",
  alternates: { canonical: `${SITE_URL}/campaigns` },
};

export default function CampaignsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Campaign Worlds</h1>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          Explore audio-first campaign worlds. Every page includes a sample narration transcript and a campaign hook.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {SEO_CAMPAIGNS.map((campaign) => (
            <li key={campaign.slug} className="rounded-xl border p-5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <p className="text-xs uppercase" style={{ color: "var(--accent)" }}>{campaign.intentKeyword}</p>
              <h2 className="mt-2 text-xl font-semibold" style={{ color: "var(--text)" }}>{campaign.name}</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{campaign.hook}</p>
              <Link href={`/campaigns/${campaign.slug}`} className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                View campaign page →
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
