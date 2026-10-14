import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("expo-router", () => ({ useFocusEffect: vi.fn() }));

import {
  __resetCommandBusForTests,
  dispatchTranscript,
  listCommandPhrases,
  registerCommands,
} from "./commandBus";

describe("command bus", () => {
  beforeEach(() => {
    __resetCommandBusForTests();
  });

  it("matches a command phrase as a prefix by default", async () => {
    const speak = vi.fn();
    registerCommands({ "speak|mic": speak });
    await expect(dispatchTranscript("speak to the guard")).resolves.toBe(true);
    expect(speak).toHaveBeenCalledWith("speak to the guard");
  });

  it("matches only the whole phrase in exact mode", async () => {
    const speak = vi.fn();
    registerCommands({ "speak|mic": speak });
    await expect(dispatchTranscript("speak to the guard", { exact: true })).resolves.toBe(false);
    expect(speak).not.toHaveBeenCalled();
    // Recognizers punctuate and capitalize.
    await expect(dispatchTranscript("Mic.", { exact: true })).resolves.toBe(true);
    expect(speak).toHaveBeenCalledOnce();
  });

  it("runs the command whose phrase matched, newest registration first", async () => {
    const globalHelp = vi.fn();
    const screenRepeat = vi.fn();
    const screenHelp = vi.fn();
    registerCommands({ help: globalHelp });
    registerCommands({ "repeat|read that again": screenRepeat, help: screenHelp });
    await dispatchTranscript("read that again", { exact: true });
    await dispatchTranscript("help", { exact: true });
    expect(screenRepeat).toHaveBeenCalledOnce();
    expect(screenHelp).toHaveBeenCalledOnce();
    expect(globalHelp).not.toHaveBeenCalled();
  });

  it("stops matching a screen's commands once unregistered", async () => {
    const refresh = vi.fn();
    const unregister = registerCommands({ "refresh|reload": refresh });
    unregister();
    await expect(dispatchTranscript("refresh")).resolves.toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("lists the first phrase of each active command", () => {
    registerCommands({ "help|what can i do": () => {} });
    registerCommands({ "repeat|read that again": () => {}, "next|continue": () => {} });
    expect(listCommandPhrases()).toEqual(["repeat", "next", "help"]);
  });
});
