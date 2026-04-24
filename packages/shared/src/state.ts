import { z } from "zod";

export const InventoryItem = z.object({
  name: z.string(),
  quantity: z.number().int().nonnegative(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
export type InventoryItem = z.infer<typeof InventoryItem>;

export const Quest = z.object({
  name: z.string(),
  status: z.enum(["active", "complete", "failed"]),
  objectives: z.array(
    z.object({ text: z.string(), done: z.boolean().default(false) }),
  ),
  log: z.array(z.string()).default([]),
});
export type Quest = z.infer<typeof Quest>;

export const Relationship = z.object({
  npc: z.string(),
  standing: z.number().int(),
  notes: z.string().optional(),
  last_interaction_turn: z.number().int().nonnegative().optional(),
});
export type Relationship = z.infer<typeof Relationship>;

export const CodexEntry = z.object({
  key: z.string(),
  title: z.string(),
  body: z.string(),
  unlocked_turn: z.number().int().nonnegative(),
});
export type CodexEntry = z.infer<typeof CodexEntry>;

export const Character = z.object({
  name: z.string(),
  pronouns: z.string().optional(),
  stats: z.record(z.string(), z.number()).default({}),
  background: z.record(z.string(), z.string()).default({}),
  portrait_desc: z.string().optional(),
});
export type Character = z.infer<typeof Character>;

/**
 * Authoritative campaign state. The GM reads this in, proposes
 * state_mutations, and a deterministic reducer applies them. The narration
 * never owns this data.
 */
export const CampaignState = z.object({
  scene: z.object({
    name: z.string().default("Prologue"),
    summary: z.string().default(""),
  }),
  turn_number: z.number().int().nonnegative().default(0),
  character: Character,
  inventory: z.array(InventoryItem).default([]),
  quests: z.array(Quest).default([]),
  relationships: z.array(Relationship).default([]),
  codex: z.array(CodexEntry).default([]),
  flags: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});
export type CampaignState = z.infer<typeof CampaignState>;
