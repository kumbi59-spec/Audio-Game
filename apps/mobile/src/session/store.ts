import { create } from "zustand";
import type {
  CampaignState,
  ChoiceOption,
  ServerEvent,
  StateMutation,
} from "@audio-rpg/shared";
import { applyMutations } from "@audio-rpg/gm-engine";
import { resetNpcVoiceMap, updateNpcVoiceMap } from "@/audio/narrator";
import { usePrefs } from "@/prefs/store";
import { buildPlayerTranscript, buildTranscriptPlainText } from "@/domain/session/use-cases";

export interface TranscriptEntry {
  id: string;
  role: "gm" | "player";
  text: string;
  streaming: boolean;
}

export interface SessionSlice {
  connected: boolean;
  campaignId: string | null;
  authToken: string | null;
  title: string;
  state: CampaignState | null;
  transcript: TranscriptEntry[];
  currentTurnId: string | null;
  choices: ChoiceOption[];
  acceptsFreeform: boolean;
  awaitingGm: boolean;
  lastError: string | null;
  /** Why the campaign couldn't be joined or re-joined; the screen offers Retry. */
  connectionError: string | null;
  /** Choices cleared by the pending input, restored if the server rejects it. */
  choicesBeforeInput: ChoiceOption[] | null;

  // lifecycle
  reset: () => void;
  setConnected: (connected: boolean) => void;
  setConnectionError: (message: string | null) => void;
  joined: (args: {
    campaignId: string;
    authToken: string;
    title: string;
    state: CampaignState;
  }) => void;
  appendPlayer: (text: string) => void;
  handleEvent: (evt: ServerEvent) => void;
}

export const useSession = create<SessionSlice>((set, get) => ({
  connected: false,
  campaignId: null,
  authToken: null,
  title: "",
  state: null,
  transcript: [],
  currentTurnId: null,
  choices: [],
  acceptsFreeform: true,
  awaitingGm: false,
  lastError: null,
  connectionError: null,
  choicesBeforeInput: null,

  reset: () => {
    resetNpcVoiceMap();
    set({
      connected: false,
      campaignId: null,
      authToken: null,
      title: "",
      state: null,
      transcript: [],
      currentTurnId: null,
      choices: [],
      acceptsFreeform: true,
      awaitingGm: false,
      lastError: null,
      connectionError: null,
      choicesBeforeInput: null,
    });
  },

  // A dropped socket loses the running turn, so input is released.
  setConnected: (connected) =>
    set(connected ? { connected } : { connected, awaitingGm: false }),

  setConnectionError: (connectionError) => set({ connectionError }),

  joined: ({ campaignId, authToken, title, state }) => {
    // Kept per campaign so the campaign screen can resume or reconnect.
    usePrefs.getState().setSessionToken(campaignId, authToken);
    resetNpcVoiceMap();
    set({
      campaignId,
      authToken,
      title,
      state,
      transcript: [],
      choices: [],
      acceptsFreeform: true,
      currentTurnId: null,
      awaitingGm: false,
      lastError: null,
      connectionError: null,
      choicesBeforeInput: null,
    });
  },

  appendPlayer: (text) =>
    set((s) => {
      const transcript = buildPlayerTranscript(text);
      if (!transcript) {
        return {};
      }
      return {
      transcript: [
        ...s.transcript,
        {
          id: `player-${s.transcript.length}`,
          role: "player",
          text: transcript,
          streaming: false,
        },
      ],
      awaitingGm: true,
      choices: [],
      choicesBeforeInput: s.choicesBeforeInput ?? s.choices,
    };
  }),

  handleEvent: (evt) => {
    switch (evt.type) {
      case "session_ready":
        return;
      case "narration_chunk": {
        const { turnId, text, done } = evt;
        set((s) => {
          const existing = s.transcript.find((t) => t.id === turnId);
          let transcript = s.transcript;
          if (existing) {
            transcript = s.transcript.map((t) =>
              t.id === turnId
                ? { ...t, text: t.text + text, streaming: !done }
                : t,
            );
          } else {
            transcript = [
              ...s.transcript,
              { id: turnId, role: "gm", text, streaming: !done },
            ];
          }
          // The turn lock is held until turn_complete or error, not until
          // the narration's done chunk.
          return {
            transcript,
            currentTurnId: turnId,
            awaitingGm: true,
            lastError: null,
            choicesBeforeInput: null,
          };
        });
        return;
      }
      case "choice_list":
        set({
          choices: evt.choices,
          acceptsFreeform: evt.acceptsFreeform,
          choicesBeforeInput: null,
        });
        return;
      case "state_delta": {
        const mutations: StateMutation[] = evt.mutations;
        set((s) => {
          if (!s.state) return {};
          // The server applies a turn's mutations at that turn's number, so
          // unlock and interaction stamps match; turn_complete then
          // advances the counter.
          const next = applyMutations(
            { ...s.state, turn_number: s.state.turn_number + 1 },
            mutations,
          );
          return { state: { ...next, turn_number: s.state.turn_number } };
        });
        return;
      }
      case "sound_cue":
        // Wired by the cue dispatcher in app/_layout or the screen.
        return;
      case "recap_ready":
        set((s) => ({
          transcript: [
            ...s.transcript,
            {
              id: `recap-${s.transcript.length}`,
              role: "gm",
              text: `Recap: ${evt.summary}`,
              streaming: false,
            },
          ],
        }));
        return;
      case "turn_complete":
        set((s) =>
          s.state
            ? {
                awaitingGm: false,
                choicesBeforeInput: null,
                state: { ...s.state, turn_number: evt.turnNumber },
              }
            : { awaitingGm: false, choicesBeforeInput: null },
        );
        return;
      case "error":
        set((s) => ({
          lastError: evt.message,
          awaitingGm: false,
          // The input didn't produce a turn, so its choices come back.
          ...(s.choicesBeforeInput
            ? { choices: s.choicesBeforeInput, choicesBeforeInput: null }
            : {}),
        }));
        return;
      case "voice_plan": {
        const assignments: Record<string, "voice_a" | "voice_b" | "voice_c"> = {};
        for (const a of evt.assignments) {
          assignments[a.npcName] = a.voiceRole;
        }
        updateNpcVoiceMap(assignments);
        return;
      }
    }
  },
}));

export function transcriptPlainText(): string {
  return buildTranscriptPlainText(useSession.getState().transcript);
}
