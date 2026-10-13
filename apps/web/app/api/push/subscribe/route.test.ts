import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), upsertPushToken: vi.fn() }));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/push/tokens", () => ({ upsertPushToken: mocks.upsertPushToken }));

import { NextRequest } from "next/server";
import { POST } from "./route";

function subscribe(endpoint: string) {
  return POST(new NextRequest("http://localhost/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "web", endpoint, keys: { p256dh: "p", auth: "a" } }),
  }));
}

describe("POST /api/push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  });

  it("stores an https push service endpoint", async () => {
    const res = await subscribe("https://fcm.googleapis.com/fcm/send/abc123");
    expect(res.status).toBe(200);
    expect(mocks.upsertPushToken).toHaveBeenCalledWith(
      "u1",
      "https://fcm.googleapis.com/fcm/send/abc123",
      "web",
      { p256dh: "p", auth: "a" },
    );
  });

  it.each([
    "http://169.254.169.254/latest/meta-data",
    "http://localhost:3000/internal",
    "ftp://push.example.com/x",
  ])("refuses a non-https endpoint the server would later POST to (%s)", async (endpoint) => {
    const res = await subscribe(endpoint);
    expect(res.status).toBe(400);
    expect(mocks.upsertPushToken).not.toHaveBeenCalled();
  });
});
