#!/usr/bin/env tsx
/**
 * Manual end-to-end smoke test against a running API server.
 *
 * Unlike the vitest integration test, this script:
 *  - assumes a real server is already listening (or starts one)
 *  - hits the real Claude path so you can verify streaming narration
 *  - streams the transcript to stdout as it arrives
 *  - plays through 3 scripted turns (begin → pick choice 1 → freeform)
 *
 * Usage:
 *   pnpm --filter @audio-rpg/api e2e
 *   # with a different host:
 *   AUDIO_RPG_API=http://localhost:4000 pnpm --filter @audio-rpg/api e2e
 *
 * Requires ANTHROPIC_API_KEY on whichever process is running the API.
 */

import WebSocket from "ws";
import type { ClientEvent, ServerEvent } from "@audio-rpg/shared";

const BASE = process.env["AUDIO_RPG_API"] ?? "http://localhost:4000";

async function main(): Promise<void> {
  line(`→ POST ${BASE}/campaigns`);
  const res = await fetch(`${BASE}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worldId: "sunken_bell", characterName: "Wren" }),
  });
  if (!res.ok) fail(`campaigns create failed: ${res.status} ${await res.text()}`);
  const { campaignId, authToken, title } = (await res.json()) as {
    campaignId: string;
    authToken: string;
    title: string;
  };
  line(`✓ campaign ${campaignId} ("${title}")`);

  const wsUrl = BASE.replace(/^http/, "ws") + "/session";
  line(`→ WS ${wsUrl}`);
  const ws = new WebSocket(wsUrl);
  await once(ws, "open");
  line("✓ ws open");

  const bySeq = new Map<string, string>(); // turnId → accumulated narration

  ws.on("message", (raw: Buffer) => {
    const evt = JSON.parse(raw.toString("utf8")) as ServerEvent;
    switch (evt.type) {
      case "session_ready":
        line(`— session_ready (turn ${evt.turnNumber})`);
        break;
      case "narration_chunk": {
        const acc = bySeq.get(evt.turnId) ?? "";
        if (evt.done) {
          process.stdout.write("\n");
          bySeq.delete(evt.turnId);
        } else {
          bySeq.set(evt.turnId, acc + evt.text);
          process.stdout.write(evt.text);
        }
        break;
      }
      case "choice_list":
        line(
          `— choices: ${evt.choices.map((c, i) => `[${i + 1}] ${c.label}`).join(" ")}${evt.acceptsFreeform ? " (or freeform)" : ""}`,
        );
        break;
      case "state_delta":
        line(`— state_delta: ${evt.mutations.length} mutation(s)`);
        break;
      case "sound_cue":
        line(`— cue: ${evt.cue}`);
        break;
      case "turn_complete":
        line(`— turn_complete (turn ${evt.turnNumber})`);
        break;
      case "error":
        line(`!! server error ${evt.code}: ${evt.message}`);
        break;
      default:
        break;
    }
  });

  const send = (event: ClientEvent) => ws.send(JSON.stringify(event));

  send({ type: "join", campaignId, authToken });

  // Three scripted turns.
  await waitFor(ws, "turn_complete", () => {
    send({ type: "player_input", input: { kind: "utility", command: "begin" } });
  });
  await waitFor(ws, "turn_complete", () => {
    // Pick the first choice we just saw (or fall back to freeform).
    const choiceListed = listenedLastChoices;
    const firstId = choiceListed?.[0]?.id;
    if (firstId) {
      send({ type: "player_input", input: { kind: "choice", choiceId: firstId } });
    } else {
      send({
        type: "player_input",
        input: { kind: "freeform", text: "I walk toward the lantern." },
      });
    }
  });
  await waitFor(ws, "turn_complete", () => {
    send({
      type: "player_input",
      input: { kind: "freeform", text: "I pull my notebook out and scribble what I see." },
    });
  });

  line("✓ three turns completed");
  ws.close();
}

// Track the latest choice_list so we can pick choice 1 in turn 2.
let listenedLastChoices: { id: string; label: string }[] | null = null;

function line(s: string): void {
  console.log(s);
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function once(ws: WebSocket, event: "open" | "close"): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ws.once(event, () => resolve());
    ws.once("error", (err) => reject(err));
  });
}

/** Run `kick` then resolve when the matching server event type arrives. */
function waitFor(
  ws: WebSocket,
  type: ServerEvent["type"],
  kick: () => void,
  timeoutMs = 30_000,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off("message", handler);
      reject(new Error(`timeout waiting for ${type}`));
    }, timeoutMs);
    const handler = (raw: Buffer) => {
      const evt = JSON.parse(raw.toString("utf8")) as ServerEvent;
      if (evt.type === "choice_list") listenedLastChoices = evt.choices;
      if (evt.type === type) {
        clearTimeout(timer);
        ws.off("message", handler);
        resolve();
      }
    };
    ws.on("message", handler);
    kick();
  });
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
