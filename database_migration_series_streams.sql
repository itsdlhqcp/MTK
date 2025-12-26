-- Database Migration: Allow series_episodes to link to both series and streams tables
-- This enables series to be stored in streams table instead of separate series table
-- 
-- IMPORTANT: This migration modifies the series_episodes table structure.
-- Make sure to backup your database before running this migration.

-- Step 1: Make series_id nullable (currently it's NOT NULL)
-- First, drop the existing foreign key constraint
ALTER TABLE series_episodes
DROP CONSTRAINT IF EXISTS series_episodes_series_id_fkey;

-- Make series_id nullable
ALTER TABLE series_episodes
ALTER COLUMN series_id DROP NOT NULL;

-- Re-add the foreign key constraint (now nullable)
ALTER TABLE series_episodes
ADD CONSTRAINT series_episodes_series_id_fkey 
FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE;

-- Step 2: Add stream_id column to series_episodes table (nullable)
ALTER TABLE series_episodes
ADD COLUMN IF NOT EXISTS stream_id INT8;

-- Step 3: Create index for stream_id for better query performance
CREATE INDEX IF NOT EXISTS series_episodes_stream_id_idx 
ON series_episodes(stream_id);

-- Step 4: Add foreign key constraint for stream_id referencing streams table
-- Note: This assumes streams.id is INT8. If it's a different type, adjust accordingly.
ALTER TABLE series_episodes
DROP CONSTRAINT IF EXISTS series_episodes_stream_id_fkey;

-- Add foreign key constraint (adjust if streams table structure differs)
-- You may need to check your streams table schema first
ALTER TABLE series_episodes
ADD CONSTRAINT series_episodes_stream_id_fkey 
FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE;

-- Step 5: Add check constraint to ensure either series_id or stream_id is set (but not both)
ALTER TABLE series_episodes
DROP CONSTRAINT IF EXISTS series_episodes_series_or_stream_check;

ALTER TABLE series_episodes
ADD CONSTRAINT series_episodes_series_or_stream_check 
CHECK (
    (series_id IS NOT NULL AND stream_id IS NULL) OR 
    (series_id IS NULL AND stream_id IS NOT NULL)
);

-- Step 6: Update unique constraint to handle both series_id and stream_id
-- Drop existing unique constraint if it exists
DROP INDEX IF EXISTS series_episodes_series_episode_unique;

-- Create unique constraint for series_id (episodes per series)
CREATE UNIQUE INDEX IF NOT EXISTS series_episodes_series_episode_unique 
ON series_episodes(series_id, episode_number) 
WHERE series_id IS NOT NULL;

-- Create unique constraint for stream_id (episodes per stream/series)
CREATE UNIQUE INDEX IF NOT EXISTS series_episodes_stream_episode_unique 
ON series_episodes(stream_id, episode_number) 
WHERE stream_id IS NOT NULL;

-- Step 7: Update composite index for better query performance
CREATE INDEX IF NOT EXISTS series_episodes_stream_episode_number_idx 
ON series_episodes(stream_id, episode_number) 
WHERE stream_id IS NOT NULL;

-- Step 8: Update release_date index to include stream_id
CREATE INDEX IF NOT EXISTS series_episodes_stream_release_date_idx 
ON series_episodes(stream_id, release_date) 
WHERE stream_id IS NOT NULL;

-- Step 9: Add seriesType column to streams table to mark series (optional but recommended)
ALTER TABLE streams
ADD COLUMN IF NOT EXISTS seriesType TEXT DEFAULT 'normal';

-- Step 10: Create index for seriesType for filtering
CREATE INDEX IF NOT EXISTS streams_series_type_idx 
ON streams(seriesType) 
WHERE seriesType = 'series';

-- Migration complete!
-- Now series_episodes can link to either:
--   - series.id (for backward compatibility with existing series)
--   - streams.id (for new series stored in streams table)

