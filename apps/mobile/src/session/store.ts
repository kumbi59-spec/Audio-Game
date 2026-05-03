import { create } from "zustand";
import type {
  CampaignState,
  ChoiceOption,
  ServerEvent,
  StateMutation,
} from "@audio-rpg/shared";
import { applyMutations } from "@audio-rpg/gm-engine";
import { updateNpcVoiceMap } from "@/audio/narrator";
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

  // lifecycle
  reset: () => void;
  setConnected: (connected: boolean) => void;
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

  reset: () =>
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
    }),

  setConnected: (connected) => set({ connected }),

  joined: ({ campaignId, authToken, title, state }) =>
    set({
      campaignId,
      authToken,
      title,
      state,
      transcript: [],
      choices: [],
      currentTurnId: null,
      awaitingGm: false,
      lastError: null,
    }),

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
          return {
            transcript,
            currentTurnId: turnId,
            awaitingGm: !done,
          };
        });
        return;
      }
      case "choice_list":
        set({
          choices: evt.choices,
          acceptsFreeform: evt.acceptsFreeform,
        });
        return;
      case "state_delta": {
        const mutations: StateMutation[] = evt.mutations;
        set((s) =>
          s.state
            ? { state: applyMutations(s.state, mutations) }
            : {},
        );
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
                state: { ...s.state, turn_number: evt.turnNumber },
              }
            : { awaitingGm: false },
        );
        return;
      case "error":
        set({ lastError: evt.message, awaitingGm: false });
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
