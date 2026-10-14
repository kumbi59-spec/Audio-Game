import { afterEach, describe, expect, it, vi } from "vitest";
import { createVoyageEmbedder } from "./voyage.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("voyage embedder", () => {
  it("does not retry a 4xx response", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(401, { detail: "bad key" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createVoyageEmbedder("key").embed(["hello"])).rejects.toThrow("voyage 401");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("embeds queries with the query input type and a request timeout", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse(200, { data: [{ embedding: [0.1, 0.2] }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createVoyageEmbedder("key", "query").embed(["where is the bell?"])).resolves.toEqual([[0.1, 0.2]]);
    const init = fetchMock.mock.calls[0]![1];
    expect(JSON.parse(String(init.body))).toMatchObject({ input_type: "query" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("embeds documents by default", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse(200, { data: [{ embedding: [1] }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createVoyageEmbedder("key").embed(["chunk"]);
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1].body))).toMatchObject({ input_type: "document" });
  });

  it("retries a document embed after a 5xx but gives a query one try", async () => {
    const docFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ embedding: [1] }] }));
    vi.stubGlobal("fetch", docFetch);
    await expect(createVoyageEmbedder("key").embed(["chunk"])).resolves.toEqual([[1]]);
    expect(docFetch).toHaveBeenCalledTimes(2);

    const queryFetch = vi.fn(async () => jsonResponse(503, {}));
    vi.stubGlobal("fetch", queryFetch);
    await expect(createVoyageEmbedder("key", "query").embed(["bell?"])).rejects.toThrow("voyage 503");
    expect(queryFetch).toHaveBeenCalledTimes(1);
  });
});
