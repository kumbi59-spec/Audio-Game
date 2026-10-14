import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TIER_ENTITLEMENTS } from "@audio-rpg/shared";

// A browser whose Web Storage is blocked (privacy settings, some embedded
// browsers): every access throws, as Safari and Chrome do then. It is in place
// before the store module loads, since the store reads it at load time.
const storage = vi.hoisted(() => {
  const storage = { blocked: true, items: new Map<string, string>() };
  const guard = () => {
    if (storage.blocked) throw new DOMException("The operation is insecure.", "SecurityError");
  };
  const fake = {
    getItem: (key: string) => { guard(); return storage.items.get(key) ?? null; },
    setItem: (key: string, value: string) => { guard(); storage.items.set(key, value); },
    removeItem: (key: string) => { guard(); storage.items.delete(key); },
  };
  vi.stubGlobal("window", { location: { search: "" } });
  vi.stubGlobal("localStorage", fake);
  vi.stubGlobal("sessionStorage", fake);
  return storage;
});

const {
  getInitialEntitlements,
  loadEntitlementsFromStorage,
  saveTierToStorage,
  useEntitlementsStore,
} = await import("./entitlements-store");

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("entitlements with blocked storage", () => {
  beforeEach(() => {
    storage.blocked = true;
    storage.items.clear();
    useEntitlementsStore.getState().setTier("free");
  });

  it("loads the store on the free tier instead of crashing", () => {
    expect(useEntitlementsStore.getState().entitlements).toEqual(TIER_ENTITLEMENTS.free);
    expect(getInitialEntitlements()).toEqual(TIER_ENTITLEMENTS.free);
  });

  it("leaves the tier alone when there's nothing to load", () => {
    useEntitlementsStore.getState().setTier("storyteller");
    expect(() => loadEntitlementsFromStorage()).not.toThrow();
    expect(useEntitlementsStore.getState().entitlements).toEqual(TIER_ENTITLEMENTS.storyteller);
  });

  it("doesn't throw when remembering the tier", () => {
    expect(() => saveTierToStorage("creator")).not.toThrow();
    expect(() => saveTierToStorage(null)).not.toThrow();
  });
});

describe("entitlements with working storage", () => {
  beforeEach(() => {
    storage.blocked = false;
    storage.items.clear();
    useEntitlementsStore.getState().setTier("free");
  });

  it("restores a remembered tier, and ignores one that isn't real", () => {
    saveTierToStorage("storyteller");
    expect(getInitialEntitlements()).toEqual(TIER_ENTITLEMENTS.storyteller);
    loadEntitlementsFromStorage();
    expect(useEntitlementsStore.getState().entitlements).toEqual(TIER_ENTITLEMENTS.storyteller);

    storage.items.set("echoquest-tier", "platinum");
    expect(getInitialEntitlements()).toEqual(TIER_ENTITLEMENTS.free);
    useEntitlementsStore.getState().setTier("free");
    loadEntitlementsFromStorage();
    expect(useEntitlementsStore.getState().entitlements).toEqual(TIER_ENTITLEMENTS.free);
  });

  it("forgets the tier on sign-out", () => {
    saveTierToStorage("creator");
    saveTierToStorage(null);
    expect(storage.items.has("echoquest-tier")).toBe(false);
  });
});
