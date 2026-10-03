import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SEO_CAMPAIGNS, getSeoCampaign } from "@/lib/seo-campaigns";
import { serializeJsonLd } from "@/lib/blog/render-markdown";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.us";

export function generateStaticParams() {
  return SEO_CAMPAIGNS.map((campaign) => ({ slug: campaign.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getSeoCampaign(slug);
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

export default async function CampaignDetailPage({ params }: Props) {
  const { slug } = await params;
  const campaign = getSeoCampaign(slug);
  if (!campaign) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Campaigns", item: `${SITE_URL}/campaigns` },
      { "@type": "ListItem", position: 3, name: campaign.name, item: `${SITE_URL}/campaigns/${campaign.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <p className="text-sm text-accent">{campaign.intentKeyword}</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{campaign.name}</h1>
        <p className="mt-4 text-base text-muted">{campaign.hook}</p>

        <section className="mt-8 rounded-xl border p-6 border-border bg-surface">
          <h2 className="text-xl font-semibold text-foreground">Sample narration transcript</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            {campaign.transcript.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-xl border p-6 border-border bg-surface">
          <h2 className="text-xl font-semibold text-foreground">Story hook</h2>
          <p className="mt-3 text-sm text-muted">{campaign.cta}</p>
          <div className="mt-5 flex gap-3">
            <Link href="/library" className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-accent-solid text-on-accent">
              Start playing
            </Link>
            <Link href="/blog" className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold border-border text-foreground">
              Read world-building guides
            </Link>
          </div>
        </section>

        {campaign.slug === "accessible-dd-alternative" && (
          <p className="mt-6 text-sm text-muted">
            Looking for a broader comparison? Read{" "}
            <Link href="/seo/accessible-dnd-alternative" className="hover:underline text-accent">
              EchoQuest as an accessible D&amp;D alternative
            </Link>{" "}
            for how the platform compares to traditional tabletop play.
          </p>
        )}
      </main>
    </div>
  );
}
