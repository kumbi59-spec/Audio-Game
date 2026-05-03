import { describe, expect, it } from "vitest";
import {
  CURRENT_FIXTURES,
  LEGACY_CLIENT_FIXTURES,
  MALFORMED_FIXTURES,
  TRANSPORT_FIXTURE_DEPRECATION,
} from "./__fixtures__/session-transport-fixtures.js";
import {
  SESSION_EVENT_VERSION,
  UnsupportedClientEventVersionError,
  deserializeServerEvent,
  normalizeClientEventV1,
  serializeServerEventForClient,
} from "./session-compat.js";
import { assertFixtureMetadataComplete } from "./__tests__/transport-fixture-helpers.js";

describe("transport replay fixtures", () => {
  it("decodes legacy fixtures into canonical client event model", () => {
    for (const fixture of LEGACY_CLIENT_FIXTURES) {
      expect(normalizeClientEventV1(fixture.raw)).toEqual(fixture.expected);
    }
  });

  it("round-trips current fixtures for server event envelope", () => {
    const encoded = serializeServerEventForClient(CURRENT_FIXTURES.serverEvent, {
      eventVersion: SESSION_EVENT_VERSION,
      transportVersion: "1",
    });
    const decoded = deserializeServerEvent(JSON.parse(encoded));
    expect(decoded).toMatchObject(CURRENT_FIXTURES.serverEvent);
  });

  it("fails explicitly for malformed/partial fixtures", () => {
    const [missingVersion, unsupportedVersion, malformedPayload] = MALFORMED_FIXTURES;
    expect(missingVersion).toBeDefined();
    expect(unsupportedVersion).toBeDefined();
    expect(malformedPayload).toBeDefined();

    expect(() => normalizeClientEventV1(missingVersion!.raw)).toThrow();
    expect(() => normalizeClientEventV1(unsupportedVersion!.raw)).toThrowError(UnsupportedClientEventVersionError);
    expect(() => normalizeClientEventV1(malformedPayload!.raw)).toThrow();
  });

  it("keeps deprecation metadata aligned with every legacy fixture", () => {
    assertFixtureMetadataComplete(
      LEGACY_CLIENT_FIXTURES.map((f) => f.name),
      TRANSPORT_FIXTURE_DEPRECATION,
    );
  });

  it("encodes response envelope honoring capability negotiation", () => {
    const legacyClientEncoded = JSON.parse(
      serializeServerEventForClient(CURRENT_FIXTURES.serverEvent, { transportVersion: "999" }),
    );
    expect(legacyClientEncoded.version).toBe("1");
    expect(legacyClientEncoded.payload.v).toBeUndefined();

    const currentClientEncoded = JSON.parse(
      serializeServerEventForClient(CURRENT_FIXTURES.serverEvent, { eventVersion: SESSION_EVENT_VERSION, transportVersion: "1" }),
    );
    expect(currentClientEncoded.version).toBe("1");
    expect(currentClientEncoded.payload.v).toBe(SESSION_EVENT_VERSION);
  });
});
