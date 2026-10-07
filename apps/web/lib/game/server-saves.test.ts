import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteServerSave, loadServerSave } from "./server-saves";
import { useGameStore } from "@/store/game-store";

describe("loadServerSave", () => {
  beforeEach(() => useGameStore.getState().forgetAllGames());
  afterEach(() => vi.unstubAllGlobals());

  it("loads the save as the current game, with no undo from before", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      session: { id: "sess", narrationLog: [{ id: "1", text: "Hi", type: "narration", timestamp: "2026-10-01T00:00:00Z" }] },
      character: { id: "c1", name: "Mara" },
      world: { id: "w1", name: "World" },
    })));
    useGameStore.setState({ previousTurn: { character: {} as never, session: {} as never } });

    expect(await loadServerSave("sess")).toEqual({ ok: true });
    const state = useGameStore.getState();
    expect(state.dbSessionId).toBe("sess");
    expect(state.previousTurn).toBeNull();
    expect(state.session?.isGenerating).toBe(false);
    expect(state.session?.narrationLog[0]!.timestamp).toBeInstanceOf(Date);
  });

  it("explains a save that no longer exists, and one it couldn't reach", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    expect(await loadServerSave("gone")).toEqual({ ok: false, message: "That saved game no longer exists." });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    expect(await loadServerSave("x")).toEqual({ ok: false, message: "Couldn't reach the server to load that game." });
  });
});

describe("deleteServerSave", () => {
  beforeEach(() => useGameStore.getState().forgetAllGames());
  afterEach(() => vi.unstubAllGlobals());

  it("sends a DELETE for the save", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await deleteServerSave("sess 1")).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/game/session?sessionId=sess%201", { method: "DELETE" });
  });

  it("counts a save that's already gone as deleted", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    expect(await deleteServerSave("gone")).toEqual({ ok: true });
  });

  it("stops the game in this browser saving to a deleted save", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    useGameStore.setState({ dbSessionId: "sess" });
    await deleteServerSave("other");
    expect(useGameStore.getState().dbSessionId).toBe("sess");
    await deleteServerSave("sess");
    expect(useGameStore.getState().dbSessionId).toBeNull();
  });

  it("reports a failure and leaves the game alone", async () => {
    useGameStore.setState({ dbSessionId: "sess" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    expect(await deleteServerSave("sess")).toEqual({ ok: false, message: "Couldn't delete that save. Try again in a moment." });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    expect(await deleteServerSave("sess")).toEqual({ ok: false, message: "Couldn't reach the server to delete that save." });
    expect(useGameStore.getState().dbSessionId).toBe("sess");
  });
});
