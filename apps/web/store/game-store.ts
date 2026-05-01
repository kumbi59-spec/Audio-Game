import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InMemorySession, NarrationEntry, PlayerAction, ItemMutation, QuestMutation } from "@/types/game";
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
  updateStat: (statName: string, delta: number) => void;
  applyInventoryMutation: (mutation: ItemMutation) => void;
  applyQuestMutation: (mutation: QuestMutation) => void;
  updateLocation: (locationId: string) => void;
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

      updateStat: (statName, delta) =>
        set((state) => {
          if (!state.character) return {};
          const knownStats = ["hp", "maxHp", "strength", "dexterity", "intelligence", "charisma", "level", "experience"] as const;
          type KnownStat = typeof knownStats[number];
          if ((knownStats as readonly string[]).includes(statName)) {
            const key = statName as KnownStat;
            const current = state.character.stats[key] ?? 0;
            return {
              character: {
                ...state.character,
                stats: { ...state.character.stats, [key]: Math.max(0, current + delta) },
              },
            };
          }
          const current = state.character.customStats?.[statName] ?? 0;
          return {
            character: {
              ...state.character,
              customStats: { ...state.character.customStats, [statName]: Math.max(0, current + delta) },
            },
          };
        }),

      applyInventoryMutation: (mutation) =>
        set((state) => {
          if (!state.character) return {};
          const inv = state.character.inventory;
          if (mutation.op === "add") {
            const idx = inv.findIndex((i) => i.name.toLowerCase() === mutation.name.toLowerCase());
            if (idx >= 0) {
              const updated = inv.map((item, i) =>
                i === idx ? { ...item, quantity: item.quantity + mutation.quantity } : item
              );
              return { character: { ...state.character, inventory: updated } };
            }
            return {
              character: {
                ...state.character,
                inventory: [
                  ...inv,
                  {
                    id: `item-${Date.now()}`,
                    name: mutation.name,
                    quantity: mutation.quantity,
                    description: mutation.description ?? "",
                    category: mutation.category ?? "misc",
                    properties: {},
                  },
                ],
              },
            };
          }
          // remove
          const updated = inv
            .map((item) =>
              item.name.toLowerCase() === mutation.name.toLowerCase()
                ? { ...item, quantity: Math.max(0, item.quantity - mutation.quantity) }
                : item
            )
            .filter((item) => item.quantity > 0);
          return { character: { ...state.character, inventory: updated } };
        }),

      applyQuestMutation: (mutation) =>
        set((state) => {
          if (!state.character) return {};
          const quests = state.character.quests;
          if (mutation.op === "start") {
            if (quests.some((q) => q.title.toLowerCase() === mutation.title.toLowerCase())) {
              return {};
            }
            return {
              character: {
                ...state.character,
                quests: [
                  ...quests,
                  {
                    id: `quest-${Date.now()}`,
                    title: mutation.title,
                    description: mutation.description ?? "",
                    status: "active" as const,
                    objectives: (mutation.objectives ?? []).map((text, i) => ({
                      id: `obj-${Date.now()}-${i}`,
                      text,
                      completed: false,
                    })),
                    reward: null,
                  },
                ],
              },
            };
          }
          if (mutation.op === "update") {
            const updated = quests.map((q) => {
              if (q.title.toLowerCase() !== mutation.title.toLowerCase()) return q;
              return {
                ...q,
                objectives: q.objectives.map((o) =>
                  o.text === mutation.objective ? { ...o, completed: mutation.done ?? true } : o
                ),
              };
            });
            return { character: { ...state.character, quests: updated } };
          }
          // complete or fail
          const status = mutation.op === "complete" ? "completed" : "failed";
          const updated = quests.map((q) =>
            q.title.toLowerCase() === mutation.title.toLowerCase() ? { ...q, status: status as "completed" | "failed" } : q
          );
          return { character: { ...state.character, quests: updated } };
        }),

      updateLocation: (locationId) =>
        set((state) => ({
          session: state.session ? { ...state.session, currentLocationId: locationId } : null,
        })),

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
