import { describe, expect, it, vi } from "vitest";

const tts = vi.hoisted(() => ({
  isPaused: vi.fn(() => false),
  isSpeaking: vi.fn(() => true),
  pauseSpeech: vi.fn(),
  resumeSpeech: vi.fn(),
  stopSpeech: vi.fn(),
}));
vi.mock("@/lib/audio/tts-provider", () => tts);

const { handleShortcutKey } = await import("./KeyboardShortcuts");
type ShortcutContext = import("./KeyboardShortcuts").ShortcutContext;

function keydown(key: string, init: Record<string, unknown> = {}) {
  const event = {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target: { tagName: "BODY", isContentEditable: false, getAttribute: () => null },
    preventDefault: vi.fn(),
    ...init,
  };
  return event as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };
}

function context(overrides: Partial<ShortcutContext> = {}): ShortcutContext {
  return {
    keyboardHelpOpen: false,
    setKeyboardHelpOpen: vi.fn(),
    operationsManualOpen: false,
    ttsSpeed: 1,
    setTTSSpeed: vi.fn(),
    ambientEnabled: true,
    setAmbientEnabled: vi.fn(),
    announce: vi.fn(),
    onChoiceSelect: vi.fn(),
    onReplayLast: vi.fn(),
    onToggleInventory: vi.fn(),
    onToggleQuestLog: vi.fn(),
    onToggleCharacterSheet: vi.fn(),
    onFocusInput: vi.fn(),
    onToggleVoice: vi.fn(),
    onReadLocation: vi.fn(),
    onReadStatus: vi.fn(),
    onToggleHelpManual: vi.fn(),
    onUndo: vi.fn(),
    ...overrides,
  };
}

describe("game keyboard shortcuts", () => {
  it("leave Ctrl, Cmd and Alt combos to the browser", () => {
    const ctx = context();
    for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
      for (const key of ["c", "r", "p", "1"]) {
        const e = keydown(key, { [modifier]: true });
        handleShortcutKey(e, ctx);
        expect(e.preventDefault).not.toHaveBeenCalled();
      }
    }
    expect(ctx.onToggleCharacterSheet).not.toHaveBeenCalled();
    expect(ctx.onReplayLast).not.toHaveBeenCalled();
    expect(ctx.onChoiceSelect).not.toHaveBeenCalled();
    expect(tts.pauseSpeech).not.toHaveBeenCalled();
  });

  it("don't fire while typing in a contentEditable field", () => {
    const ctx = context();
    const e = keydown("c", { target: { tagName: "DIV", isContentEditable: true, getAttribute: () => null } });
    handleShortcutKey(e, ctx);
    expect(ctx.onToggleCharacterSheet).not.toHaveBeenCalled();
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it("open the quest log on Q as well as q", () => {
    const ctx = context();
    handleShortcutKey(keydown("Q", { shiftKey: true }), ctx);
    handleShortcutKey(keydown("q"), ctx);
    expect(ctx.onToggleQuestLog).toHaveBeenCalledTimes(2);
  });

  it("do nothing behind the open character sheet except C, which closes it", () => {
    const ctx = context({ sheetOpen: true });
    for (const key of ["q", "i", "r", "u", "h", "v", "1", "?", " ", "m", "]"]) {
      const e = keydown(key);
      handleShortcutKey(e, ctx);
      expect(e.preventDefault).not.toHaveBeenCalled();
    }
    expect(ctx.onToggleQuestLog).not.toHaveBeenCalled();
    expect(ctx.onToggleInventory).not.toHaveBeenCalled();
    expect(ctx.onReplayLast).not.toHaveBeenCalled();
    expect(ctx.onUndo).not.toHaveBeenCalled();
    expect(ctx.onToggleHelpManual).not.toHaveBeenCalled();
    expect(ctx.onToggleVoice).not.toHaveBeenCalled();
    expect(ctx.onChoiceSelect).not.toHaveBeenCalled();
    expect(ctx.setKeyboardHelpOpen).not.toHaveBeenCalled();
    expect(ctx.setAmbientEnabled).not.toHaveBeenCalled();
    expect(ctx.setTTSSpeed).not.toHaveBeenCalled();
    expect(tts.pauseSpeech).not.toHaveBeenCalled();

    handleShortcutKey(keydown("C", { shiftKey: true }), ctx);
    expect(ctx.onToggleCharacterSheet).toHaveBeenCalledTimes(1);
  });

  it("still work with the sheet closed", () => {
    const ctx = context();
    handleShortcutKey(keydown("2"), ctx);
    handleShortcutKey(keydown("v"), ctx);
    expect(ctx.onChoiceSelect).toHaveBeenCalledWith(1);
    expect(ctx.onToggleVoice).toHaveBeenCalledTimes(1);
  });
});
