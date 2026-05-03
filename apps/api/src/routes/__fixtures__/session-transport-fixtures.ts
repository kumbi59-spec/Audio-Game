import type { ClientEvent, ServerEvent } from "@audio-rpg/shared";

export const TRANSPORT_FIXTURE_DEPRECATION = {
  "legacy-payload": { supportedUntil: "2026-12-31", owner: "platform" },
  "legacy-envelope-v1": { supportedUntil: "2026-12-31", owner: "platform" },
  "current-envelope-v1": { supportedUntil: null, owner: "platform" },
} as const;

export const LEGACY_CLIENT_FIXTURES: Array<{
  name: keyof typeof TRANSPORT_FIXTURE_DEPRECATION;
  raw: unknown;
  expected: ClientEvent;
}> = [
  {
    name: "legacy-payload",
    raw: { type: "request_recap" },
    expected: { type: "request_recap" },
  },
  {
    name: "legacy-envelope-v1",
    raw: {
      version: "1",
      kind: "session.client_event",
      sentAt: "2026-01-01T00:00:00.000Z",
      payload: { type: "pause", v: "v1" },
    },
    expected: { type: "pause", v: "v1" },
  },
];

export const CURRENT_FIXTURES = {
  clientEnvelope: {
    version: "1",
    kind: "session.client_event",
    sentAt: "2026-01-01T00:00:00.000Z",
    payload: { type: "request_recap", v: "v1" } satisfies ClientEvent,
  },
  serverEvent: {
    type: "error",
    code: "bad_event",
    message: "Invalid event.",
    recoverable: true,
  } satisfies ServerEvent,
};

export const MALFORMED_FIXTURES: Array<{ name: string; raw: unknown }> = [
  { name: "partial-envelope-missing-payload", raw: { version: "1", kind: "session.client_event" } },
  {
    name: "unsupported-envelope-version",
    raw: {
      version: "999",
      kind: "session.client_event",
      sentAt: "2026-01-01T00:00:00.000Z",
      payload: { type: "leave", v: "v1" },
    },
  },
  { name: "invalid-event-shape", raw: { type: "player_input" } },
];
