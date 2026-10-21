import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SEO_CAMPAIGNS } from "@/lib/seo-campaigns";
import { BRAND_TTRPG } from "@/lib/seo/brand";
import { OFFICIAL_CAMPAIGNS, OFFICIAL_CAMPAIGN_COUNT } from "@/lib/seo/official-campaigns";
import { socialMetadata } from "@/lib/seo/social";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const DESCRIPTION = `All ${OFFICIAL_CAMPAIGN_COUNT} official ${BRAND_TTRPG} campaigns are free to play, from sci-fi and cyberpunk to dark fantasy and horror. Pick a world and start.`;

export const metadata: Metadata = {
  title: "Free Audio RPG Campaigns",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/campaigns` },
  ...socialMetadata({
    title: `Free Audio RPG Campaigns | ${BRAND_TTRPG}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/campaigns`,
    type: "website",
  }),
};

export default function CampaignsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold text-foreground">Free official campaigns</h1>
        <p className="mt-3 text-base text-muted">
          All {OFFICIAL_CAMPAIGN_COUNT} official campaigns are free to play, and you don&rsquo;t need
          an account to start. Pick a world, create a character, and the AI Game Master takes it from
          there.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {OFFICIAL_CAMPAIGNS.map((campaign) => (
            <li key={campaign.id} className="rounded-xl border p-5 border-border bg-surface">
              <h2 className="text-xl font-semibold text-foreground">{campaign.name}</h2>
              <p className="mt-2 text-sm text-muted">{campaign.summary}</p>
              <Link
                href={campaign.playHref}
                className="mt-4 inline-block text-sm font-semibold hover:underline text-accent"
              >
                Play free<span className="sr-only">: {campaign.name}</span> <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-2xl font-semibold text-foreground">Hear a sample session</h2>
        <p className="mt-3 text-base text-muted">
          These pages include a sample narration transcript and a campaign hook.
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {SEO_CAMPAIGNS.map((campaign) => (
            <li key={campaign.slug} className="rounded-xl border p-5 border-border bg-surface">
              <p className="text-xs uppercase text-accent">{campaign.intentKeyword}</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{campaign.name}</h3>
              <p className="mt-2 text-sm text-muted">{campaign.hook}</p>
              <Link href={`/campaigns/${campaign.slug}`} className="mt-4 inline-block text-sm font-semibold hover:underline text-accent">
                View campaign page<span className="sr-only">: {campaign.name}</span> <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
