-- Per-user, per-world stable voice mapping for named NPCs so the same
-- character speaks with the same voice across sessions and devices. Keyed
-- by a normalized form of the GM-emitted display name (npcKey) — see
-- npcKeyFromName in apps/web/lib/audio/narration-speaker.ts.
CREATE TABLE "NpcVoiceAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "npcKey" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'neutral',
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NpcVoiceAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NpcVoiceAssignment_userId_worldId_npcKey_key"
    ON "NpcVoiceAssignment"("userId", "worldId", "npcKey");

CREATE INDEX "NpcVoiceAssignment_userId_worldId_idx"
    ON "NpcVoiceAssignment"("userId", "worldId");

ALTER TABLE "NpcVoiceAssignment"
    ADD CONSTRAINT "NpcVoiceAssignment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
