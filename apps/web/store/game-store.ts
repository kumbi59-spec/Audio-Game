import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { InMemorySession, NarrationEntry, PlayerAction, ItemMutation, QuestMutation, AchievementUnlock, NpcRelationship, CodexEntry } from "@/types/game";
import type { CharacterData } from "@/types/character";
import type { WorldData } from "@/types/world";
import { normalizeChoiceList } from "@/src/domain/game/use-cases";
import { trimHistoryForContext } from "@/lib/ai/memory/context-window";
import { mergeAchievement, mergeCodexEntry, mergeRelationship, type RelationshipChange } from "@/lib/game/session-progress";
import {
  applyHpDelta,
  applyInventoryMutation,
  applyQuestMutation,
  applyStatDelta,
  isItemMutation,
  isQuestMutation,
} from "@/lib/game/character-reducer";

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
  /** Starts a fresh game: no server save and no undo carried over from the last one. */
  startNewGame: (game: { world: WorldData; character: CharacterData; session: InMemorySession }) => void;
  /** Forgets every game on this device (current and saved), e.g. on sign-out. */
  forgetAllGames: () => void;

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
  updateNpcRelationship: (change: RelationshipChange) => void;
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

/**
 * Saved campaigns live in localStorage (about 5 MB per site), so each keeps
 * only the recent log and the history the GM still sees.
 */
const SAVED_LOG_ENTRIES = 150;

function compactSession(session: InMemorySession): InMemorySession {
  return {
    ...session,
    isGenerating: false,
    narrationLog: session.narrationLog.slice(-SAVED_LOG_ENTRIES),
    history: trimHistoryForContext(session.history ?? []),
  };
}

/** The world's GM prompt is only read on the server, so it isn't stored here. */
function compactWorld(world: WorldData): WorldData {
  return { ...world, systemPrompt: "" };
}

const GAME_STORE_VERSION = 1;

type PersistedSession = Partial<InMemorySession> | null | undefined;

function withProgressArrays<T extends PersistedSession>(session: T): T {
  if (!session) return session;
  return {
    ...session,
    achievements: session.achievements ?? [],
    relationships: session.relationships ?? [],
    codex: session.codex ?? [],
    narrationLog: session.narrationLog ?? [],
    history: session.history ?? [],
    choices: session.choices ?? [],
  };
}

/**
 * Upgrades what an older version of the app stored. Version 0 saves can lack
 * the achievements/relationships/codex arrays (added later), which crashed
 * the store on the first relationship or codex change.
 */
export function migrateGameStore(persisted: unknown, version: number): unknown {
  if (!persisted || typeof persisted !== "object") return persisted;
  const state = persisted as {
    session?: PersistedSession;
    world?: WorldData | null;
    savedCampaigns?: Array<{ session: PersistedSession; world: WorldData }>;
  };
  if (version < 1) {
    return {
      ...state,
      session: withProgressArrays(state.session),
      world: state.world ? compactWorld(state.world) : state.world,
      savedCampaigns: (state.savedCampaigns ?? []).map((saved) => ({
        ...saved,
        session: withProgressArrays(saved.session),
        world: compactWorld(saved.world),
      })),
    };
  }
  return state;
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
      startNewGame: ({ world, character, session }) =>
        set({ world, character, session, dbSessionId: null, previousTurn: null }),
      forgetAllGames: () =>
        set({ session: null, character: null, world: null, dbSessionId: null, previousTurn: null, savedCampaigns: [] }),

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
        set((state) => (state.character ? { character: applyHpDelta(state.character, delta) } : {})),

      updateStat: (statName, delta) =>
        set((state) => (state.character ? { character: applyStatDelta(state.character, statName, delta) } : {})),

      applyInventoryMutation: (mutation) =>
        set((state) =>
          state.character && isItemMutation(mutation)
            ? { character: applyInventoryMutation(state.character, mutation) }
            : {},
        ),

      applyQuestMutation: (mutation) =>
        set((state) =>
          state.character && isQuestMutation(mutation)
            ? { character: applyQuestMutation(state.character, mutation) }
            : {},
        ),

      unlockAchievement: (achievement) =>
        set((s) =>
          s.session
            ? {
                session: {
                  ...s.session,
                  achievements: mergeAchievement(s.session.achievements ?? [], achievement, s.session.turnCount),
                },
              }
            : s
        ),

      updateNpcRelationship: (change) =>
        set((s) =>
          s.session
            ? {
                session: {
                  ...s.session,
                  relationships: mergeRelationship(s.session.relationships ?? [], change, s.session.turnCount),
                },
              }
            : s
        ),

      addCodexEntry: (entry) =>
        set((s) =>
          s.session
            ? { session: { ...s.session, codex: mergeCodexEntry(s.session.codex ?? [], entry, s.session.turnCount) } }
            : s
        ),

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
        const entry = {
          id,
          savedAt: Date.now(),
          session: compactSession(state.session),
          character: state.character,
          world: compactWorld(state.world),
          dbSessionId: state.dbSessionId,
        };
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
      version: GAME_STORE_VERSION,
      migrate: migrateGameStore,
      partialize: (state) => ({
        session: state.session ? { ...state.session, isGenerating: false } : null,
        character: state.character,
        world: state.world ? compactWorld(state.world) : null,
        dbSessionId: state.dbSessionId,
        savedCampaigns: state.savedCampaigns.map((saved) => ({ ...saved, session: { ...saved.session, isGenerating: false } })),
      }),
    }
  )
);

export function submitPlayerAction(_action: PlayerAction) {
  // Implemented via useGameSession hook
}
