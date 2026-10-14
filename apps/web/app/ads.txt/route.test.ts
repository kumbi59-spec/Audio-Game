import { afterEach, describe, expect, it, vi } from "vitest";

// The publisher id is read once at module load, so each case loads a fresh copy.
async function adsTxtFor(pubId: string | undefined): Promise<string> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUB_ID", pubId);
  const { GET } = await import("./route");
  return GET().text();
}

describe("GET /ads.txt", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("turns the AdSense client id (ca-pub-…) into the pub-… id ads.txt expects", async () => {
    expect(await adsTxtFor("ca-pub-123")).toBe("google.com, pub-123, DIRECT, f08c47fec0942fa0\n");
  });

  it("keeps an id that is already pub-…, and accepts bare digits", async () => {
    expect(await adsTxtFor(" pub-456 ")).toContain("google.com, pub-456, DIRECT");
    expect(await adsTxtFor("789")).toContain("google.com, pub-789, DIRECT");
  });

  it("treats an empty env var as unset", async () => {
    expect(await adsTxtFor("")).toContain("google.com, pub-9267788778991046, DIRECT");
    expect(await adsTxtFor(undefined)).toContain("google.com, pub-9267788778991046, DIRECT");
  });
});
