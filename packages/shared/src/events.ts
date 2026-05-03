import { z } from "zod";
import { ChoiceOption, PlayerInput, SoundCue, StateMutation } from "./gm.js";

const EventVersion = z.literal("v1").optional();

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
    v: EventVersion,
    campaignId: z.string(),
    turnNumber: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("narration_chunk"),
    v: EventVersion,
    turnId: z.string(),
    text: z.string(),
    done: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("choice_list"),
    v: EventVersion,
    turnId: z.string(),
    choices: z.array(ChoiceOption),
    acceptsFreeform: z.boolean(),
  }),
  z.object({
    type: z.literal("state_delta"),
    v: EventVersion,
    turnId: z.string(),
    mutations: z.array(StateMutation),
  }),
  z.object({
    type: z.literal("sound_cue"),
    v: EventVersion,
    cue: SoundCue,
  }),
  z.object({
    type: z.literal("recap_ready"),
    v: EventVersion,
    summary: z.string(),
  }),
  z.object({
    type: z.literal("turn_complete"),
    v: EventVersion,
    turnId: z.string(),
    turnNumber: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("error"),
    v: EventVersion,
    code: z.string(),
    message: z.string(),
    recoverable: z.boolean().default(true),
    eventId: z.string().optional(),
  }),
  z.object({
    type: z.literal("voice_plan"),
    v: EventVersion,
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
    v: EventVersion,
    campaignId: z.string(),
    authToken: z.string(),
    /** Signed tier token — if absent or invalid the session defaults to free tier limits. */
    tierToken: z.string().optional(),
  }),
  z.object({
    type: z.literal("player_input"),
    v: EventVersion,
    input: PlayerInput,
    /** Optional client-generated id used for idempotent retries over unstable networks. */
    eventId: z.string().min(1).max(128).optional(),
  }),
  z.object({
    type: z.literal("request_recap"),
    v: EventVersion,
  }),
  z.object({
    type: z.literal("pause"),
    v: EventVersion,
  }),
  z.object({
    type: z.literal("leave"),
    v: EventVersion,
  }),
]);
export type ClientEvent = z.infer<typeof ClientEvent>;
