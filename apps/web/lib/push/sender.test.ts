import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserPushTokens: vi.fn(),
  deletePushTokens: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("./tokens", () => ({
  getUserPushTokens: mocks.getUserPushTokens,
  deletePushTokens: mocks.deletePushTokens,
}));
vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: mocks.sendNotification },
}));

import { sendPushToUser } from "./sender";

const payload = { title: "Pack added", body: "60 minutes are ready." };

describe("sendPushToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "public-key");
    vi.stubEnv("VAPID_PRIVATE_KEY", "private-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("forgets a web subscription the push service says is gone", async () => {
    mocks.getUserPushTokens.mockResolvedValue([
      { token: "https://push.example/gone", type: "web", webAuth: '{"p256dh":"p","auth":"a"}' },
    ]);
    mocks.sendNotification.mockRejectedValue(Object.assign(new Error("Gone"), { statusCode: 410 }));

    await sendPushToUser("u1", payload);

    expect(mocks.deletePushTokens).toHaveBeenCalledWith(["https://push.example/gone"]);
  });

  it("keeps a web subscription after a temporary failure", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getUserPushTokens.mockResolvedValue([
      { token: "https://push.example/busy", type: "web", webAuth: '{"p256dh":"p","auth":"a"}' },
    ]);
    mocks.sendNotification.mockRejectedValue(Object.assign(new Error("Busy"), { statusCode: 503 }));

    await sendPushToUser("u1", payload);

    expect(mocks.deletePushTokens).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it("forgets Expo tokens whose device is no longer registered", async () => {
    mocks.getUserPushTokens.mockResolvedValue([
      { token: "ExponentPushToken[old]", type: "expo", webAuth: null },
      { token: "ExponentPushToken[new]", type: "expo", webAuth: null },
    ]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [
        { status: "error", message: "not registered", details: { error: "DeviceNotRegistered" } },
        { status: "ok", id: "ticket-2" },
      ],
    }))));

    await sendPushToUser("u1", payload);

    expect(mocks.deletePushTokens).toHaveBeenCalledWith(["ExponentPushToken[old]"]);
  });
});
