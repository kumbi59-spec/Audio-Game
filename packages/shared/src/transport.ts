import { z } from "zod";

export const TRANSPORT_VERSION = "1" as const;
export const SUPPORTED_TRANSPORT_VERSIONS = [TRANSPORT_VERSION] as const;

export const TransportEnvelope = z.object({
  version: z.string(),
  kind: z.string().min(1),
  payload: z.unknown(),
  sentAt: z.string().datetime(),
});
export type TransportEnvelope = z.infer<typeof TransportEnvelope>;

export function createTransportEnvelope<TPayload>(
  kind: string,
  payload: TPayload,
  version: string = TRANSPORT_VERSION,
): { version: string; kind: string; payload: TPayload; sentAt: string } {
  return {
    version,
    kind,
    payload,
    sentAt: new Date().toISOString(),
  };
}

export function isSupportedTransportVersion(version: string): boolean {
  return SUPPORTED_TRANSPORT_VERSIONS.includes(version as (typeof SUPPORTED_TRANSPORT_VERSIONS)[number]);
}
