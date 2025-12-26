# How to Redeploy Edge Function for Image Support

## Yes, You Need to Redeploy!

The Edge Function was updated to support images in notifications. You need to redeploy it for the changes to take effect.

## Quick Deploy Command

```bash
supabase functions deploy send-push-notification
```

## What Changed

The Edge Function now:
1. ✅ Adds `notification` object for better Android/iOS compatibility
2. ✅ Includes `imageUrl` field for Android devices
3. ✅ Better logging for image URLs

## Step-by-Step Redeploy

### 1. Make sure you're in the project directory
```bash
cd /path/to/your/project
```

### 2. Verify you're linked to your Supabase project
```bash
supabase status
```

If not linked:
```bash
supabase link --project-ref YOUR_PROJECT_REF_ID
```

### 3. Deploy the function
```bash
supabase functions deploy send-push-notification
```

### 4. Verify deployment
You should see:
```
Deploying function send-push-notification...
Function send-push-notification deployed successfully
```

### 5. Test the function
1. Go to Supabase Dashboard → Edge Functions → `send-push-notification`
2. Click **Invoke Function**
3. Use this test payload:
```json
{
  "notification": {
    "type": "new_post",
    "postId": "123",
    "title": "Test with Image",
    "body": "This notification should have an image",
    "image": "https://lxzwfdaefevtppxwdjyg.supabase.co/storage/v1/object/public/profileImage/postImage/test.png",
    "data": {
      "screen": "feeds",
      "postId": "123"
    }
  },
  "target": "all_users"
}
```

## After Deployment

1. ✅ Edge Function is updated
2. ✅ Create a new post with an image
3. ✅ Check notifications - should now include images
4. ✅ Check Edge Function logs for image URL logs

## Verify It's Working

After redeploying and creating a new post:
1. Check Edge Function logs for: `🖼️ Adding image to notification: ...`
2. Check device notification - should show image thumbnail
3. If image doesn't show, verify the image URL is publicly accessible

## Troubleshooting

### Deployment fails
- Make sure you're logged in: `supabase login`
- Check you have the correct project linked
- Verify the function file exists at: `supabase/functions/send-push-notification/index.ts`

### Function deployed but images still not showing
- Check Edge Function logs for image URL
- Verify image URL is publicly accessible (open in browser)
- Check storage bucket permissions



