# Using Web URL for Notification Images

## Current Implementation

The notification service now uses:
```
https://plotwist-site.vercel.app/posts/{postId}
```

As the image URL for push notifications.

## Important Note

⚠️ **Expo Push Notifications typically require direct image URLs** (like `.jpg`, `.png` files), not web page URLs.

For this to work, your web page at `https://plotwist-site.vercel.app/posts/{postId}` needs to:

### Option 1: Open Graph Meta Tags (Recommended)
Add Open Graph meta tags to your web page:

```html
<meta property="og:image" content="https://lxzwfdaefevtppxwdjyg.supabase.co/storage/v1/object/public/profileImage/{imagePath}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
```

Some notification systems can extract the image from `og:image` tags.

### Option 2: Direct Image Redirect
Make your web page redirect to the actual image:
- `/posts/424` → redirects to → actual image URL

### Option 3: Use Direct Image URL (Alternative)
If the web URL doesn't work, you can modify the code to use the direct Supabase storage URL instead.

## Current Code Behavior

The code now:
1. ✅ Always uses web URL format: `https://plotwist-site.vercel.app/posts/{postId}`
2. ✅ Includes postId from the `posts` table
3. ✅ Logs the URL being used

## Testing

1. **Check the URL format:**
   - After creating a post, check logs for: `🔗 Post web URL (image): https://plotwist-site.vercel.app/posts/424`
   
2. **Verify web page has image:**
   - Open `https://plotwist-site.vercel.app/posts/424` in browser
   - Check if it displays the post image
   - Check page source for Open Graph tags

3. **Test notification:**
   - Create a new post
   - Check if notification shows image
   - If not, the web URL might not be compatible with Expo notifications

## If Images Still Don't Show

If using the web URL doesn't work, you have two options:

### Option A: Use Direct Image URL (Current Implementation)
Change back to using direct Supabase storage URLs:
```javascript
const imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${postData.file}`;
```

### Option B: Add Open Graph Tags to Web Page
Ensure your web page at `/posts/{postId}` includes proper Open Graph meta tags with the actual image URL.

## Next Steps

1. ✅ Code updated to use web URL format
2. ⏳ Test with a new post
3. ⏳ Verify web page displays image correctly
4. ⏳ Check if notification shows image
5. ⏳ If not, consider using direct image URL or adding Open Graph tags



