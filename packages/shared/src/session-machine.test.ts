import { describe, expect, it } from "vitest";
import { canTransition } from "./session-machine.js";
import { ClientEvent, ServerEvent } from "./events.js";

describe("session machine", () => {
  it("allows valid transition", () => {
    expect(canTransition("connected", "joined")).toBe(true);
  });

  it("rejects invalid transition", () => {
    expect(canTransition("disconnected", "turn_complete")).toBe(false);
  });

  it("accepts events without version and with version", () => {
    expect(ClientEvent.parse({ type: "pause" }).type).toBe("pause");
    expect(ServerEvent.parse({ type: "recap_ready", summary: "x", v: "v1" }).type).toBe("recap_ready");
  });
});
