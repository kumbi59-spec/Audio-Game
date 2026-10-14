/**
 * Brand wording for titles, meta descriptions and structured data.
 *
 * Another game called "EchoQuest" exists on itch.io, so the name on its own is
 * ambiguous in search. Pairing it with a category modifier ("EchoQuest TTRPG")
 * everywhere it appears in metadata teaches search engines which EchoQuest
 * this site is.
 */
export const BRAND_NAME = "EchoQuest";
export const BRAND_TTRPG = "EchoQuest TTRPG";
export const BRAND_ALTERNATE_NAMES = [BRAND_TTRPG, "EchoQuest Audio RPG", "EchoQuest AI Game Master"];

/** One plain, quotable sentence that says what EchoQuest is (for AI search summaries). */
export const BRAND_DEFINITION =
  "EchoQuest is a screen-reader friendly, AI-narrated audio tabletop role-playing game (TTRPG).";

/**
 * Official profiles, listed as schema.org `sameAs` so search engines tie them
 * to this site.
 * TODO: add the itch.io page (itch.io/…/echoquest-ttrpg), Reddit, Bluesky and
 * other official profiles once they exist. Only list profiles we control.
 */
export const SAME_AS: string[] = ["https://x.com/echoquestapp"];
