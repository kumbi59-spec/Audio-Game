import { z } from "zod";
import { StyleMode } from "./gm.js";

export const BibleEntityKind = z.enum([
  "npc",
  "faction",
  "location",
  "item",
  "rule",
  "creature",
]);
export type BibleEntityKind = z.infer<typeof BibleEntityKind>;

export const BibleEntity = z.object({
  id: z.string(),
  kind: BibleEntityKind,
  name: z.string(),
  description: z.string(),
  attributes: z.record(z.string(), z.unknown()).default({}),
});
export type BibleEntity = z.infer<typeof BibleEntity>;

export const BibleRules = z.object({
  combat: z.string().optional(),
  magic: z.string().optional(),
  skill_checks: z.string().optional(),
  progression: z.string().optional(),
  death_and_failure: z.string().optional(),
  hard_constraints: z.array(z.string()).default([]),
});
export type BibleRules = z.infer<typeof BibleRules>;

export const BibleTone = z.object({
  voice: z.string().optional(),
  pacing: z.string().optional(),
  content_rating: z
    .enum(["family", "teen", "mature"])
    .default("teen"),
  forbidden_topics: z.array(z.string()).default([]),
});
export type BibleTone = z.infer<typeof BibleTone>;

export const CharacterCreation = z.object({
  origins: z.array(z.string()).default([]),
  classes: z.array(z.string()).default([]),
  stats: z.array(z.string()).default([]),
  starting_items: z.array(z.string()).default([]),
});
export type CharacterCreation = z.infer<typeof CharacterCreation>;

/**
 * Canonical structured Game Bible. Produced by the ingestion pipeline from
 * uploads, or by the Create World wizard from spoken prompts. Every field
 * is optional so partial worlds can still be played with GM filling gaps.
 */
export const GameBible = z.object({
  version: z.literal(1).default(1),
  title: z.string(),
  pitch: z.string().optional(),
  genre: z.string().optional(),
  setting: z.string().optional(),
  style_mode: StyleMode.default("cinematic"),
  tone: BibleTone.default({
    content_rating: "teen",
    forbidden_topics: [],
  }),
  rules: BibleRules.default({ hard_constraints: [] }),
  entities: z.array(BibleEntity).default([]),
  timeline: z
    .array(z.object({ when: z.string(), what: z.string() }))
    .default([]),
  character_creation: CharacterCreation.default({
    origins: [],
    classes: [],
    stats: [],
    starting_items: [],
  }),
  starting_scenario: z.string().optional(),
  win_states: z.array(z.string()).default([]),
  fail_states: z.array(z.string()).default([]),
});
export type GameBible = z.infer<typeof GameBible>;
