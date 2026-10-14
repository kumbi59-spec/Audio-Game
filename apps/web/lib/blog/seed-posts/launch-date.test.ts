import { afterEach, describe, expect, it, vi } from "vitest";
import { launchPublishDate } from "./2026-launch";

describe("launchPublishDate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Node applies a TZ change immediately, so each case runs in that zone.
  it.each(["UTC", "America/Los_Angeles", "Asia/Tokyo"])("is 09:00 UTC on the right day in %s", (zone) => {
    vi.stubEnv("TZ", zone);
    expect(launchPublishDate(1).toISOString()).toBe("2026-05-02T09:00:00.000Z");
    expect(launchPublishDate(30).toISOString()).toBe("2026-05-31T09:00:00.000Z");
  });
});
