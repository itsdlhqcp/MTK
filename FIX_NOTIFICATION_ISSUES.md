# Fix: Notification Image and "Read more" Issues

## Issues Identified
1. Images not showing in notifications
2. "Read more" text not appearing

## Root Causes

### Issue 1: Images Not Showing
**Problem:** Expo Push API requires specific format for images to display on Android.

**Solution Applied:**
- ✅ Image URL is set at root level: `message.image = imageUrl`
- ✅ Image URL is also in data field: `message.data.image = imageUrl`
- ✅ Image URL format validated (must be direct image URL)

**Important Notes:**
- Expo Push API on Android should automatically display images when `image` field is set at root level
- Image URL must be publicly accessible (✅ Confirmed working)
- Image URL format: `https://...supabase.co/storage/v1/object/public/profileImage/postImage/xxx.png`

### Issue 2: "Read more" Not Showing
**Problem:** Text formatting might not be adding "Read more" correctly.

**Solution Applied:**
- ✅ Code adds "Read more" at line 83: `text = text.trim() + ' Read more'`
- ✅ Added verification logging to check if "Read more" is in body

## Debugging Steps

### Step 1: Check App Logs
After creating a post, check logs for:

```
📝 Formatted body: [text] Read more
📤 Image URL in payload: https://...supabase.co/storage/.../postImage/xxx.png
📤 Body ends with 'Read more'? true
```

### Step 2: Check Edge Function Logs
In Supabase Dashboard → Functions → Logs, look for:

```
📝 Image URL: https://...supabase.co/storage/.../postImage/xxx.png
📝 Body ends with 'Read more'? true
🖼️ Image URL: https://... (in message)
```

### Step 3: Verify Notification Format
The notification message should have:
```json
{
  "to": "ExponentPushToken[...]",
  "title": "...",
  "body": "... Read more",
  "image": "https://...supabase.co/storage/.../postImage/xxx.png",
  "data": {
    "image": "https://...supabase.co/storage/.../postImage/xxx.png",
    ...
  }
}
```

## If Issues Persist

### For Images:
1. **Check if image URL is accessible:**
   - Open image URL in browser
   - Should display image directly

2. **Android Specific:**
   - Images in notifications work on Android 7.0+ (API 24+)
   - Check device Android version

3. **iOS Specific:**
   - Requires Notification Service Extension (NSE) for images
   - Without NSE, images won't show on iOS

### For "Read more":
1. **Check logs:**
   - Look for `📝 Formatted body:` - should end with "Read more"
   - If missing, check `formatNotificationBody` function

2. **Verify body text:**
   - Check `notificationPayload.body` in logs
   - Should contain "Read more" at the end

## Next Steps

1. **Redeploy Edge Function:**
   ```bash
   supabase functions deploy send-push-notification
   ```

2. **Test with new post:**
   - Create post with image
   - Check all logs
   - Verify notification received

3. **Share logs if issues persist:**
   - App logs showing payload
   - Edge Function logs
   - Notification received on device

## Code Changes Made

1. ✅ Enhanced logging in `pushNotificationService.js`
2. ✅ Enhanced logging in Edge Function
3. ✅ Image URL validation
4. ✅ "Read more" verification
5. ✅ Error logging if image or "Read more" missing



