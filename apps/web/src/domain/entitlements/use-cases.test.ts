import { describe, expect, it } from "vitest";
import {
  canAccessFeature,
  entitlementsForTier,
  minimumTierFor,
  upgradePromptFor,
} from "./use-cases";

describe("entitlements domain use-cases", () => {
  it("returns correct entitlements for each tier", () => {
    const free = entitlementsForTier("free");
    expect(free.tier).toBe("free");
    expect(free.bibleUpload).toBe(false);

    const storyteller = entitlementsForTier("storyteller");
    expect(storyteller.bibleUpload).toBe(true);

    const creator = entitlementsForTier("creator");
    expect(creator.worldWizard).toBe(true);
    expect(creator.publicPublishing).toBe(true);
  });

  it("canAccessFeature checks boolean and numeric features", () => {
    expect(canAccessFeature("free", "bibleUpload")).toBe(false);
    expect(canAccessFeature("storyteller", "bibleUpload")).toBe(true);
    expect(canAccessFeature("creator", "worldWizard")).toBe(true);
    expect(canAccessFeature("free", "worldWizard")).toBe(false);
  });

  it("minimumTierFor returns the lowest tier with access", () => {
    expect(minimumTierFor("bibleUpload")).toBe("storyteller");
    expect(minimumTierFor("publicPublishing")).toBe("creator");
  });

  it("upgradePromptFor returns null when already has access", () => {
    expect(upgradePromptFor("storyteller", "bibleUpload")).toBeNull();
    expect(upgradePromptFor("creator", "worldWizard")).toBeNull();
  });

  it("upgradePromptFor returns prompt string when upgrade needed", () => {
    const prompt = upgradePromptFor("free", "bibleUpload");
    expect(prompt).toContain("Storyteller");
    const creatorPrompt = upgradePromptFor("free", "publicPublishing");
    expect(creatorPrompt).toContain("Creator");
  });
});
