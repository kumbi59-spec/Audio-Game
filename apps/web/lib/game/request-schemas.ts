import { z } from "zod";

// Request schemas shared by the game API routes. Every string and array is
// bounded: these payloads end up in model prompts, so unbounded input is an
// AI-cost and memory-pressure vector.

const shortText = z.string().max(200);
const mediumText = z.string().max(2_000);
const longText = z.string().max(8_000);

export const CharacterSchema = z.object({
  id: shortText.min(1),
  name: shortText.min(1),
  class: z.enum(["warrior", "rogue", "mage", "ranger", "bard"]),
  roleTitle: shortText.nullish(),
  backstory: longText,
  stats: z.object({
    hp: z.number(),
    maxHp: z.number(),
    strength: z.number(),
    dexterity: z.number(),
    intelligence: z.number(),
    charisma: z.number(),
    level: z.number(),
    experience: z.number(),
  }),
  customStats: z.record(z.number()).optional(),
  inventory: z.array(
    z.object({
      id: shortText.min(1),
      name: shortText.min(1),
      description: mediumText.default(""),
      category: z.enum(["weapon", "armor", "consumable", "key", "misc"]).default("misc"),
      quantity: z.number(),
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
  age: z.number().nullish(),
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
  history: z.array(
    z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20_000) })
  ).max(1_000).default([]),
  // Not used server-side; current clients send []. Bounded for older clients.
  narrationLog: z.array(z.unknown()).max(5_000).default([]),
  choices: z.array(mediumText).max(20).default([]),
  isGenerating: z.boolean().default(false),
  achievements: z.array(z.unknown()).max(500).default([]),
  relationships: z.array(z.unknown()).max(500).default([]),
  codex: z.array(z.unknown()).max(1_000).default([]),
});
