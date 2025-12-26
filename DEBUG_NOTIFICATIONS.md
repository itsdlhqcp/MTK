# Debugging Push Notifications - Step by Step Guide

Since users are not receiving notifications, let's debug systematically:

## Step 1: Check if FCM Tokens are Being Registered

### In Supabase Dashboard:
1. Go to **Table Editor** → `user_fcm_tokens`
2. Check if there are any records
3. Verify `is_active` is `true` for active tokens
4. Check if `fcm_token` column has valid Expo push tokens (they should start with `ExponentPushToken[...]`)

### SQL Query to Check:
```sql
SELECT 
  COUNT(*) as total_tokens,
  COUNT(*) FILTER (WHERE is_active = true) as active_tokens,
  COUNT(DISTINCT user_id) as unique_users
FROM user_fcm_tokens;
```

### Expected Result:
- If `total_tokens` is 0 → FCM tokens are NOT being registered
- If `active_tokens` is 0 → All tokens are inactive
- If you see tokens → Proceed to Step 2

---

## Step 2: Verify Edge Function is Being Called

### Check Edge Function Logs:
1. Go to Supabase Dashboard → **Edge Functions** → `send-push-notification`
2. Click on **Logs** tab
3. Check if there are any logs when you create a new post
4. Look for errors or successful invocations

### Test Edge Function Manually:
1. Go to **Edge Functions** → `send-push-notification`
2. Click **Invoke Function**
3. Use this test payload:
```json
{
  "notification": {
    "type": "new_post",
    "postId": "123",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {
      "screen": "feeds",
      "postId": "123",
      "type": "new_post"
    }
  },
  "target": "all_users"
}
```

### Expected Result:
- If you see logs → Function is being called
- If no logs → Function is NOT being called (check Step 3)
- If errors in logs → Check error messages

---

## Step 3: Verify Post Creation Triggers Notification

### Add Console Logs:
Check if `sendPushNotificationForNewPost` is being called when creating a post.

### Check in Code:
The notification should be triggered in `services/postService.js` at line 28-30:
```javascript
if (isNewPost && data) {
  sendPushNotificationForNewPost(data).catch(err => {
    console.error("Error sending push notification:", err);
  });
}
```

### Test:
1. Create a new post
2. Check device console/logs for:
   - "Error sending push notification:" messages
   - Edge Function invocation errors

---

## Step 4: Check Notification Permissions

### On Device:
1. Go to device Settings → Apps → Your App → Notifications
2. Verify notifications are enabled
3. Check if permission was granted

### In Code:
The app should request permissions when user logs in via `useNotifications` hook.

---

## Step 5: Verify Expo Push Token Format

### Check Token Format:
Expo push tokens should look like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

### If tokens look different:
- They might be FCM tokens instead of Expo tokens
- This would cause notifications to fail

---

## Step 6: Test with Expo Push Notification Tool

### Use Expo's Test Tool:
1. Go to: https://expo.dev/notifications
2. Enter a valid Expo push token from your database
3. Send a test notification
4. Check if device receives it

### If this works:
- Your tokens are valid
- Issue is with Edge Function or notification sending

### If this doesn't work:
- Token format is wrong
- Device doesn't have proper permissions
- App configuration issue

---

## Common Issues and Solutions

### Issue 1: No FCM Tokens in Database
**Cause:** `initializeFCM` is not being called or failing silently

**Solution:**
1. Check if `useNotifications` hook is called in `app/_layout.jsx`
2. Add console logs in `services/fcmService.js` to see if it's being called
3. Check device logs for permission errors

### Issue 2: Edge Function Not Being Called
**Cause:** Post creation might not be triggering notification

**Solution:**
1. Add console.log in `postService.js` before calling `sendPushNotificationForNewPost`
2. Verify `isNewPost` is `true` (check if `post.id` exists)
3. Check if `data` exists after post creation

### Issue 3: Edge Function Errors
**Cause:** Function might have errors in execution

**Solution:**
1. Check Edge Function logs in Supabase Dashboard
2. Verify function is deployed correctly
3. Check if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Issue 4: Tokens Exist But No Notifications
**Cause:** Expo Push API might be rejecting tokens

**Solution:**
1. Verify tokens are valid Expo push tokens
2. Check if tokens are expired (Expo tokens can expire)
3. Test with Expo's notification tool

### Issue 5: Notifications Sent But Not Received
**Cause:** Device/App configuration issue

**Solution:**
1. Check notification permissions
2. Verify app is not in Do Not Disturb mode
3. Check if notifications are disabled in app settings
4. Test on multiple devices

---

## Quick Diagnostic Queries

### Check Active Tokens:
```sql
SELECT user_id, fcm_token, device_type, created_at, updated_at 
FROM user_fcm_tokens 
WHERE is_active = true 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Check Recent Posts:
```sql
SELECT id, "userId", created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check if Function Was Called (if you add logging):
```sql
-- If you add a logs table, check recent function calls
```

---

## Next Steps After Diagnosis

Based on what you find:

1. **No tokens** → Fix FCM registration
2. **Tokens exist but function not called** → Fix post creation trigger
3. **Function called but errors** → Fix Edge Function
4. **Function works but no notifications** → Check Expo/device configuration

Let me know what you find and I'll help fix the specific issue!



