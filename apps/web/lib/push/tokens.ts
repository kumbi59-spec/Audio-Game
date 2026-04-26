import { prisma } from "@/lib/db";

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

export async function deletePushToken(token: string): Promise<void> {
  await prisma.pushToken.deleteMany({ where: { token } });
}

export async function getUserPushTokens(userId: string) {
  return prisma.pushToken.findMany({ where: { userId } });
}
