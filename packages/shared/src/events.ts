import { z } from "zod";
import { ChoiceOption, PlayerInput, SoundCue, StateMutation } from "./gm";

export const VoiceRole = z.enum(["narrator", "voice_a", "voice_b", "voice_c"]);
export type VoiceRole = z.infer<typeof VoiceRole>;

/**
 * Server → client event stream over a per-campaign WebSocket.
 * Narration text arrives in chunks so the client can drive TTS in parallel
 * with Claude's token stream.
 */
export const ServerEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("session_ready"),
    campaignId: z.string(),
    turnNumber: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("narration_chunk"),
    turnId: z.string(),
    text: z.string(),
    done: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("choice_list"),
    turnId: z.string(),
    choices: z.array(ChoiceOption),
    acceptsFreeform: z.boolean(),
  }),
  z.object({
    type: z.literal("state_delta"),
    turnId: z.string(),
    mutations: z.array(StateMutation),
  }),
  z.object({
    type: z.literal("sound_cue"),
    cue: SoundCue,
  }),
  z.object({
    type: z.literal("recap_ready"),
    summary: z.string(),
  }),
  z.object({
    type: z.literal("turn_complete"),
    turnId: z.string(),
    turnNumber: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("error"),
    code: z.string(),
    message: z.string(),
    recoverable: z.boolean().default(true),
  }),
  z.object({
    type: z.literal("voice_plan"),
    turnId: z.string(),
    assignments: z.array(z.object({
      npcName: z.string(),
      voiceRole: z.enum(["voice_a", "voice_b", "voice_c"]),
    })),
  }),
]);
export type ServerEvent = z.infer<typeof ServerEvent>;

/** Client → server events. */
export const ClientEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join"),
    campaignId: z.string(),
    authToken: z.string(),
    /** Signed tier token — if absent or invalid the session defaults to free tier limits. */
    tierToken: z.string().optional(),
  }),
  z.object({
    type: z.literal("player_input"),
    input: PlayerInput,
  }),
  z.object({
    type: z.literal("request_recap"),
  }),
  z.object({
    type: z.literal("pause"),
  }),
  z.object({
    type: z.literal("leave"),
  }),
]);
export type ClientEvent = z.infer<typeof ClientEvent>;
