import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

/** Loads public/sw.js into a fake worker scope and returns its handlers. */
function loadWorker(version = "abc123") {
  const listeners: Record<string, (event: unknown) => void> = {};
  const stored: Array<{ cache: string; url: string }> = [];
  const caches = {
    open: vi.fn(async (name: string) => ({
      put: vi.fn(async (req: Request) => { stored.push({ cache: name, url: req.url }); }),
      addAll: vi.fn(async () => undefined),
    })),
    match: vi.fn(async () => undefined),
    keys: vi.fn(async () => ["echoquest-old", `echoquest-${version}`]),
    delete: vi.fn(async () => true),
  };
  const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
  const self = {
    location: new URL(`https://echoquest.test/sw.js?v=${version}`),
    addEventListener: (type: string, fn: (event: unknown) => void) => { listeners[type] = fn; },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
    registration: {},
  };
  vm.runInNewContext(readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8"), {
    self, caches, fetch: fetchMock, URL, Response, console, clients: self.clients,
  });

  async function request(path: string, mode: RequestMode = "no-cors") {
    let responded: Promise<Response> | null = null;
    const req = { url: `https://echoquest.test${path}`, method: "GET", mode, clone: () => req };
    listeners.fetch!({ request: req, respondWith: (p: Promise<Response>) => { responded = p; } });
    if (responded) await responded;
    await new Promise((r) => setTimeout(r, 0));
    return { handled: responded !== null };
  }
  return { listeners, caches, stored, request };
}

describe("service worker", () => {
  it("names its cache after the build and deletes older ones on activate", async () => {
    const { listeners, caches } = loadWorker("build42");
    let done: Promise<unknown> = Promise.resolve();
    listeners.activate!({ waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    expect(caches.delete).toHaveBeenCalledWith("echoquest-old");
    expect(caches.delete).not.toHaveBeenCalledWith("echoquest-build42");
  });

  it("caches public pages and build assets, never signed-in pages", async () => {
    const { request, stored } = loadWorker("v1");
    await request("/blog/some-post", "navigate");
    await request("/_next/static/chunks/app.js");
    await request("/account", "navigate");
    await request("/play", "navigate");
    expect(stored.map((s) => new URL(s.url).pathname)).toEqual(["/blog/some-post", "/_next/static/chunks/app.js"]);
    expect(stored.every((s) => s.cache === "echoquest-v1")).toBe(true);
  });

  it("leaves page data (RSC) and other requests to the browser", async () => {
    const { request } = loadWorker();
    expect((await request("/library?_rsc=abc", "cors")).handled).toBe(false);
    expect((await request("/api/game/session", "cors")).handled).toBe(true);
  });
});
