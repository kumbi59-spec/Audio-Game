import { prisma } from "@/lib/db";

export interface StoredPushToken {
  token: string;
  type: string;
  webAuth: string | null;
}

export async function upsertPushToken(
  userId: string,
  token: string,
  type: "expo" | "web",
  webAuth?: { p256dh: string; auth: string },
): Promise<void> {
  await prisma.pushToken.upsert({
    where: { token },
    create: {
      userId,
      token,
      type,
      webAuth: webAuth ? JSON.stringify(webAuth) : null,
    },
    update: {
      userId,
      type,
      webAuth: webAuth ? JSON.stringify(webAuth) : null,
    },
  });
}

export async function deletePushToken(userId: string, token: string): Promise<void> {
  await prisma.pushToken.deleteMany({ where: { userId, token } });
}

export async function getUserPushTokens(userId: string) {
  return prisma.pushToken.findMany({
    where: { userId },
    select: { token: true, type: true, webAuth: true },
  }) as Promise<StoredPushToken[]>;
}
