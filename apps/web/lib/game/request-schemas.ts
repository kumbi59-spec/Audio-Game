import { z } from "zod";
import { MAX_HISTORY_CHARS, MAX_PENDING_SUMMARY_MESSAGES } from "@/lib/ai/memory/context-window";

// Request schemas shared by the game API routes. Every string and array is
// bounded: these payloads end up in model prompts, so unbounded input is an
// AI-cost and memory-pressure vector.

const shortText = z.string().max(200);
const mediumText = z.string().max(2_000);
const longText = z.string().max(8_000);

// Stats are stored on the character as sent for a game without a server
// save yet, so they're kept to sane, finite ranges.
const statValue = (min: number, max: number) => z.number().finite().min(min).max(max);
const coreStat = statValue(0, 1_000);

export const CharacterSchema = z.object({
  id: shortText.min(1),
  name: shortText.min(1),
  class: z.enum(["warrior", "rogue", "mage", "ranger", "bard"]),
  roleTitle: shortText.nullish(),
  backstory: longText,
  stats: z.object({
    hp: statValue(0, 100_000),
    maxHp: statValue(0, 100_000),
    strength: coreStat,
    dexterity: coreStat,
    intelligence: coreStat,
    charisma: coreStat,
    level: statValue(0, 1_000),
    experience: statValue(0, 1_000_000_000),
  }),
  customStats: z.record(statValue(-1_000_000, 1_000_000_000)).refine((r) => Object.keys(r).length <= 50).optional(),
  inventory: z.array(
    z.object({
      id: shortText.min(1),
      name: shortText.min(1),
      description: mediumText.default(""),
      category: z.enum(["weapon", "armor", "consumable", "key", "misc"]).default("misc"),
      quantity: statValue(0, 1_000_000),
      properties: z.record(z.unknown()).default({}),
    })
  ).max(200),
  quests: z.array(
    z.object({
      id: shortText.min(1),
      title: shortText.min(1),
      description: mediumText.default(""),
      status: z.enum(["active", "completed", "failed", "abandoned"]),
      objectives: z.array(
        z.object({
          id: shortText.min(1),
          text: mediumText.min(1),
          completed: z.boolean(),
        })
      ).max(50),
      reward: mediumText.nullish(),
    })
  ).max(100),
  pronouns: shortText.nullish(),
  age: statValue(0, 100_000).nullish(),
  shortDescription: mediumText.nullish(),
});

/**
 * Only the world id is trusted: routes load the world server-side (see
 * resolvePlayableWorld) so client-supplied prompts never reach the model.
 */
export const WorldRefSchema = z.object({ id: shortText.min(1) }).passthrough();

// Legacy browser-generated guest id, honoured only to re-bind an existing
// guest row to a server-issued cookie (see resolvePlayer).
export const LegacyGuestIdSchema = z.string().max(64).nullish();

export const SessionSnapshotSchema = z.object({
  id: shortText,
  worldId: shortText,
  characterId: shortText,
  status: z.string().max(50).default("active"),
  turnCount: z.number().default(0),
  currentLocationId: shortText.nullish(),
  timeOfDay: z.string().max(50).default("morning"),
  weather: z.string().max(50).default("clear"),
  globalFlags: z.record(z.unknown()).default({}),
  npcStates: z.record(z.unknown()).default({}),
  memorySummary: z.string().max(20_000).default(""),
  /** Leading history messages already folded into memorySummary (unsaved games). */
  summarizedMessages: z.number().int().min(0).optional(),
  // Clients trim history to the GM's context window before sending (see
  // trimHistoryForContext), which always keeps the last two messages.
  history: z.array(
    z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20_000) })
  ).max(1_000).default([])
    .refine((h) => h.reduce((n, m) => n + m.content.length, 0) <= MAX_HISTORY_CHARS + 40_000, {
      message: "history is longer than the GM's context window",
    }),
  // Not used server-side; current clients send []. Bounded for older clients.
  narrationLog: z.array(z.unknown()).max(5_000).default([]),
  choices: z.array(mediumText).max(20).default([]),
  isGenerating: z.boolean().default(false),
  achievements: z.array(z.unknown()).max(500).default([]),
  relationships: z.array(z.unknown()).max(500).default([]),
  codex: z.array(z.unknown()).max(1_000).default([]),
});


/**
 * History an unsaved game is about to drop from its context window without
 * having summarised it. The server folds it into the memory summary (saved
 * games are summarised from the database instead).
 */
export const PendingSummarySchema = z.object({
  /** Index in the client's full history of the first message here. */
  fromMessage: z.number().int().min(0),
  messages: z.array(
    z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20_000) }),
  ).min(1).max(MAX_PENDING_SUMMARY_MESSAGES),
});
