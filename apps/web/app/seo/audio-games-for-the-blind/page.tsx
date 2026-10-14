import { GuidePage, blogHref, guideMetadata, type GuideFaq } from "@/components/seo/GuidePage";
import { BRAND_DEFINITION } from "@/lib/seo/brand";

const SLUG = "audio-games-for-the-blind";

export const metadata = guideMetadata({
  slug: SLUG,
  title: "Audio Games for the Blind: An Accessible TTRPG",
  description:
    "EchoQuest TTRPG is an audio RPG built for blind and low-vision players: narrated scenes, full screen-reader support and an AI Game Master. Free to start.",
});

const FAQS: GuideFaq[] = [
  {
    question: "Can a blind player play EchoQuest without sighted help?",
    answer:
      "Yes. Every scene is narrated aloud, every menu is reachable by keyboard and voice, and status changes are announced through live regions. Sign-up, character creation and play all work with a screen reader.",
  },
  {
    question: "Which screen readers does EchoQuest support?",
    answer: "EchoQuest is tested with NVDA, JAWS, VoiceOver and TalkBack.",
  },
  {
    question: "Are accessibility features paid extras?",
    answer:
      "No. Narration, keyboard and voice control, screen-reader support and display settings are all on the Free tier. Paid plans add things like premium voices and more campaigns.",
  },
];

export default function Page() {
  return (
    <GuidePage
      slug={SLUG}
      heading="Audio games for the blind: an accessible TTRPG"
      faqs={FAQS}
      related={[
        { href: blogHref("Audio Games for Blind People: 10 Genres You Can Play Entirely by Ear"), label: "Audio games for blind people: 10 genres you can play entirely by ear" },
        { href: blogHref("Games You Can Play With a Screen Reader: NVDA, JAWS and VoiceOver Tips"), label: "Games you can play with a screen reader: NVDA, JAWS and VoiceOver tips" },
        { href: "/seo/play-audio-rpg-with-screen-reader", label: "How to play an audio RPG with a screen reader" },
      ]}
    >
      <p className="mt-4 text-base text-muted">
        {BRAND_DEFINITION} It was designed for blind and low-vision players from the first line of
        code, not adapted for them afterwards. You hear the story, you say or type what your
        character does, and an AI Game Master answers in kind.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">Why most RPGs shut blind players out</h2>
      <p className="mt-3 text-base text-muted">
        Tabletop role-playing games lean on battle maps, character sheets full of tiny boxes and
        handouts passed across a table. Video game RPGs lean on minimaps, inventory grids and
        cutscenes. Blind players searching for accessible RPG games usually find either a short
        list of hobby projects or mainstream games with partial screen-reader support. EchoQuest
        takes the other route: the game is the narration, so nothing important is ever only visual.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">How EchoQuest plays by ear</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-base text-muted">
        <li>Every scene is read aloud, with browser text-to-speech on the Free tier and premium narration on paid plans.</li>
        <li>You act in plain language, by voice, keyboard or text. There are no preset choice menus to hunt through.</li>
        <li>Single-key shortcuts let you replay narration or open your character sheet without leaving the scene.</li>
        <li>Clues and descriptions come with sounds and textures, not only colours and shapes.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">For low-vision players too</h2>
      <p className="mt-3 text-base text-muted">
        If you play with some sight, the display settings add high contrast, large text and reduced
        motion, and they follow your operating system&rsquo;s contrast and motion preferences
        automatically. You can mix listening and reading in whatever way is comfortable.
      </p>
    </GuidePage>
  );
}
