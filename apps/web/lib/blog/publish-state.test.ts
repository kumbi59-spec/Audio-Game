import { describe, expect, it } from "vitest";
import { publishState } from "./publish-state";

describe("publishState", () => {
  const now = new Date("2026-10-07T18:00:00Z");

  it("treats a missing date as a draft", () => {
    expect(publishState(null, now)).toBe("draft");
  });

  it("is published once the date has arrived", () => {
    expect(publishState(new Date("2026-10-07T09:00:00Z"), now)).toBe("published");
    expect(publishState("2026-10-07T18:00:00.000Z", now)).toBe("published");
  });

  it("is scheduled while the date is in the future", () => {
    expect(publishState(new Date("2026-10-08T09:00:00Z"), now)).toBe("scheduled");
    expect(publishState("2026-10-23T09:00:00.000Z", now)).toBe("scheduled");
  });
});
