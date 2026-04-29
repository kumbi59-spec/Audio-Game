-- Add monthly ElevenLabs character usage tracking to User
ALTER TABLE "User" ADD COLUMN "ttsCharsUsedThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "ttsCharsResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
