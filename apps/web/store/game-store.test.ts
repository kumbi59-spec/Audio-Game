import { beforeEach, describe, expect, it } from "vitest";
import { migrateGameStore, useGameStore } from "./game-store";
import type { CharacterData } from "@/types/character";
import type { InMemorySession, NarrationEntry } from "@/types/game";
import type { WorldData } from "@/types/world";

const world = { id: "w1", name: "World", systemPrompt: "secret GM prompt", locations: [], npcs: [] } as unknown as WorldData;
const character = { id: "c1", name: "Mara" } as unknown as CharacterData;
function session(id: string, log = 0): InMemorySession {
  const narrationLog: NarrationEntry[] = Array.from({ length: log }, (_, i) => ({
    id: String(i), text: `entry ${i}`, type: "narration", timestamp: new Date(0),
  }));
  return {
    id, worldId: "w1", characterId: "c1", status: "active", turnCount: 3, currentLocationId: null,
    timeOfDay: "morning", weather: "clear", globalFlags: {}, npcStates: {}, memorySummary: "",
    history: [], narrationLog, choices: [], isGenerating: false, achievements: [], relationships: [], codex: [],
  };
}

describe("game store", () => {
  beforeEach(() => useGameStore.getState().forgetAllGames());

  it("starts a new game without the last game's server save or undo", () => {
    useGameStore.setState({
      dbSessionId: "old-save",
      previousTurn: { character, session: session("old") },
    });
    useGameStore.getState().startNewGame({ world, character, session: session("new") });
    const state = useGameStore.getState();
    expect(state.session?.id).toBe("new");
    expect(state.dbSessionId).toBeNull();
    expect(state.previousTurn).toBeNull();
  });

  it("keeps saved campaigns small: recent log only, no GM prompt", () => {
    useGameStore.setState({ world, character, session: session("s1", 400) });
    useGameStore.getState().saveCurrentCampaign();
    const [saved] = useGameStore.getState().savedCampaigns;
    expect(saved!.session.narrationLog).toHaveLength(150);
    expect(saved!.session.narrationLog.at(-1)!.text).toBe("entry 399");
    expect(saved!.world.systemPrompt).toBe("");
  });

  it("forgets every game on sign-out", () => {
    useGameStore.setState({ world, character, session: session("s1") });
    useGameStore.getState().saveCurrentCampaign();
    useGameStore.getState().forgetAllGames();
    const state = useGameStore.getState();
    expect([state.session, state.character, state.world, state.savedCampaigns]).toEqual([null, null, null, []]);
  });
});

describe("migrateGameStore", () => {
  it("fills in progress arrays a version-0 save is missing", () => {
    const old = { session: { id: "s1", narrationLog: [] }, world, savedCampaigns: [{ session: { id: "s2" }, world }] };
    const migrated = migrateGameStore(old, 0) as {
      session: InMemorySession;
      world: WorldData;
      savedCampaigns: Array<{ session: InMemorySession; world: WorldData }>;
    };
    expect(migrated.session).toMatchObject({ achievements: [], relationships: [], codex: [], history: [] });
    expect(migrated.savedCampaigns[0]!.session).toMatchObject({ achievements: [], codex: [], narrationLog: [] });
    expect(migrated.world.systemPrompt).toBe("");
  });
});
