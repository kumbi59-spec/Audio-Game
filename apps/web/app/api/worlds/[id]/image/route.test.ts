import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { world: { findUnique: mocks.findUnique } } }));

import { NextRequest } from "next/server";
import { worldCoverDataUrl } from "@/lib/worlds/cover-art";
import { GET } from "./route";

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);

function getImage(imageUrl: string | null) {
  mocks.findUnique.mockResolvedValue(imageUrl === null ? null : { imageUrl });
  return GET(new NextRequest("http://localhost/api/worlds/w1/image"), { params: Promise.resolve({ id: "w1" }) });
}

function expectSandboxed(res: Response) {
  const csp = res.headers.get("Content-Security-Policy") ?? "";
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain("sandbox");
  expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
}

describe("GET /api/worlds/[id]/image", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serves a stored raster cover with its image type", async () => {
    const res = await getImage(`data:image/png;base64,${PNG_BYTES.toString("base64")}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(Buffer.from(await res.arrayBuffer()).equals(PNG_BYTES)).toBe(true);
    expectSandboxed(res);
  });

  it("refuses an HTML payload instead of serving it as a page on our origin", async () => {
    const html = Buffer.from("<script>fetch('/api/auth/session')</script>").toString("base64");
    const res = await getImage(`data:text/html;base64,${html}`);
    expect(res.status).toBe(415);
    expect(res.headers.get("Content-Type") ?? "").not.toContain("text/html");
    expect((await res.arrayBuffer()).byteLength).toBe(0);
    expectSandboxed(res);
  });

  it("serves an SVG only inside a sandbox that blocks its scripts", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>';
    const res = await getImage(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(res.headers.get("Content-Security-Policy")).not.toContain("script-src");
    expectSandboxed(res);
  });

  it("serves the percent-encoded fallback cover as a valid SVG", async () => {
    const res = await getImage(worldCoverDataUrl("Saltglass", "sci-fi"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    const body = Buffer.from(await res.arrayBuffer()).toString("utf-8");
    expect(body.startsWith("<svg")).toBe(true);
    expect(body).toContain("SCI-FI");
  });

  it("serves a raster cover stored under a generic type by its real type", async () => {
    const res = await getImage(`data:application/octet-stream;base64,${PNG_BYTES.toString("base64")}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });

  it("lets a regenerated cover replace the cached one", async () => {
    const res = await getImage(`data:image/png;base64,${PNG_BYTES.toString("base64")}`);
    expect(res.headers.get("Cache-Control")).not.toContain("immutable");
    expect(res.headers.get("Cache-Control")).toContain("max-age=60");
  });

  it("returns 404 when the world has no stored cover", async () => {
    const res = await getImage(null);
    expect(res.status).toBe(404);
    expectSandboxed(res);
  });
});
