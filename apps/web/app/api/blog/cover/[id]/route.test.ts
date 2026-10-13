import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { blogPost: { findFirst: mocks.findFirst } } }));

import { NextRequest } from "next/server";
import { GET } from "./route";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);

function getCover() {
  return GET(new NextRequest("http://localhost/api/blog/cover/p1"), { params: Promise.resolve({ id: "p1" }) });
}

describe("GET /api/blog/cover/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serves a published post's cover as a sandboxed image", async () => {
    mocks.findFirst.mockResolvedValue({ coverImageUrl: `data:image/jpeg;base64,${JPEG.toString("base64")}` });

    const res = await getCover();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Content-Security-Policy")).toContain("sandbox");
    expect(Buffer.from(await res.arrayBuffer()).equals(JPEG)).toBe(true);
  });

  it("only looks up posts that are already live", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const res = await getCover();

    expect(res.status).toBe(404);
    const { where } = mocks.findFirst.mock.calls[0]![0] as { where: { publishedAt: { lte: Date } } };
    expect(where.publishedAt.lte.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
