# Fix: FCM Tokens Not Being Registered

## Problem
When users log in, FCM tokens are not being registered in the database.

## Changes Made

### 1. Enhanced Logging
Added comprehensive logging throughout the FCM initialization flow to help identify where it's failing.

### 2. Improved Hook Logic
- Added delay before initialization to ensure user state is fully set
- Added app foreground listener to retry initialization if it failed
- Better handling of initialization state

### 3. Better Error Handling
- More detailed error messages
- Validation of EAS Project ID
- Better permission request handling

## Debugging Steps

### Step 1: Check Device Logs
After a user logs in, check the device console/logs for these messages:

**Expected Flow:**
```
🔔 useNotifications hook running, user: exists (user-id)
🚀 Starting FCM initialization for user: user-id
🔐 Initializing FCM for user: user-id
📱 Checking device type...
🔐 Checking existing notification permissions...
📋 Current permission status: granted (or undetermined)
📝 Requesting notification permissions... (if not granted)
✅ Permissions granted, getting Expo push token...
🔑 Project ID: 914fa909-af2f-4ae4-951d-30b3a259f8d3
🎫 Successfully obtained Expo push token
🎫 Got Expo push token: ExponentPushToken[...]
💾 Token registration result: {success: true, ...}
✅ FCM initialized successfully for user: user-id
```

**If you see errors:**
- `❌ EAS Project ID not found` → Check `app.json` has `extra.eas.projectId`
- `❌ Permission not granted` → User denied permissions
- `❌ No token received` → Expo push token generation failed
- `❌ Failed to register token` → Database insert/update failed

### Step 2: Verify EAS Project ID
Check `app.json` has:
```json
{
  "extra": {
    "eas": {
      "projectId": "914fa909-af2f-4ae4-951d-30b3a259f8d3"
    }
  }
}
```

### Step 3: Check Database
Run this query in Supabase:
```sql
SELECT * FROM user_fcm_tokens 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 4: Test Permission Request
The app should show a permission dialog when:
1. User logs in for the first time
2. User hasn't granted permissions before

If no dialog appears:
- Check device Settings → Apps → Your App → Notifications
- Verify permissions are enabled

## Common Issues

### Issue 1: Hook Not Running
**Symptoms:** No logs appear when user logs in

**Solution:**
- Verify `useNotifications()` is called in `app/_layout.jsx`
- Check if user is being set in AuthContext
- Check if hook is inside AuthProvider

### Issue 2: Permission Denied
**Symptoms:** Logs show "Permission not granted"

**Solution:**
- User needs to manually enable in device settings
- Or reinstall app to get permission prompt again

### Issue 3: EAS Project ID Missing
**Symptoms:** Logs show "EAS Project ID not found"

**Solution:**
- Verify `app.json` has `extra.eas.projectId`
- Rebuild app if you just added it

### Issue 4: Database Insert Fails
**Symptoms:** Token obtained but registration fails

**Solution:**
- Check RLS policies on `user_fcm_tokens` table
- Verify user has INSERT permission
- Check for unique constraint violations

## Testing

1. **Clear app data** (to test fresh login)
2. **Login** with a test user
3. **Check logs** for the flow above
4. **Check database** for token registration
5. **Grant permissions** if prompted
6. **Verify token** appears in `user_fcm_tokens` table

## Next Steps

After fixing token registration:
1. ✅ Tokens should appear in database
2. ✅ Create a test post
3. ✅ Check Edge Function logs
4. ✅ Verify notifications are sent

Let me know what logs you see and I'll help fix the specific issue!



