import { describe, expect, it } from "vitest";
import {
  normalizeClientEventV1,
  serializeServerEvent,
  SESSION_EVENT_VERSION,
  UnsupportedClientEventVersionError,
} from "./session-compat.js";

describe("session transport compatibility", () => {
  it("accepts client events without a version and normalizes to v1 shape", () => {
    const event = normalizeClientEventV1({
      type: "request_recap",
    });

    expect(event).toEqual({ type: "request_recap" });
  });

  it("accepts explicit v1 client events", () => {
    const event = normalizeClientEventV1({
      type: "pause",
      v: "v1",
    });

    expect(event).toEqual({ type: "pause", v: "v1" });
  });

  it("rejects unsupported future versions with recoverable typed error", () => {
    expect(() =>
      normalizeClientEventV1({
        type: "leave",
        v: "v2",
      }),
    ).toThrowError(UnsupportedClientEventVersionError);

    try {
      normalizeClientEventV1({ type: "leave", v: "v2" });
    } catch (err) {
      expect(err).toBeInstanceOf(UnsupportedClientEventVersionError);
      const typed = err as UnsupportedClientEventVersionError;
      expect(typed.code).toBe("unsupported_event_version");
      expect(typed.recoverable).toBe(true);
      expect(typed.providedVersion).toBe("v2");
    }
  });

  it("serializes all outbound events with current version stamp", () => {
    const payload = serializeServerEvent({
      type: "error",
      code: "bad_event",
      message: "Invalid event.",
      recoverable: true,
    });

    expect(JSON.parse(payload)).toMatchObject({
      type: "error",
      code: "bad_event",
      v: SESSION_EVENT_VERSION,
    });
  });
});
