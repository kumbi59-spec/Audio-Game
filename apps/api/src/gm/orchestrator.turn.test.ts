import { describe, expect, it, vi } from "vitest";
import type { GmTurn, ServerEvent } from "@audio-rpg/shared";
import { runTurn, splitNarrationChunks, type OrchestratorDeps, type Session } from "./orchestrator.js";

vi.mock("../config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config.js")>();
  return {
    config: {
      ...actual.config,
      GM_TURN_MAX_RETRIES: 0,
      GM_TURN_RETRY_BACKOFF_MS: 0,
      GM_TURN_TIMEOUT_MS: 5_000,
      TURN_REQUEST_DEADLINE_MS: 300,
      GM_CIRCUIT_BREAKER_ENABLED: true,
      GM_CIRCUIT_BREAKER_FAILURE_THRESHOLD: 3,
      GM_CIRCUIT_BREAKER_COOLDOWN_MS: 60_000,
    },
  };
});

const baseSession: Session = {
  campaignId: "c1",
  worldId: "w1",
  bible: { version: 1, title: "Test World", style_mode: "cinematic", tone: { content_rating: "teen", forbidden_topics: [] }, rules: { hard_constraints: [] }, entities: [], timeline: [], character_creation: { origins: [], classes: [], stats: [], starting_items: [] }, win_states: [], fail_states: [] },
  state: { scene: { name: "Prologue", summary: "" }, turn_number: 1, character: { name: "Hero", stats: {}, background: {} }, inventory: [], quests: [], relationships: [], codex: [], achievements: [], flags: {} },
  lastPresentedChoices: [{ id: "a", label: "Open the door" }],
};

const okTurn: GmTurn = {
  narration: "The door creaks open. Cold air rushes out!",
  presented_choices: [{ id: "x", label: "Step inside" }],
  accepts_freeform: true,
  state_mutations: [],
  sound_cues: [],
  narration_voice_plan: [],
  scene_ends: false,
};

function makeDeps(overrides: Partial<OrchestratorDeps> = {}) {
  const persistedTurns: { role: string; text: string }[] = [];
  const persistedChoices: { id: string; label: string }[][] = [];
  const deps: OrchestratorDeps = {
    memory: {
      recentTurns: async () => [],
      sceneSummaries: async () => [],
      searchTurns: async () => [],
      searchBible: async () => [],
      criticalFacts: async () => [],
    },
    persistTurn: async ({ role, text }) => {
      persistedTurns.push({ role, text });
    },
    persistState: async () => undefined,
    persistPresentedChoices: async (_campaignId, choices) => {
      persistedChoices.push(choices);
    },
    generateTurn: async () => okTurn,
    ...overrides,
  };
  return { deps, persistedTurns, persistedChoices };
}

function newSession(campaignId: string): Session {
  return { ...baseSession, campaignId, lastPresentedChoices: [...baseSession.lastPresentedChoices] };
}

describe("runTurn narration", () => {
  it("emits the parsed narration as sentence chunks, not the streamed reply", async () => {
    const events: ServerEvent[] = [];
    const { deps } = makeDeps({
      generateTurn: async ({ onText }) => {
        onText?.(JSON.stringify(okTurn));
        return okTurn;
      },
    });
    await runTurn(newSession("narration"), { kind: "freeform", text: "push" }, deps, (e) => events.push(e));

    const chunks = events.flatMap((e) => (e.type === "narration_chunk" ? [e] : []));
    expect(chunks.map((c) => [c.text, c.done])).toEqual([
      ["The door creaks open. ", false],
      ["Cold air rushes out!", false],
      ["", true],
    ]);
  });

  it("splits sentences without losing any text", () => {
    const narration = '"Run!" she shouts.  The bell tolls…\n\nThen silence?';
    const parts = splitNarrationChunks(narration);
    expect(parts).toEqual(['"Run!" ', "she shouts.  ", "The bell tolls…\n\n", "Then silence?"]);
    expect(parts.join("")).toBe(narration);
    expect(splitNarrationChunks("")).toEqual([]);
  });
});

describe("runTurn inputs and fallbacks", () => {
  it("stores a picked choice as its label, not its id", async () => {
    const { deps, persistedTurns } = makeDeps();
    await runTurn(newSession("label"), { kind: "choice", choiceId: "a" }, deps, () => undefined);
    expect(persistedTurns[0]).toEqual({ role: "player", text: "Open the door" });
  });

  it("persists fallback choices so a pick resolves to its label next turn", async () => {
    const session = newSession("fallback");
    const failing = makeDeps({
      generateTurn: async () => {
        throw new Error("No JSON object found in model response");
      },
    });
    const events: ServerEvent[] = [];
    await expect(
      runTurn(session, { kind: "freeform", text: "look" }, failing.deps, (e) => events.push(e)),
    ).rejects.toThrow();

    const offered = events.flatMap((e) => (e.type === "choice_list" ? e.choices : []));
    expect(offered.map((c) => c.id)).toEqual(["fallback_0", "fallback_1", "fallback_2", "fallback_3"]);
    expect(failing.persistedChoices).toEqual([offered]);
    expect(session.lastPresentedChoices).toEqual(offered);

    let prompt = "";
    const next = makeDeps({
      generateTurn: async ({ userPrompt }) => {
        prompt = userPrompt;
        return okTurn;
      },
    });
    await runTurn(session, { kind: "choice", choiceId: "fallback_1" }, next.deps, () => undefined);
    expect(next.persistedTurns[0]).toEqual({ role: "player", text: offered[1]!.label });
    expect(prompt).toContain(offered[1]!.label);
    expect(prompt).not.toContain("Player picked choice id: fallback_1");
  });

  it("bounds each attempt by the turn deadline and aborts the losing request", async () => {
    let signal: AbortSignal | undefined;
    const { deps } = makeDeps({
      generateTurn: ({ signal: s }) => {
        signal = s;
        return new Promise<GmTurn>(() => undefined);
      },
    });
    const start = Date.now();
    await expect(runTurn(newSession("deadline"), { kind: "freeform", text: "wait" }, deps, () => undefined)).rejects.toThrow(
      "gm_turn_timeout",
    );
    // The deadline is 300 ms; the per-attempt timeout alone would be 5 s.
    expect(Date.now() - start).toBeLessThan(2_000);
    expect(signal?.aborted).toBe(true);
  });
});

// These share the module's circuit-breaker state, so they run in order and
// the one that opens the breaker goes last.
describe("runTurn circuit breaker", () => {
  it("does not open on malformed model output", async () => {
    for (let i = 0; i < 3; i += 1) {
      const { deps } = makeDeps({
        generateTurn: async () => {
          throw new SyntaxError("Unexpected token } in JSON at position 12");
        },
      });
      await expect(runTurn(newSession(`bad-${i}`), { kind: "freeform", text: "go" }, deps, () => undefined)).rejects.toThrow(
        SyntaxError,
      );
    }
    const events: ServerEvent[] = [];
    const { deps } = makeDeps();
    await runTurn(newSession("after-bad"), { kind: "freeform", text: "go" }, deps, (e) => events.push(e));
    expect(events.some((e) => e.type === "turn_complete")).toBe(true);
  });

  it("opens after repeated provider failures", async () => {
    for (let i = 0; i < 3; i += 1) {
      const { deps } = makeDeps({
        generateTurn: async () => {
          throw new Error("provider_down");
        },
      });
      await expect(runTurn(newSession(`down-${i}`), { kind: "freeform", text: "go" }, deps, () => undefined)).rejects.toThrow(
        "provider_down",
      );
    }
    const events: ServerEvent[] = [];
    const { deps } = makeDeps();
    await expect(runTurn(newSession("after-down"), { kind: "freeform", text: "go" }, deps, (e) => events.push(e))).rejects.toThrow(
      "circuit_open",
    );
    expect(events).toContainEqual(expect.objectContaining({ type: "error", code: "circuit_open" }));
  });
});
