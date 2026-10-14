import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

import { POST } from "./route";

const valid = { topic: "Bug report", email: "player@example.com", message: "The narrator stopped mid-sentence." };

function request(body: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_EMAIL", "team@example.com");
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.send.mockResolvedValue({ data: { id: "email_1" }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends the message to the contact inbox, with the sender as reply-to", async () => {
    const res = await POST(request(valid));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(expect.objectContaining({ key: "contact:ip:203.0.113.7" }));
    const email = mocks.send.mock.calls[0]![0];
    expect(email).toMatchObject({ to: "team@example.com", replyTo: "player@example.com", subject: "Contact form: Bug report" });
    expect(email.text).toContain("The narrator stopped mid-sentence.");
  });

  it("sends without a reply address when none was given, and escapes the message", async () => {
    const res = await POST(request({ topic: "Suggestion", message: "<script>alert(1)</script>" }));
    expect(res.status).toBe(200);
    const email = mocks.send.mock.calls[0]![0];
    expect(email.replyTo).toBeUndefined();
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
  });

  it.each([
    ["malformed JSON", "{"],
    ["an empty message", { ...valid, message: "   " }],
    ["an oversized message", { ...valid, message: "x".repeat(5_001) }],
    ["an unknown topic", { ...valid, topic: "Free money" }],
    ["a bad email address", { ...valid, email: "not an address" }],
  ])("returns 400 for %s", async (_, body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("returns 429 once the sender is rate limited", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 600 });
    const res = await POST(request(valid));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("600");
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("returns 503 with an address to write to when email isn't set up", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const res = await POST(request(valid));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.email).toBe("team@example.com");
    expect(body.error).toContain("team@example.com");
    expect(mocks.send).not.toHaveBeenCalled();

    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_EMAIL", "");
    const unset = await POST(request(valid));
    expect(unset.status).toBe(503);
    expect((await unset.json()).email).toEqual(expect.stringContaining("@"));
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("reports a failed send instead of claiming success", async () => {
    mocks.send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "bad from" } });
    const res = await POST(request(valid));
    expect(res.status).toBe(500);
    expect((await res.json()).email).toBe("team@example.com");
  });
});
