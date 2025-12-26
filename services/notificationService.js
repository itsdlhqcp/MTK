import { supabase } from "../lib/supabase";
import { sendPushNotificationToUsers } from "./pushNotificationService";
import { supabaseUrl } from "../constants";

/**
 * Create notification and send FCM push notification
 * @param {Object} notification - Notification object with senderId, receiverId, title, and data
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const createNotifications = async (notification) => {
    try{
        // Insert notification into database
        const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

        if (error){
            console.log('createNotifications error: ', error);
            return { success: false, msg: 'Could not create notifications' };
        }

        // Send FCM push notification to the receiver
        try {
            await sendFCMPushNotification(notification);
        } catch (pushError) {
            // Log error but don't fail the notification creation
            console.error('Error sending FCM push notification:', pushError);
        }

        return { success: true, data };
    }catch(error){
        console.log('createNotifications error: ', error);
        return { success: false, msg: 'Could not create notifications' };
    }
}

/**
 * Format notification body text (strip HTML, decode entities, add "Read more")
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
const formatNotificationBody = (text) => {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    let formatted = text;
    
    // Step 1: Decode HTML entities
    formatted = formatted
        .replace(/&nbsp;/g, ' ')
        .replace(/&#160;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, '...')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™');
    
    // Step 2: Replace block elements with spaces
    formatted = formatted
        .replace(/<\/p>/gi, ' ')
        .replace(/<\/div>/gi, ' ')
        .replace(/<\/h[1-6]>/gi, ' ')
        .replace(/<\/li>/gi, ' ')
        .replace(/<\/tr>/gi, ' ')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/\n/g, ' ');
    
    // Step 3: Remove all HTML tags
    formatted = formatted.replace(/<[^>]*>/g, '');
    
    // Step 4: Normalize whitespace
    formatted = formatted
        .replace(/\s+/g, ' ')
        .replace(/\s*\.\s*/g, '. ')
        .replace(/\s*,\s*/g, ', ')
        .trim();
    
    // Step 5: Replace "..." with "Read more" and ensure it ends with "Read more"
    formatted = formatted.replace(/\.\.\./g, ' Read more');
    if (formatted && !formatted.endsWith('Read more')) {
        formatted = formatted + ' Read more';
    }
    
    return formatted || '';
};

/**
 * Get image URL for notification based on type
 * @param {string} title - Notification title
 * @param {Object} notificationData - Parsed notification data
 * @returns {Promise<string|null>} Image URL or null
 */
const getNotificationImage = async (title, notificationData) => {
    try {
        
        // For reviews - get release/stream image
        if (title.includes('reviewed') || title.includes('replied to your review') || 
            title.includes('upvoted your review') || title.includes('downvoted your review')) {
            if (notificationData.releaseId) {
                const { data: releaseData } = await supabase
                    .from('releases')
                    .select('image, poster')
                    .eq('id', notificationData.releaseId)
                    .single();
                
                if (releaseData?.image) {
                    return `${supabaseUrl}/storage/v1/object/public/releases/${releaseData.image}`;
                } else if (releaseData?.poster) {
                    return `${supabaseUrl}/storage/v1/object/public/releases/${releaseData.poster}`;
                }
            } else if (notificationData.streamId) {
                const { data: streamData } = await supabase
                    .from('streams')
                    .select('image, poster')
                    .eq('id', notificationData.streamId)
                    .single();
                
                if (streamData?.image) {
                    return `${supabaseUrl}/storage/v1/object/public/streams/${streamData.image}`;
                } else if (streamData?.poster) {
                    return `${supabaseUrl}/storage/v1/object/public/streams/${streamData.poster}`;
                }
            }
        }
        
        // For comments on posts - get post image
        if (title.includes('commented on your post') && notificationData.postId) {
            const { data: postData } = await supabase
                .from('posts')
                .select('file, image')
                .eq('id', notificationData.postId)
                .single();
            
            if (postData?.file) {
                return `${supabaseUrl}/storage/v1/object/public/posts/${postData.file}`;
            } else if (postData?.image) {
                return `${supabaseUrl}/storage/v1/object/public/posts/${postData.image}`;
            }
        }
        
        // For comments on twists - get twist/post image
        if (title.includes('commented on your twist') && notificationData.postId) {
            const { data: twistData } = await supabase
                .from('posts')
                .select('file, image')
                .eq('id', notificationData.postId)
                .single();
            
            if (twistData?.file) {
                return `${supabaseUrl}/storage/v1/object/public/posts/${twistData.file}`;
            } else if (twistData?.image) {
                return `${supabaseUrl}/storage/v1/object/public/posts/${twistData.image}`;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching notification image:', error);
        return null;
    }
};

/**
 * Send FCM push notification for a notification
 * @param {Object} notification - Notification object
 */
const sendFCMPushNotification = async (notification) => {
    try {
        console.log('🔔 sendFCMPushNotification called for:', notification.title);
        
        // Get sender user info for notification title/body
        const { data: senderData, error: senderError } = await supabase
            .from('users')
            .select('id, name, image')
            .eq('id', notification.senderId)
            .single();

        if (senderError || !senderData) {
            console.error('Error fetching sender data for push notification:', senderError);
            return;
        }

        // Parse notification data to get context
        let notificationData = {};
        try {
            notificationData = notification.data ? JSON.parse(notification.data) : {};
        } catch (e) {
            console.error('Error parsing notification data:', e);
        }

        // Build notification title and body based on notification type
        const senderName = senderData.name || 'Someone';
        
        // Determine notification body based on title
        let notificationBody = '';
        let notificationTitle = senderName;
        
        if (notification.title.includes('commented on your post')) {
            notificationTitle = senderName;
            notificationBody = `${senderName} commented on your post Read more`;
        } else if (notification.title.includes('commented on your twist')) {
            notificationTitle = senderName;
            notificationBody = `${senderName} commented on your twist Read more`;
        } else if (notification.title.includes('reviewed on your release')) {
            notificationTitle = senderName;
            notificationBody = `${senderName} reviewed your release Read more`;
        } else if (notification.title.includes('replied to your review')) {
            notificationTitle = senderName;
            notificationBody = `${senderName} replied to your review Read more`;
        } else if (notification.title.includes('upvoted your review')) {
            notificationTitle = senderName;
            notificationBody = `${senderName} upvoted your review Read more`;
        } else if (notification.title.includes('downvoted your review')) {
            notificationTitle = senderName;
            notificationBody = `${senderName} downvoted your review Read more`;
        } else if (notification.title.includes('followed')) {
            notificationBody = `${senderName} started following you`;
        } else if (notification.title.includes('friend request')) {
            notificationBody = `${senderName} sent you a friend request`;
        } else {
            notificationBody = `${senderName} ${notification.title} Read more`;
        }

        // Get relevant image for the notification
        const notificationImage = await getNotificationImage(notification.title, notificationData);
        console.log('🖼️ Notification image URL:', notificationImage);

        // Build push notification payload
        const pushNotificationPayload = {
            type: 'notification',
            title: notificationTitle,
            body: notificationBody,
            image: notificationImage || senderData.image || null, // Use context image, fallback to sender image
            sound: 'notification',
            data: {
                screen: getScreenFromNotification(notification.title, notificationData),
                type: 'notification',
                ...notificationData,
            },
        };

        console.log('📤 Sending push notification payload:', {
            title: pushNotificationPayload.title,
            body: pushNotificationPayload.body,
            hasImage: !!pushNotificationPayload.image,
            screen: pushNotificationPayload.data.screen,
        });

        // Send push notification to specific user (receiver)
        await sendPushNotificationToUsers([notification.receiverId], pushNotificationPayload);
        
        console.log('✅ FCM push notification sent for notification:', notification.title);
    } catch (error) {
        console.error('Error in sendFCMPushNotification:', error);
        throw error;
    }
}

/**
 * Determine screen to navigate to based on notification type
 * @param {string} title - Notification title
 * @param {Object} data - Parsed notification data
 * @returns {string} Screen name
 */
const getScreenFromNotification = (title, data) => {
    if (title.includes('commented on your post')) {
        return 'postDetails'; // Navigate to post details
    } else if (title.includes('commented on your twist')) {
        return 'twistDetails'; // Navigate to twist details
    } else if (title.includes('reviewed on your release')) {
        if (data.releaseId) {
            return 'releaseDetails';
        } else if (data.streamId) {
            return 'streamDetails';
        }
        return 'feeds';
    } else if (title.includes('replied to your review')) {
        if (data.releaseId) {
            return 'releaseDetails';
        } else if (data.streamId) {
            return 'streamDetails';
        }
        return 'feeds';
    } else if (title.includes('upvoted your review') || title.includes('downvoted your review')) {
        if (data.releaseId) {
            return 'releaseDetails';
        } else if (data.streamId) {
            return 'streamDetails';
        }
        return 'feeds';
    } else if (title.includes('followed') || title.includes('friend request')) {
        return 'find';
    }
    return 'feeds';
}



export const fetchNotifications = async (receiverId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`*, sender: senderId(id, name, image)
          `,
        )
        .eq('receiverId', receiverId)
        .order("created_at", { ascending: false })
      if (error) {
        console.log('fetchNotifications error: ', error);
        return { success: false, msg: 'Could not fetch notifications' };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, msg: 'Could not fetch the notifications' };
    }
  };