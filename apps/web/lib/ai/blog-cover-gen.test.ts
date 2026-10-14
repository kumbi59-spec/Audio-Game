import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pickScenes } from "./blog-cover-gen";

describe("pickScenes", () => {
  it("ignores cue words buried inside other words", () => {
    // "said" (ai), "image" (mage), "EchoQuest" (quest), "history" (story), "explore" (lore)
    expect(pickScenes("She said the image of EchoQuest history helps you explore.")).toEqual([]);
  });

  it("still matches whole words, plurals and stems", () => {
    const scenes = pickScenes("Worldbuilding for heroes: how AI narrates quests");
    expect(scenes).toHaveLength(3);
    expect(scenes[0]).toContain("leather-bound atlas");
    expect(scenes[1]).toContain("cloaked travelers");
    expect(scenes[2]).toContain("winding mountain road");
  });

  it("matches D&D on its own", () => {
    expect(pickScenes("A D&D night")[0]).toContain("dice, parchment");
  });
});

/** Imports the module fresh, so its module-level env reads see `env`. */
async function generateWith(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  vi.resetModules();
  const { generateBlogCoverArt } = await import("./blog-cover-gen");
  return generateBlogCoverArt({ title: "Launch day", excerpt: "EchoQuest is live." });
}

describe("generateBlogCoverArt (bfl)", () => {
  // An empty create response stops the flow before polling, so only the
  // request URL is exercised.
  const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const base = { IMAGE_GEN_PROVIDER: "bfl", BFL_API_KEY: "bfl_test", MODEL_NAME: "" };

  it("keeps the default endpoint and model when the overrides are empty", async () => {
    const result = await generateWith({ ...base, BFL_API_BASE: "", BFL_MODEL_NAME: "" });
    expect("error" in result && result.error).toMatch(/no task id/);
    expect(fetchMock).toHaveBeenCalledWith("https://api.bfl.ai/v1/flux-dev", expect.anything());
  });

  it("reads BFL_MODEL_NAME and falls back to the legacy MODEL_NAME", async () => {
    await generateWith({ ...base, BFL_API_BASE: "", BFL_MODEL_NAME: "black-forest-labs/flux-pro-1.1" });
    expect(fetchMock).toHaveBeenLastCalledWith("https://api.bfl.ai/v1/flux-pro-1.1", expect.anything());
    await generateWith({ ...base, BFL_API_BASE: "", BFL_MODEL_NAME: "", MODEL_NAME: "flux-pro" });
    expect(fetchMock).toHaveBeenLastCalledWith("https://api.bfl.ai/v1/flux-pro", expect.anything());
  });
});
