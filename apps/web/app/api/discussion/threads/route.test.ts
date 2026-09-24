import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  consumeRateLimit: vi.fn(),
  createThread: vi.fn(),
  createComment: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/discussion/queries", () => ({
  createThread: mocks.createThread,
  createComment: mocks.createComment,
  ensureSeedThreads: vi.fn(),
  listThreads: vi.fn(),
}));

import { POST as postThread } from "./route";
import { POST as postComment } from "./[id]/comments/route";

function req(body: unknown) {
  return new Request("http://localhost/api/discussion/threads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
const params = { params: Promise.resolve({ id: "t1" }) };

describe("discussion writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1", emailVerified: new Date() } });
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.createThread.mockImplementation(async (authorId: string, title: string, body: string) => ({ id: "t1", title, body, authorId }));
    mocks.createComment.mockResolvedValue({ id: "c1" });
  });

  it("requires a verified signed-in author", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await postThread(req({ title: "Hello", body: "World" }))).status).toBe(401);
    mocks.auth.mockResolvedValue({ user: { id: "u1", emailVerified: null } });
    expect((await postThread(req({ title: "Hello", body: "World" }))).status).toBe(403);
    expect(mocks.createThread).not.toHaveBeenCalled();
  });

  it("enforces length limits", async () => {
    expect((await postThread(req({ title: "Hi", body: "x" }))).status).toBe(400);
    expect((await postThread(req({ title: "Hello", body: "x".repeat(5_001) }))).status).toBe(400);
    expect((await postComment(req({ text: "x".repeat(2_001) }), params)).status).toBe(400);
    expect(mocks.createThread).not.toHaveBeenCalled();
    expect(mocks.createComment).not.toHaveBeenCalled();
  });

  it("rate limits per user and per IP", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 900 });
    const res = await postThread(req({ title: "Hello", body: "World" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("900");
    expect(mocks.createThread).not.toHaveBeenCalled();

    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    await postComment(req({ text: "nice" }), params);
    const keys = mocks.consumeRateLimit.mock.calls.map((c) => c[0].key);
    expect(keys).toContain("discussion:comment:user:u1");
    expect(keys).toContain("discussion:comment:ip:203.0.113.7");
  });

  it("stores trimmed content against the author's id", async () => {
    const res = await postThread(req({ title: "  Hello  ", body: " World " }));
    expect(res.status).toBe(201);
    expect(mocks.createThread).toHaveBeenCalledWith("u1", "Hello", "World");
  });

  it("returns 404 when commenting on a missing or hidden thread", async () => {
    mocks.createComment.mockResolvedValue(null);
    expect((await postComment(req({ text: "hi" }), params)).status).toBe(404);
  });
});
