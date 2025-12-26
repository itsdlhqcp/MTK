# Release Notifications Setup Guide

This guide explains how to set up automatic push notifications for theatre and digital releases.

## Features

The system sends push notifications to all users when:

1. **6 Hours Before Release**: A theatre or digital release will become "Now Showing" or "Now Streaming" in 6 hours
2. **When Release Starts**: A theatre or digital release just became "Now Showing" or "Now Streaming"

## Files Created

1. **`services/releaseNotificationService.js`**: Service functions to check releases and send notifications (can be used from the app)
2. **`supabase/functions/check-release-notifications/index.ts`**: Supabase Edge Function that checks for releases and sends notifications

## Setup Instructions

### Step 1: Deploy the Edge Function

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy check-release-notifications
   ```

### Step 2: Schedule the Function (Using pg_cron)

You need to schedule the function to run periodically (recommended: every hour).

1. Go to your Supabase Dashboard → SQL Editor

2. Run the following SQL to enable pg_cron extension (if not already enabled):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

3. Schedule the function to run every hour:
   ```sql
   SELECT cron.schedule(
     'check-release-notifications',
     '0 * * * *', -- Run every hour at minute 0
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-release-notifications',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
       ),
       body := '{}'::jsonb
     ) AS request_id;
     $$
   );
   ```

   **Replace:**
   - `YOUR_PROJECT_REF` with your Supabase project reference
   - `YOUR_SERVICE_ROLE_KEY` with your Supabase service role key (found in Project Settings → API)

### Step 3: Test the Function

You can test the function manually by calling it:

1. **Via Supabase Dashboard:**
   - Go to Edge Functions → `check-release-notifications`
   - Click "Invoke" to test

2. **Via cURL:**
   ```bash
   curl -X POST \
     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-release-notifications' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```

3. **From your app:**
   ```javascript
   import { supabase } from '../lib/supabase';
   
   const { data, error } = await supabase.functions.invoke('check-release-notifications', {
     body: {}
   });
   ```

## How It Works

### 6 Hours Before Release

The function checks for releases where:
- `rDate` is between now and 6 hours from now
- The release is not already "Now Showing" or "Now Streaming"
- Sends notification: `"[Release Name] will be Now Showing/Streaming in [X hours]. Get ready!"`

### When Release Starts

The function checks for releases where:
- `rDate` is between 1 hour ago and now
- The release is currently "Now Showing" or "Now Streaming"
- Sends notification: `"[Release Name] is Now Showing/Streaming! Don't miss it!"`

## Notification Format

Notifications include:
- **Title**: Release name with status (e.g., "Movie Name - Coming Soon!" or "Movie Name is Now Showing!")
- **Body**: Descriptive message with release name
- **Image**: Poster image from `filel` or `file` field
- **Data**: Navigation data to open the release in the app

## Troubleshooting

### Notifications Not Sending

1. **Check Edge Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → `check-release-notifications` → Logs
   - Look for errors or warnings

2. **Verify pg_cron Schedule:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-release-notifications';
   ```

3. **Check FCM Tokens:**
   - Ensure users have registered FCM tokens in `user_fcm_tokens` table
   - Verify tokens are active (`is_active = true`)

4. **Test Manually:**
   - Call the function manually to see if it works
   - Check the response for errors

### Function Not Running on Schedule

1. **Verify pg_cron is Enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Check Cron Jobs:**
   ```sql
   SELECT * FROM cron.job;
   ```

3. **View Cron Job History:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-release-notifications')
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

## Customization

### Change Notification Timing

To change from 6 hours to a different time, modify the Edge Function:

```typescript
// Change from 6 hours to 12 hours
const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

// Update the time window check
if (timeUntilRelease >= 11.5 && timeUntilRelease <= 12.5) {
  // ...
}
```

### Change Schedule Frequency

To run more or less frequently, update the cron schedule:

```sql
-- Run every 30 minutes
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'check-release-notifications'),
  schedule := '*/30 * * * *'
);

-- Run every 6 hours
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'check-release-notifications'),
  schedule := '0 */6 * * *'
);
```

## Notes

- The function checks releases in the `releases` table (theatre) and `streams` table (digital)
- Release names are extracted from the `body` field (HTML content)
- Images are taken from `filel` (preferred) or `file` fields
- Notifications are sent to ALL users with active FCM tokens
- The function is idempotent - it can be called multiple times safely

