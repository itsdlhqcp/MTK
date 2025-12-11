-- Database Migration Script for Series Management System
-- Creates tables for series with multiple images and episodes

-- 1. Create series table to store series information
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

-- 2. Create series_images table to store multiple pics for each series
CREATE TABLE IF NOT EXISTS series_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id INT8 NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_order INT4 NOT NULL DEFAULT 1,
  image_type TEXT DEFAULT 'poster', -- 'poster', 'banner', 'gallery', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Create series_episodes table to store episodes for each series
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

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS series_created_by_idx ON series(created_by);
CREATE INDEX IF NOT EXISTS series_status_idx ON series(status);
CREATE INDEX IF NOT EXISTS series_images_series_id_idx ON series_images(series_id);
CREATE INDEX IF NOT EXISTS series_images_order_idx ON series_images(series_id, image_order);
CREATE INDEX IF NOT EXISTS series_episodes_series_id_idx ON series_episodes(series_id);
CREATE INDEX IF NOT EXISTS series_episodes_number_idx ON series_episodes(series_id, episode_number);
CREATE INDEX IF NOT EXISTS series_episodes_release_date_idx ON series_episodes(release_date);

-- 5. Add constraints to ensure data integrity

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

-- 6. Add unique constraint to prevent duplicate episode numbers for same series
CREATE UNIQUE INDEX IF NOT EXISTS series_episodes_series_episode_unique 
ON series_episodes(series_id, episode_number);

-- 7. Add unique constraint to prevent duplicate image orders for same series and type
CREATE UNIQUE INDEX IF NOT EXISTS series_images_series_order_type_unique 
ON series_images(series_id, image_order, image_type);

-- 8. Add trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_series_updated_at ON series;
CREATE TRIGGER update_series_updated_at
    BEFORE UPDATE ON series
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_series_episodes_updated_at ON series_episodes;
CREATE TRIGGER update_series_episodes_updated_at
    BEFORE UPDATE ON series_episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();




