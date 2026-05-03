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
  ) {}

  register(bus: DomainEventBus, config: SideEffectConfig): void {
    for (const eventType of config.eventTypes) {
      bus.on(eventType, async (event) => {
        await this.handleEvent(config.action, event);
      });
    }
  }

  private async handleEvent(action: SideEffectAction, event: DomainEventEnvelope): Promise<void> {
    this.totalHandled += 1;
    this.latestLagMs = Date.now() - Date.parse(event.occurredAt);
    if (this.dedupeStore.has(event.dedupeKey)) {
      this.dedupeHits += 1;
      return;
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        await action(event);
        this.dedupeStore.add(event.dedupeKey);
        return;
      } catch {
        if (attempt === this.maxRetries) {
          this.deadLetterQueue.push(event);
          return;
        }
        this.retryVolume += 1;
        await sleep(this.baseBackoffMs * (attempt + 1));
      }
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
