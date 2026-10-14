import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { getWorldsAnalytics } from "./rest";

function idsOf(url: string): string[] {
  return (new URL(url).searchParams.get("ids") ?? "").split(",");
}

describe("getWorldsAnalytics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("splits more than 50 ids into requests of at most 50 and merges the results", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const rows = idsOf(url).map((worldId) => ({ worldId, sessionCount: 1, totalTurns: 2 }));
      return new Response(JSON.stringify(rows), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const ids = Array.from({ length: 120 }, (_, i) => `world-${i}`);
    const analytics = await getWorldsAnalytics(ids);

    const requested = fetchMock.mock.calls.map(([url]) => idsOf(url));
    expect(requested.map((chunk) => chunk.length)).toEqual([50, 50, 20]);
    expect(requested.flat()).toEqual(ids);
    expect(analytics.map((a) => a.worldId)).toEqual(ids);
  });

  it("makes no request for an empty list", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getWorldsAnalytics([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
