-- Audio RPG schema. Applied by runMigrations() on boot when DATABASE_URL is set.
-- Safe to run multiple times; all statements are CREATE ... IF NOT EXISTS.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS worlds (
  world_id    text PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('official', 'uploaded', 'created')),
  title       text NOT NULL,
  bible       jsonb NOT NULL,
  warnings    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS worlds_created_at_idx ON worlds (created_at DESC);

-- Semantic chunks of a world bible for retrieval during play. Embeddings
-- are written out-of-band by the ingest pipeline (Phase 4+).
CREATE TABLE IF NOT EXISTS world_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id    text NOT NULL REFERENCES worlds(world_id) ON DELETE CASCADE,
  categories  text[] NOT NULL DEFAULT '{}',
  chunk_text  text NOT NULL,
  embedding   vector(1024),
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS world_chunks_world_id_idx ON world_chunks (world_id);
CREATE INDEX IF NOT EXISTS world_chunks_embedding_idx
  ON world_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id  text PRIMARY KEY,
  world_id     text NOT NULL REFERENCES worlds(world_id),
  title        text NOT NULL,
  state        jsonb NOT NULL,
  presented_choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_played_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_last_played_idx ON campaigns (last_played_at DESC);

-- Every GM and player utterance. Embeddings land here for cold-memory
-- retrieval; the state column is a snapshot after the GM turn applied.
CREATE TABLE IF NOT EXISTS turns (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  text NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  turn_number  integer NOT NULL,
  role         text NOT NULL CHECK (role IN ('gm', 'player')),
  text         text NOT NULL,
  embedding    vector(1024),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS turns_campaign_turn_idx ON turns (campaign_id, turn_number);
CREATE INDEX IF NOT EXISTS turns_embedding_idx
  ON turns USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE TABLE IF NOT EXISTS scene_summaries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  text NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  scene_number integer NOT NULL,
  summary      text NOT NULL,
  key_events   jsonb NOT NULL DEFAULT '[]'::jsonb,
  embedding    vector(1024),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, scene_number)
);

CREATE INDEX IF NOT EXISTS scene_summaries_campaign_idx ON scene_summaries (campaign_id, scene_number);
