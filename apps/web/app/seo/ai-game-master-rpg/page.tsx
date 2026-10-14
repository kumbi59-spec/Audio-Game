import { GuidePage, blogHref, guideMetadata, type GuideFaq } from "@/components/seo/GuidePage";
import { BRAND_DEFINITION } from "@/lib/seo/brand";

const SLUG = "ai-game-master-rpg";

export const metadata = guideMetadata({
  slug: SLUG,
  title: "AI Game Master RPG: Play a TTRPG Without a DM",
  description:
    "No DM, no schedule? EchoQuest TTRPG gives you an AI Game Master that narrates, plays every NPC and runs the rules, solo or with friends. Free to start.",
});

const FAQS: GuideFaq[] = [
  {
    question: "Can I play a tabletop RPG without a Dungeon Master?",
    answer:
      "Yes. In EchoQuest the AI Game Master does the DM's job: it narrates the world, voices the NPCs, calls for checks and keeps track of the story, so you can play solo whenever you like.",
  },
  {
    question: "What AI runs the Game Master?",
    answer:
      "EchoQuest's Game Master is powered by Anthropic's Claude. Your session conversations are not used to train AI models.",
  },
  {
    question: "Can I use my own rules or setting?",
    answer:
      "On the Storyteller tier and above you can upload a PDF of your own setting or rules, and the AI Game Master treats it as the source of truth for your campaign.",
  },
];

export default function Page() {
  return (
    <GuidePage
      slug={SLUG}
      heading="AI Game Master RPG: play a TTRPG without a DM"
      faqs={FAQS}
      related={[
        { href: blogHref("How to Play D&D Solo With an AI Dungeon Master"), label: "How to play D&D solo with an AI Dungeon Master" },
        { href: blogHref("What Is an AI Game Master? Everything You Need to Know"), label: "What is an AI Game Master? Everything you need to know" },
        { href: "/seo/accessible-dnd-alternative", label: "An accessible D&D alternative" },
      ]}
    >
      <p className="mt-4 text-base text-muted">
        {BRAND_DEFINITION} Instead of waiting for a group to line up their calendars, you start a
        campaign with an AI Game Master that is ready whenever you are.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">What the AI Game Master does</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-base text-muted">
        <li>Narrates every scene and reacts to whatever you say, not just a list of preset options.</li>
        <li>Plays every NPC, including the ones who lie to you, bargain or hold a grudge.</li>
        <li>Calls for ability checks and sets their difficulty from what you actually describe.</li>
        <li>Remembers your campaign, so earlier choices come back to matter later.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">Playing a TTRPG without a DM</h2>
      <p className="mt-3 text-base text-muted">
        The usual answers to &ldquo;how do I play without a DM?&rdquo; are oracle tables,
        GM-less systems or one person running and playing at once. They work, but they ask you to
        do the bookkeeping. With an AI Game Master you describe what your character does and the
        GM handles the rest, the same way a human DM would at the table.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">Solo or with friends</h2>
      <p className="mt-3 text-base text-muted">
        Most players start solo. When you want company, you can open a lobby and invite friends
        into the same campaign, and the AI Game Master runs the table for everyone.
      </p>
    </GuidePage>
  );
}
