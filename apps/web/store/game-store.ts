import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InMemorySession, NarrationEntry, PlayerAction } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";

interface GameStore {
  session: InMemorySession | null;
  character: CharacterData | null;
  world: WorldData | null;
  /** DB-persisted session ID (null when running in-memory only) */
  dbSessionId: string | null;

  setSession: (session: InMemorySession) => void;
  setCharacter: (character: CharacterData) => void;
  setWorld: (world: WorldData) => void;
  setDbSessionId: (id: string | null) => void;

  addNarrationEntry: (entry: NarrationEntry) => void;
  setChoices: (choices: string[]) => void;
  setIsGenerating: (value: boolean) => void;
  incrementTurnCount: () => void;
  updateFlags: (flags: Record<string, unknown>) => void;
  updateHP: (delta: number) => void;
  clearSession: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      session: null,
      character: null,
      world: null,
      dbSessionId: null,

      setSession: (session) => set({ session }),
      setCharacter: (character) => set({ character }),
      setWorld: (world) => set({ world }),
      setDbSessionId: (id) => set({ dbSessionId: id }),

      addNarrationEntry: (entry) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, narrationLog: [...state.session.narrationLog, entry] }
            : null,
        })),

      setChoices: (choices) =>
        set((state) => ({
          session: state.session ? { ...state.session, choices } : null,
        })),

      setIsGenerating: (value) =>
        set((state) => ({
          session: state.session ? { ...state.session, isGenerating: value } : null,
        })),

      incrementTurnCount: () =>
        set((state) => ({
          session: state.session
            ? { ...state.session, turnCount: state.session.turnCount + 1 }
            : null,
        })),

      updateFlags: (flags) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, globalFlags: { ...state.session.globalFlags, ...flags } }
            : null,
        })),

      updateHP: (delta) =>
        set((state) => {
          if (!state.character) return {};
          const newHp = Math.max(
            0,
            Math.min(state.character.stats.maxHp, state.character.stats.hp + delta)
          );
          return {
            character: { ...state.character, stats: { ...state.character.stats, hp: newHp } },
          };
        }),

      clearSession: () =>
        set({ session: null, character: null, world: null, dbSessionId: null }),
    }),
    {
      name: "echoquest-game",
      partialize: (state) => ({
        session: state.session ? { ...state.session, isGenerating: false } : null,
        character: state.character,
        world: state.world,
        dbSessionId: state.dbSessionId,
      }),
    }
  )
);

export function submitPlayerAction(_action: PlayerAction) {
  // Implemented via useGameSession hook
}
