import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import WebSocket from "ws";
import type { GmTurn, ServerEvent } from "@audio-rpg/shared";
import { buildServer } from "../server.js";
import { closeStore, getStore } from "../state/store.js";
import { deserializeServerEvent } from "../routes/session-compat.js";

/**
 * Session WebSocket behaviour across sockets and retries, on the in-memory
 * store with a controllable fake GM.
 */

const fakeTurn: GmTurn = {
  narration: "The lantern stops. Someone is waiting on the breakwater.",
  presented_choices: [
    { id: "c1", label: "Walk toward the lantern." },
    { id: "c2", label: "Wait in the fog." },
  ],
  accepts_freeform: true,
  sound_cues: [],
  state_mutations: [],
  narration_voice_plan: [],
  scene_ends: false,
};

let generatorFails = false;
let generatorGate: Promise<void> | null = null;
let generatorCalls = 0;

let app: Awaited<ReturnType<typeof buildServer>>;
let baseUrl: string;

beforeAll(async () => {
  app = await buildServer({
    logLevel: "silent",
    turnGenerator: async () => {
      generatorCalls += 1;
      if (generatorGate) await generatorGate;
      if (generatorFails) throw new Error("model unavailable");
      return fakeTurn;
    },
  });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address() as AddressInfo;
  baseUrl = `127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await app.close();
  await closeStore();
});

beforeEach(() => {
  generatorFails = false;
  generatorGate = null;
  generatorCalls = 0;
});

async function createCampaign(characterName: string) {
  const res = await fetch(`http://${baseUrl}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldId: "sunken_bell", characterName }),
  });
  return (await res.json()) as { campaignId: string; authToken: string };
}

async function joinedSocket(
  campaignId: string,
  authToken: string,
): Promise<{ ws: WebSocket; events: ServerEvent[] }> {
  const ws = new WebSocket(`ws://${baseUrl}/session`);
  const events: ServerEvent[] = [];
  ws.on("message", (raw: Buffer) => {
    events.push(deserializeServerEvent(JSON.parse(raw.toString("utf8"))));
  });
  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", reject);
  });
  ws.send(JSON.stringify({ type: "join", campaignId, authToken }));
  await waitUntil(() => events.some((e) => e.type === "session_ready"), "session_ready");
  return { ws, events };
}

function sendInput(ws: WebSocket, eventId?: string): void {
  ws.send(
    JSON.stringify({
      type: "player_input",
      ...(eventId ? { eventId } : {}),
      input: { kind: "freeform", text: "I walk toward the lantern." },
    }),
  );
}

function turnCompletions(events: ServerEvent[]): number[] {
  return events.flatMap((e) => (e.type === "turn_complete" ? [e.turnNumber] : []));
}

function errorCodes(events: ServerEvent[]): string[] {
  return events.flatMap((e) => (e.type === "error" ? [e.code] : []));
}

async function waitUntil(check: () => boolean, label: string, timeoutMs = 3000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 15));
  }
  throw new Error(`timed out waiting for ${label}`);
}

describe("multiplayer session", () => {
  it("runs each player's turn on the campaign's latest state", async () => {
    const { campaignId, authToken } = await createCampaign("Wren");
    const a = await joinedSocket(campaignId, authToken);
    const b = await joinedSocket(campaignId, authToken);

    sendInput(a.ws);
    await waitUntil(() => turnCompletions(b.events).length === 1, "A's turn on B");

    sendInput(b.ws);
    await waitUntil(() => turnCompletions(b.events).length === 2, "B's turn");

    // B's turn builds on A's instead of replaying turn 1 over it.
    expect(turnCompletions(b.events)).toEqual([1, 2]);
    expect(turnCompletions(a.events)).toEqual([1, 2]);
    const summary = (await (await fetch(`http://${baseUrl}/campaigns/${campaignId}`)).json()) as {
      state: { turn_number: number };
    };
    expect(summary.state.turn_number).toBe(2);

    a.ws.close();
    b.ws.close();
  });

  it("keeps the turn lock when the player driving the turn disconnects", async () => {
    const { campaignId, authToken } = await createCampaign("Ida");
    const a = await joinedSocket(campaignId, authToken);
    const b = await joinedSocket(campaignId, authToken);

    let release: () => void = () => {};
    generatorGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    sendInput(a.ws);
    await waitUntil(() => generatorCalls === 1, "A's turn to start");
    a.ws.close();
    await new Promise((r) => setTimeout(r, 100));

    sendInput(b.ws);
    await waitUntil(() => errorCodes(b.events).includes("turn_in_progress"), "turn_in_progress");
    expect(generatorCalls).toBe(1);

    release();
    await waitUntil(() => turnCompletions(b.events).length === 1, "A's turn to finish");
    generatorGate = null;

    // The finished turn released the lock.
    sendInput(b.ws);
    await waitUntil(() => turnCompletions(b.events).length === 2, "B's turn");
    expect(turnCompletions(b.events)).toEqual([1, 2]);

    b.ws.close();
  });
});

describe("session socket", () => {
  it("rejects a second join once a campaign is joined", async () => {
    const first = await createCampaign("Aer");
    const second = await createCampaign("Mira");
    const a = await joinedSocket(first.campaignId, first.authToken);

    a.ws.send(JSON.stringify({ type: "join", campaignId: second.campaignId, authToken: second.authToken }));
    await waitUntil(() => errorCodes(a.events).includes("already_joined"), "already_joined");
    expect(a.events.filter((e) => e.type === "session_ready")).toHaveLength(1);

    // Turns still go to the first campaign only.
    sendInput(a.ws);
    await waitUntil(() => turnCompletions(a.events).length === 1, "turn_complete");
    const firstSummary = (await (await fetch(`http://${baseUrl}/campaigns/${first.campaignId}`)).json()) as {
      state: { turn_number: number };
    };
    const secondSummary = (await (await fetch(`http://${baseUrl}/campaigns/${second.campaignId}`)).json()) as {
      state: { turn_number: number };
    };
    expect(firstSummary.state.turn_number).toBe(1);
    expect(secondSummary.state.turn_number).toBe(0);

    a.ws.close();
  });

  it("lets a failed turn be retried with the same eventId", async () => {
    const { campaignId, authToken } = await createCampaign("Nim");
    const a = await joinedSocket(campaignId, authToken);

    generatorFails = true;
    sendInput(a.ws, "evt-retry");
    await waitUntil(() => errorCodes(a.events).includes("turn_failed"), "turn_failed");

    generatorFails = false;
    sendInput(a.ws, "evt-retry");
    await waitUntil(() => turnCompletions(a.events).length === 1, "retried turn");
    expect(errorCodes(a.events)).not.toContain("duplicate_event");

    // Once it succeeded, the same id is a duplicate.
    sendInput(a.ws, "evt-retry");
    await waitUntil(() => errorCodes(a.events).includes("duplicate_event"), "duplicate_event");
    expect(turnCompletions(a.events)).toEqual([1]);

    a.ws.close();
  });

  it("counts the free turn limit per session, not over the campaign's lifetime", async () => {
    const { campaignId, authToken } = await createCampaign("Rec");
    const store = getStore();
    const summary = await store.getCampaignSummary(campaignId);
    await store.persistState(campaignId, { ...summary!.state, turn_number: 40 });

    const a = await joinedSocket(campaignId, authToken);
    for (let i = 1; i <= 20; i += 1) {
      sendInput(a.ws);
      await waitUntil(() => turnCompletions(a.events).length === i, `turn ${i}`);
    }
    expect(turnCompletions(a.events)[0]).toBe(41);

    sendInput(a.ws);
    await waitUntil(() => errorCodes(a.events).includes("turn_limit_reached"), "turn_limit_reached");
    expect(turnCompletions(a.events)).toHaveLength(20);

    a.ws.close();
  });
});
