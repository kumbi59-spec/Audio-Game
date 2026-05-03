import { describe, expect, it } from "vitest";
import {
  normalizeClientEventV1,
  serializeServerEvent,
  SESSION_EVENT_VERSION,
  UnsupportedClientEventVersionError,
} from "./session-compat.js";

describe("session transport compatibility", () => {
  const legacyFixtures: Array<{ name: string; payload: unknown }> = [
    { name: "legacy request recap without version", payload: { type: "request_recap" } },
    { name: "legacy explicit v1 event", payload: { type: "pause", v: "v1" } },
  ];

  it("replays older fixture payloads against current validators", () => {
    for (const fixture of legacyFixtures) {
      expect(normalizeClientEventV1(fixture.payload)).toMatchObject(fixture.payload as object);
    }
  });

  it("accepts transport envelope payloads for supported versions", () => {
    const event = normalizeClientEventV1({
      version: "1",
      kind: "session.client_event",
      sentAt: new Date().toISOString(),
      payload: { type: "request_recap" },
    });

    expect(event).toEqual({ type: "request_recap" });
  });

  it("rejects unsupported future versions with recoverable typed error", () => {
    expect(() =>
      normalizeClientEventV1({
        version: "999",
        kind: "session.client_event",
        sentAt: new Date().toISOString(),
        payload: { type: "leave", v: "v1" },
      }),
    ).toThrowError(UnsupportedClientEventVersionError);

    try {
      normalizeClientEventV1({
        type: "leave",
        v: "v2",
      });
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedClientEventVersionError);
      const typed = err as UnsupportedClientEventVersionError;
      expect(typed.code).toBe("unsupported_event_version");
      expect(typed.recoverable).toBe(true);
      expect(typed.providedVersion).toBe("v2");
    }
  });

  it("serializes outbound events in a versioned transport envelope", () => {
    const payload = serializeServerEvent({
      type: "error",
      code: "bad_event",
      message: "Invalid event.",
      recoverable: true,
    });

    expect(JSON.parse(payload)).toMatchObject({
      version: "1",
      kind: "session.server_event",
      payload: {
        type: "error",
        code: "bad_event",
        v: SESSION_EVENT_VERSION,
      },
    });
  });
});
