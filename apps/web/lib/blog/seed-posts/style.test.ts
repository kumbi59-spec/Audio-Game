import { describe, expect, it } from "vitest";
import { findAiTells } from "@audio-rpg/shared";
import structure from "./__fixtures__/structure.json";
import {
  LAUNCH_POSTS,
  SCHEDULED_SEED_POSTS,
  launchPublishDate,
  scheduledPublishDate,
  seedPostSlug,
} from "./index";

// Every seeded post is written in the creator's own voice. These checks keep
// the stock AI phrasing out, and keep what the site depends on in place:
// slugs come from titles, and section images attach by H2 position. Posts
// keep their original publish dates, so they can't tell build stories dated
// after them.

type Expected = { slug: string; title: string; h2: string[]; internalLinks: string[] };

const posts = [
  ...LAUNCH_POSTS.map((p) => ({ ...p, publishedAt: launchPublishDate(p.daysFromNow) })),
  ...SCHEDULED_SEED_POSTS.map((p) => ({ ...p, publishedAt: scheduledPublishDate(p.publishAt) })),
];
// The fixture is the structure from before the rewrite, plus one heading
// corrected to match the plans. The only other change allowed is an em
// dash in a heading becoming a colon, which keeps the slug.
const noDash = (text: string) => text.replace(/\s*\u2014\s*/g, ": ");
const expected = (structure as Expected[]).map((e) => ({
  ...e,
  title: noDash(e.title),
  h2: e.h2.map(noDash),
}));

const h2s = (content: string) => [...content.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]!);
const body = (content: string) =>
  content
    .split("\n")
    .filter((line) => !/^#{1,2}\s/.test(line))
    .join("\n");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
// A month (with an optional "early"/"late" or day) that isn't followed by a
// year. Historical facts carry a year ("May 2018"); build stories don't.
const MONTH_RE = new RegExp(
  `\\b(?:(early|late)\\s+)?(${MONTHS.join("|")})\\b(?:\\s+(\\d{1,2})(?!\\d))?(?![,\\s]*(?:\\d{1,2},?\\s+)?\\d{4})`,
  "g",
);
// The Halloween post talks about October as a season, not as build history.
const SEASONAL = /count down to October|an October night|afternoon in late October/g;

/** Month mentions (read as 2026) that fall after `publishedAt`. */
function monthsAfter(content: string, publishedAt: Date): string[] {
  return [...content.replace(SEASONAL, "").matchAll(MONTH_RE)]
    .filter((m) => {
      const day = m[3] ? Number(m[3]) : m[1] === "early" ? 5 : m[1] === "late" ? 25 : 15;
      return new Date(Date.UTC(2026, MONTHS.indexOf(m[2]!), day)) > publishedAt;
    })
    .map((m) => m[0]);
}

describe("seeded blog posts", () => {
  it("has all 60 posts in the fixture's order", () => {
    expect(posts.map((p) => seedPostSlug(p.title))).toEqual(expected.map((e) => e.slug));
  });

  describe.each(posts.map((p, i) => [seedPostSlug(p.title), p, expected[i]!] as const))("%s", (_slug, post, want) => {
    it("keeps its title, slug and section headings", () => {
      expect(post.title).toBe(want.title);
      expect(post.content.trimStart().split("\n")[0]).toBe(`# ${want.title}`);
      expect(h2s(post.content)).toEqual(want.h2);
    });

    it("keeps its internal links and cites outside sources", () => {
      for (const link of want.internalLinks) expect(post.content).toContain(`](${link})`);
      expect(post.content).toMatch(/\]\(\/(blog|library|campaigns|pricing|worlds)[^)]*\)/);
      const external = [...post.content.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].filter(
        (m) => !/echoquest\./.test(m[1]!),
      );
      expect(external.length).toBeGreaterThanOrEqual(2);
    });

    it("has a meta-description-length excerpt", () => {
      expect(post.excerpt.length).toBeGreaterThan(0);
      expect(post.excerpt.length).toBeLessThanOrEqual(160);
    });

    it("avoids em dashes and stock AI phrasing", () => {
      expect(findAiTells(post.title)).not.toContain("em dash");
      expect(findAiTells(`${post.excerpt}\n${body(post.content)}`)).toEqual([]);
    });

    it("doesn't date anything after its own publish date", () => {
      expect(monthsAfter(post.content, post.publishedAt)).toEqual([]);
    });
  });
});
