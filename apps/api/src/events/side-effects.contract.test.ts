import { describe, expect, it } from "vitest";
import { createEventEnvelope, InMemoryDomainEventBus } from "./domain-events.js";
import { SideEffectProcessor } from "./side-effects.js";

describe("side-effect handlers contract", () => {
  it("retries and executes external action once under at-least-once replay", async () => {
    const bus = new InMemoryDomainEventBus();
    const processor = new SideEffectProcessor(2, 1);
    let attempts = 0;
    let externalActions = 0;
    processor.register(bus, {
      name: "analytics",
      eventTypes: ["game.turn_committed"],
      action: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("transient");
        externalActions += 1;
      },
    });

    const evt = createEventEnvelope({
      eventType: "game.turn_committed",
      aggregateId: "c1",
      version: 1,
      dedupeKey: "turn:c1:1",
      payload: { campaignId: "c1", turnNumber: 1 },
    });

    await bus.publish(evt);
    await bus.publish(evt);

    expect(externalActions).toBe(1);
    expect(processor.getTelemetry().retryVolume).toBe(1);
  });

  it("quarantines poison events into dead-letter queue", async () => {
    const bus = new InMemoryDomainEventBus();
    const processor = new SideEffectProcessor(1, 1);
    processor.register(bus, {
      name: "email",
      eventTypes: ["moderation.outcome_finalized"],
      action: async () => {
        throw new Error("poison");
      },
    });

    await bus.publish(
      createEventEnvelope({
        eventType: "moderation.outcome_finalized",
        aggregateId: "m1",
        version: 3,
        dedupeKey: "mod:m1:3",
        payload: { outcome: "blocked" },
      }),
    );

    expect(processor.getDeadLetters()).toHaveLength(1);
  });
});
