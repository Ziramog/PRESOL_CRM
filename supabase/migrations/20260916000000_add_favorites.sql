-- Add is_favorite column to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Index for fast filtering by favorite
CREATE INDEX IF NOT EXISTS idx_prospects_is_favorite ON prospects(is_favorite) WHERE is_favorite = true;
