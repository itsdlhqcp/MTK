-- Migration: Add FCM Push Notifications Support
-- This migration adds support for storing FCM tokens and sending push notifications

-- 1. Create user_fcm_tokens table to store FCM tokens for each user
CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fcm_token text NOT NULL,
  device_id text,
  device_type text CHECK (device_type IN ('ios', 'android', 'web')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT user_fcm_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT user_fcm_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_fcm_tokens_fcm_token_unique UNIQUE (fcm_token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id ON public.user_fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_active ON public.user_fcm_tokens(user_id, is_active) WHERE is_active = true;

-- 2. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_user_fcm_tokens_updated_at 
    BEFORE UPDATE ON public.user_fcm_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Create function to send push notifications (to be called from Edge Function or API)
-- This function will be used by Supabase Edge Functions
CREATE OR REPLACE FUNCTION get_all_active_fcm_tokens()
RETURNS TABLE (
    user_id uuid,
    fcm_token text,
    device_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uft.user_id,
        uft.fcm_token,
        uft.device_type
    FROM public.user_fcm_tokens uft
    WHERE uft.is_active = true
    ORDER BY uft.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_fcm_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_active_fcm_tokens() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_active_fcm_tokens() TO anon; -- For Edge Functions

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own FCM tokens
CREATE POLICY "Users can manage their own FCM tokens"
    ON public.user_fcm_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can read all tokens (for sending notifications)
CREATE POLICY "Service role can read all tokens"
    ON public.user_fcm_tokens
    FOR SELECT
    USING (true); -- This will be restricted by service role key in Edge Functions

-- 6. Create a view for easier querying of active tokens
CREATE OR REPLACE VIEW public.active_fcm_tokens_view AS
SELECT 
    uft.id,
    uft.user_id,
    uft.fcm_token,
    uft.device_type,
    uft.device_id,
    uft.created_at,
    uft.updated_at,
    u.name as user_name,
    u.image as user_image
FROM public.user_fcm_tokens uft
LEFT JOIN public.users u ON u.id = uft.user_id
WHERE uft.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.active_fcm_tokens_view TO authenticated;
GRANT SELECT ON public.active_fcm_tokens_view TO anon;

-- 7. Optional: Create a function to clean up old/inactive tokens
CREATE OR REPLACE FUNCTION cleanup_inactive_fcm_tokens()
RETURNS void AS $$
BEGIN
    -- Mark tokens as inactive if not updated in last 90 days
    UPDATE public.user_fcm_tokens
    SET is_active = false
    WHERE updated_at < now() - interval '90 days'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Note: You can schedule this cleanup function using pg_cron extension if available
-- SELECT cron.schedule('cleanup-fcm-tokens', '0 0 * * 0', 'SELECT cleanup_inactive_fcm_tokens()');



