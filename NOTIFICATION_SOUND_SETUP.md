# How to Set Custom Notification Sounds

This guide explains how to configure custom notification sounds for your Expo app.

## Quick Setup

### 1. Add Your Sound File

1. Create a `sounds` folder in your `assets` directory:
   ```
   assets/sounds/
   ```

2. Add your sound file (e.g., `notification.mp3`) to `assets/sounds/`
   - **Supported formats:**
     - iOS: `.mp3`, `.wav`, `.aiff`, `.caf`
     - Android: `.mp3`, `.wav`, `.ogg`
   - **Recommended:** Use `.mp3` for cross-platform compatibility
   - **File size:** Keep under 30 seconds and 500KB for best performance

### 2. Update app.json

The sound file is already configured in `app.json`:
```json
"expo-notifications": {
  "sounds": [
    "./assets/sounds/notification.mp3"
  ]
}
```

**Important:** 
- The filename in the array should match your actual file
- Use the path relative to the project root
- You can add multiple sounds to the array

### 3. Update Notification Payload

In `services/pushNotificationService.js`, the sound is already set:
```javascript
sound: 'notification', // This matches the filename (without extension)
```

**To use a different sound:**
- Change `'notification'` to match your sound filename (without extension)
- Example: If your file is `alert.mp3`, use `sound: 'alert'`

### 4. For Android (Additional Setup)

Android requires sounds to be in the `res/raw` folder:

1. Create the directory structure:
   ```
   android/app/src/main/res/raw/
   ```

2. Copy your sound file there:
   ```
   android/app/src/main/res/raw/notification.mp3
   ```

3. **Important:** The filename must be lowercase with no special characters
   - ✅ Good: `notification.mp3`, `alert.mp3`
   - ❌ Bad: `Notification.mp3`, `alert-sound.mp3`

### 5. Available Sound Options

You can use:
- **Custom sound:** `'notification'` (or your custom sound name)
- **Default sound:** `'default'` (system default)
- **No sound:** `null` or omit the sound field

### 6. Testing

1. **Rebuild your app** after adding sound files:
   ```bash
   # For development build
   eas build --platform android --profile development
   eas build --platform ios --profile development
   
   # Or for production
   eas build --platform all
   ```

2. **Note:** Sound files are bundled at build time, so you must rebuild after adding/changing sounds.

## Current Configuration

- **Sound file:** `assets/sounds/notification.mp3` (you need to add this file)
- **Sound name in code:** `'notification'`
- **Edge Function:** Automatically uses the sound from the payload

## Troubleshooting

### Sound not playing?
1. ✅ Check the file exists in `assets/sounds/`
2. ✅ Check Android file exists in `android/app/src/main/res/raw/`
3. ✅ Verify filename matches (case-sensitive on Android)
4. ✅ Rebuild the app after adding sounds
5. ✅ Check device volume is not muted
6. ✅ Verify sound format is supported

### "default" sound works but custom doesn't?
- Make sure you rebuilt the app after adding the sound file
- Check the filename matches exactly (without extension)
- For Android, ensure the file is in `res/raw/` folder

## Example: Multiple Sounds

If you want different sounds for different notification types:

1. Add multiple sounds to `app.json`:
```json
"sounds": [
  "./assets/sounds/notification.mp3",
  "./assets/sounds/alert.mp3",
  "./assets/sounds/message.mp3"
]
```

2. Use different sounds in your code:
```javascript
// In pushNotificationService.js
sound: 'notification', // For new posts
sound: 'alert',         // For alerts
sound: 'message',       // For messages
```

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android Notification Sounds](https://developer.android.com/develop/ui/views/notifications/channels)
- [iOS Notification Sounds](https://developer.apple.com/documentation/usernotifications/unnotificationsound)


