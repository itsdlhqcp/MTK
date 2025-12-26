import { supabase } from '../lib/supabase';

/**
 * Subscribe to notifications for a specific release
 * @param {string} userId - User ID
 * @param {number} releaseId - Release ID (from releases or streams table)
 * @param {string} releaseType - 'theatre' or 'digital'
 * @returns {Promise<{success: boolean, msg?: string, data?: Object}>}
 */
export const subscribeToReleaseNotifications = async (userId, releaseId, releaseType) => {
  try {
    if (!userId || !releaseId || !releaseType) {
      return { success: false, msg: 'User ID, Release ID, and Release Type are required' };
    }

    if (releaseType !== 'theatre' && releaseType !== 'digital') {
      return { success: false, msg: 'Release type must be "theatre" or "digital"' };
    }

    // Check if subscription already exists
    const { data: existing, error: checkError } = await supabase
      .from('release_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('release_id', releaseId)
      .eq('release_type', releaseType)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error checking existing subscription:', checkError);
      return { success: false, msg: 'Failed to check subscription', error: checkError.message };
    }

    if (existing) {
      // Subscription exists, just activate it if it's inactive
      if (!existing.is_active) {
        const { data, error } = await supabase
          .from('release_notifications')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error activating subscription:', error);
          return { success: false, msg: 'Failed to activate subscription', error: error.message };
        }

        return { success: true, msg: 'Subscription activated', data };
      }

      return { success: true, msg: 'Already subscribed', data: existing };
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('release_notifications')
      .insert({
        user_id: userId,
        release_id: releaseId,
        release_type: releaseType,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return { success: false, msg: 'Failed to subscribe', error: error.message };
    }

    return { success: true, msg: 'Subscribed successfully', data };
  } catch (error) {
    console.error('Error in subscribeToReleaseNotifications:', error);
    return { success: false, msg: 'Failed to subscribe', error: error.message };
  }
};

/**
 * Unsubscribe from notifications for a specific release
 * @param {string} userId - User ID
 * @param {number} releaseId - Release ID (from releases or streams table)
 * @param {string} releaseType - 'theatre' or 'digital'
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const unsubscribeFromReleaseNotifications = async (userId, releaseId, releaseType) => {
  try {
    if (!userId || !releaseId || !releaseType) {
      return { success: false, msg: 'User ID, Release ID, and Release Type are required' };
    }

    // Deactivate subscription instead of deleting (soft delete)
    const { data, error } = await supabase
      .from('release_notifications')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('release_id', releaseId)
      .eq('release_type', releaseType)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return { success: false, msg: 'Subscription not found' };
      }
      console.error('Error unsubscribing:', error);
      return { success: false, msg: 'Failed to unsubscribe', error: error.message };
    }

    return { success: true, msg: 'Unsubscribed successfully', data };
  } catch (error) {
    console.error('Error in unsubscribeFromReleaseNotifications:', error);
    return { success: false, msg: 'Failed to unsubscribe', error: error.message };
  }
};

/**
 * Check if user is subscribed to a specific release
 * @param {string} userId - User ID
 * @param {number} releaseId - Release ID (from releases or streams table)
 * @param {string} releaseType - 'theatre' or 'digital'
 * @returns {Promise<{success: boolean, isSubscribed: boolean, data?: Object}>}
 */
export const checkSubscriptionStatus = async (userId, releaseId, releaseType) => {
  try {
    if (!userId || !releaseId || !releaseType) {
      return { success: false, isSubscribed: false, msg: 'User ID, Release ID, and Release Type are required' };
    }

    const { data, error } = await supabase
      .from('release_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('release_id', releaseId)
      .eq('release_type', releaseType)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        return { success: true, isSubscribed: false };
      }
      console.error('Error checking subscription:', error);
      return { success: false, isSubscribed: false, error: error.message };
    }

    return { success: true, isSubscribed: !!data && data.is_active, data };
  } catch (error) {
    console.error('Error in checkSubscriptionStatus:', error);
    return { success: false, isSubscribed: false, error: error.message };
  }
};

/**
 * Get all active subscriptions for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: Array}>}
 */
export const getUserSubscriptions = async (userId) => {
  try {
    if (!userId) {
      return { success: false, msg: 'User ID is required' };
    }

    const { data, error } = await supabase
      .from('release_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return { success: false, msg: 'Failed to fetch subscriptions', error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    return { success: false, msg: 'Failed to fetch subscriptions', error: error.message };
  }
};

/**
 * Get all users subscribed to a specific release
 * @param {number} releaseId - Release ID (from releases or streams table)
 * @param {string} releaseType - 'theatre' or 'digital'
 * @returns {Promise<{success: boolean, data?: Array<string>}>} - Returns array of user IDs
 */
export const getSubscribedUsers = async (releaseId, releaseType) => {
  try {
    if (!releaseId || !releaseType) {
      return { success: false, msg: 'Release ID and Release Type are required' };
    }

    const { data, error } = await supabase
      .from('release_notifications')
      .select('user_id')
      .eq('release_id', releaseId)
      .eq('release_type', releaseType)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching subscribed users:', error);
      return { success: false, msg: 'Failed to fetch subscribed users', error: error.message };
    }

    const userIds = (data || []).map(sub => sub.user_id);
    return { success: true, data: userIds };
  } catch (error) {
    console.error('Error in getSubscribedUsers:', error);
    return { success: false, msg: 'Failed to fetch subscribed users', error: error.message };
  }
};

