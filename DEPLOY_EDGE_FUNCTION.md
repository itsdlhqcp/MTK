# How to Deploy Supabase Edge Function: send-push-notification

This guide will walk you through deploying the push notification Edge Function to Supabase.

## Prerequisites

1. Node.js installed (v16 or higher)
2. Supabase account and project
3. Your Supabase project reference ID

## Step-by-Step Instructions

### Step 1: Install Supabase CLI

Install the Supabase CLI globally:

```bash
npm install -g supabase
```

Or if you prefer using npx (no global installation):

```bash
npx supabase --version
```

### Step 2: Login to Supabase

Login to your Supabase account:

```bash
supabase login
```

This will open a browser window for authentication. After logging in, you'll be authenticated in the CLI.

### Step 3: Initialize Supabase (if not already done)

If you don't have a Supabase config file, initialize it:

```bash
supabase init
```

This creates a `supabase/config.toml` file. You can skip this if you already have one.

### Step 4: Link Your Project

Link your local project to your Supabase project. You'll need your **Project Reference ID**.

**How to find your Project Reference ID:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **General**
4. Copy the **Reference ID** (it looks like: `abcdefghijklmnop`)

**Link the project:**

```bash
supabase link --project-ref YOUR_PROJECT_REF_ID
```

Replace `YOUR_PROJECT_REF_ID` with your actual project reference ID.

Example:
```bash
supabase link --project-ref abcdefghijklmnop
```

### Step 5: Verify Function Exists

Check that your function file exists at:
```
supabase/functions/send-push-notification/index.ts
```

### Step 6: Deploy the Function

Deploy the Edge Function:

```bash
supabase functions deploy send-push-notification
```

**Alternative: Deploy with specific project ref (if not linked):**

```bash
supabase functions deploy send-push-notification --project-ref YOUR_PROJECT_REF_ID
```

### Step 7: Verify Deployment

After deployment, you should see:
```
Deploying function send-push-notification...
Function send-push-notification deployed successfully
```

You can verify in the Supabase Dashboard:
1. Go to **Edge Functions** in the left sidebar
2. You should see `send-push-notification` listed
3. Click on it to see logs and details

## Testing the Function

### Option 1: Test via Supabase Dashboard

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

### Option 2: Test via CLI

```bash
supabase functions invoke send-push-notification \
  --body '{"notification":{"type":"new_post","postId":"123","title":"Test","body":"Test body","data":{"screen":"feeds"}},"target":"all_users"}'
```

### Option 3: Test from Your App

Create a test post from your app and check:
1. Edge Function logs in Supabase Dashboard
2. Check if notifications are received on devices with registered FCM tokens

## Troubleshooting

### Error: "Not logged in"

**Solution:**
```bash
supabase login
```

### Error: "Project not linked"

**Solution:**
```bash
supabase link --project-ref YOUR_PROJECT_REF_ID
```

### Error: "Function not found"

**Solution:**
- Verify the function file exists at: `supabase/functions/send-push-notification/index.ts`
- Check the function name matches exactly: `send-push-notification`

### Error: "Permission denied" or "Unauthorized"

**Solution:**
- Make sure you're logged in with the correct account
- Verify you have access to the project
- Check your project reference ID is correct

### Error: "TypeScript compilation errors"

**Solution:**
- The function uses Deno, not Node.js TypeScript
- Make sure imports use Deno-compatible URLs (https://)
- Check the function file for syntax errors

### Function deployed but not working

**Check logs:**
```bash
supabase functions logs send-push-notification
```

Or view logs in the Supabase Dashboard:
1. Go to **Edge Functions** → `send-push-notification`
2. Click on **Logs** tab

## Updating the Function

To update the function after making changes:

```bash
supabase functions deploy send-push-notification
```

The function will be redeployed with your latest changes.

## Viewing Function Logs

### Via CLI:
```bash
supabase functions logs send-push-notification
```

### Via Dashboard:
1. Go to **Edge Functions** → `send-push-notification`
2. Click on **Logs** tab
3. View real-time logs

## Function URL

After deployment, your function will be available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification
```

This URL is automatically used by your app when calling:
```javascript
supabase.functions.invoke('send-push-notification', {...})
```

## Environment Variables

The function automatically has access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for database access)

These are automatically injected by Supabase, no configuration needed.

## Quick Reference Commands

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF_ID

# Deploy function
supabase functions deploy send-push-notification

# View logs
supabase functions logs send-push-notification

# Test function
supabase functions invoke send-push-notification --body '{"notification":{...},"target":"all_users"}'

# List all functions
supabase functions list
```

## Next Steps

After successful deployment:
1. ✅ Function is deployed and ready
2. ✅ Test by creating a new post in your app
3. ✅ Check Edge Function logs to verify it's being called
4. ✅ Verify notifications are received on test devices

Your push notification system is now fully operational! 🎉



