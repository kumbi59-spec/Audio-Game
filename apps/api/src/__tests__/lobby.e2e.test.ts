import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import WebSocket from "ws";
import type { MultiplayerServerEvent } from "@audio-rpg/shared";
import { buildServer } from "../server.js";
import { issueSessionToken } from "../state/tokens.js";
import { clearRooms } from "../routes/lobby.js";

let app: Awaited<ReturnType<typeof buildServer>>;
let baseUrl: string;

beforeAll(async () => {
  app = await buildServer({ logLevel: "silent", lobby: { startDelayMs: 100 } });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address() as AddressInfo;
  baseUrl = `127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await app.close();
});

afterEach(() => {
  clearRooms();
});

async function openWs(campaignId: string): Promise<WebSocket> {
  const ws = new WebSocket(`ws://${baseUrl}/ws/lobby/${campaignId}`);
  await new Promise<void>((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  return ws;
}

type AnyEvent = MultiplayerServerEvent | { type: "error"; code: string; message: string };

function collect(ws: WebSocket): AnyEvent[] {
  const events: AnyEvent[] = [];
  ws.on("message", (raw: Buffer) => {
    try {
      events.push(JSON.parse(raw.toString("utf8")) as AnyEvent);
    } catch { /* ignore */ }
  });
  return events;
}

async function waitFor(
  events: AnyEvent[],
  type: AnyEvent["type"],
  timeoutMs = 2000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (events.some((e) => e.type === type)) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`timed out waiting for '${type}'`);
}

function joinMsg(campaignId: string, token: string, displayName: string) {
  return JSON.stringify({ type: "lobby_join", v: "v1", campaignId, authToken: token, displayName });
}

function readyMsg(campaignId: string, ready: boolean) {
  return JSON.stringify({ type: "lobby_ready", v: "v1", campaignId, ready });
}

describe("lobby WebSocket", () => {
  it("sends lobby_state to the first player who joins", async () => {
    const cid = "lob-1";
    const ws = await openWs(cid);
    const events = collect(ws);

    ws.send(joinMsg(cid, issueSessionToken(cid), "Alice"));
    await waitFor(events, "lobby_state");

    expect(events.find((e) => e.type === "lobby_state")).toMatchObject({
      type: "lobby_state",
      campaignId: cid,
      participants: [{ displayName: "Alice", ready: false }],
      maxPlayers: 4,
    });

    ws.close();
  });

  it("notifies the first player when a second player joins", async () => {
    const cid = "lob-2";
    const ws1 = await openWs(cid);
    const ev1 = collect(ws1);
    ws1.send(joinMsg(cid, issueSessionToken(cid), "Alice"));
    await waitFor(ev1, "lobby_state");

    const ws2 = await openWs(cid);
    const ev2 = collect(ws2);
    ws2.send(joinMsg(cid, issueSessionToken(cid), "Bob"));

    await waitFor(ev1, "player_joined");
    await waitFor(ev2, "lobby_state");

    expect(ev1.find((e) => e.type === "player_joined")).toMatchObject({
      participant: { displayName: "Bob" },
    });
    const s2 = ev2.find((e) => e.type === "lobby_state");
    expect(s2).toMatchObject({
      participants: expect.arrayContaining([
        expect.objectContaining({ displayName: "Alice" }),
        expect.objectContaining({ displayName: "Bob" }),
      ]),
    });

    ws1.close();
    ws2.close();
  });

  it("broadcasts lobby_ready then turn_request when all players are ready", async () => {
    const cid = "lob-3";

    const ws1 = await openWs(cid);
    const ev1 = collect(ws1);
    ws1.send(joinMsg(cid, issueSessionToken(cid), "Alice"));
    await waitFor(ev1, "lobby_state");

    const ws2 = await openWs(cid);
    const ev2 = collect(ws2);
    ws2.send(joinMsg(cid, issueSessionToken(cid), "Bob"));
    await waitFor(ev2, "lobby_state");

    ws1.send(readyMsg(cid, true));
    ws2.send(readyMsg(cid, true));

    await waitFor(ev1, "lobby_ready", 2000);
    await waitFor(ev1, "turn_request", 2000);

    const lobbyReady = ev1.find((e) => e.type === "lobby_ready");
    expect(lobbyReady).toMatchObject({
      type: "lobby_ready",
      participants: expect.arrayContaining([
        expect.objectContaining({ ready: true }),
        expect.objectContaining({ ready: true }),
      ]),
    });

    const turnReq = ev1.find((e) => e.type === "turn_request");
    expect(turnReq).toMatchObject({ type: "turn_request", campaignId: cid });

    ws1.close();
    ws2.close();
  });

  it("does not start with only one ready player", async () => {
    const cid = "lob-4";

    const ws1 = await openWs(cid);
    const ev1 = collect(ws1);
    ws1.send(joinMsg(cid, issueSessionToken(cid), "Loner"));
    await waitFor(ev1, "lobby_state");

    ws1.send(readyMsg(cid, true));
    await waitFor(ev1, "lobby_state"); // Updated state with ready: true

    await new Promise((r) => setTimeout(r, 300));
    expect(ev1.some((e) => e.type === "lobby_ready")).toBe(false);
    expect(ev1.some((e) => e.type === "turn_request")).toBe(false);

    ws1.close();
  });

  it("rejects an invalid auth token and closes the connection", async () => {
    const cid = "lob-5";
    const ws = await openWs(cid);
    const events = collect(ws);

    ws.send(joinMsg(cid, "invalid-token", "Hacker"));

    const closed = new Promise<void>((resolve) => ws.once("close", resolve));
    await closed;

    const err = events.find((e) => e.type === "error") as { type: "error"; code: string } | undefined;
    expect(err).toBeDefined();
    expect(err?.code).toBe("auth_failed");
  });

  it("notifies remaining players when someone disconnects", async () => {
    const cid = "lob-6";

    const ws1 = await openWs(cid);
    const ev1 = collect(ws1);
    ws1.send(joinMsg(cid, issueSessionToken(cid), "Alice"));
    await waitFor(ev1, "lobby_state");

    const ws2 = await openWs(cid);
    ws2.send(joinMsg(cid, issueSessionToken(cid), "Bob"));
    await waitFor(ev1, "player_joined");

    ws2.close();
    await waitFor(ev1, "player_left");

    expect(ev1.find((e) => e.type === "player_left")).toMatchObject({
      displayName: "Bob",
    });

    ws1.close();
  });
});
