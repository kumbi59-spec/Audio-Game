import { describe, expect, it } from "vitest";
import { adClientId } from "./AdBanner";

describe("adClientId", () => {
  it("adds the ca- prefix to a bare pub- id", () => {
    expect(adClientId("pub-9267788778991046")).toBe("ca-pub-9267788778991046");
  });

  it("keeps an id that is already in ca-pub- form", () => {
    expect(adClientId("ca-pub-9267788778991046")).toBe("ca-pub-9267788778991046");
  });

  it("accepts just the digits and trims whitespace", () => {
    expect(adClientId(" 9267788778991046 ")).toBe("ca-pub-9267788778991046");
  });

  it("returns undefined when unset or blank", () => {
    expect(adClientId(undefined)).toBeUndefined();
    expect(adClientId("  ")).toBeUndefined();
  });
});
