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

  it("loads a saved campaign without the last game's undo", () => {
    useGameStore.setState({ world, character, session: session("saved"), dbSessionId: "saved-db" });
    useGameStore.getState().saveCurrentCampaign();
    useGameStore.setState({
      session: session("other"),
      dbSessionId: "other-db",
      previousTurn: { character, session: session("other") },
    });
    useGameStore.getState().loadSavedCampaign("w1:saved");
    const state = useGameStore.getState();
    expect(state.session?.id).toBe("saved");
    expect(state.dbSessionId).toBe("saved-db");
    expect(state.previousTurn).toBeNull();
  });

  it("moves summarizedMessages back by the history a saved campaign drops", () => {
    // 30 messages of 10k chars: the context trim drops the oldest 20.
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `${i}`.padEnd(10_000, "."),
    }));
    useGameStore.setState({ world, character, session: { ...session("s1"), history, summarizedMessages: 25 } });
    useGameStore.getState().saveCurrentCampaign();
    const saved = useGameStore.getState().savedCampaigns[0]!.session;
    expect(saved.history).toHaveLength(10);
    expect(saved.summarizedMessages).toBe(5);

    useGameStore.setState({ session: { ...session("s2"), history, summarizedMessages: 4 } });
    useGameStore.getState().saveCurrentCampaign();
    expect(useGameStore.getState().savedCampaigns[0]!.session.summarizedMessages).toBe(0);
  });

  it("stamps progress with the turn being played, as the server does", () => {
    useGameStore.setState({ world, character, session: session("s1") });
    useGameStore.getState().updateNpcRelationship({ npcId: "voss", name: "Voss", standing: 10 });
    expect(useGameStore.getState().session!.relationships[0]!.lastSeenTurn).toBe(4);
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
