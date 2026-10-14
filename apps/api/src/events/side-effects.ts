import type { DomainEventBus, DomainEventEnvelope, DomainEventType } from "./domain-events.js";

interface HandlerTelemetry {
  retryVolume: number;
  deadLetterCount: number;
  dedupeHitRate: number;
  lagMs: number;
}

type SideEffectName =
  | "notifications"
  | "billing"
  | "moderation"
  | "analytics"
  | "email";

type SideEffectAction = (event: DomainEventEnvelope) => Promise<void>;

interface SideEffectConfig {
  name: SideEffectName;
  eventTypes: DomainEventType[];
  action: SideEffectAction;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class SideEffectProcessor {
  private dedupeStore = new Set<string>();
  private deadLetterQueue: DomainEventEnvelope[] = [];
  private retryVolume = 0;
  private dedupeHits = 0;
  private totalHandled = 0;
  private latestLagMs = 0;

  constructor(
    private readonly maxRetries = 3,
    private readonly baseBackoffMs = 20,
    // Bounds for a long-running process: the dedupe set forgets its least
    // recently seen keys and the dead-letter queue keeps only the newest.
    private readonly maxDedupeKeys = 10_000,
    private readonly maxDeadLetters = 1_000,
  ) {}

  register(bus: DomainEventBus, config: SideEffectConfig): void {
    for (const eventType of config.eventTypes) {
      bus.on(eventType, async (event) => {
        await this.handleEvent(config, event);
      });
    }
  }

  private async handleEvent(config: SideEffectConfig, event: DomainEventEnvelope): Promise<void> {
    this.totalHandled += 1;
    this.latestLagMs = Date.now() - Date.parse(event.occurredAt);
    const handlerDedupeKey = `${event.dedupeKey}:${config.name}`;
    if (this.dedupeStore.has(handlerDedupeKey)) {
      this.dedupeHits += 1;
      // Re-insert so the key counts as recently seen.
      this.dedupeStore.delete(handlerDedupeKey);
      this.dedupeStore.add(handlerDedupeKey);
      return;
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        await config.action(event);
        this.rememberDedupeKey(handlerDedupeKey);
        return;
      } catch {
        if (attempt === this.maxRetries) {
          this.deadLetterQueue.push(event);
          if (this.deadLetterQueue.length > this.maxDeadLetters) this.deadLetterQueue.shift();
          return;
        }
        this.retryVolume += 1;
        await sleep(this.baseBackoffMs * (attempt + 1));
      }
    }
  }

  private rememberDedupeKey(key: string): void {
    this.dedupeStore.add(key);
    // A Set iterates in insertion order, so the first key is the stalest.
    while (this.dedupeStore.size > this.maxDedupeKeys) {
      const stalest = this.dedupeStore.values().next().value;
      if (stalest === undefined) break;
      this.dedupeStore.delete(stalest);
    }
  }

  getDeadLetters(): DomainEventEnvelope[] {
    return [...this.deadLetterQueue];
  }

  getTelemetry(): HandlerTelemetry {
    return {
      retryVolume: this.retryVolume,
      deadLetterCount: this.deadLetterQueue.length,
      dedupeHitRate: this.totalHandled === 0 ? 0 : this.dedupeHits / this.totalHandled,
      lagMs: this.latestLagMs,
    };
  }
}

export function registerDefaultSideEffects(
  bus: DomainEventBus,
  processor: SideEffectProcessor,
  actions: Partial<Record<SideEffectName, SideEffectAction>> = {},
): void {
  const noop: SideEffectAction = async () => {};
  processor.register(bus, {
    name: "notifications",
    eventTypes: ["game.turn_committed", "moderation.outcome_finalized"],
    action: actions.notifications ?? noop,
  });
  processor.register(bus, {
    name: "billing",
    eventTypes: ["entitlement.changed"],
    action: actions.billing ?? noop,
  });
  processor.register(bus, {
    name: "moderation",
    eventTypes: ["moderation.outcome_finalized"],
    action: actions.moderation ?? noop,
  });
  processor.register(bus, {
    name: "analytics",
    eventTypes: ["game.turn_committed", "entitlement.changed", "moderation.outcome_finalized"],
    action: actions.analytics ?? noop,
  });
  processor.register(bus, {
    name: "email",
    eventTypes: ["entitlement.changed", "moderation.outcome_finalized"],
    action: actions.email ?? noop,
  });
}
