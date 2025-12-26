import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { initializeFCM, removeFCMToken } from '../services/fcmService';

/**
 * Custom hook to handle push notifications
 * Sets up notification listeners and handles navigation
 */
export const useNotifications = () => {
  const router = useRouter();
  const { user } = useAuth();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const fcmInitialized = useRef(false);

  // Initialize FCM when user logs in
  useEffect(() => {
    console.log('🔔 useNotifications hook running, user:', user?.id ? `exists (${user.id})` : 'null');
    
    if (!user?.id) {
      console.log('⏸️ No user ID, skipping FCM initialization');
      fcmInitialized.current = false;
      return;
    }

    // Initialize FCM when user is logged in
    const setupNotifications = async () => {
      // Prevent multiple simultaneous initializations
      if (fcmInitialized.current) {
        console.log('ℹ️ FCM initialization already in progress, skipping');
        return;
      }

      try {
        console.log('🚀 Starting FCM initialization for user:', user.id);
        fcmInitialized.current = true;
        
        const result = await initializeFCM(user.id);
        
        if (result.success) {
          console.log('✅ FCM initialized successfully for user:', user.id);
        } else {
          console.error('❌ FCM initialization failed:', result.msg || result.error);
          fcmInitialized.current = false; // Allow retry on failure
        }
      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
        fcmInitialized.current = false; // Allow retry on failure
      }
    };

    // Small delay to ensure user state is fully set
    const timeoutId = setTimeout(() => {
      setupNotifications();
    }, 500);

    // Cleanup FCM token on logout
    return () => {
      clearTimeout(timeoutId);
      if (user?.id) {
        console.log('🧹 Cleaning up FCM token for user:', user.id);
        fcmInitialized.current = false;
        removeFCMToken(user.id).catch(err => {
          console.error('Error removing FCM token:', err);
        });
      }
    };
  }, [user?.id]);

  // Also initialize when app comes to foreground (in case it failed before)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && user?.id && !fcmInitialized.current) {
        console.log('📱 App came to foreground, retrying FCM initialization for user:', user.id);
        initializeFCM(user.id)
          .then(result => {
            if (result.success) {
              fcmInitialized.current = true;
              console.log('✅ FCM initialized on app foreground');
            }
          })
          .catch(err => {
            console.error('❌ Failed to initialize FCM on foreground:', err);
          });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  useEffect(() => {
    // Handle notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        // Check for image at root level (Expo format)
        hasImageAtRoot: !!notification.request.content.image,
        imageUrlAtRoot: notification.request.content.image,
        // Check for image in data field
        hasImageInData: !!notification.request.content.data?.image,
        imageUrlInData: notification.request.content.data?.image,
        mediaType: notification.request.content.data?.mediaType,
      });
      
      // Log full notification content for debugging
      console.log('📬 Full notification content:', JSON.stringify({
        title: notification.request.content.title,
        body: notification.request.content.body,
        image: notification.request.content.image,
        data: notification.request.content.data,
      }, null, 2));
      
      // You can show a custom in-app notification here if needed
    });

    // Handle notification taps (when user taps on notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', {
        title: response.notification.request.content.title,
        body: response.notification.request.content.body,
        data: response.notification.request.content.data,
        hasImage: !!response.notification.request.content.data?.image,
        mediaType: response.notification.request.content.data?.mediaType,
      });
      
      const data = response.notification.request.content.data;
      
      console.log('🧭 Navigating from notification tap, data:', data);
      
      // Navigate to Spotlight (feeds) tab when notification is tapped
      if (data?.screen === 'feeds' || data?.type === 'new_post') {
        console.log('🧭 Navigating to Spotlight tab (feeds)');
        router.push('/(main)/feeds');
        
        // If there's a specific postId, you can navigate to it later
        // For now, just navigate to the feeds tab
        if (data?.postId) {
          console.log('🧭 Post ID in notification:', data.postId);
          // The feeds page will show all posts, including this one
        }
      } else {
        // Default: navigate to feeds/spotlight tab
        console.log('🧭 Default navigation to Spotlight tab');
        router.push('/(main)/feeds');
      }
    });

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  return null; // This hook doesn't return anything, it just sets up listeners
};

