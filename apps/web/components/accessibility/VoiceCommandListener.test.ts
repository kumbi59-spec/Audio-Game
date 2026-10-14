import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPendingVoiceAction, parseVoiceInput } from "./VoiceCommandListener";

describe("parseVoiceInput", () => {
  it("reads choices by digit or word, with or without a verb", () => {
    expect(parseVoiceInput("choose option 3")).toEqual({ type: "choice", value: 2 });
    expect(parseVoiceInput("Pick two.")).toEqual({ type: "choice", value: 1 });
    expect(parseVoiceInput("number 1")).toEqual({ type: "choice", value: 0 });
    expect(parseVoiceInput("4")).toEqual({ type: "choice", value: 3 });
  });

  it("only treats a whole phrase as a command", () => {
    expect(parseVoiceInput("stop")).toEqual({ type: "meta", value: "pause" });
    expect(parseVoiceInput("Where am I?")).toEqual({ type: "meta", value: "location" });
    expect(parseVoiceInput("stop the guard")).toEqual({ type: "action", value: "stop the guard" });
    expect(parseVoiceInput("I choose to run for the door")).toEqual({ type: "action", value: "I choose to run for the door" });
  });
});

describe("a staged free-text voice action", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // Like React's setState under StrictMode, which runs an updater twice: an
  // action sent from inside one would go out twice.
  function strictModeState() {
    const state = { shown: null as string | null };
    const set = (next: string | null | ((prev: string | null) => string | null)) => {
      if (typeof next === "function") {
        next(state.shown);
        state.shown = next(state.shown);
      } else {
        state.shown = next;
      }
    };
    return { state, set };
  }

  it("fires onAction once when the confirmation delay runs out", () => {
    const onAction = vi.fn();
    const { state, set } = strictModeState();
    const pending = createPendingVoiceAction(3500, onAction, set);

    pending.stage("open the door");
    expect(state.shown).toBe("open the door");
    vi.advanceTimersByTime(3499);
    expect(onAction).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("open the door");
    expect(state.shown).toBeNull();

    // Nothing is left to send afterwards.
    pending.send();
    vi.advanceTimersByTime(10_000);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("sends once on Send, and not at all after Cancel", () => {
    const onAction = vi.fn();
    const { state, set } = strictModeState();
    const pending = createPendingVoiceAction(3500, onAction, set);

    pending.stage("attack the wizard");
    pending.send();
    vi.advanceTimersByTime(10_000);
    expect(onAction).toHaveBeenCalledTimes(1);

    pending.stage("attack the lizard");
    pending.cancel();
    vi.advanceTimersByTime(10_000);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(state.shown).toBeNull();
  });

  it("only sends the newest transcript", () => {
    const onAction = vi.fn();
    const pending = createPendingVoiceAction(3500, onAction, () => undefined);
    pending.stage("go north");
    vi.advanceTimersByTime(2000);
    pending.stage("go south");
    vi.advanceTimersByTime(3500);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("go south");
  });
});
