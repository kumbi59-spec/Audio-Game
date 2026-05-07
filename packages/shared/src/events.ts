import { z } from "zod";
import { ChoiceOption, PlayerInput, SoundCue, StateMutation } from "./gm.js";

const EventVersion = z.literal("v1").optional();

export const PassiveBonus = z.object({
  sourceStat: z.string(),
  value: z.number(),
  reason: z.string(),
  targetRoll: z.string(),
});
export type PassiveBonus = z.infer<typeof PassiveBonus>;

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
    passiveBonuses: z.array(PassiveBonus).optional(),
    bonusNarration: z.array(z.string()).optional(),
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

/**
 * Lobby participant — sent as part of lobby_state updates.
 * Multiplayer sessions begin in a lobby where all participants must signal
 * readiness before the GM begins the first turn.
 */
export const LobbyParticipant = z.object({
  userId: z.string(),
  displayName: z.string(),
  ready: z.boolean(),
  joinedAt: z.string().datetime(),
});
export type LobbyParticipant = z.infer<typeof LobbyParticipant>;

/**
 * Extended server events for multiplayer sessions.
 * These appear on the same WebSocket alongside the existing ServerEvent
 * variants — the client discriminates on `type`.
 */
export const MultiplayerServerEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lobby_state"),
    v: EventVersion,
    campaignId: z.string(),
    participants: z.array(LobbyParticipant),
    maxPlayers: z.number().int().min(2).max(4),
    hostUserId: z.string(),
    /** Echoed only in the first lobby_state sent to a newly-joined player so they know their own server-assigned userId. */
    myUserId: z.string().optional(),
  }),
  z.object({
    type: z.literal("player_joined"),
    v: EventVersion,
    campaignId: z.string(),
    participant: LobbyParticipant,
  }),
  z.object({
    type: z.literal("player_left"),
    v: EventVersion,
    campaignId: z.string(),
    userId: z.string(),
    displayName: z.string(),
  }),
  z.object({
    type: z.literal("lobby_ready"),
    v: EventVersion,
    campaignId: z.string(),
    participants: z.array(LobbyParticipant),
  }),
  z.object({
    type: z.literal("turn_request"),
    v: EventVersion,
    campaignId: z.string(),
    requestingUserId: z.string(),
    requestingDisplayName: z.string(),
    turnId: z.string(),
  }),
]);
export type MultiplayerServerEvent = z.infer<typeof MultiplayerServerEvent>;

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

/** Multiplayer-specific client → server events. */
export const MultiplayerClientEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lobby_join"),
    v: EventVersion,
    campaignId: z.string(),
    authToken: z.string(),
    displayName: z.string().min(1).max(32),
  }),
  z.object({
    type: z.literal("lobby_ready"),
    v: EventVersion,
    campaignId: z.string(),
    ready: z.boolean(),
  }),
  z.object({
    type: z.literal("lobby_leave"),
    v: EventVersion,
    campaignId: z.string(),
  }),
  z.object({
    type: z.literal("request_turn"),
    v: EventVersion,
    campaignId: z.string(),
  }),
]);
export type MultiplayerClientEvent = z.infer<typeof MultiplayerClientEvent>;
