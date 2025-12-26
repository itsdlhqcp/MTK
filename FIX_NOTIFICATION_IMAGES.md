# Fix: Notification Images Not Showing

## Problem
Users are receiving notifications with text only, but not seeing the post images/thumbnails.

## Changes Made

### 1. Fixed Image URL Construction
- Changed from using `getSupabaseFileUrl()` which returns an object
- Now directly constructs the full public URL: `${supabaseUrl}/storage/v1/object/public/profileImage/${postData.file}`
- This ensures the URL is a string that Expo can use

### 2. Enhanced Notification Format
- Added `notification` object for better Android/iOS compatibility
- Added `imageUrl` field in notification object for Android
- Kept `image` field at root level for Expo compatibility

### 3. Better Logging
- Added logs to track when images are being added
- Logs the image URL being used

## How It Works Now

### Image URL Format
The notification now uses:
```
https://lxzwfdaefevtppxwdjyg.supabase.co/storage/v1/object/public/profileImage/postImage/1234567890.png
```

### Notification Payload Structure
```javascript
{
  to: "ExponentPushToken[...]",
  sound: "default",
  title: "New Spotlight Post",
  body: "Post content...",
  image: "https://...", // Full public URL
  data: {
    screen: "feeds",
    postId: "123",
    type: "new_post"
  },
  notification: {
    title: "New Spotlight Post",
    body: "Post content...",
    imageUrl: "https://...", // For Android
    sound: "default"
  },
  priority: "high"
}
```

## Testing

1. **Create a new post with an image**
2. **Check logs** for:
   - `🖼️ Post image URL: ...`
   - `🖼️ Adding image to notification: ...`
3. **Check notification** - should show image thumbnail
4. **Verify image URL** is publicly accessible (open in browser)

## Troubleshooting

### Images Still Not Showing

1. **Check Image URL is Public**
   - Open the image URL in a browser
   - Should display the image directly
   - If 404 or access denied → Storage bucket permissions issue

2. **Check Image Format**
   - URL should end with `.png`, `.jpg`, or `.jpeg`
   - Expo supports common image formats

3. **Check Image Size**
   - Very large images might not display
   - Consider using thumbnails for notifications

4. **Platform Differences**
   - iOS: Images show in notification preview
   - Android: Images show as large icon/expanded notification
   - Both require publicly accessible HTTPS URLs

### Verify Image URL in Logs

After creating a post, check:
- `🖼️ Post image URL:` should show full URL
- `🖼️ Adding image to notification:` should appear in Edge Function logs

### Test Image URL Manually

1. Get image URL from logs
2. Open in browser - should see image
3. If not accessible, check Supabase storage bucket permissions

## Next Steps

1. ✅ Image URL is now properly constructed
2. ✅ Notification format includes image fields
3. ⏳ Test with a new post
4. ⏳ Verify image appears in notification

If images still don't show, check:
- Storage bucket public access settings
- Image URL format in logs
- Device notification settings (some devices hide images)



