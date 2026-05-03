import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import WebSocket from "ws";
import type { GmTurn, ServerEvent } from "@audio-rpg/shared";
import { buildServer } from "../server.js";
import { closeStore } from "../state/store.js";
import { resetSessionMetrics } from "../observability/session-metrics.js";

/**
 * End-to-end loop test. Spins up the real Fastify server with an
 * injected deterministic turn generator, creates a campaign via REST,
 * joins the session WebSocket, sends a player input, and asserts the
 * full event sequence lands. No Anthropic / ElevenLabs / Deepgram /
 * Postgres credentials required — the in-memory store is used and the
 * turn generator is a fake.
 */

const fakeTurn: GmTurn = {
  narration:
    "The fog rolls in over Lirren. A single lantern bobs along the breakwater, then stops.",
  presented_choices: [
    { id: "c1", label: "Walk toward the lantern." },
    { id: "c2", label: "Call out first, then approach." },
    { id: "c3", label: "Slip into the fog and watch." },
  ],
  accepts_freeform: true,
  sound_cues: ["tension_low"],
  state_mutations: [
    { op: "flag.set", key: "arrived_in_lirren", value: true },
    {
      op: "codex.unlock",
      key: "lirren",
      title: "Lirren",
      body: "A fogbound fishing village at the edge of the sea.",
    },
  ],
  narration_voice_plan: [],
  scene_ends: false,
};

let app: Awaited<ReturnType<typeof buildServer>>;
let baseUrl: string;

beforeAll(async () => {
  resetSessionMetrics();
  app = await buildServer({
    logLevel: "warn",
    turnGenerator: async ({ onText }) => {
      // Stream a few slices so the WS narration_chunk path is exercised.
      if (onText) {
        const slices = chunk(fakeTurn.narration, 24);
        for (const s of slices) onText(s);
      }
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

describe("session end-to-end", () => {
  it("creates a campaign, runs one GM turn over WS, and persists state", async () => {
    // 1. Create campaign via REST.
    const res = await fetch(`http://${baseUrl}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worldId: "sunken_bell", characterName: "Wren" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      campaignId: string;
      authToken: string;
      title: string;
    };
    expect(body.campaignId).toBeTruthy();
    expect(body.authToken).toBeTruthy();
    expect(body.title).toMatch(/Sunken Bell/i);

    // 2. Open the session WebSocket.
    const ws = new WebSocket(`ws://${baseUrl}/session`);
    const events: ServerEvent[] = [];
    const turnComplete = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("timed out waiting for turn_complete")),
        5000,
      );
      ws.on("message", (raw: Buffer) => {
        const evt = JSON.parse(raw.toString("utf8")) as ServerEvent;
        events.push(evt);
        if (evt.type === "turn_complete") {
          clearTimeout(timeout);
          resolve();
        }
      });
      ws.on("error", reject);
    });
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    // 3. join
    ws.send(
      JSON.stringify({
        type: "join",
        campaignId: body.campaignId,
        authToken: body.authToken,
      }),
    );

    // 4. Wait a tick for session_ready, then send player input.
    await waitForEvent(events, "session_ready");
    ws.send(
      JSON.stringify({
        type: "player_input",
        input: { kind: "utility", command: "begin" },
      }),
    );

    await turnComplete;
    ws.close();

    // 5. Assert the full event sequence.
    const types = events.map((e) => e.type);
    expect(types).toContain("session_ready");
    expect(types).toContain("narration_chunk");
    expect(types).toContain("choice_list");
    expect(types).toContain("state_delta");
    expect(types).toContain("sound_cue");
    expect(types).toContain("turn_complete");

    const choiceList = events.find((e) => e.type === "choice_list");
    expect(choiceList).toMatchObject({
      choices: fakeTurn.presented_choices,
      acceptsFreeform: true,
    });

    const stateDelta = events.find((e) => e.type === "state_delta");
    expect(stateDelta).toMatchObject({
      mutations: expect.arrayContaining([
        expect.objectContaining({ op: "flag.set", key: "arrived_in_lirren" }),
      ]),
    });

    // 6. Confirm state was persisted and the presented choices round-tripped.
    const summaryRes = await fetch(
      `http://${baseUrl}/campaigns/${body.campaignId}`,
    );
    expect(summaryRes.status).toBe(200);
    const summary = (await summaryRes.json()) as {
      state: {
        turn_number: number;
        flags: Record<string, unknown>;
        codex: unknown[];
      };
    };
    expect(summary.state.turn_number).toBe(1);
    expect(summary.state.flags).toMatchObject({ arrived_in_lirren: true });
    expect(summary.state.codex).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "lirren" })]),
    );
  });

  it("rejects a player_input before join with a recoverable error", async () => {
    const ws = new WebSocket(`ws://${baseUrl}/session`);
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });
    const errored = new Promise<ServerEvent>((resolve) => {
      ws.once("message", (raw: Buffer) => {
        resolve(JSON.parse(raw.toString("utf8")) as ServerEvent);
      });
    });
    ws.send(
      JSON.stringify({
        type: "player_input",
        input: { kind: "freeform", text: "hello?" },
      }),
    );
    const evt = await errored;
    expect(evt.type).toBe("error");
    if (evt.type === "error") {
      expect(evt.code).toBe("not_joined");
      expect(evt.recoverable).toBe(true);
    }
    ws.close();
  });

  it("deduplicates repeated player_input events with the same eventId", async () => {
    const res = await fetch(`http://${baseUrl}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worldId: "sunken_bell", characterName: "Ida" }),
    });
    const { campaignId, authToken } = (await res.json()) as {
      campaignId: string;
      authToken: string;
    };

    const ws = new WebSocket(`ws://${baseUrl}/session`);
    const events: ServerEvent[] = [];
    ws.on("message", (raw: Buffer) => {
      events.push(JSON.parse(raw.toString("utf8")) as ServerEvent);
    });
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    ws.send(JSON.stringify({ type: "join", campaignId, authToken }));
    await waitForEvent(events, "session_ready");

    const payload = {
      type: "player_input",
      eventId: "evt-1",
      input: { kind: "utility", command: "begin" },
    };

    ws.send(JSON.stringify(payload));
    await waitForEvent(events, "turn_complete");

    ws.send(JSON.stringify(payload));
    await waitForErrorCode(events, "duplicate_event");

    ws.close();

    const turnCompletions = events.filter((e) => e.type === "turn_complete");
    expect(turnCompletions).toHaveLength(1);

    const duplicateError = events.find(
      (e) => e.type === "error" && e.code === "duplicate_event",
    );
    expect(duplicateError).toMatchObject({
      type: "error",
      code: "duplicate_event",
      eventId: "evt-1",
    });
  });

  it("persists two sequential turns (exercises Postgres when DATABASE_URL is set)", async () => {
    // Create a fresh campaign so we can observe the monotonic turn counter.
    const res = await fetch(`http://${baseUrl}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worldId: "sunken_bell", characterName: "Aer" }),
    });
    const { campaignId, authToken } = (await res.json()) as {
      campaignId: string;
      authToken: string;
    };

    const ws = new WebSocket(`ws://${baseUrl}/session`);
    const completes: number[] = [];
    const events: ServerEvent[] = [];
    ws.on("message", (raw: Buffer) => {
      const evt = JSON.parse(raw.toString("utf8")) as ServerEvent;
      events.push(evt);
      if (evt.type === "turn_complete") completes.push(evt.turnNumber);
    });
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    ws.send(JSON.stringify({ type: "join", campaignId, authToken }));
    await waitForEvent(events, "session_ready");

    ws.send(
      JSON.stringify({
        type: "player_input",
        input: { kind: "utility", command: "begin" },
      }),
    );
    await waitForCompletion(completes, 1);

    // A choice input from the list returned by the fake generator.
    ws.send(
      JSON.stringify({
        type: "player_input",
        input: { kind: "choice", choiceId: "c1" },
      }),
    );
    await waitForCompletion(completes, 2);
    ws.close();

    expect(completes).toEqual([1, 2]);

    // Fetch the campaign summary — asserts Postgres round-trip of state.
    const summaryRes = await fetch(`http://${baseUrl}/campaigns/${campaignId}`);
    const summary = (await summaryRes.json()) as {
      state: { turn_number: number; inventory: { name: string }[] };
    };
    expect(summary.state.turn_number).toBe(2);
    expect(summary.state.inventory.length).toBeGreaterThan(0);
  });

  it("exposes session counters on /metrics", async () => {
    const res = await fetch(`http://${baseUrl}/metrics`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      session: {
        connectionsOpened: number;
        connectionsClosed: number;
        turnRequests: number;
        duplicateInputs: number;
      };
    };

    expect(body.session.connectionsOpened).toBeGreaterThan(0);
    expect(body.session.connectionsClosed).toBeGreaterThan(0);
    expect(body.session.turnRequests).toBeGreaterThan(0);
    expect(body.session.duplicateInputs).toBeGreaterThan(0);
  });

  it("reports storage backend in health and metrics", async () => {
    const expectedBackend = process.env["DATABASE_URL"] ? "postgres" : "memory";

    const healthRes = await fetch(`http://${baseUrl}/health`);
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as {
      ok: boolean;
      storageBackend: "memory" | "postgres";
      models: { gmTurnModel: string; summaryModel: string };
    };
    expect(health.ok).toBe(true);
    expect(health.storageBackend).toBe(expectedBackend);
    expect(health.models.gmTurnModel).toBeTruthy();
    expect(health.models.summaryModel).toBeTruthy();

    const metricsRes = await fetch(`http://${baseUrl}/metrics`);
    expect(metricsRes.status).toBe(200);
    const metrics = (await metricsRes.json()) as {
      storageBackend: "memory" | "postgres";
    };
    expect(metrics.storageBackend).toBe(expectedBackend);
  });

  it("rejects an invalid session token", async () => {
    const ws = new WebSocket(`ws://${baseUrl}/session`);
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });
    const firstMessage = new Promise<ServerEvent>((resolve) => {
      ws.once("message", (raw: Buffer) => {
        resolve(JSON.parse(raw.toString("utf8")) as ServerEvent);
      });
    });
    ws.send(
      JSON.stringify({
        type: "join",
        campaignId: "does-not-exist",
        authToken: "not-a-token",
      }),
    );
    const evt = await firstMessage;
    expect(evt.type).toBe("error");
    if (evt.type === "error") {
      expect(evt.code).toBe("join_failed");
    }
    ws.close();
  });
});

function chunk(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

async function waitForEvent(
  events: ServerEvent[],
  type: ServerEvent["type"],
  timeoutMs = 2000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (events.some((e) => e.type === type)) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`timed out waiting for ${type}`);
}

async function waitForCompletion(
  completes: number[],
  turnNumber: number,
  timeoutMs = 5000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (completes.includes(turnNumber)) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`timed out waiting for turn_complete ${turnNumber}`);
}

async function waitForErrorCode(
  events: ServerEvent[],
  code: string,
): Promise<void> {
  for (let i = 0; i < 50; i += 1) {
    if (events.some((e) => e.type === "error" && e.code === code)) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`timed out waiting for error code ${code}`);
}
