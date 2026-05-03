import { describe, expect, it } from "vitest";
import { normalizeClientEventV1, serializeServerEventForClient } from "./session-compat.js";

describe("compatibility contract: web/mobile skew", () => {
  it("older client payload decodes on newer server", () => {
    const olderClientPayload = { type: "request_recap" };
    expect(normalizeClientEventV1(olderClientPayload)).toEqual({ type: "request_recap" });
  });

  it("newer-capability client gets versioned server payload while older client gets fallback", () => {
    const event = { type: "recap_ready", summary: "Previously on..." } as const;

    const olderClient = JSON.parse(serializeServerEventForClient(event, { transportVersion: "999" }));
    expect(olderClient.version).toBe("1");
    expect(olderClient.payload.v).toBeUndefined();

    const newerClient = JSON.parse(
      serializeServerEventForClient(event, { transportVersion: "1", eventVersion: "v1" }),
    );
    expect(newerClient.version).toBe("1");
    expect(newerClient.payload.v).toBe("v1");
  });
});
