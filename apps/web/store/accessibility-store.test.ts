import { afterAll, describe, expect, it, vi } from "vitest";

// The store only persists when it finds a localStorage at creation.
const items = vi.hoisted(() => {
  const items = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
    removeItem: (key: string) => { items.delete(key); },
  });
  return items;
});

import { useAccessibilityStore } from "./accessibility-store";
import { A11Y_STORAGE_KEY } from "@/lib/a11y/display-prefs";

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("accessibility store", () => {
  it("doesn't persist open dialogs, so they don't reopen on the next visit", () => {
    const store = useAccessibilityStore.getState();
    store.setKeyboardHelpOpen(true);
    store.openOperationsManual();
    store.markOperationsManualSeen();
    const persisted = JSON.parse(items.get(A11Y_STORAGE_KEY)!) as { state: Record<string, unknown> };
    expect(persisted.state).not.toHaveProperty("keyboardHelpOpen");
    expect(persisted.state).not.toHaveProperty("operationsManualOpen");
    expect(persisted.state).toMatchObject({ operationsManualSeen: true });
  });
});
