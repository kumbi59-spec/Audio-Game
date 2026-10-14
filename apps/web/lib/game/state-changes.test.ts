import { describe, expect, it } from "vitest";
import { sanitizeStateChanges } from "./state-changes";

const world = { locations: [{ id: "harbor" }, { id: "chapel" }] } as Parameters<typeof sanitizeStateChanges>[1];

describe("sanitizeStateChanges", () => {
  it("keeps a locationId the world has and drops one it doesn't", () => {
    expect(sanitizeStateChanges({ locationId: "chapel" }, world)).toEqual({ locationId: "chapel" });
    expect(sanitizeStateChanges({ locationId: "The Chapel" }, world)).toEqual({});
    expect(sanitizeStateChanges({ locationId: null }, world)).toEqual({});
    expect(sanitizeStateChanges({ locationId: ["chapel"] }, world)).toEqual({});
  });

  it("stores time of day and weather as short text", () => {
    expect(sanitizeStateChanges({ timeOfDay: " dusk ", weather: 3 }, world)).toEqual({ timeOfDay: "dusk", weather: "3" });
    expect(sanitizeStateChanges({ timeOfDay: { hour: 9 }, weather: "" }, world)).toEqual({});
    expect(sanitizeStateChanges({ timeOfDay: "x".repeat(80) }, world).timeOfDay).toHaveLength(50);
  });

  it("drops flags that aren't an object, and passes everything else through", () => {
    const rest = { hp: -2, inventoryChanges: [{ op: "add", name: "Rope", quantity: 1 }], passiveBonuses: [] };
    expect(sanitizeStateChanges({ ...rest, flags: ["gate_open"] }, world)).toEqual(rest);
    expect(sanitizeStateChanges({ flags: { gate_open: true } }, world)).toEqual({ flags: { gate_open: true } });
  });
});
