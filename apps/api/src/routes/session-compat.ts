import {
  ClientEvent,
  ServerEvent,
  TransportEnvelope,
  createTransportEnvelope,
  isSupportedTransportVersion,
} from "@audio-rpg/shared";

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
  const normalizedRaw = unwrapLegacyOrEnvelope(raw);
  const version = getRawVersion(normalizedRaw);
  if (typeof version === "string" && version !== SESSION_EVENT_VERSION) {
    throw new UnsupportedClientEventVersionError(version);
  }

  return ClientEvent.parse(normalizedRaw);
}

export function serializeServerEvent(event: ServerEvent): string {
  return JSON.stringify(
    createTransportEnvelope("session.server_event", {
      ...event,
      v: SESSION_EVENT_VERSION,
    }),
  );
}

export function deserializeServerEvent(raw: unknown): ServerEvent {
  const parsedEnvelope = TransportEnvelope.safeParse(raw);
  const payload = parsedEnvelope.success ? parsedEnvelope.data.payload : raw;
  return ServerEvent.parse(payload);
}

function unwrapLegacyOrEnvelope(raw: unknown): unknown {
  const parsed = TransportEnvelope.safeParse(raw);
  if (!parsed.success) return raw;
  if (!isSupportedTransportVersion(parsed.data.version)) {
    throw new UnsupportedClientEventVersionError(parsed.data.version);
  }
  return parsed.data.payload;
}

function getRawVersion(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return undefined;
  return (raw as Record<string, unknown>).v;
}
