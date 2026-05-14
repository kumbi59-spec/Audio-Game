import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://echoquest.app";

export const metadata: Metadata = {
  title: "About EchoQuest",
  description:
    "EchoQuest is an audio-first AI tabletop RPG built so blind, low-vision, and sighted players can share the same adventures. Learn what we make, who it's for, and how we got here.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About EchoQuest",
    description:
      "An audio-first AI tabletop RPG built so blind, low-vision, and sighted players can share the same adventures.",
    url: `${SITE_URL}/about`,
    type: "article",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
          About EchoQuest
        </h1>
        <p className="mt-4 text-base" style={{ color: "var(--text-muted)" }}>
          EchoQuest is an audio-first AI tabletop role-playing game. We make
          the experience of running a campaign with a Dungeon Master
          available to anyone, on demand, with no group to assemble and no
          battle map to see. Every scene is narrated aloud, every menu is
          reachable by keyboard, and every interaction is designed to work
          for blind and low-vision players from the first scene to the last.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          What we make
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          The product is a browser-based RPG platform with a live AI Game
          Master powered by Anthropic&rsquo;s Claude. You pick a world —
          official campaigns or one you uploaded yourself — create a
          character, and the AI narrates a campaign that reacts to anything
          you say or type. Combat, social encounters, exploration, and
          mystery scenes are all resolved in plain language; you never need
          to touch a token, a grid, or a dice tower.
        </p>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          The free tier lets you play three official campaigns with the
          browser&rsquo;s built-in text-to-speech and sixty AI minutes per
          day. Paid tiers unlock ElevenLabs premium narration, unlimited
          campaigns, uploading your own Game Bible PDF, and the World Builder
          Wizard for creating publishable worlds.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Why audio-first
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          Most digital tabletop tools were designed around a visual battle
          map. Screen readers can announce a character sheet but they
          can&rsquo;t describe a tactical grid in a way you can play from.
          Most narrative-driven games bury scene text inside UI chrome that
          assistive technology can&rsquo;t reach. The result is that
          millions of blind and low-vision players who love the idea of a
          tabletop RPG can&rsquo;t actually run one.
        </p>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          EchoQuest inverts the architecture. The narration is the interface.
          Scenes are described aloud — through your browser&rsquo;s voice on
          the free tier, through ElevenLabs on premium plans — and your
          replies go in through a single text or voice input. Live regions,
          skip links, and tested compatibility with NVDA, JAWS, VoiceOver,
          and TalkBack ship by default. Accessibility features are never
          paywalled.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Who it&rsquo;s for
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-base" style={{ color: "var(--text-muted)" }}>
          <li>
            <strong style={{ color: "var(--text)" }}>Blind and low-vision players</strong> who have wanted to run a real tabletop-style campaign without depending on a sighted friend to GM.
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>Solo players</strong> who love RPG storytelling but can&rsquo;t schedule a regular group.
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>Writers and worldbuilders</strong> who want to play inside their own settings to pressure-test them before running for a table.
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>GMs taking a break</strong> who want to play someone else&rsquo;s campaign — including ones they&rsquo;d normally have to run themselves.
          </li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          How a turn works
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-base" style={{ color: "var(--text-muted)" }}>
          <li>The AI Game Master narrates the current scene through TTS.</li>
          <li>You respond in natural language — by voice, by keyboard, or by picking one of the suggested actions.</li>
          <li>EchoQuest sends your action plus the current campaign state to Claude, which decides the consequence and proposes any state changes (HP, items, quest progress, relationships).</li>
          <li>A deterministic reducer applies those state changes — the AI proposes, the engine disposes — so the world stays consistent across turns.</li>
          <li>The next scene is narrated. The cycle continues until you save, share a recap, or finish the campaign.</li>
        </ol>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Our approach to AI
        </h2>
        <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
          The AI Game Master is a narrative engine, not a chatbot. Inventory,
          quests, relationships, and stats are tracked by code — Claude
          proposes mutations, the engine applies them. That separation is
          what keeps the dragon you killed in act one dead, the gold you
          spent gone, and the NPC you betrayed in scene three remembering it
          in scene seven. We don&rsquo;t use your session content to train
          any model, and we don&rsquo;t share it with third parties for ad
          targeting.
        </p>

        <h2 className="mt-10 text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Where to go next
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/library" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            Open the adventure library
          </Link>
          <Link href="/campaigns" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Browse campaign worlds
          </Link>
          <Link href="/blog" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Read the blog
          </Link>
          <Link href="/contact-us" className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
