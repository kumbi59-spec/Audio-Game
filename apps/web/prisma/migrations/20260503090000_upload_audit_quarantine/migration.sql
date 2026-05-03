-- CreateTable
CREATE TABLE "UploadAuditEvent" (
  "id" TEXT NOT NULL,
  "uploaderId" TEXT NOT NULL,
  "gameBibleId" TEXT,
  "action" TEXT NOT NULL,
  "reasonCode" TEXT,
  "metadata" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadAuditEvent_uploaderId_createdAt_idx" ON "UploadAuditEvent"("uploaderId", "createdAt");
CREATE INDEX "UploadAuditEvent_action_createdAt_idx" ON "UploadAuditEvent"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "UploadAuditEvent" ADD CONSTRAINT "UploadAuditEvent_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UploadAuditEvent" ADD CONSTRAINT "UploadAuditEvent_gameBibleId_fkey" FOREIGN KEY ("gameBibleId") REFERENCES "GameBible"("id") ON DELETE SET NULL ON UPDATE CASCADE;
