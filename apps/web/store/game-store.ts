import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InMemorySession, NarrationEntry, PlayerAction, ItemMutation, QuestMutation, AchievementUnlock, NpcRelationship, CodexEntry } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";
import { normalizeChoiceList } from "@/src/domain/game/use-cases";

/**
 * Hard cap on the in-memory narrationLog. Long sessions otherwise grow it
 * unbounded — every entry is persisted into localStorage on every set(),
 * so 500-turn sessions can balloon the persisted slice into many MB and
 * slow store writes. Keep the most recent ENTRIES (covers ~50–80 turns
 * of GM narration + system + player_action mix) and drop the oldest.
 *
 * The DB-backed history (when dbSessionId is set) is the canonical
 * record — clients keep only a recent display window.
 */
const NARRATION_LOG_MAX_ENTRIES = 400;

function trimNarrationLog<T>(log: T[]): T[] {
  return log.length <= NARRATION_LOG_MAX_ENTRIES
    ? log
    : log.slice(log.length - NARRATION_LOG_MAX_ENTRIES);
}

interface GameStore {
  session: InMemorySession | null;
  character: CharacterData | null;
  world: WorldData | null;
  /** DB-persisted session ID (null when running in-memory only) */
  dbSessionId: string | null;
  /**
   * Snapshot of (character, session) immediately before the most recent
   * completed turn. Captured by useGameSession on successful turn finalize
   * and consumed by undoLastTurn(). Single-step only — null when no undo
   * is available (start of session, after an undo, or after clearSession).
   * Not persisted: undo is a same-tab convenience; resuming a saved session
   * starts with no undo target.
   */
  previousTurn: { character: CharacterData; session: InMemorySession } | null;
  savedCampaigns: Array<{ id: string; savedAt: number; session: InMemorySession; character: CharacterData; world: WorldData; dbSessionId: string | null }>;

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
  unlockAchievement: (achievement: AchievementUnlock) => void;
  updateNpcRelationship: (change: { npcId: string; name: string; standing: number; notes?: string }) => void;
  addCodexEntry: (entry: CodexEntry) => void;
  updateLocation: (locationId: string) => void;
  setMemorySummary: (summary: string) => void;
  capturePreTurn: (snapshot: { character: CharacterData; session: InMemorySession }) => void;
  undoLastTurn: () => boolean;
  clearSession: () => void;
  saveCurrentCampaign: () => void;
  loadSavedCampaign: (id: string) => void;
  deleteSavedCampaign: (id: string) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      session: null,
      character: null,
      world: null,
      dbSessionId: null,
      previousTurn: null,
      savedCampaigns: [],

      setSession: (session) => set({ session }),
      setCharacter: (character) => set({ character }),
      setWorld: (world) => set({ world }),
      setDbSessionId: (id) => set({ dbSessionId: id }),

      addNarrationEntry: (entry) =>
        set((state) => ({
          session: state.session
            ? { ...state.session, narrationLog: trimNarrationLog([...state.session.narrationLog, entry]) }
            : null,
        })),

      setChoices: (choices) =>
        set((state) => ({
          session: state.session ? { ...state.session, choices: normalizeChoiceList(choices) } : null,
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
            const newStats = { ...state.character.stats, [key]: Math.max(0, current + delta) };

            // Auto-level on XP gain. Mirrors packages/gm-engine/src/reducer.ts:
            //   threshold = level² × 100
            //   per level: +5 maxHp, +5 hp (capped at new maxHp)
            //   odd levels: +1 STR, +1 DEX
            //   even levels: +1 INT, +1 CHA
            // The reducer keeps applying levels in a loop while XP exceeds the
            // threshold, so a large XP grant can cross multiple levels in one
            // turn. The GM's prompt also says "the system handles leveling
            // automatically" — this is what makes that true on the web side.
            if (key === "experience") {
              while (true) {
                const lvl = newStats.level ?? 1;
                const threshold = lvl * lvl * 100;
                if ((newStats.experience ?? 0) < threshold) break;
                const next = lvl + 1;
                newStats.level = next;
                newStats.maxHp = (newStats.maxHp ?? 10) + 5;
                newStats.hp = Math.min((newStats.hp ?? 0) + 5, newStats.maxHp);
                if (next % 2 !== 0) {
                  newStats.strength = (newStats.strength ?? 10) + 1;
                  newStats.dexterity = (newStats.dexterity ?? 10) + 1;
                } else {
                  newStats.intelligence = (newStats.intelligence ?? 10) + 1;
                  newStats.charisma = (newStats.charisma ?? 10) + 1;
                }
              }
            }

            return {
              character: { ...state.character, stats: newStats },
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

      unlockAchievement: (achievement) =>
        set((s) =>
          s.session
            ? { session: { ...s.session, achievements: [...(s.session.achievements ?? []), achievement] } }
            : s
        ),

      updateNpcRelationship: (change) =>
        set((s) => {
          if (!s.session) return s;
          const existing = s.session.relationships.findIndex((r) => r.npcId === change.npcId);
          const turnCount = s.session.turnCount;
          const updated: NpcRelationship[] =
            existing >= 0
              ? s.session.relationships.map((r, i) =>
                  i === existing
                    ? { ...r, standing: change.standing, notes: change.notes ?? r.notes, lastSeenTurn: turnCount }
                    : r
                )
              : [...s.session.relationships, { ...change, lastSeenTurn: turnCount }];
          return { session: { ...s.session, relationships: updated } };
        }),

      addCodexEntry: (entry) =>
        set((s) => {
          if (!s.session) return s;
          if (s.session.codex.some((c) => c.key === entry.key)) return s;
          return { session: { ...s.session, codex: [...s.session.codex, entry] } };
        }),

      updateLocation: (locationId) =>
        set((state) => ({
          session: state.session ? { ...state.session, currentLocationId: locationId } : null,
        })),

      setMemorySummary: (summary) =>
        set((state) => ({
          session: state.session ? { ...state.session, memorySummary: summary } : null,
        })),

      capturePreTurn: (snapshot) => set({ previousTurn: snapshot }),

      undoLastTurn: () => {
        const { previousTurn } = useGameStore.getState();
        if (!previousTurn) return false;
        useGameStore.setState({
          character: previousTurn.character,
          session: previousTurn.session,
          previousTurn: null,
        });
        return true;
      },

      clearSession: () =>
        set({ session: null, character: null, world: null, dbSessionId: null, previousTurn: null }),
      saveCurrentCampaign: () => set((state) => {
        if (!state.session || !state.character || !state.world) return {};
        const id = `${state.world.id}:${state.session.id}`;
        const entry = { id, savedAt: Date.now(), session: { ...state.session, isGenerating: false }, character: state.character, world: state.world, dbSessionId: state.dbSessionId };
        return {
          savedCampaigns: [entry, ...state.savedCampaigns.filter((c) => c.id !== id)].slice(0, 20),
        };
      }),
      loadSavedCampaign: (id) => set((state) => {
        const saved = state.savedCampaigns.find((c) => c.id === id);
        if (!saved) return {};
        return { session: { ...saved.session, achievements: saved.session.achievements ?? [], relationships: saved.session.relationships ?? [], codex: saved.session.codex ?? [], isGenerating: false }, character: saved.character, world: saved.world, dbSessionId: saved.dbSessionId };
      }),
      deleteSavedCampaign: (id) => set((state) => ({
        savedCampaigns: state.savedCampaigns.filter((c) => c.id !== id),
      })),
    }),
    {
      name: "echoquest-game",
      partialize: (state) => ({
        session: state.session ? { ...state.session, isGenerating: false } : null,
        character: state.character,
        world: state.world,
        dbSessionId: state.dbSessionId,
        savedCampaigns: state.savedCampaigns.map((saved) => ({ ...saved, session: { ...saved.session, isGenerating: false } })),
      }),
    }
  )
);

export function submitPlayerAction(_action: PlayerAction) {
  // Implemented via useGameSession hook
}
