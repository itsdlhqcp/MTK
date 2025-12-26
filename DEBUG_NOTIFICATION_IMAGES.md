# Debug: Images Not Showing in Notifications

## Quick Debug Steps

### 1. Check Logs After Creating Post

Look for these logs in your device console:

```
🖼️ Post image detected
📁 File path: postImage/1234567890.png
🔗 Full image URL: https://lxzwfdaefevtppxwdjyg.supabase.co/storage/v1/object/public/profileImage/postImage/1234567890.png
✅ Image URL length: [number]
🖼️ Adding image to notification: https://...
```

### 2. Verify Image URL is Accessible

**Test the image URL:**
1. Copy the image URL from logs
2. Open it in a browser
3. Should display the image directly
4. If you see 404 or access denied → Storage permissions issue

### 3. Check Edge Function Logs

In Supabase Dashboard → Edge Functions → `send-push-notification` → Logs:

Look for:
```
📋 Notification payload: { hasImage: true, imageUrl: "https://..." }
🖼️ Adding image to notification: https://...
```

### 4. Common Issues

#### Issue 1: Image URL Not Public
**Symptom:** URL returns 404 or access denied

**Fix:**
1. Go to Supabase Dashboard → Storage → `profileImage` bucket
2. Check if bucket is public
3. If not, make it public or check RLS policies

#### Issue 2: Image URL Format Wrong
**Symptom:** URL doesn't start with `http://` or `https://`

**Check:**
- `postData.file` should be like: `postImage/1234567890.png`
- Full URL should be: `https://...supabase.co/storage/v1/object/public/profileImage/postImage/1234567890.png`

#### Issue 3: Expo Not Showing Images
**Symptom:** Text shows but no image

**Possible causes:**
- Image URL not accessible from device
- Image too large (Expo has size limits)
- Notification format issue

**Fix:**
- Verify image URL is HTTPS (required)
- Check image size (should be < 5MB for notifications)
- Ensure image format is supported (jpg, png)

#### Issue 4: Image Field Not in Message
**Symptom:** Logs show "No image provided"

**Check:**
- `postData.file` exists and contains `postImage`
- Image URL is being constructed correctly
- Check logs for "🖼️ Post image URL:" message

## Test Image URL Manually

1. **Get image URL from logs** after creating a post
2. **Test in browser:**
   ```
   https://lxzwfdaefevtppxwdjyg.supabase.co/storage/v1/object/public/profileImage/postImage/[filename]
   ```
3. **If it works in browser** → URL is correct, issue is with notification format
4. **If it doesn't work** → Storage permissions issue

## Verify Notification Format

The notification should have:
```javascript
{
  to: "ExponentPushToken[...]",
  title: "...",
  body: "...",
  image: "https://...", // ← This should be present
  data: { ... },
  attachments: {
    image: "https://..." // ← Also added for compatibility
  }
}
```

## Quick Fixes

### Fix 1: Verify Storage Bucket is Public
```sql
-- Check bucket policies in Supabase Dashboard
-- Storage → profileImage → Policies
-- Should have public read access
```

### Fix 2: Test with Direct URL
Create a test notification with a known working image URL:
```json
{
  "notification": {
    "title": "Test",
    "body": "Test with image",
    "image": "https://example.com/test-image.jpg"
  },
  "target": "all_users"
}
```

### Fix 3: Check Image Size
Large images might not display. Consider:
- Using thumbnails for notifications
- Compressing images before upload
- Using CDN for images

## Next Steps

1. ✅ Check logs for image URL
2. ✅ Test image URL in browser
3. ✅ Verify Edge Function logs show image
4. ✅ Check storage bucket permissions
5. ✅ Test with smaller image

Share the logs you see and I'll help fix the specific issue!



