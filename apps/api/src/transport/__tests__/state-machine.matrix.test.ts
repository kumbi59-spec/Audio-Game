import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SessionStates, SessionTriggers } from "@audio-rpg/shared";
import {
  declaredTransportMatrix,
  evaluateTransportTransition,
  nextStateForTransportEvent,
} from "../state-machine.js";

const generatedPath = resolve(process.cwd(), "../../docs/architecture/generated/transport-transition-matrix.json");

describe("transport transition matrix", () => {
  it("covers every declared state/event pair", () => {
    const matrix = declaredTransportMatrix();
    expect(matrix).toHaveLength(SessionStates.length * SessionTriggers.length);
  });

  it("accepts every valid transition and returns resulting state", () => {
    for (const from of SessionStates) {
      for (const trigger of SessionTriggers) {
        const result = evaluateTransportTransition({ from, trigger });
        const to = nextStateForTransportEvent(trigger);
        if (result.ok) {
          expect(result.to).toBe(to);
        }
      }
    }
  });

  it("blocks invalid transitions with stable codes", () => {
    const blocked = [
      evaluateTransportTransition({ from: "disconnected", trigger: "player_input" }),
      evaluateTransportTransition({ from: "connected", trigger: "request_recap" }),
      evaluateTransportTransition({ from: "closed", trigger: "join" }),
    ];
    expect(blocked.map((b) => (b.ok ? "ok" : b.reason))).toEqual([
      "invalid_transition",
      "invalid_transition",
      "already_terminal",
    ]);
  });

  it("enforces guard-specific failures", () => {
    const timeout = evaluateTransportTransition({ from: "joined", trigger: "player_input", context: { requestTimedOut: true } });
    const missing = evaluateTransportTransition({ from: "joined", trigger: "player_input", context: { hasSession: false } });
    const version = evaluateTransportTransition({ from: "connected", trigger: "join", context: { transportVersionSupported: false } });
    expect(timeout.ok ? "ok" : timeout.reason).toBe("timeout");
    expect(missing.ok ? "ok" : missing.reason).toBe("missing_prerequisite");
    expect(version.ok ? "ok" : version.reason).toBe("incompatible_transport_version");
  });

  it("matches generated transition artifact", () => {
    const actual = JSON.stringify(declaredTransportMatrix(), null, 2);
    const expected = readFileSync(generatedPath, "utf8").trim();
    expect(actual).toBe(expected);
  });
});
