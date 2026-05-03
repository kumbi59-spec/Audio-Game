import { describe, expect, it, vi } from "vitest";
import { DomainEventBus } from "./domain-events.js";

describe("DomainEventBus", () => {
  it("publishes to matching handlers", async () => {
    const bus = new DomainEventBus();
    const fn = vi.fn();
    bus.on("TurnResolved", fn);
    await bus.publish({ type: "TurnResolved", eventId: "e1", campaignId: "c1", turnNumber: 1 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
