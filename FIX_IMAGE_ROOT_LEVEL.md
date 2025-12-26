# Fix: Image Not at Root Level in Notifications

## Problem Identified
From logs:
- `hasImageAtRoot: false` - Image NOT at root level
- `hasImageInData: true` - Image IS in data field
- Body has `&nbsp;` and `...` instead of "Read more"

## Root Cause
The Edge Function is setting `message.image = imageUrl`, but Expo Push API might be:
1. Stripping the `image` field
2. Not forwarding it to devices
3. Requiring a different format

## Solution Applied

### 1. Fixed HTML Entity Decoding
- Moved HTML entity decoding BEFORE tag removal
- This ensures `&nbsp;` is converted to space
- Replaces `...` with "Read more"

### 2. Enhanced Logging
- Added full message logging before sending to Expo API
- Logs what's actually sent in the batch
- Verifies image field is present

## Next Steps

1. **Redeploy Edge Function:**
   ```bash
   supabase functions deploy send-push-notification
   ```

2. **Check Edge Function Logs:**
   After creating a post, check Supabase Dashboard → Functions → Logs for:
   - `📤 First message in batch (FULL):` - Should show `image` field
   - `📤 What was sent to Expo (first message):` - Verify image is present

3. **If Image Still Not at Root:**
   - Check Expo Push API documentation
   - May need to use `attachments` field instead
   - Or use FCM directly instead of Expo Push API

## Expected Logs

**Edge Function should show:**
```
📤 First message in batch (FULL): {
  "to": "...",
  "title": "...",
  "body": "... Read more",
  "image": "https://...supabase.co/storage/.../postImage/xxx.png",
  "data": {...}
}
```

**App should show:**
```
📬 Notification received: {
  "hasImageAtRoot": true,  // Should be TRUE
  "imageUrlAtRoot": "https://...",  // Should have URL
  ...
}
```



