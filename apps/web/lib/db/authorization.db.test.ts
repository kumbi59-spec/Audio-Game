import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";

// Runs against a real, migrated Postgres database when TEST_DATABASE_URL is
// set (e.g. `prisma migrate deploy` into a scratch database first). Skipped
// otherwise so the default unit-test run needs no database.
const databaseUrl = process.env["TEST_DATABASE_URL"];
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("database-backed authorization and rate limiting", () => {
  let prisma: PrismaClient;
  let consumeRateLimit: typeof import("@/lib/rate-limit").consumeRateLimit;
  let sessions: typeof import("@/lib/db/queries/sessions");
  let discussion: typeof import("@/lib/discussion/queries");
  const runId = `t${Date.now()}`;
  const ownerId = `${runId}-owner`;
  const attackerId = `${runId}-attacker`;
  let sessionId: string;

  beforeAll(async () => {
    process.env["DATABASE_URL"] = databaseUrl;
    delete process.env["UPSTASH_REDIS_REST_URL"];
    ({ prisma } = await import("@/lib/db"));
    ({ consumeRateLimit } = await import("@/lib/rate-limit"));
    sessions = await import("@/lib/db/queries/sessions");
    discussion = await import("@/lib/discussion/queries");

    for (const id of [ownerId, attackerId]) {
      await prisma.user.create({ data: { id, email: `${id}@example.test` } });
    }
    const world = await prisma.world.create({
      data: {
        id: `${runId}-world`,
        name: "Test World",
        description: "",
        genre: "fantasy",
        tone: "grim",
        systemPrompt: "",
        ownerId,
      },
    });
    const character = await prisma.character.create({
      data: { name: "Hero", class: "warrior", backstory: "", stats: "{}", userId: ownerId },
    });
    const session = await sessions.createDbSession(world.id, ownerId, character.id, null);
    sessionId = session.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.discussionThread.deleteMany({ where: { authorId: ownerId } });
    await prisma.gameHistoryEntry.deleteMany({ where: { sessionId } });
    await prisma.gameState.deleteMany({ where: { sessionId } });
    await prisma.gameSession.deleteMany({ where: { id: sessionId } });
    await prisma.character.deleteMany({ where: { userId: ownerId } });
    await prisma.world.deleteMany({ where: { id: `${runId}-world` } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, attackerId] } } });
    await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: runId } } });
    await prisma.$disconnect();
  });

  it("admits exactly `limit` requests under parallel consumption", async () => {
    const results = await Promise.all(
      Array.from({ length: 25 }, () =>
        consumeRateLimit({ key: `${runId}:parallel`, limit: 5, windowSeconds: 60 }),
      ),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key: `${runId}:parallel` } });
    expect(bucket?.count).toBe(25);
  });

  it("applies and honours a cooldown once the limit is exceeded", async () => {
    const rule = { key: `${runId}:cooldown`, limit: 1, windowSeconds: 60, cooldownSeconds: 600 };
    expect((await consumeRateLimit(rule)).allowed).toBe(true);
    expect((await consumeRateLimit(rule)).allowed).toBe(false);
    const third = await consumeRateLimit(rule);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(590);
  });

  it("restarts an expired window", async () => {
    const key = `${runId}:expired`;
    await prisma.rateLimitBucket.create({
      data: { key, count: 99, resetAt: new Date(Date.now() - 1_000) },
    });
    expect((await consumeRateLimit({ key, limit: 3, windowSeconds: 60 })).allowed).toBe(true);
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });
    expect(bucket?.count).toBe(1);
  });

  it("resolves a session only for its owner", async () => {
    expect(await sessions.getOwnedSession(sessionId, ownerId)).not.toBeNull();
    expect(await sessions.getOwnedSession(sessionId, attackerId)).toBeNull();
  });

  it("refuses cross-user session mutations", async () => {
    expect(await sessions.incrementTurnCount(sessionId, attackerId)).toBeNull();
    await expect(
      sessions.persistTurn(sessionId, attackerId, 1, "user", "injected"),
    ).rejects.toThrow();
    const stateUpdate = await sessions.updateGameState(sessionId, attackerId, { memorySummary: "pwned" });
    expect(stateUpdate.count).toBe(0);

    const stored = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { gameState: true },
    });
    expect(stored?.turnCount).toBe(0);
    expect(stored?.gameState?.memorySummary).toBe("");
    expect(await prisma.gameHistoryEntry.count({ where: { sessionId } })).toBe(0);
  });

  it("lets the owner advance turns atomically", async () => {
    const turns = await Promise.all([
      sessions.incrementTurnCount(sessionId, ownerId),
      sessions.incrementTurnCount(sessionId, ownerId),
      sessions.incrementTurnCount(sessionId, ownerId),
    ]);
    expect(new Set(turns).size).toBe(3);
    await sessions.persistTurn(sessionId, ownerId, turns[0]!, "user", "hello");
    expect(await prisma.gameHistoryEntry.count({ where: { sessionId } })).toBe(1);
  });

  it("persists discussions, hides moderated content and paginates", async () => {
    await discussion.ensureSeedThreads();
    const created = [];
    for (let i = 0; i < 3; i++) {
      created.push(await discussion.createThread(ownerId, `${runId} thread ${i}`, "body"));
    }
    await prisma.discussionThread.update({ where: { id: created[1]!.id }, data: { hidden: true } });
    const comment = await discussion.createComment(created[2]!.id, attackerId, "hello");
    expect(comment?.author).toBe("Adventurer"); // no name → never the email
    expect(await discussion.createComment(created[1]!.id, attackerId, "on hidden")).toBeNull();

    const first = await discussion.listThreads(null, 1);
    expect(first.threads[0]!.id).toBe(created[2]!.id);
    expect(first.threads[0]!.comments).toHaveLength(1);
    expect(first.nextCursor).toBe(created[2]!.id);
    const second = await discussion.listThreads(first.nextCursor, 1);
    expect(second.threads[0]!.id).toBe(created[0]!.id); // hidden thread skipped

    const all = await discussion.listThreads(null, 50);
    expect(all.threads.map((t) => t.id)).toEqual(
      expect.arrayContaining(["best-audio-rpg-builds-2026", "how-to-master-voice-text-adventure"]),
    );
  });
});
