# Rich Notifications with Images and Videos

## What's Been Updated

### 1. **Better HTML Text Formatting**
- Converts HTML to plain text while preserving line breaks
- Handles HTML entities (`&nbsp;`, `&amp;`, etc.)
- Truncates to 150 characters for notifications
- Preserves paragraph structure

### 2. **Image Support**
- ✅ Images are now included in notifications
- ✅ Full public URL is constructed correctly
- ✅ Works on both iOS and Android

### 3. **Video Support**
- ✅ Videos are detected and handled
- ✅ Video URL is included in notification data
- ✅ For YouTube videos, thumbnail is extracted automatically
- ⚠️ Note: Push notifications show video thumbnail, not the video itself

### 4. **Enhanced Notification Payload**
```javascript
{
  title: "Author Name posted in Spotlight",
  body: "Formatted text content...",
  image: "https://...", // Image or video thumbnail URL
  data: {
    screen: "feeds",
    postId: "123",
    type: "new_post",
    mediaType: "image" | "video" | null,
    image: "https://...", // Image URL
    video: "https://...", // Video URL (if video post)
  }
}
```

## Notification Display

### iOS
- Shows notification with image thumbnail
- Image appears as large image in expanded notification
- Tap navigates to feeds page

### Android
- Shows notification with image as large icon
- Image appears in expanded notification
- Tap navigates to feeds page

## Media Handling

### Images (`postImage`)
- ✅ Full image URL is sent
- ✅ Displays as thumbnail in notification
- ✅ Public URL format: `https://...supabase.co/storage/v1/object/public/profileImage/postImage/...`

### Videos (`postVideo`)
- ✅ Video URL is sent in data payload
- ✅ Video URL is used as image (some platforms show first frame)
- ⚠️ For better video thumbnails, consider generating thumbnails server-side

### YouTube Videos
- ✅ YouTube thumbnail is automatically extracted
- ✅ Uses high-quality thumbnail (`hqdefault.jpg`)
- ✅ Video URL is preserved in data payload

## Testing

1. **Create a post with an image:**
   - Notification should show image thumbnail
   - Text should be formatted (no HTML tags)

2. **Create a post with a video:**
   - Notification should show video URL as image
   - Video URL in data payload

3. **Create a post with YouTube link:**
   - Notification should show YouTube thumbnail
   - Video URL preserved

4. **Create a post with HTML text:**
   - Text should be formatted (line breaks preserved)
   - No HTML tags visible

## Next Steps

### For Better Video Thumbnails:
1. Generate video thumbnails when video is uploaded
2. Store thumbnail URL in database
3. Use thumbnail URL in notifications

### For Better Notification UI:
1. Custom notification handler can show rich UI
2. Use `data` payload to customize notification display
3. Consider using notification actions/buttons

## Deploy

**Don't forget to redeploy the Edge Function:**
```bash
supabase functions deploy send-push-notification
```

The updated code now:
- ✅ Formats HTML text properly
- ✅ Includes images in notifications
- ✅ Handles videos (with thumbnails)
- ✅ Supports YouTube videos
- ✅ Better notification structure



