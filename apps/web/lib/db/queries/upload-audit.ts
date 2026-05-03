import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function recordUploadAuditEvent(input: {
  uploaderId: string;
  action: "accepted" | "rejected" | "quarantined" | "admin_approved" | "admin_rejected";
  reasonCode?: string;
  gameBibleId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.$executeRaw`
    INSERT INTO "UploadAuditEvent" ("id", "uploaderId", "gameBibleId", "action", "reasonCode", "metadata", "createdAt")
    VALUES (${randomUUID()}, ${input.uploaderId}, ${input.gameBibleId ?? null}, ${input.action}, ${input.reasonCode ?? null}, ${JSON.stringify(input.metadata ?? {})}, NOW())
  `;
}

export async function getUploadAuditAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.$queryRaw<Array<{ action: string; reasonCode: string | null; count: bigint }>>`
    SELECT "action", "reasonCode", COUNT(*) as count
    FROM "UploadAuditEvent"
    WHERE "createdAt" >= ${since}
    GROUP BY "action", "reasonCode"
  `;
}

export async function recordAdminModerationAction(input: {
  adminUserId: string;
  uploaderId: string;
  gameBibleId: string;
  approved: boolean;
  notes?: string;
}) {
  return recordUploadAuditEvent({
    uploaderId: input.uploaderId,
    action: input.approved ? "admin_approved" : "admin_rejected",
    gameBibleId: input.gameBibleId,
    reasonCode: "admin_moderation",
    metadata: { adminUserId: input.adminUserId, notes: input.notes ?? "" },
  });
}
