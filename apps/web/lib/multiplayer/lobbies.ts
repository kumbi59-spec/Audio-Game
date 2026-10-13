import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// Upper bound on distinct members per lobby (the API room itself seats 4 at a
// time; members who left can rejoin without re-inviting).
export const MAX_LOBBY_MEMBERS = 8;

export type LobbyAccess =
  | { ok: true; inviteCode: string; isHost: boolean }
  | { ok: false; status: 403 | 404; error: "lobby_not_found" | "not_invited" | "lobby_full" };

function codesMatch(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Creates a lobby hosted by `hostId`, who becomes its first member. */
export async function createLobby(hostId: string): Promise<{ lobbyId: string; inviteCode: string }> {
  const lobbyId = `lobby-${randomUUID()}`;
  const inviteCode = randomBytes(18).toString("base64url");
  await prisma.lobby.create({
    data: { id: lobbyId, inviteCode, hostId, members: { create: { userId: hostId } } },
  });
  return { lobbyId, inviteCode };
}

/**
 * Grants access to members, and admits a non-member who presents the lobby's
 * invite code (recording their membership). Everyone else is refused.
 */
export async function authorizeLobbyAccess(
  lobbyId: string,
  userId: string,
  inviteCode: string | null,
): Promise<LobbyAccess> {
  const lobby = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    select: {
      inviteCode: true,
      hostId: true,
      members: { where: { userId }, select: { userId: true } },
      _count: { select: { members: true } },
    },
  });
  if (!lobby) return { ok: false, status: 404, error: "lobby_not_found" };

  const isHost = lobby.hostId === userId;
  if (lobby.members.length > 0) return { ok: true, inviteCode: lobby.inviteCode, isHost };

  if (!inviteCode || !codesMatch(inviteCode, lobby.inviteCode)) {
    return { ok: false, status: 403, error: "not_invited" };
  }
  if (lobby._count.members >= MAX_LOBBY_MEMBERS) {
    return { ok: false, status: 403, error: "lobby_full" };
  }

  if (!(await admitMember(lobbyId, userId))) {
    return { ok: false, status: 403, error: "lobby_full" };
  }
  return { ok: true, inviteCode: lobby.inviteCode, isHost };
}

/**
 * Records a membership unless the lobby is full. The count and the insert run
 * in one serializable transaction, so simultaneous joins can't all see a free
 * seat and push the lobby past the cap; the loser of a conflict retries.
 */
async function admitMember(lobbyId: string, userId: string): Promise<boolean> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existing = await tx.lobbyMember.findUnique({
            where: { lobbyId_userId: { lobbyId, userId } },
            select: { userId: true },
          });
          if (existing) return true;
          if ((await tx.lobbyMember.count({ where: { lobbyId } })) >= MAX_LOBBY_MEMBERS) return false;
          await tx.lobbyMember.create({ data: { lobbyId, userId } });
          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      const retryable =
        err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2034" || err.code === "P2002");
      if (!retryable || attempt >= 3) throw err;
    }
  }
}
