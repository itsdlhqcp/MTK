# FCM Push Notifications Implementation Guide

This document outlines all the modifications and changes needed to implement FCM push notifications for the following scenarios:

1. **Reviewed on your release**
2. **Commented on your twist**
3. **Commented on your post**
4. **Replied on your review**

## Overview

The notification system has been enhanced to send rich FCM push notifications with:
- **Images**: Context-specific images (release poster, post image, etc.)
- **Formatted Text**: Clean, readable notification bodies with "Read more" suffix
- **Navigation**: Proper deep linking to relevant screens
- **Custom Sounds**: Notification sounds (configurable)

## Files Modified

### 1. `services/notificationService.js` ✅ **ENHANCED**

**Changes Made:**
- Added `formatNotificationBody()` function to strip HTML and format text
- Added `getNotificationImage()` function to fetch context-specific images
- Enhanced `sendFCMPushNotification()` to:
  - Fetch relevant images based on notification type
  - Format notification bodies with "Read more"
  - Include proper navigation data
  - Add custom sound support

**Key Features:**
- Automatically fetches release/stream images for review notifications
- Automatically fetches post images for comment notifications
- Formats notification text properly (strips HTML, adds "Read more")
- Includes proper navigation screens based on notification type

### 2. Existing Notification Triggers ✅ **ALREADY IN PLACE**

All notification triggers are already implemented in the codebase:

#### **Reviewed on your release**
- **Location**: `app/streamDetails.jsx` (line ~224-232)
- **Trigger**: When a user reviews a release/stream
- **Status**: ✅ Already calls `createNotifications()`

#### **Commented on your twist**
- **Location**: `app/twistDetails.jsx` (line ~122-131)
- **Trigger**: When a user comments on a twist
- **Status**: ✅ Already calls `createNotifications()`

#### **Commented on your post**
- **Locations**: 
  - `app/postDetails.jsx` (line ~124-133)
  - `app/feedDetails.jsx` (line ~179-188)
  - `components/CommentBottomSheet.jsx` (line ~103-112)
- **Trigger**: When a user comments on a post
- **Status**: ✅ Already calls `createNotifications()`

#### **Replied on your review**
- **Locations**:
  - `app/releasePeopleSection/releasePeopleDetails.jsx` (line ~286-291)
  - `app/releasePeopleSection/releasePeopleReview.jsx` (line ~115-122)
  - `app/streamPeopleSection/streamPeopleDetails.jsx` (line ~320-325)
  - `app/streamPeopleSection/streamPeopleReview.jsx` (line ~114-122)
- **Trigger**: When a user replies to a review
- **Status**: ✅ Already calls `createNotifications()`

## Notification Flow

```
User Action (Review/Comment/Reply)
    ↓
createNotifications() called
    ↓
Notification saved to database
    ↓
sendFCMPushNotification() called
    ↓
Fetches sender info, context image, formats text
    ↓
sendPushNotificationToUsers() called
    ↓
Supabase Edge Function invoked
    ↓
FCM tokens fetched from database
    ↓
Expo Push API sends notification
    ↓
User receives rich notification with image
```

## Notification Payload Structure

Each notification includes:

```javascript
{
  type: 'notification',
  title: 'Sender Name',
  body: 'Sender Name [action] Read more',
  image: 'https://...', // Context-specific image URL
  sound: 'notification',
  data: {
    screen: 'postDetails' | 'twistDetails' | 'releaseDetails' | 'streamDetails',
    type: 'notification',
    postId: '...', // or releaseId, streamId, etc.
    commentId: '...', // or reviewId, etc.
  }
}
```

## Image Sources

### For Review Notifications
- **Release**: `releases.image` or `releases.poster`
- **Stream**: `streams.image` or `streams.poster`
- **URL Format**: `${supabaseUrl}/storage/v1/object/public/releases/${image}`

### For Comment Notifications
- **Post**: `posts.file` or `posts.image`
- **URL Format**: `${supabaseUrl}/storage/v1/object/public/posts/${file}`

## Navigation Screens

| Notification Type | Screen |
|-----------------|--------|
| Commented on your post | `postDetails` |
| Commented on your twist | `twistDetails` |
| Reviewed on your release | `releaseDetails` or `streamDetails` |
| Replied to your review | `releaseDetails` or `streamDetails` |

## Testing Checklist

- [ ] **Review Notification**: Create a review on a release → Check notification received with release image
- [ ] **Comment on Post**: Comment on a post → Check notification received with post image
- [ ] **Comment on Twist**: Comment on a twist → Check notification received with twist image
- [ ] **Reply to Review**: Reply to a review → Check notification received with release/stream image
- [ ] **Notification Image**: Verify images appear in notification bubble
- [ ] **Notification Text**: Verify text is formatted (no HTML, includes "Read more")
- [ ] **Navigation**: Tap notification → Verify app navigates to correct screen
- [ ] **Sound**: Verify custom notification sound plays

## No Additional Changes Required

✅ **All notification triggers are already in place**
✅ **Notification service has been enhanced to send rich FCM notifications**
✅ **Images are automatically fetched based on notification type**
✅ **Text formatting is handled automatically**
✅ **Navigation is configured properly**

## Edge Cases Handled

1. **Missing Images**: Falls back to sender's profile image
2. **Missing Data**: Gracefully handles missing notification data
3. **HTML Content**: Strips HTML tags and formats text properly
4. **Navigation**: Defaults to 'home' if screen cannot be determined

## Customization

### Change Notification Sound
Edit `services/notificationService.js`:
```javascript
sound: 'notification', // Change to your custom sound name
```

### Modify Notification Text
Edit `services/notificationService.js` in `sendFCMPushNotification()`:
```javascript
notificationBody = `${senderName} [your custom text] Read more`;
```

### Add New Notification Types
1. Add notification trigger in the relevant component
2. Add case in `getNotificationImage()` for image fetching
3. Add case in `getScreenFromNotification()` for navigation
4. Add case in `sendFCMPushNotification()` for body text

## Troubleshooting

### Images Not Showing
- Check image URLs are publicly accessible
- Verify storage bucket permissions
- Check console logs for image URL construction

### Notifications Not Received
- Verify FCM tokens are registered (`user_fcm_tokens` table)
- Check Edge Function logs in Supabase
- Verify Expo Push API credentials

### Navigation Not Working
- Check `data.screen` in notification payload
- Verify route exists in your app
- Check notification tap handler in `useNotifications` hook

## Summary

**All required modifications have been completed!** The notification system now:

1. ✅ Sends rich FCM notifications with images
2. ✅ Formats notification text properly
3. ✅ Includes proper navigation data
4. ✅ Handles all 4 notification types requested
5. ✅ Uses existing notification triggers (no new triggers needed)

The system is ready to use. All notification triggers are already in place, and the enhanced `notificationService.js` will automatically send rich FCM notifications for all the requested scenarios.

