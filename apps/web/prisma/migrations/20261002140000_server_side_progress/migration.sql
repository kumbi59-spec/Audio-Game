-- Keep each character's full progress on the server, and the state before
-- the last turn so it can be undone.
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "snapshot" TEXT;
ALTER TABLE "GameState" ADD COLUMN IF NOT EXISTS "undoSnapshot" TEXT;
