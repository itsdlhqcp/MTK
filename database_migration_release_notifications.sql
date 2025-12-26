-- Migration: Create release_notifications table for user subscriptions
-- This table tracks which users want to receive notifications for specific releases

CREATE TABLE IF NOT EXISTS public.release_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  release_id bigint,
  release_type text NOT NULL CHECK (release_type IN ('theatre', 'digital')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT release_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT release_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  -- Ensure one subscription per user per release
  CONSTRAINT release_notifications_unique UNIQUE (user_id, release_id, release_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_release_notifications_user_id ON public.release_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_release_notifications_release_id ON public.release_notifications(release_id, release_type);
CREATE INDEX IF NOT EXISTS idx_release_notifications_active ON public.release_notifications(release_id, release_type, is_active) WHERE is_active = true;

-- Add comment for documentation
COMMENT ON TABLE public.release_notifications IS 'Tracks user subscriptions to receive notifications for specific theatre or digital releases';
COMMENT ON COLUMN public.release_notifications.release_id IS 'ID from releases table (theatre) or streams table (digital)';
COMMENT ON COLUMN public.release_notifications.release_type IS 'Type of release: theatre or digital';
COMMENT ON COLUMN public.release_notifications.is_active IS 'Whether the subscription is active (user can toggle)';
