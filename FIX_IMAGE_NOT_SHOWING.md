# Fix: Images Not Showing in Notifications - Complete Debug Guide

## The Problem
Images are not appearing in push notifications even though the URL is being sent.

## Root Causes & Solutions

### Issue 1: Image URL Format
**Problem:** Expo requires direct image file URLs, not web page URLs.

**Solution:** ✅ Already fixed - using direct Supabase storage URLs:
```
https://lxzwfdaefevtppxwdjyg.supabase.co/storage/v1/object/public/profileImage/postImage/1234567890.png
```

### Issue 2: Notification Format
**Problem:** Expo Push API might need specific format.

**Current Format:**
```javascript
{
  to: "ExponentPushToken[...]",
  title: "...",
  body: "...",
  image: "https://...", // ← Should work
  data: { ... }
}
```

### Issue 3: Image Accessibility
**Problem:** Image URL might not be publicly accessible.

**Check:**
1. Open the image URL in browser
2. Should display image directly
3. If 404 → Storage permissions issue

### Issue 4: Image Size/Format
**Problem:** Image might be too large or wrong format.

**Requirements:**
- **iOS:** Max 10MB, formats: JPEG, PNG, BMP, GIF
- **Android:** Max 1MB, formats: JPEG, PNG, BMP
- **Resolution:** Should be reasonable (not too large)

## Debugging Steps

### Step 1: Check Logs After Creating Post

Look for these logs:

**In App (pushNotificationService.js):**
```
🖼️ ===== IMAGE PROCESSING =====
🖼️ Post image detected
📁 Original file path: postImage/1234567890.png
🖼️ Constructed image URL: https://...supabase.co/storage/.../postImage/1234567890.png
✅ Image URL will be sent to Edge Function
```

**In Edge Function Logs:**
```
📋 Notification payload: { hasImage: true, imageUrl: "https://..." }
🖼️ ===== IMAGE DEBUG INFO =====
🖼️ Image URL being added: https://...
✅ Image URL format looks correct
📤 First message sample: { hasImage: true, imageUrl: "https://..." }
```

### Step 2: Verify Image URL Works

1. **Copy image URL from logs**
2. **Open in browser:**
   ```
   https://lxzwfdaefevtppxwdjyg.supabase.co/storage/v1/object/public/profileImage/postImage/1234567890.png
   ```
3. **Should see the image directly**
4. **If 404 or access denied:**
   - Go to Supabase Dashboard → Storage → `profileImage`
   - Check bucket is public
   - Check RLS policies allow public read

### Step 3: Check Expo API Response

In Edge Function logs, look for:
```
📊 Batch 1 Expo API response: { hasData: true, dataLength: 10 }
📊 First receipt sample: { status: "ok", ... }
```

If you see errors:
```
❌ Failed notification: { status: "error", message: "...", details: "..." }
```

### Step 4: Test Image URL Manually

Test with Expo's notification tool:
1. Go to: https://expo.dev/notifications
2. Enter a valid Expo push token
3. Use this payload:
```json
{
  "to": "ExponentPushToken[...]",
  "title": "Test",
  "body": "Test with image",
  "image": "YOUR_IMAGE_URL_FROM_LOGS"
}
```

If this works → Your image URL is correct
If this doesn't work → Image URL or format issue

## Common Fixes

### Fix 1: Storage Bucket Not Public

**Check:**
```sql
-- In Supabase Dashboard → Storage → profileImage → Policies
-- Should have: "Public Access" enabled
```

**Or add policy:**
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'profileImage');
```

### Fix 2: Image URL Has Wrong Path

**Check file path format:**
- ✅ Correct: `postImage/1234567890.png`
- ✅ Correct: `/postImage/1234567890.png` (will be cleaned)
- ❌ Wrong: `profileImage/postImage/1234567890.png` (duplicate bucket name)

### Fix 3: Image Too Large

**Solution:**
- Compress images before upload
- Use thumbnails for notifications
- Max size: 1MB for Android, 10MB for iOS

### Fix 4: CORS Issues

**Check:**
- Image URL should be HTTPS (not HTTP)
- Supabase storage should allow CORS
- Check browser console for CORS errors

## Quick Test

1. **Get image URL from a post:**
   - Create a post with image
   - Check logs for image URL
   - Copy the URL

2. **Test URL directly:**
   - Open in browser
   - Should see image

3. **Test with Expo tool:**
   - Use Expo notification tester
   - Send notification with that image URL
   - Check if image appears

4. **Check Edge Function logs:**
   - Look for image URL in logs
   - Verify it's being sent to Expo API
   - Check for any errors

## What to Share for Debugging

If images still don't show, share:

1. **Image URL from logs:**
   ```
   🖼️ Constructed image URL: [paste URL here]
   ```

2. **Does URL work in browser?**
   - Yes/No
   - What do you see?

3. **Edge Function logs:**
   ```
   📊 Expo API response: [paste response]
   ```

4. **Any errors in logs?**
   - Error messages
   - Failed notification details

## Next Steps

After checking all above:
1. ✅ Verify image URL is correct
2. ✅ Verify URL is accessible
3. ✅ Check Edge Function logs
4. ✅ Test with Expo notification tool
5. ✅ Verify storage permissions

Let me know what you find and I'll help fix the specific issue!



