-- Database Migration Script for Episode Creation System
-- Fix: Use int8 (bigint) to match twists.id type

-- 1. Add new columns to twists table
-- First, drop story_id if it exists with wrong type (in case it was created as UUID)
ALTER TABLE twists DROP COLUMN IF EXISTS story_id CASCADE;

ALTER TABLE twists
ADD COLUMN IF NOT EXISTS episode_type TEXT DEFAULT 'regular' NOT NULL,
ADD COLUMN IF NOT EXISTS episode_title TEXT,
ADD COLUMN IF NOT EXISTS episode_number INT4,
ADD COLUMN IF NOT EXISTS pdf_file TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Add story_id as INT8 (must be added separately after other columns)
ALTER TABLE twists
ADD COLUMN IF NOT EXISTS story_id INT8;

-- 2. Create episode_sections table (using INT8 to match twists.id)
CREATE TABLE IF NOT EXISTS episode_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id INT8 NOT NULL REFERENCES twists(id) ON DELETE CASCADE,
  section_order INT4 NOT NULL,
  text_content TEXT,
  image_file TEXT,
  video_file TEXT,
  pdf_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2a. Ensure pdf_file column exists (in case table was created without it)
ALTER TABLE episode_sections
ADD COLUMN IF NOT EXISTS pdf_file TEXT;

-- 3. Create index for efficient querying
CREATE INDEX IF NOT EXISTS episode_sections_episode_id_section_order_idx 
ON episode_sections(episode_id, section_order);

-- 4. Create stories table (optional)
-- Note: author_id uses UUID to match users.id (Supabase Auth uses UUID)
-- If your users.id is INT8, change author_id to INT8
CREATE TABLE IF NOT EXISTS stories (
  id INT8 PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sequence for stories.id if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS stories_id_seq;
ALTER TABLE stories ALTER COLUMN id SET DEFAULT nextval('stories_id_seq');

-- 5. Add foreign key constraint for story_id in twists (using INT8)
-- First drop the constraint if it exists, then add it (makes migration idempotent)
ALTER TABLE twists DROP CONSTRAINT IF EXISTS twists_story_id_fkey;

-- Now add the correct constraint
ALTER TABLE twists
ADD CONSTRAINT twists_story_id_fkey 
FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL;

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS twists_story_id_idx ON twists(story_id);
CREATE INDEX IF NOT EXISTS twists_episode_type_idx ON twists(episode_type);

-- 7. Add constraint to ensure section_order is positive
-- Drop constraint if it exists, then add it (makes migration idempotent)
ALTER TABLE episode_sections
DROP CONSTRAINT IF EXISTS episode_sections_section_order_positive;

ALTER TABLE episode_sections
ADD CONSTRAINT episode_sections_section_order_positive 
CHECK (section_order > 0);

-- 8. Add unique constraint to prevent duplicate section orders for same episode
CREATE UNIQUE INDEX IF NOT EXISTS episode_sections_episode_order_unique 
ON episode_sections(episode_id, section_order);

-- ========================================
-- SERIES MANAGEMENT SYSTEM TABLES
-- ========================================

-- 9. Create series table to store series information
CREATE TABLE IF NOT EXISTS series (
  id INT8 PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sequence for series.id if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS series_id_seq;
ALTER TABLE series ALTER COLUMN id SET DEFAULT nextval('series_id_seq');

-- 10. Create series_images table to store multiple pics for each series
CREATE TABLE IF NOT EXISTS series_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id INT8 NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_order INT4 NOT NULL DEFAULT 1,
  image_type TEXT DEFAULT 'poster', -- 'poster', 'banner', 'gallery', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 11. Create series_episodes table to store episodes for each series
CREATE TABLE IF NOT EXISTS series_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id INT8 NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  episode_number INT4 NOT NULL,
  episode_title TEXT,
  description TEXT,
  release_date TIMESTAMP WITH TIME ZONE,
  duration TEXT, -- e.g., '45:00' or '1h 30m'
  episode_poster TEXT, -- Optional poster for individual episode
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 12. Create indexes for series tables for better query performance
CREATE INDEX IF NOT EXISTS series_created_by_idx ON series(created_by);
CREATE INDEX IF NOT EXISTS series_status_idx ON series(status);
CREATE INDEX IF NOT EXISTS series_images_series_id_idx ON series_images(series_id);
CREATE INDEX IF NOT EXISTS series_images_order_idx ON series_images(series_id, image_order);
CREATE INDEX IF NOT EXISTS series_episodes_series_id_idx ON series_episodes(series_id);
CREATE INDEX IF NOT EXISTS series_episodes_number_idx ON series_episodes(series_id, episode_number);
CREATE INDEX IF NOT EXISTS series_episodes_release_date_idx ON series_episodes(release_date);

-- 13. Add constraints for series tables to ensure data integrity

-- Ensure episode_number is positive
ALTER TABLE series_episodes
DROP CONSTRAINT IF EXISTS series_episodes_episode_number_positive;

ALTER TABLE series_episodes
ADD CONSTRAINT series_episodes_episode_number_positive 
CHECK (episode_number > 0);

-- Ensure image_order is positive
ALTER TABLE series_images
DROP CONSTRAINT IF EXISTS series_images_order_positive;

ALTER TABLE series_images
ADD CONSTRAINT series_images_order_positive 
CHECK (image_order > 0);

-- 14. Add unique constraints for series tables

-- Prevent duplicate episode numbers for same series
CREATE UNIQUE INDEX IF NOT EXISTS series_episodes_series_episode_unique 
ON series_episodes(series_id, episode_number);

-- Prevent duplicate image orders for same series and type
CREATE UNIQUE INDEX IF NOT EXISTS series_images_series_order_type_unique 
ON series_images(series_id, image_order, image_type);

-- 15. Add triggers to update updated_at timestamp automatically for series tables

-- Create or replace the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for series table
DROP TRIGGER IF EXISTS update_series_updated_at ON series;
CREATE TRIGGER update_series_updated_at
    BEFORE UPDATE ON series
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for series_episodes table
DROP TRIGGER IF EXISTS update_series_episodes_updated_at ON series_episodes;
CREATE TRIGGER update_series_episodes_updated_at
    BEFORE UPDATE ON series_episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 16. Add tile_image field to series table for tile/poster image
ALTER TABLE series
ADD COLUMN IF NOT EXISTS tile_image TEXT;

-- ========================================
-- REVIEW PERFORMANCE OPTIMIZATION INDEXES
-- ========================================

-- 17. Add indexes for efficient review checking by userId and releaseId/streamId
-- These indexes optimize the hasUserReviewed flag checks
-- 
-- IMPORTANT: If you get an error about table not existing, first run this diagnostic query:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND (table_name ILIKE '%review%' OR table_name ILIKE '%preview%')
-- ORDER BY table_name;
--
-- This will show you the exact table names in your database.
-- Then update the table names below to match (with correct case and quotes if needed)

-- Index for peoplesReview table - optimize userId + releaseId queries
-- Option 1: If table name is "peoplesReview" (with capital R, case-sensitive)
CREATE INDEX IF NOT EXISTS idx_peoplesreview_userid_releaseid 
ON "peoplesReview"("userId", "releaseId");

CREATE INDEX IF NOT EXISTS idx_peoplesreview_userid 
ON "peoplesReview"("userId");

CREATE INDEX IF NOT EXISTS idx_peoplesreview_releaseid 
ON "peoplesReview"("releaseId");

-- Option 2: If the above fails, uncomment below and comment out Option 1
-- (This is for lowercase table name: peoplesreview)
-- CREATE INDEX IF NOT EXISTS idx_peoplesreview_userid_releaseid 
-- ON peoplesreview(userid, releaseid);
-- 
-- CREATE INDEX IF NOT EXISTS idx_peoplesreview_userid 
-- ON peoplesreview(userid);
-- 
-- CREATE INDEX IF NOT EXISTS idx_peoplesreview_releaseid 
-- ON peoplesreview(releaseid);

-- Index for dpeopreviews table - optimize userId + releaseId queries
-- Option 1: If columns are camelCase (userId, releaseId)
CREATE INDEX IF NOT EXISTS idx_dpeopreviews_userid_releaseid 
ON dpeopreviews("userId", "releaseId");

CREATE INDEX IF NOT EXISTS idx_dpeopreviews_userid 
ON dpeopreviews("userId");

CREATE INDEX IF NOT EXISTS idx_dpeopreviews_releaseid 
ON dpeopreviews("releaseId");

-- Option 2: If the above fails, uncomment below and comment out Option 1
-- (This is for lowercase column names: userid, releaseid)
-- CREATE INDEX IF NOT EXISTS idx_dpeopreviews_userid_releaseid 
-- ON dpeopreviews(userid, releaseid);
-- 
-- CREATE INDEX IF NOT EXISTS idx_dpeopreviews_userid 
-- ON dpeopreviews(userid);
-- 
-- CREATE INDEX IF NOT EXISTS idx_dpeopreviews_releaseid 
-- ON dpeopreviews(releaseid);

