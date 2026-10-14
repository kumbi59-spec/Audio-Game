import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserTier: vi.fn(),
  worldCreate: vi.fn(),
  resolveWorldCoverImage: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/queries/users", () => ({ getUserTier: mocks.getUserTier }));
vi.mock("@/lib/db", () => ({ prisma: { world: { count: vi.fn().mockResolvedValue(0), create: mocks.worldCreate } } }));
vi.mock("@/lib/worlds/cover-art-resolver", () => ({ resolveWorldCoverImage: mocks.resolveWorldCoverImage }));

import { NextRequest } from "next/server";
import { POST } from "./route";

const draft = {
  title: "Saltglass",
  pitch: "A sea of salt.",
  genre: "fantasy",
  setting: "A salt flat",
  styleMode: "cinematic",
  contentRating: "teen",
  toneVoice: "dry and bright",
  hardConstraint: "",
  startingScenario: "You wake on the salt.",
  characterName: "Mara",
};

function create(imageUrl?: string) {
  return POST(new NextRequest("http://localhost/api/worlds/wizard/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...draft, imageUrl }),
  }));
}

describe("POST /api/worlds/wizard/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.getUserTier.mockResolvedValue("creator");
    mocks.worldCreate.mockResolvedValue({});
    mocks.resolveWorldCoverImage.mockResolvedValue("data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C%2Fsvg%3E");
  });

  it.each([
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pjwvc2NyaXB0Pjwvc3ZnPg==",
    "javascript:alert(1)",
  ])("refuses a cover image that isn't a plain image (%s)", async (imageUrl) => {
    const res = await create(imageUrl);
    expect(res.status).toBe(400);
    expect(mocks.worldCreate).not.toHaveBeenCalled();
  });

  it("stores an https cover image", async () => {
    const res = await create("https://cdn.example.com/saltglass.webp");
    expect(res.status).toBe(200);
    expect(mocks.worldCreate.mock.calls[0]![0].data.imageUrl).toBe("https://cdn.example.com/saltglass.webp");
    expect(mocks.resolveWorldCoverImage).not.toHaveBeenCalled();
  });

  it("generates a cover when none is supplied", async () => {
    const res = await create();
    expect(res.status).toBe(200);
    expect(mocks.resolveWorldCoverImage).toHaveBeenCalled();
  });
});
