export type SeoCampaign = {
  slug: string;
  name: string;
  genre: string;
  intentKeyword: string;
  hook: string;
  transcript: string[];
  cta: string;
};

export const SEO_CAMPAIGNS: SeoCampaign[] = [
  {
    slug: "long-watch",
    name: "The Long Watch",
    genre: "sci-fi",
    intentKeyword: "sci-fi AI text adventure with voice",
    hook: "Wake up three years too early on a colony ship where a cryopod opened from the inside.",
    transcript: [
      "GM: Thaw chamber seals hiss open. Captain Mirovic hands you a mug and says, 'Pod 217 opened itself at 04:18.'",
      "You: 'Show me the cryobay logs and everyone who touched that deck in the last six hours.'",
      "GM: The ship AI answers immediately: 'One log segment is missing, not corrupted.'",
    ],
    cta: "Investigate the missing botanist before the crew turns on itself.",
  },
  {
    slug: "crimson-sands",
    name: "Crimson Sands",
    genre: "desert archaeology",
    intentKeyword: "desert AI text adventure with voice",
    hook: "Race a rival expedition into a buried empire where living glyphs still answer to blood and sound.",
    transcript: [
      "GM: Lantern light reveals three sealed doors under the Seventh Gate. One was disturbed in the last day.",
      "You: 'I test the glyph resonance from a distance before anyone touches stone.'",
      "GM: Amber symbols brighten. A warning translates: 'Memory taken, oath required.'",
    ],
    cta: "Choose discovery, preservation, or profit — and live with what you unleash.",
  },
  {
    slug: "accessible-dd-alternative",
    name: "EchoQuest Intro Campaign",
    genre: "fantasy",
    intentKeyword: "accessible D&D alternative",
    hook: "Play a fully narrated tabletop-style campaign with keyboard, voice, or screen reader.",
    transcript: [
      "GM: Rain taps your shield as the village bell rings. Three people are shouting your name at once.",
      "You: 'Read each voice in order, then ask who saw the lights in the woods.'",
      "GM: You hear panic, grief, and one witness who swears the trees moved against the wind.",
    ],
    cta: "Start free and test a true audio-first campaign experience.",
  },
];

export function getSeoCampaign(slug: string) {
  return SEO_CAMPAIGNS.find((campaign) => campaign.slug === slug);
}
