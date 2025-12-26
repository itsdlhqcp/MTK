# Notification Sound Fix Guide

## Issue
Custom notification sound is not playing - still getting default sound.

## Solution Applied

### ✅ Files Created/Updated:

1. **Android Sound File Location**
   - Created: `android/app/src/main/res/raw/notification.mp3`
   - This is required for Android to use custom notification sounds

2. **Sound Configuration**
   - ✅ `app.json` - Sound file configured in `expo-notifications` plugin
   - ✅ `assets/sounds/notification.mp3` - Sound file exists
   - ✅ `android/app/src/main/res/raw/notification.mp3` - Android sound file added
   - ✅ `services/notificationService.js` - Uses `sound: 'notification'`
   - ✅ `services/pushNotificationService.js` - Uses `sound: 'notification'`
   - ✅ Edge Function - Uses `notification.sound || "default"`

## ⚠️ IMPORTANT: Rebuild Required

**Sound files are bundled at BUILD TIME**, so you MUST rebuild your app after adding/changing sound files.

### Rebuild Commands:

```bash
# For Android development build
eas build --platform android --profile development

# For Android production build
eas build --platform android --profile production

# For iOS (if needed)
eas build --platform ios --profile development

# For both platforms
eas build --platform all
```

## Verification Checklist

Before rebuilding, verify:

- [x] Sound file exists: `assets/sounds/notification.mp3`
- [x] Android sound file exists: `android/app/src/main/res/raw/notification.mp3`
- [x] `app.json` has sound configured in `expo-notifications` plugin
- [x] Code uses `sound: 'notification'` (matches filename without extension)
- [x] Filename is lowercase: `notification.mp3` ✅

## Common Issues

### 1. Still Getting Default Sound After Rebuild?

**Check:**
- Filename must be **exactly** `notification.mp3` (lowercase, no spaces)
- Sound name in code must be `'notification'` (matches filename without `.mp3`)
- App must be **completely rebuilt** (not just updated via OTA)

### 2. Android Not Playing Custom Sound?

**Check:**
- File exists in `android/app/src/main/res/raw/notification.mp3`
- Filename is lowercase with no special characters
- App was rebuilt after adding the file

### 3. iOS Not Playing Custom Sound?

**Check:**
- File exists in `assets/sounds/notification.mp3`
- File format is supported (`.mp3`, `.wav`, `.aiff`, `.caf`)
- App was rebuilt after adding the file

### 4. Sound Works in Development but Not Production?

- Make sure `"mode": "production"` is set in `app.json` for `expo-notifications`
- Rebuild with production profile

## Testing

After rebuilding:

1. **Send a test notification**
2. **Check device volume** (not muted)
3. **Listen for custom sound** (should be different from default)
4. **Check notification settings** on device (some devices allow per-app sound settings)

## Current Configuration

```json
// app.json
"expo-notifications": {
  "sounds": [
    "./assets/sounds/notification.mp3"
  ],
  "mode": "production"
}
```

```javascript
// services/notificationService.js & pushNotificationService.js
sound: 'notification' // Matches filename without extension
```

## Next Steps

1. **Rebuild your app** using EAS Build
2. **Test notifications** after installing the new build
3. **Verify custom sound plays** instead of default

## Notes

- Sound files are **bundled at build time** - OTA updates won't include new sounds
- For Android, the file **must** be in `res/raw/` folder
- Filename must be **lowercase** with no special characters
- Sound name in code must **exactly match** filename (without extension)

