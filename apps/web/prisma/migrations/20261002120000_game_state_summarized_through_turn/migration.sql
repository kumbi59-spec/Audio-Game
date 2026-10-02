-- Track how far the memory summary has progressed so each window of turns is
-- summarised once, instead of re-summarising the oldest turns every turn.
ALTER TABLE "GameState" ADD COLUMN IF NOT EXISTS "summarizedThroughTurn" INTEGER NOT NULL DEFAULT 0;
