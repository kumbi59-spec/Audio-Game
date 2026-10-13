import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "../server.js";
import { issueTierToken } from "../auth/entitlements.js";

const ingest = vi.hoisted(() => ({ reply: "" }));

vi.mock("../ingest/runner.js", () => ({
  runIngestModel: async () => ingest.reply,
}));

vi.mock("../gm/claude.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../gm/claude.js")>()),
  generateWizardSuggestions: async () => ["The Drowned Chapel"],
}));

const storyteller = { authorization: `Bearer ${issueTierToken("storyteller")}` };
const notes = "Session 4: the party reached the drowned chapel and met the bell-keeper.";

let app: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  app = await buildServer({ logLevel: "silent" });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  ingest.reply = "";
});

describe("POST /worlds/import-notes", () => {
  it("requires a storyteller tier token", async () => {
    ingest.reply = '{"title": "Drowned Chapel"}';
    const res = await app.inject({ method: "POST", url: "/worlds/import-notes", payload: { notes } });
    expect(res.statusCode).toBe(403);
  });

  it("reads a draft from a reply wrapped in prose and fences", async () => {
    ingest.reply = 'Here is the draft:\n```json\n{"title": "Drowned Chapel", "genre": "gothic", "extra": "x"}\n```';
    const res = await app.inject({
      method: "POST",
      url: "/worlds/import-notes",
      payload: { notes },
      headers: storyteller,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ draft: { title: "Drowned Chapel", genre: "gothic" } });
  });

  it("rejects a reply that is JSON but not an object", async () => {
    ingest.reply = '["Drowned Chapel"]';
    const res = await app.inject({
      method: "POST",
      url: "/worlds/import-notes",
      payload: { notes },
      headers: storyteller,
    });
    expect(res.statusCode).toBe(502);
  });
});

describe("world wizard tier gates", () => {
  it("lets storyteller use POST /worlds", async () => {
    const res = await app.inject({ method: "POST", url: "/worlds", payload: {}, headers: storyteller });
    // Past the tier gate: the empty body fails validation instead.
    expect(res.statusCode).toBe(400);
  });

  it("lets storyteller use /wizard/suggest", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/wizard/suggest",
      payload: { stepId: "title" },
      headers: storyteller,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ suggestions: ["The Drowned Chapel"] });
  });

  it("still refuses the free tier", async () => {
    const res = await app.inject({ method: "POST", url: "/wizard/suggest", payload: { stepId: "title" } });
    expect(res.statusCode).toBe(403);
  });
});
