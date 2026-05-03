import { randomUUID } from "node:crypto";

export type DomainEventType =
  | "game.turn_committed"
  | "entitlement.changed"
  | "moderation.outcome_finalized";

export interface DomainEventEnvelope<TPayload = Record<string, unknown>> {
  eventId: string;
  eventType: DomainEventType;
  aggregateId: string;
  occurredAt: string;
  version: number;
  dedupeKey: string;
  payload: TPayload;
}

export interface DomainEventBus {
  on(type: DomainEventType, handler: DomainEventHandler): void;
  publish(event: DomainEventEnvelope): Promise<void>;
}

export type DomainEventHandler = (
  event: DomainEventEnvelope,
) => Promise<void> | void;

export function createEventEnvelope<TPayload>(args: {
  eventType: DomainEventType;
  aggregateId: string;
  version: number;
  dedupeKey: string;
  payload: TPayload;
}): DomainEventEnvelope<TPayload> {
  return {
    eventId: randomUUID(),
    eventType: args.eventType,
    aggregateId: args.aggregateId,
    occurredAt: new Date().toISOString(),
    version: args.version,
    dedupeKey: args.dedupeKey,
    payload: args.payload,
  };
}

export class InMemoryDomainEventBus implements DomainEventBus {
  private handlers = new Map<DomainEventType, DomainEventHandler[]>();

  on(type: DomainEventType, handler: DomainEventHandler): void {
    const current = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...current, handler]);
  }

  async publish(event: DomainEventEnvelope): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    for (const handler of handlers) await handler(event);
  }
}
