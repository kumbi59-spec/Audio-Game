import { ClientEvent, type ServerEvent } from "@audio-rpg/shared";

export const SESSION_EVENT_VERSION = "v1" as const;

export class UnsupportedClientEventVersionError extends Error {
  readonly code = "unsupported_event_version" as const;
  readonly recoverable = true as const;

  constructor(readonly providedVersion: string) {
    super(
      `Unsupported client event version '${providedVersion}'. Please upgrade your client and reconnect.`,
    );
    this.name = "UnsupportedClientEventVersionError";
  }
}

export function normalizeClientEventV1(raw: unknown) {
  const version = getRawVersion(raw);
  if (typeof version === "string" && version !== SESSION_EVENT_VERSION) {
    throw new UnsupportedClientEventVersionError(version);
  }

  return ClientEvent.parse(raw);
}

export function serializeServerEvent(event: ServerEvent): string {
  return JSON.stringify({ ...event, v: SESSION_EVENT_VERSION });
}

function getRawVersion(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return undefined;
  return (raw as Record<string, unknown>).v;
}
