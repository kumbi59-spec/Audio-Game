export type DomainEvent =
  | { type: "TurnResolved"; eventId: string; campaignId: string; turnNumber: number }
  | { type: "TierChanged"; eventId: string; userId: string; tier: string }
  | { type: "WorldPublished"; eventId: string; worldId: string; ownerId: string };

export type DomainEventHandler<T extends DomainEvent = DomainEvent> = (
  event: T,
) => Promise<void> | void;

export class DomainEventBus {
  private handlers = new Map<DomainEvent["type"], DomainEventHandler[]>();

  on<T extends DomainEvent["type"]>(type: T, handler: DomainEventHandler) {
    const current = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...current, handler]);
  }

  async publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) await handler(event);
  }
}
