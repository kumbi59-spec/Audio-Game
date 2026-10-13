import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { discussionThread: { findMany: mocks.findMany } } }));

import { COMMENTS_PER_THREAD, listThreads } from "./queries";

function comment(n: number) {
  return { id: `c${n}`, text: `comment ${n}`, createdAt: new Date(Date.UTC(2026, 0, 1, 0, n)), author: { name: "Ada" } };
}

describe("listThreads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads each thread's newest comments and returns them oldest first", async () => {
    // The database returns them newest first, as asked.
    const newest = Array.from({ length: COMMENTS_PER_THREAD }, (_, i) => comment(60 - i));
    mocks.findMany.mockResolvedValue([
      { id: "t1", title: "Builds", body: "Share them", createdAt: new Date(), author: { name: "Ada" }, comments: newest },
    ]);

    const { threads } = await listThreads(null);

    const query = mocks.findMany.mock.calls[0]![0] as {
      include: { comments: { orderBy: unknown; take: number } };
    };
    expect(query.include.comments.take).toBe(COMMENTS_PER_THREAD);
    expect(query.include.comments.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);

    const ids = threads[0]!.comments.map((c) => c.id);
    expect(ids[0]).toBe("c11");
    expect(ids.at(-1)).toBe("c60");
    expect(ids).toHaveLength(COMMENTS_PER_THREAD);
  });
});
