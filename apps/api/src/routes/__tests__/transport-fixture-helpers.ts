import { expect } from "vitest";

export function assertFixtureMetadataComplete<TName extends string>(
  fixtureNames: TName[],
  metadata: Record<TName, { supportedUntil: string | null; owner: string }>,
): void {
  for (const name of fixtureNames) {
    expect(metadata[name]).toBeDefined();
    expect(typeof metadata[name].owner).toBe("string");
  }
}
