import { beforeEach, describe, expect, it, vi } from "vitest";

type Post = { id: string; slug: string; title: string; content: string; excerpt: string };

const mocks = vi.hoisted(() => ({
  posts: [] as Post[],
  update: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({ requireAdmin: vi.fn().mockResolvedValue({ id: "admin", email: "a@x.test" }) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    blogPost: {
      findMany: vi.fn(async () => mocks.posts.map((p) => ({ ...p }))),
      update: mocks.update,
    },
  },
}));

import { POST } from "./route";

describe("POST /api/admin/blog/seo-fix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stand-in for the database: apply each update to the stored posts.
    mocks.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: Partial<Post> }) => {
      const post = mocks.posts.find((p) => p.id === where.id)!;
      Object.assign(post, data);
      return post;
    });
  });

  it("changes nothing on a second run", async () => {
    mocks.posts = [
      {
        id: "p1",
        slug: "voice-first",
        // Punctuation in the title used to stop the key phrase ever matching.
        title: "Voice-First RPGs: A Beginner's Guide",
        content: "Some thoughts on playing by ear.",
        excerpt: "Short",
      },
    ];

    const first = (await (await POST()).json()) as { updatedCount: number };
    expect(first.updatedCount).toBe(1);
    const afterFirst = { ...mocks.posts[0]! };
    expect(afterFirst.content.match(/Related reading/g)).toHaveLength(1);

    const second = (await (await POST()).json()) as { updatedCount: number };
    expect(second.updatedCount).toBe(0);
    expect(mocks.posts[0]).toEqual(afterFirst);
  });

  it("leaves a post that already links to the blog index alone", async () => {
    const content = [
      "Voice-first RPGs are the focus here.",
      "## Getting started",
      "Read more on [the blog](/blog) and the [Google guide](https://developers.google.com/search).",
    ].join("\n\n");
    mocks.posts = [
      { id: "p2", slug: "vf", title: "Voice-First RPGs", content, excerpt: "An excerpt that is comfortably longer than eighty characters, so it is kept as it is." },
    ];

    const res = (await (await POST()).json()) as { updatedCount: number };
    expect(res.updatedCount).toBe(0);
  });
});
