import { z } from "zod";

export const StyleMode = z.enum([
  "cinematic",
  "rules_light",
  "crunchy",
  "mystery",
  "horror",
  "political",
  "adventure",
]);
export type StyleMode = z.infer<typeof StyleMode>;

export const SoundCue = z.enum([
  "tension_low",
  "tension_high",
  "danger",
  "success",
  "failure",
  "discovery",
  "scene_change",
  "save_complete",
  "choice_available",
]);
export type SoundCue = z.infer<typeof SoundCue>;

export const ChoiceOption = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
});
export type ChoiceOption = z.infer<typeof ChoiceOption>;

export const StateMutation = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("inventory.add"),
    item: z.string(),
    quantity: z.number().int().default(1),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  z.object({
    op: z.literal("inventory.remove"),
    item: z.string(),
    quantity: z.number().int().default(1),
  }),
  z.object({
    op: z.literal("relationship.adjust"),
    npc: z.string(),
    delta: z.number().int(),
    note: z.string().optional(),
  }),
  z.object({
    op: z.literal("quest.start"),
    name: z.string(),
    objectives: z.array(z.string()).default([]),
  }),
  z.object({
    op: z.literal("quest.update"),
    name: z.string(),
    objective: z.string(),
    done: z.boolean(),
  }),
  z.object({
    op: z.literal("quest.complete"),
    name: z.string(),
  }),
  z.object({
    op: z.literal("flag.set"),
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
  z.object({
    op: z.literal("codex.unlock"),
    key: z.string(),
    title: z.string(),
    body: z.string(),
  }),
  z.object({
    op: z.literal("stat.adjust"),
    stat: z.string(),
    delta: z.number(),
  }),
  z.object({
    op: z.literal("scene.set"),
    name: z.string(),
    summary: z.string().optional(),
  }),
]);
export type StateMutation = z.infer<typeof StateMutation>;

export const NarrationSpan = z.object({
  span: z.tuple([z.number().int().nonnegative(), z.number().int().positive()]),
  voice: z.string(),
  emotion: z.string().optional(),
});
export type NarrationSpan = z.infer<typeof NarrationSpan>;

/**
 * The structured GM turn envelope. Every GM call returns this shape,
 * validated server-side before being streamed to the client.
 */
export const GmTurn = z.object({
  narration: z.string().min(1),
  presented_choices: z.array(ChoiceOption).min(0).max(6),
  accepts_freeform: z.boolean().default(true),
  sound_cues: z.array(SoundCue).default([]),
  state_mutations: z.array(StateMutation).default([]),
  narration_voice_plan: z.array(NarrationSpan).default([]),
  ruling_rationale: z.string().optional(),
  scene_ends: z.boolean().default(false),
});
export type GmTurn = z.infer<typeof GmTurn>;

export const PlayerInput = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), choiceId: z.string() }),
  z.object({ kind: z.literal("freeform"), text: z.string().min(1).max(2000) }),
  z.object({ kind: z.literal("utility"), command: z.string() }),
]);
export type PlayerInput = z.infer<typeof PlayerInput>;
