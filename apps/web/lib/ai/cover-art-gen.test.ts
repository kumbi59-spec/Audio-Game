import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const input = { worldName: "Mirewood", genre: "gothic horror", tone: "tense" };

/** Imports the module fresh, so its module-level env reads see `env`. */
async function generateWith(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  vi.resetModules();
  const { generateAICoverArt } = await import("./cover-art-gen");
  return generateAICoverArt(input);
}

describe("generateAICoverArt (bfl)", () => {
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
    expect(result.error).toMatch(/no task id/);
    expect(fetchMock).toHaveBeenCalledWith("https://api.bfl.ai/v1/flux-dev", expect.anything());
  });

  it("reads BFL_MODEL_NAME and BFL_API_BASE", async () => {
    await generateWith({
      ...base,
      BFL_API_BASE: "https://api.us.bfl.ai/v1",
      BFL_MODEL_NAME: "black-forest-labs/flux-pro-1.1",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.us.bfl.ai/v1/flux-pro-1.1",
      expect.anything(),
    );
  });

  it("falls back to the legacy MODEL_NAME", async () => {
    await generateWith({ ...base, BFL_API_BASE: "", BFL_MODEL_NAME: "", MODEL_NAME: "flux-pro" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.bfl.ai/v1/flux-pro", expect.anything());
  });
});
