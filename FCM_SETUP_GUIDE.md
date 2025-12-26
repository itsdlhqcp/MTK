# FCM Push Notifications Setup Guide

This guide will help you set up FCM (Firebase Cloud Messaging) push notifications for your Expo app.

## Prerequisites

1. Expo project with EAS configured
2. Supabase project with Edge Functions enabled
3. Firebase project (for FCM)

## Step 1: Install Dependencies

The required packages have been added to `package.json`. Install them:

```bash
npm install
```

## Step 2: Run Database Migration

Run the SQL migration file to create the FCM tokens table:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database_migration_fcm_notifications.sql`
4. Run the migration

This will create:
- `user_fcm_tokens` table
- Indexes for performance
- RLS policies
- Helper functions

## Step 3: Configure Expo Notifications

The `app.json` has been updated with the `expo-notifications` plugin. No additional configuration needed.

## Step 4: Deploy Supabase Edge Function

The Edge Function for sending push notifications is located at:
`supabase/functions/send-push-notification/index.ts`

### Deploy the function:

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
supabase link --project-ref your-project-ref
```

4. Deploy the function:
```bash
supabase functions deploy send-push-notification
```

### Environment Variables

The Edge Function uses these environment variables (automatically available in Supabase):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Step 5: Test the Setup

### 1. Test FCM Token Registration

When a user logs in, the app will automatically:
- Request notification permissions
- Get Expo push token
- Register the token in the database

Check the `user_fcm_tokens` table in Supabase to verify tokens are being saved.

### 2. Test Push Notifications

1. Create a new post from `app/createFeed.jsx`
2. The system will automatically:
   - Create the post
   - Trigger `sendPushNotificationForNewPost()` 
   - Call the Edge Function
   - Send notifications to all users with active FCM tokens

### 3. Test Notification Tap

When a user taps on a notification:
- The app will navigate to the feeds page
- The notification data will be logged to console

## How It Works

### Flow Diagram

```
New Post Created
    ↓
postService.createOrUpdatePost()
    ↓
sendPushNotificationForNewPost()
    ↓
Supabase Edge Function: send-push-notification
    ↓
Fetch all active FCM tokens from database
    ↓
Send notifications via Expo Push API
    ↓
Users receive push notifications
```

### Key Components

1. **`services/fcmService.js`**
   - Handles FCM token registration
   - Manages notification permissions
   - Token cleanup on logout

2. **`services/pushNotificationService.js`**
   - Prepares notification payload
   - Calls Supabase Edge Function
   - Handles post thumbnails

3. **`hooks/useNotifications.js`**
   - Sets up notification listeners
   - Handles notification taps
   - Navigates to appropriate screens

4. **`supabase/functions/send-push-notification/index.ts`**
   - Edge Function that sends notifications
   - Fetches FCM tokens from database
   - Sends via Expo Push API

## Notification Payload Structure

```javascript
{
  type: 'new_post',
  postId: '123',
  title: 'New Spotlight Post',
  body: 'Post content preview...',
  image: 'https://...', // Post thumbnail URL
  data: {
    screen: 'feeds',
    postId: '123',
    type: 'new_post'
  }
}
```

## Troubleshooting

### Notifications not being received

1. **Check FCM tokens are registered:**
   ```sql
   SELECT * FROM user_fcm_tokens WHERE is_active = true;
   ```

2. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → send-push-notification → Logs

3. **Verify notification permissions:**
   - Check if user granted notification permissions
   - On iOS, ensure APNs certificates are configured in Expo

### Edge Function deployment issues

1. **Check Supabase CLI is linked:**
   ```bash
   supabase status
   ```

2. **Verify function syntax:**
   ```bash
   supabase functions serve send-push-notification
   ```

### Token registration issues

1. **Check device is physical (not simulator):**
   - Push notifications only work on physical devices

2. **Verify EAS project ID:**
   - Check `app.json` has correct `eas.projectId`
   - This is required for Expo push tokens

## Production Considerations

1. **Rate Limiting:**
   - Expo Push API has rate limits
   - For large user bases, consider batching or using FCM topics

2. **Error Handling:**
   - The current implementation logs errors but doesn't fail post creation
   - Consider adding retry logic for failed notifications

3. **Token Cleanup:**
   - The migration includes a cleanup function
   - Consider scheduling it to run periodically

4. **Notification Preferences:**
   - Consider adding user preferences to opt-out of notifications
   - Store preferences in database and filter tokens accordingly

## Additional Features (Optional)

### Send to specific users
```javascript
import { sendPushNotificationToUsers } from '../services/pushNotificationService';

await sendPushNotificationToUsers(
  ['user-id-1', 'user-id-2'],
  {
    title: 'Custom Notification',
    body: 'Message content',
    data: { screen: 'feeds' }
  }
);
```

### Custom notification sounds
Add to `app.json`:
```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "sounds": ["./assets/notification.wav"]
      }
    ]
  ]
}
```

## Support

For issues or questions:
1. Check Expo Notifications docs: https://docs.expo.dev/push-notifications/overview/
2. Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
3. Review Edge Function logs in Supabase Dashboard



