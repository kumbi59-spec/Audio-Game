import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserTier: vi.fn(),
  consumeRateLimit: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/db/queries/users", () => ({ getUserTier: mocks.getUserTier }));
vi.mock("@/lib/db", () => ({
  prisma: { world: { count: vi.fn().mockResolvedValue(0) }, gameBible: { create: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/db/queries/upload-audit", () => ({ recordUploadAuditEvent: vi.fn() }));

import { NextRequest } from "next/server";
import { MAX_FILE_BYTES } from "@/lib/upload/constants";
import { POST } from "./route";

function uploadRequest(contentLength: number) {
  const req = new NextRequest("http://localhost/api/upload", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=x", "content-length": String(contentLength) },
    body: "--x--",
  });
  const formData = vi.spyOn(req, "formData");
  return { req, formData };
}

async function events(res: Response): Promise<Array<{ stage: string; message: string }>> {
  const text = await res.text();
  return text
    .split("\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => JSON.parse(l.slice(6)) as { stage: string; message: string });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getUserTier.mockResolvedValue("creator");
  });

  it("turns away a signed-out caller without reading the upload", async () => {
    mocks.auth.mockResolvedValue(null);
    const { req, formData } = uploadRequest(1024);

    const last = (await events(await POST(req))).at(-1);

    expect(last).toMatchObject({ stage: "error", message: "Sign in to upload a game bible." });
    expect(formData).not.toHaveBeenCalled();
  });

  it("refuses a body declared larger than the file limit before buffering it", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    const { req, formData } = uploadRequest(MAX_FILE_BYTES + 1024 * 1024);

    const last = (await events(await POST(req))).at(-1);

    expect(last).toMatchObject({ stage: "error" });
    expect(last?.message).toContain("too large");
    expect(formData).not.toHaveBeenCalled();
  });
});
