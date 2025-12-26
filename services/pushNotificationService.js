import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';
import { stripHtmlTags } from '../helpers/common';

/**
 * Send push notification to all users when a new post is created
 * This function calls a Supabase Edge Function or external API
 * 
 * @param {Object} postData - Post data including id, body, file, userId, etc.
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const sendPushNotificationForNewPost = async (postData) => {
  try {
    console.log("🔔 sendPushNotificationForNewPost called with:", { postId: postData?.id, userId: postData?.userId });
    
    if (!postData || !postData.id) {
      console.error("❌ Post data is missing or invalid");
      return { success: false, msg: 'Post data is required' };
    }

    // Get post author info
    const { data: authorData, error: authorError } = await supabase
      .from('users')
      .select('id, name, image')
      .eq('id', postData.userId)
      .single();

    if (authorError || !authorData) {
      console.error('Error fetching author data:', authorError);
      // Continue anyway, we can send notification without author name
    }

    // Format HTML body to clean, readable plain text for notifications
    const formatNotificationBody = (htmlBody) => {
      if (!htmlBody || typeof htmlBody !== 'string') {
        return 'Check out the new post!';
      }
      
      let text = htmlBody;
      
      // Step 1: Decode HTML entities FIRST (before removing tags)
      // This ensures all entities are converted before tag removal
      text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&#160;/g, ' ') // Non-breaking space (numeric)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&apos;/g, "'")
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, ' Read more') // Replace HTML ellipsis with "Read more"
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™');
      
      // Step 2: Convert block elements to spaces (before removing tags)
      text = text
        .replace(/<\/p>/gi, ' ') // Paragraphs to space
        .replace(/<\/div>/gi, ' ') // Divs to space
        .replace(/<\/h[1-6]>/gi, ' ') // Headings to space
        .replace(/<\/li>/gi, ' ') // List items to space
        .replace(/<\/tr>/gi, ' ') // Table rows to space
        .replace(/<br\s*\/?>/gi, ' ') // Line breaks to space
        .replace(/\n/g, ' '); // Newlines to space
      
      // Step 3: Remove all HTML tags
      text = text.replace(/<[^>]*>/g, '');
      
      // Step 4: Clean up whitespace (multiple spaces to single space)
      text = text
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/\s*\.\s*/g, '. ') // Space around periods
        .replace(/\s*,\s*/g, ', ') // Space around commas
        .trim();
      
      // Step 5: Replace any existing "..." with "Read more"
      text = text.replace(/\.\.\./g, ' Read more');
      
      // Step 6: Ensure we have valid text
      if (!text || text.length === 0) {
        return 'Check out the new post!';
      }
      
      // Step 7: Add "Read more" at the end if not already present (no truncation)
      const trimmedText = text.trim();
      if (!trimmedText.endsWith('Read more')) {
        text = trimmedText + ' Read more';
      } else {
        text = trimmedText;
      }
      
      return text;
    };

    // Get author name for title
    const authorName = authorData?.name || 'Someone';
    const notificationTitle = `New Post Spotlight`;

    // Format the notification body
    const formattedBody = formatNotificationBody(postData.body);
    console.log("📝 ===== TEXT FORMATTING =====");
    console.log("📝 Original body:", postData.body?.substring(0, 100) + "...");
    console.log("📝 Original body length:", postData.body?.length || 0);
    console.log("📝 Formatted body:", formattedBody);
    console.log("📝 Formatted body length:", formattedBody.length);
    console.log("📝 Has 'Read more'?", formattedBody.includes('Read more'));

    // Prepare notification payload
    const notificationPayload = {
      type: 'new_post',
      postId: postData.id,
      title: notificationTitle,
      body: formattedBody,
      image: null,
      video: null,
      mediaType: null, // 'image', 'video', or null
      sound: 'notification', // Custom sound name (without extension) - change this to your custom sound
      data: {
        screen: 'feeds',
        postId: postData.id.toString(),
        type: 'new_post',
      },
    };

    // Web URL for post (used in data payload for navigation)
    const postWebUrl = `https://plotwist-site.vercel.app/posts/${postData.id}`;
    notificationPayload.data.postUrl = postWebUrl;
    
    // For notification images, we need DIRECT image URLs (not web page URLs)
    // Expo Push API requires actual image file URLs (.jpg, .png, etc.)
    // So we'll use the direct Supabase storage URL for the image
    let imageUrl = null;
    
    // Determine media type and get direct image URL
    if (postData.file && typeof postData.file === 'string') {
      const isImage = postData.file.includes('postImage');
      const isVideo = postData.file.includes('postVideo');
      const isYouTube = postData.file.includes('youtube.com') || postData.file.includes('youtu.be');
      
      if (isImage) {
        // Use direct Supabase storage URL for the image (required for notifications)
        // postData.file format: "postImage/1234567890.png" or "/postImage/1234567890.png"
        let filePath = postData.file;
        // Remove leading slash if present
        if (filePath.startsWith('/')) {
          filePath = filePath.substring(1);
        }
        // Construct full public URL - Format: https://...supabase.co/storage/v1/object/public/profileImage/postImage/xxx.png
        // This matches the publicly accessible format you confirmed
        imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${filePath}`;
        
        // Ensure URL is clean (no double slashes)
        imageUrl = imageUrl.replace(/([^:]\/)\/+/g, "$1");
        
        notificationPayload.image = imageUrl; // Direct image URL for notification
        notificationPayload.mediaType = 'image';
        
        console.log("🖼️ ===== IMAGE PROCESSING =====");
        console.log("🖼️ Post image detected");
        console.log("📁 Original file path:", postData.file);
        console.log("📁 Cleaned file path:", filePath);
        console.log("🖼️ Final image URL:", imageUrl);
        console.log("🔗 Post web URL:", postWebUrl);
        console.log("✅ Image URL format matches your public URLs");
        
        // Verify URL format matches your working examples
        const expectedFormat = /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/profileImage\/postImage\/.*\.(png|jpg|jpeg)$/i;
        if (expectedFormat.test(imageUrl)) {
          console.log("✅ Image URL format is correct and matches public access pattern");
        } else {
          console.warn("⚠️ Image URL format might not match expected pattern");
        }
      } else if (isVideo) {
        // For videos, use video URL (some platforms show first frame)
        const videoUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${postData.file}`;
        imageUrl = videoUrl; // Use video URL as image
        notificationPayload.image = imageUrl;
        notificationPayload.video = videoUrl;
        notificationPayload.mediaType = 'video';
        console.log("🎥 Post video detected");
        console.log("🎥 Video URL:", videoUrl);
        console.log("🔗 Post web URL:", postWebUrl);
      } else if (isYouTube) {
        // Handle YouTube videos - extract thumbnail (direct image URL)
        try {
          const { extractYouTubeID, getYouTubeThumbnail } = require('../helpers/youtubeHelper');
          const youtubeId = extractYouTubeID(postData.file);
          if (youtubeId) {
            imageUrl = getYouTubeThumbnail(youtubeId, 'high');
            notificationPayload.image = imageUrl; // YouTube thumbnail is a direct image URL
            notificationPayload.video = postData.file;
            notificationPayload.mediaType = 'video';
            console.log("📺 YouTube video detected");
            console.log("🖼️ YouTube thumbnail URL:", imageUrl);
            console.log("🔗 Post web URL:", postWebUrl);
          } else {
            console.log("⚠️ Could not extract YouTube ID");
          }
        } catch (error) {
          console.error("❌ Error processing YouTube video:", error);
        }
      } else {
        notificationPayload.mediaType = null;
        console.log("ℹ️ Post has file but type unknown");
      }
    } else {
      notificationPayload.mediaType = null;
      console.log("ℹ️ Post has no file attached");
    }
    
    // Log final image URL being used
    if (imageUrl) {
      console.log("✅ Using direct image URL for notification:", imageUrl);
    } else {
      console.log("⚠️ No image URL available for notification");
    }

    // Option 1: Call Supabase Edge Function (Recommended)
    console.log("📤 ===== SENDING TO EDGE FUNCTION =====");
    console.log("📤 Full notification payload:", JSON.stringify(notificationPayload, null, 2));
    console.log("📤 Image URL in payload:", notificationPayload.image || "❌ NONE - IMAGE MISSING!");
    console.log("📤 Body text in payload:", notificationPayload.body);
    console.log("📤 Body ends with 'Read more'?", notificationPayload.body?.endsWith('Read more'));
    console.log("📤 Body length:", notificationPayload.body?.length || 0);
    console.log("📤 Target: all_users");
    
    // Final verification
    if (!notificationPayload.image) {
      console.error("❌ CRITICAL ERROR: Image URL is missing from notification payload!");
    }
    if (!notificationPayload.body?.endsWith('Read more')) {
      console.error("❌ CRITICAL ERROR: 'Read more' is missing from notification body!");
      console.error("❌ Body text:", notificationPayload.body);
    }
    
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          notification: notificationPayload,
          target: 'all_users', // Send to all users
        },
      }
    );

    if (edgeFunctionError) {
      console.error('❌ Edge Function error:', edgeFunctionError);
      console.error('Error details:', JSON.stringify(edgeFunctionError, null, 2));
      
      return { 
        success: false, 
        msg: 'Failed to send push notification',
        error: edgeFunctionError.message || JSON.stringify(edgeFunctionError)
      };
    }

    console.log("✅ Edge Function response:", edgeFunctionData);
    return { 
      success: true, 
      msg: 'Push notification sent successfully',
      data: edgeFunctionData 
    };

    /* 
    // Option 2: Direct API call (Alternative approach)
    // Uncomment and configure if you're using a separate notification service
    
    const API_URL = 'YOUR_NOTIFICATION_API_URL'; // Replace with your API URL
    
    try {
      const response = await fetch(`${API_URL}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOUR_API_KEY}`, // If needed
        },
        body: JSON.stringify({
          notification: notificationPayload,
          target: 'all_users',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, msg: 'Push notification sent successfully', data: result };
    } catch (apiError) {
      console.error('API call error:', apiError);
      return { success: false, msg: 'Failed to send push notification', error: apiError.message };
    }
    */

  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, msg: 'Failed to send push notification', error: error.message };
  }
};

/**
 * Send push notification to specific users
 * @param {Array<string>} userIds - Array of user IDs to send notification to
 * @param {Object} notificationPayload - Notification data
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const sendPushNotificationToUsers = async (userIds, notificationPayload) => {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return { success: false, msg: 'User IDs array is required' };
    }

    const { data, error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          notification: notificationPayload,
          target: 'specific_users',
          userIds: userIds,
        },
      }
    );

    if (error) {
      console.error('Error sending push notification to users:', error);
      return { success: false, msg: 'Failed to send push notification', error: error.message };
    }

    return { success: true, msg: 'Push notification sent successfully', data };
  } catch (error) {
    console.error('Error sending push notification to users:', error);
    return { success: false, msg: 'Failed to send push notification', error: error.message };
  }
};

