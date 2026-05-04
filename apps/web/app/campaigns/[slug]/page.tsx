import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SEO_CAMPAIGNS, getSeoCampaign } from "@/lib/seo-campaigns";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export function generateStaticParams() {
  return SEO_CAMPAIGNS.map((campaign) => ({ slug: campaign.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const campaign = getSeoCampaign(params.slug);
  if (!campaign) return {};
  const canonical = `${SITE_URL}/campaigns/${campaign.slug}`;
  return {
    title: `${campaign.name} — ${campaign.intentKeyword}`,
    description: `${campaign.hook} Read a sample narration transcript and start this ${campaign.genre} campaign.`,
    alternates: { canonical },
    openGraph: {
      title: `${campaign.name} | EchoQuest Campaign`,
      description: campaign.hook,
      url: canonical,
      type: "article",
    },
  };
}

export default function CampaignDetailPage({ params }: { params: { slug: string } }) {
  const campaign = getSeoCampaign(params.slug);
  if (!campaign) notFound();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <p className="text-sm" style={{ color: "var(--accent)" }}>{campaign.intentKeyword}</p>
        <h1 className="mt-2 text-3xl font-bold" style={{ color: "var(--text)" }}>{campaign.name}</h1>
        <p className="mt-4 text-base" style={{ color: "var(--text-muted)" }}>{campaign.hook}</p>

        <section className="mt-8 rounded-xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>Sample narration transcript</h2>
          <ol className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
            {campaign.transcript.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-xl border p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>Story hook</h2>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>{campaign.cta}</p>
          <div className="mt-5 flex gap-3">
            <Link href="/library" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
              Start playing
            </Link>
            <Link href="/blog" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              Read world-building guides
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
