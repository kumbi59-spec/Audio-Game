import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import type { CharacterData } from "@/types/character";
import type { InMemorySession, PlayerAction } from "@/types/game";
import type { WorldData } from "@/types/world";

const mocks = vi.hoisted(() => ({ stream: vi.fn() }));

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  getAnthropicClient: () => ({ messages: { stream: mocks.stream } }),
}));

import { resolveSkillCheck, streamGMTurn, type GMStreamEvent } from "./gm-engine";

interface Script {
  text?: string[];
  final?: Partial<Anthropic.Message>;
  /** Thrown by the iterator after the text chunks. */
  error?: unknown;
  /** Never finish; reject once abort() is called. */
  hang?: boolean;
}

function fakeStream(script: Script) {
  let rejectHang: ((err: unknown) => void) | null = null;
  const abort = vi.fn(() => rejectHang?.(new Anthropic.APIUserAbortError()));
  return {
    abort,
    async *[Symbol.asyncIterator]() {
      for (const text of script.text ?? []) {
        yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } };
      }
      if (script.hang) {
        await new Promise((_, reject) => { rejectHang = reject; });
      }
      if (script.error) throw script.error;
    },
    finalMessage: async () => ({
      content: (script.text ?? []).length > 0 ? [{ type: "text", text: (script.text ?? []).join("") }] : [],
      stop_reason: "end_turn",
      ...script.final,
    }),
  };
}

const character: CharacterData = {
  id: "c1",
  name: "Mara",
  class: "warrior",
  backstory: "A sellsword.",
  stats: { hp: 20, maxHp: 20, strength: 14, dexterity: 10, intelligence: 10, charisma: 10, level: 1, experience: 0 },
  customStats: { luck: 16 },
  inventory: [],
  quests: [],
};

const world = {
  id: "w1",
  name: "Test World",
  systemPrompt: "A test world.",
  locations: [],
} as unknown as WorldData;

const session: InMemorySession = {
  id: "s1",
  worldId: "w1",
  characterId: "c1",
  status: "active",
  turnCount: 3,
  currentLocationId: null,
  timeOfDay: "morning",
  weather: "clear",
  globalFlags: {},
  npcStates: {},
  memorySummary: "",
  history: [],
  narrationLog: [],
  choices: [],
  isGenerating: false,
  achievements: [],
  relationships: [],
  codex: [],
};

const action: PlayerAction = { type: "free_text", content: "I force the gate open" };

const REPLY = JSON.stringify({
  narration: "The gate groans and gives way.",
  choices: ["Step through", "Wait"],
  soundCue: "door_open",
  stateChanges: { flags: { gate_open: true } },
});

async function collect(gen: AsyncGenerator<GMStreamEvent>) {
  const events: GMStreamEvent[] = [];
  for await (const evt of gen) events.push(evt);
  return events;
}

function types(events: GMStreamEvent[]) {
  return events.map((e) => e.type);
}

function eventData<T>(events: GMStreamEvent[], type: GMStreamEvent["type"]): T {
  return events.find((e) => e.type === type)?.data as T;
}

beforeEach(() => {
  mocks.stream.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("resolveSkillCheck", () => {
  it("adds the stat modifier and luck to a d20 roll", () => {
    const result = resolveSkillCheck(
      { stat: "strength", dc: 12, label: "Force the gate" },
      character,
      [
        { sourceStat: "luck", value: 2, reason: "", targetRoll: "general_risk" },
        { sourceStat: "dexterity", value: 3, reason: "", targetRoll: "evade" },
      ],
      () => 0.65,
    );
    expect(result).toEqual({
      stat: "strength",
      label: "Force the gate",
      dc: 12,
      roll: 14,
      modifier: 2,
      bonus: 2,
      total: 18,
      success: true,
    });
  });

  it("keeps the roll between 1 and 20", () => {
    const input = { stat: "charisma" as const, dc: 30, label: "x" };
    expect(resolveSkillCheck(input, character, [], () => 0).roll).toBe(1);
    expect(resolveSkillCheck(input, character, [], () => 1).roll).toBe(20);
  });
});

describe("streamGMTurn", () => {
  it("streams a turn without a skill check", async () => {
    mocks.stream.mockReturnValueOnce(fakeStream({ text: [REPLY.slice(0, 20), REPLY.slice(20)] }));

    const events = await collect(streamGMTurn(action, session, character, world));

    expect(types(events)).toEqual([
      "narration_chunk",
      "narration_chunk",
      "sound_cue",
      "state_change",
      "choices_ready",
      "done",
    ]);
    expect(mocks.stream).toHaveBeenCalledTimes(1);
    const params = mocks.stream.mock.calls[0]![0];
    expect(params.tools.map((t: { name: string }) => t.name)).toEqual(["roll_skill_check"]);
    expect(params.tool_choice).toEqual({ type: "auto", disable_parallel_tool_use: true });
    expect(eventData<{ narration: string }>(events, "choices_ready").narration).toBe("The gate groans and gives way.");
    expect(eventData<Record<string, unknown>>(events, "state_change").passiveBonusNarration).toBeUndefined();
  });

  it("rolls a requested skill check before the narration is written", async () => {
    const toolUse = {
      type: "tool_use",
      id: "toolu_1",
      name: "roll_skill_check",
      input: { stat: "strength", dc: 12, label: "Force the gate" },
    };
    mocks.stream
      .mockReturnValueOnce(fakeStream({ text: ["Let me roll."], final: { content: [toolUse] as never, stop_reason: "tool_use" } }))
      .mockReturnValueOnce(fakeStream({ text: [REPLY] }));

    const events = await collect(streamGMTurn(action, session, character, world, { rng: () => 0.65 }));

    expect(types(events)).toEqual([
      "narration_chunk",
      "narration_reset",
      "skill_check_result",
      "narration_chunk",
      "sound_cue",
      "state_change",
      "choices_ready",
      "done",
    ]);
    expect(eventData(events, "skill_check_result")).toMatchObject({ roll: 14, modifier: 2, bonus: 2, total: 18, success: true });

    const second = mocks.stream.mock.calls[1]![0];
    expect(second.tool_choice).toEqual({ type: "none" });
    expect(second.messages.at(-2)).toEqual({ role: "assistant", content: [toolUse] });
    const toolResult = second.messages.at(-1).content[0];
    expect(toolResult).toMatchObject({ type: "tool_result", tool_use_id: "toolu_1" });
    expect(toolResult.is_error).toBeUndefined();
    expect(toolResult.content).toContain("SUCCESS");

    const changes = eventData<{ flags: Record<string, unknown>; passiveBonusNarration?: string[] }>(events, "state_change");
    expect(changes.flags.gate_open).toBe(true);
    expect(JSON.parse(changes.flags.last_skill_check as string)).toMatchObject({ success: true, total: 18 });
    expect(changes.passiveBonusNarration).toEqual(["LUCK granted +2 on general risk."]);
  });

  it("answers an invalid tool call with an error result and no roll", async () => {
    const toolUse = { type: "tool_use", id: "toolu_2", name: "roll_skill_check", input: { stat: "wisdom", dc: 12, label: "x" } };
    mocks.stream
      .mockReturnValueOnce(fakeStream({ final: { content: [toolUse] as never, stop_reason: "tool_use" } }))
      .mockReturnValueOnce(fakeStream({ text: [REPLY] }));

    const events = await collect(streamGMTurn(action, session, character, world));

    expect(types(events)).not.toContain("skill_check_result");
    const toolResult = mocks.stream.mock.calls[1]![0].messages.at(-1).content[0];
    expect(toolResult).toMatchObject({ tool_use_id: "toolu_2", is_error: true });
  });

  it("ignores a skill_check the model writes into its JSON instead of calling the tool", async () => {
    const reply = JSON.stringify({
      narration: "You strain at the bars.",
      choices: ["Keep pushing"],
      skill_check: { stat: "strength", dc: 12, label: "Bend the bars" },
      stateChanges: { skill_check: { stat: "strength", dc: 12, label: "Bend the bars" } },
    });
    mocks.stream.mockReturnValueOnce(fakeStream({ text: [reply] }));

    const events = await collect(streamGMTurn(action, session, character, world));

    expect(types(events)).not.toContain("skill_check_result");
    const changes = eventData<{ flags?: Record<string, unknown> }>(events, "state_change");
    expect(changes.flags?.last_skill_check).toBeUndefined();
  });

  it("tells the client to drop partial text before retrying", async () => {
    mocks.stream
      .mockReturnValueOnce(fakeStream({ text: ['{"narration": "The ga'], error: new Error("socket hang up") }))
      .mockReturnValueOnce(fakeStream({ text: [REPLY] }));

    const events = await collect(streamGMTurn(action, session, character, world));

    expect(types(events).slice(0, 3)).toEqual(["narration_chunk", "narration_reset", "narration_chunk"]);
    expect(eventData(events, "narration_reset")).toEqual({ reason: "retry" });
    expect(types(events)).not.toContain("error");
  });

  it("does not retry a refusal and returns a fallback turn", async () => {
    mocks.stream.mockReturnValueOnce(fakeStream({ final: { content: [], stop_reason: "refusal" } }));

    const events = await collect(streamGMTurn(action, session, character, world));

    expect(mocks.stream).toHaveBeenCalledTimes(1);
    expect(eventData(events, "error")).toMatchObject({ degraded: true, errorClass: "safety_refusal" });
    expect(eventData<{ choices: string[] }>(events, "choices_ready").choices[0]).toBe("Search the area for threats");
  });

  it("does not retry a request the API rejected as invalid", async () => {
    mocks.stream.mockReturnValueOnce(
      fakeStream({ error: new Anthropic.BadRequestError(400, undefined, "bad request", new Headers()) }),
    );

    const events = await collect(streamGMTurn(action, session, character, world));

    expect(mocks.stream).toHaveBeenCalledTimes(1);
    expect(eventData(events, "error")).toMatchObject({ degraded: true, errorClass: "provider_error" });
  });

  it("stops quietly when the player disconnects", async () => {
    const controller = new AbortController();
    const stream = fakeStream({ text: ["{"], hang: true });
    mocks.stream.mockReturnValueOnce(stream);

    const gen = streamGMTurn(action, session, character, world, { signal: controller.signal });
    const first = await gen.next();
    expect(first.value).toMatchObject({ type: "narration_chunk" });
    const rest = gen.next();
    controller.abort();
    expect(await rest).toEqual({ done: true, value: undefined });
    expect(stream.abort).toHaveBeenCalled();
    expect(mocks.stream).toHaveBeenCalledTimes(1);
  });

  it("aborts the request when the consumer stops reading", async () => {
    const stream = fakeStream({ text: ["{", "more"] });
    mocks.stream.mockReturnValueOnce(stream);

    const gen = streamGMTurn(action, session, character, world);
    await gen.next();
    await gen.return(undefined);

    expect(stream.abort).toHaveBeenCalled();
  });

  it("aborts a stream that goes idle and reports a timeout", async () => {
    vi.useFakeTimers();
    const streams = [fakeStream({ hang: true }), fakeStream({ hang: true }), fakeStream({ hang: true })];
    for (const s of streams) mocks.stream.mockReturnValueOnce(s);

    const done = collect(streamGMTurn(action, session, character, world));
    await vi.advanceTimersByTimeAsync(3 * 20_000 + 100);
    const events = await done;

    for (const s of streams) expect(s.abort).toHaveBeenCalled();
    expect(eventData(events, "error")).toMatchObject({ degraded: true, errorClass: "timeout" });
  });
});
