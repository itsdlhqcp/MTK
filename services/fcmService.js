import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

// Configure notification handler to support images
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 Notification handler called:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      hasImage: !!notification.request.content.image,
      imageUrl: notification.request.content.image,
      data: notification.request.content.data,
    });
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // Expo will automatically display images if image field is present
      // The image field should be at notification.request.content.image
    };
  },
});

/**
 * Request notification permissions from the user
 * @returns {Promise<{success: boolean, status: string, token?: string}>}
 */
export const requestNotificationPermissions = async () => {
  try {
    console.log('📱 Checking device type...');
    if (!Device.isDevice) {
      console.warn('⚠️ Must use physical device for Push Notifications');
      return { success: false, status: 'Must use physical device' };
    }

    console.log('🔐 Checking existing notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('📝 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 Permission request result:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.warn('❌ Permission not granted. Status:', finalStatus);
      return { success: false, status: finalStatus };
    }

    console.log('✅ Permissions granted, getting Expo push token...');
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('🔑 Project ID:', projectId || 'NOT FOUND');
    
    if (!projectId) {
      console.error('❌ EAS Project ID not found in app.json');
      return { success: false, status: 'error', error: 'EAS Project ID not configured' };
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    if (!tokenData?.data) {
      console.error('❌ No token data received from Expo');
      return { success: false, status: 'error', error: 'No token received' };
    }

    console.log('🎫 Successfully obtained Expo push token');
    return { 
      success: true, 
      status: finalStatus, 
      token: tokenData.data 
    };
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    console.error('Error details:', error.message, error.stack);
    return { success: false, status: 'error', error: error.message };
  }
};

/**
 * Register FCM token with the backend
 * @param {string} userId - User ID
 * @param {string} expoPushToken - Expo push token
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const registerFCMToken = async (userId, expoPushToken) => {
  try {
    if (!userId || !expoPushToken) {
      return { success: false, msg: 'User ID and token are required' };
    }

    // Get device info
    const deviceId = Device.modelName || 'unknown';
    const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    // Check if token already exists
    const { data: existingToken, error: checkError } = await supabase
      .from('user_fcm_tokens')
      .select('id, user_id')
      .eq('fcm_token', expoPushToken)
      .single();

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('user_fcm_tokens')
        .update({
          user_id: userId,
          device_id: deviceId,
          device_type: deviceType,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingToken.id);

      if (updateError) {
        console.error('Error updating FCM token:', updateError);
        return { success: false, msg: 'Failed to update FCM token' };
      }

      return { success: true, msg: 'FCM token updated successfully' };
    } else {
      // Insert new token
      const { error: insertError } = await supabase
        .from('user_fcm_tokens')
        .insert({
          user_id: userId,
          fcm_token: expoPushToken,
          device_id: deviceId,
          device_type: deviceType,
          is_active: true,
        });

      if (insertError) {
        // If unique constraint violation, try to update
        if (insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('user_fcm_tokens')
            .update({
              user_id: userId,
              device_id: deviceId,
              device_type: deviceType,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('fcm_token', expoPushToken);

          if (updateError) {
            console.error('Error updating FCM token after conflict:', updateError);
            return { success: false, msg: 'Failed to register FCM token' };
          }
          return { success: true, msg: 'FCM token registered successfully' };
        }

        console.error('Error inserting FCM token:', insertError);
        return { success: false, msg: 'Failed to register FCM token' };
      }

      return { success: true, msg: 'FCM token registered successfully' };
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return { success: false, msg: 'Failed to register FCM token', error: error.message };
  }
};

/**
 * Remove FCM token (on logout or when user disables notifications)
 * @param {string} userId - User ID
 * @param {string} expoPushToken - Expo push token (optional, if not provided, removes all user tokens)
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const removeFCMToken = async (userId, expoPushToken = null) => {
  try {
    if (!userId) {
      return { success: false, msg: 'User ID is required' };
    }

    let query = supabase
      .from('user_fcm_tokens')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (expoPushToken) {
      query = query.eq('fcm_token', expoPushToken);
    }

    const { error } = await query;

    if (error) {
      console.error('Error removing FCM token:', error);
      return { success: false, msg: 'Failed to remove FCM token' };
    }

    return { success: true, msg: 'FCM token removed successfully' };
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return { success: false, msg: 'Failed to remove FCM token', error: error.message };
  }
};

/**
 * Initialize FCM for a user (request permissions and register token)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, token?: string, msg?: string}>}
 */
export const initializeFCM = async (userId) => {
  try {
    console.log("🔐 Initializing FCM for user:", userId);
    
    // Request permissions
    const permissionResult = await requestNotificationPermissions();
    console.log("📱 Permission result:", permissionResult);
    
    if (!permissionResult.success) {
      console.warn("⚠️ Permission not granted:", permissionResult.status);
      return permissionResult;
    }

    if (!permissionResult.token) {
      console.error("❌ No token received from permission request");
      return { success: false, msg: 'No push token received' };
    }

    console.log("🎫 Got Expo push token:", permissionResult.token.substring(0, 30) + "...");

    // Register token
    const registerResult = await registerFCMToken(userId, permissionResult.token);
    console.log("💾 Token registration result:", registerResult);
    
    if (!registerResult.success) {
      console.error("❌ Failed to register token:", registerResult.msg);
      return registerResult;
    }

    console.log("✅ FCM initialized successfully for user:", userId);
    return { 
      success: true, 
      token: permissionResult.token,
      msg: 'FCM initialized successfully' 
    };
  } catch (error) {
    console.error('❌ Error initializing FCM:', error);
    return { success: false, msg: 'Failed to initialize FCM', error: error.message };
  }
};

/**
 * Get the current Expo push token
 * @returns {Promise<string|null>}
 */
export const getExpoPushToken = async () => {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
};

