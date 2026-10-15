import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { serializeJsonLd } from "@/lib/blog/render-markdown";
import { seedPostSlug } from "@/lib/blog/seed-posts/types";
import { BRAND_TTRPG } from "@/lib/seo/brand";
import { guideBreadcrumbJsonLd, guideFaqJsonLd, type GuideFaq } from "@/lib/seo/guide-jsonld";
import { getSiteUrl } from "@/lib/site-url";
import { socialMetadata } from "@/lib/seo/social";

const PATH = "/seo/ai-game-master-rpg";
const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  title: "AI Game Master RPG: Play Without a DM",
  description:
    "Play a tabletop RPG with an AI Game Master, solo and on demand. EchoQuest TTRPG narrates every scene, runs the world's rules and answers anything you say.",
  alternates: { canonical: `${SITE_URL}${PATH}` },
  ...socialMetadata({
    title: `AI Game Master RPG | ${BRAND_TTRPG}`,
    description:
      "A tabletop RPG run by an AI Game Master: no DM, no schedule, fully narrated and screen-reader accessible.",
    url: `${SITE_URL}${PATH}`,
    type: "article",
  }),
};

const FAQS: GuideFaq[] = [
  {
    question: "Can I play a TTRPG without a DM?",
    answer:
      "Yes. In EchoQuest the AI Game Master does the DM's job: it describes scenes, plays every character you meet, calls for skill checks and resolves what you try. You can play solo whenever you like.",
  },
  {
    question: "What AI runs the Game Master?",
    answer:
      "EchoQuest's Game Master is powered by Anthropic's Claude. Your sessions are not used to train any AI model.",
  },
  {
    question: "Can the AI Game Master run my own world?",
    answer:
      "On the Storyteller tier and above you can upload a PDF of your setting, rules or campaign notes. The Game Master uses it as its source of truth, so house rules and homebrew lore work like the official campaigns.",
  },
];

const RELATED = [
  "How to Play D&D Solo With an AI Dungeon Master",
  "What Is an AI Game Master? Everything You Need to Know",
];

export default function Page() {
  return (
    <div className="min-h-screen bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(guideBreadcrumbJsonLd("AI game master RPG", PATH)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(guideFaqJsonLd(PATH, FAQS)) }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold text-foreground">
          Play a tabletop RPG with an AI Game Master
        </h1>
        <p className="mt-4 text-base text-muted">
          {BRAND_TTRPG} is a screen-reader friendly, AI-narrated audio tabletop role-playing
          game. Instead of a human Dungeon Master, an AI Game Master runs the table: it sets
          the scene, plays the characters and decides what happens when you act.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          How the AI Game Master runs a session
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base text-muted">
          <li>It narrates each scene and offers choices, but you can say anything, not just pick one.</li>
          <li>It plays every non-player character you meet, and tracks how they feel about you.</li>
          <li>It follows the rules and lore of the world you chose, and calls for skill checks when the outcome is uncertain.</li>
          <li>It remembers what happened earlier in your campaign, so choices carry forward.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          No DM, no schedule
        </h2>
        <p className="mt-3 text-base text-muted">
          The hardest part of tabletop play is often getting everyone together, and someone
          always has to prepare and run the game. With an AI Game Master you can start a
          session in a minute, play for ten minutes or two hours, and pick up exactly where you
          left off.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          What an AI Game Master doesn&rsquo;t replace
        </h2>
        <p className="mt-3 text-base text-muted">
          A good human DM reads the table, improvises with friends and makes a night of it.
          EchoQuest isn&rsquo;t trying to replace that. It&rsquo;s for the times you want the
          story and the choices on your own terms, and it&rsquo;s fully playable by ear for
          players a battle map leaves out.
        </p>

        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mt-10 text-2xl font-semibold text-foreground">
            Common questions
          </h2>
          <dl className="mt-3 space-y-4 text-base">
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="font-semibold text-foreground">{faq.question}</dt>
                <dd className="mt-1 text-muted">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <h2 className="mt-10 text-2xl font-semibold text-foreground">
          Further reading
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base">
          {RELATED.map((title) => (
            <li key={title}>
              <Link href={`/blog/${seedPostSlug(title)}`} className="hover:underline text-accent">{title}</Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/campaigns" className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-accent-solid text-on-accent">
            Explore official campaigns
          </Link>
          <Link href="/library" className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold border-border text-foreground">
            Open the adventure library
          </Link>
        </div>
      </main>
    </div>
  );
}
