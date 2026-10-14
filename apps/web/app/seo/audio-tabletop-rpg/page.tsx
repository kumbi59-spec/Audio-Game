import { GuidePage, blogHref, guideMetadata, type GuideFaq } from "@/components/seo/GuidePage";
import { BRAND_DEFINITION } from "@/lib/seo/brand";

const SLUG = "audio-tabletop-rpg";

export const metadata = guideMetadata({
  slug: SLUG,
  title: "Audio Tabletop RPG: Interactive Audio Stories You Play",
  description:
    "EchoQuest TTRPG is an audio-first tabletop RPG: a narrator tells the story, you choose what happens next by voice or keyboard. No screen needed. Free to start.",
});

const FAQS: GuideFaq[] = [
  {
    question: "What is an audio tabletop RPG?",
    answer:
      "It is a tabletop role-playing game you play by listening. A narrator describes the world, you say or type what your character does, and the story changes in response, much like an interactive audio drama.",
  },
  {
    question: "How is it different from an audiobook or podcast?",
    answer:
      "An audiobook or actual-play podcast tells the same story to everyone. In an audio RPG you are the main character, and the narrator responds to your choices, so no two playthroughs are the same.",
  },
  {
    question: "Do I need to look at the screen?",
    answer:
      "No. EchoQuest narrates every scene and accepts voice and keyboard input, so you can play with your eyes closed.",
  },
];

export default function Page() {
  return (
    <GuidePage
      slug={SLUG}
      heading="Audio tabletop RPG: interactive audio stories you play"
      faqs={FAQS}
      related={[
        { href: blogHref("Interactive Audio Stories: How They Differ From Audiobooks and Podcasts"), label: "Interactive audio stories: how they differ from audiobooks and podcasts" },
        { href: blogHref("Games You Can Play With Your Eyes Closed: Audio RPGs for Commutes, Chores and Bedtime"), label: "Games you can play with your eyes closed" },
        { href: "/campaigns/long-watch", label: "Read a sample transcript: The Long Watch" },
        { href: "/campaigns/crimson-sands", label: "Read a sample transcript: Crimson Sands" },
      ]}
    >
      <p className="mt-4 text-base text-muted">
        {BRAND_DEFINITION} Think of it as an audio drama where you are the lead, and the narrator
        is an AI Game Master who listens to what you want to do.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">Audio first, not audio added</h2>
      <p className="mt-3 text-base text-muted">
        Many games bolt narration onto a visual interface. EchoQuest starts from the narration:
        every scene is written to be heard, every menu works without a screen, and visuals are
        there only if you want them. That makes it easy to play on a commute, while cooking, or
        at the end of a day when you have had enough of screens.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">What a session sounds like</h2>
      <p className="mt-3 text-base text-muted">
        The Game Master sets a scene, you respond, and the story moves on. Each official campaign
        page includes a short written transcript of real play, so you can read a session before
        you start one.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">Choose your narrator</h2>
      <p className="mt-3 text-base text-muted">
        The Free tier uses your browser&rsquo;s built-in text-to-speech. Paid plans add premium
        ElevenLabs narration for a voice closer to a professional audiobook.
      </p>
    </GuidePage>
  );
}
