import { describe, expect, it } from "vitest";
import { worldCoverDataUrl } from "./cover-art";
import { CoverImageUrlSchema, decodeDataUrl, isAllowedCoverImageUrl } from "./data-url";

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const PNG_DATA_URL = `data:image/png;base64,${PNG_BYTES.toString("base64")}`;

describe("decodeDataUrl", () => {
  it("decodes a base64 payload", () => {
    const decoded = decodeDataUrl(PNG_DATA_URL);
    expect(decoded?.contentType).toBe("image/png");
    expect(decoded?.bytes.equals(PNG_BYTES)).toBe(true);
  });

  it("decodes a percent-encoded payload", () => {
    const decoded = decodeDataUrl("data:image/svg+xml;charset=utf-8,%3Csvg%3E%C3%A9%3C%2Fsvg%3E");
    expect(decoded?.contentType).toBe("image/svg+xml");
    expect(decoded?.bytes.toString("utf-8")).toBe("<svg>é</svg>");
  });

  it("turns the generated fallback cover back into the SVG it was built from", () => {
    const decoded = decodeDataUrl(worldCoverDataUrl("Saltglass", "dark fantasy", "grim"));
    const svg = decoded?.bytes.toString("utf-8") ?? "";
    expect(decoded?.contentType).toBe("image/svg+xml");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
    expect(svg).toContain("DARK FANTASY");
  });

  it("returns null for anything that isn't a well-formed data URL", () => {
    expect(decodeDataUrl("https://example.com/cover.png")).toBeNull();
    expect(decodeDataUrl("data:image/png;base64")).toBeNull();
    expect(decodeDataUrl("data:image/svg+xml,%E0%A4%A")).toBeNull();
  });
});

describe("cover image URL validation", () => {
  it("accepts https links and base64 raster data URLs", () => {
    expect(isAllowedCoverImageUrl("https://cdn.example.com/cover.webp")).toBe(true);
    expect(isAllowedCoverImageUrl("http://example.com/cover.jpg")).toBe(true);
    expect(isAllowedCoverImageUrl(PNG_DATA_URL)).toBe(true);
  });

  it("rejects HTML, SVG and script URLs", () => {
    expect(isAllowedCoverImageUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
    expect(isAllowedCoverImageUrl("data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pjwvc2NyaXB0Pjwvc3ZnPg==")).toBe(false);
    expect(isAllowedCoverImageUrl("data:image/png,<script>alert(1)</script>")).toBe(false);
    expect(isAllowedCoverImageUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedCoverImageUrl("not a url")).toBe(false);
  });

  it("rejects an oversized data URL", () => {
    expect(isAllowedCoverImageUrl(`data:image/png;base64,${"A".repeat(2_000_000)}`)).toBe(false);
  });

  it("lets an empty value through so the server generates a cover instead", () => {
    expect(CoverImageUrlSchema.safeParse("  ").success).toBe(true);
    expect(CoverImageUrlSchema.safeParse(" https://example.com/a.png ").data).toBe("https://example.com/a.png");
    expect(CoverImageUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
});
