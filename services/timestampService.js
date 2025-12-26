import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_POST_TIMESTAMP_KEY = 'last_seen_post_timestamp';

/**
 * Store the timestamp of the newest post the user has seen
 * @param {string} timestamp - ISO timestamp string
 */
export const storeLastSeenPostTimestamp = async (timestamp) => {
  try {
    await AsyncStorage.setItem(LAST_SEEN_POST_TIMESTAMP_KEY, timestamp);
    return { success: true };
  } catch (error) {
    console.error('Error storing last seen post timestamp:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get the timestamp of the newest post the user has seen
 * @returns {Promise<{success: boolean, timestamp: string|null}>}
 */
export const getLastSeenPostTimestamp = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SEEN_POST_TIMESTAMP_KEY);
    return { success: true, timestamp: timestamp || null };
  } catch (error) {
    console.error('Error getting last seen post timestamp:', error);
    return { success: false, timestamp: null, error: error.message };
  }
};

/**
 * Clear the stored timestamp (useful for logout or reset)
 */
export const clearLastSeenPostTimestamp = async () => {
  try {
    await AsyncStorage.removeItem(LAST_SEEN_POST_TIMESTAMP_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing last seen post timestamp:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update the timestamp if the new timestamp is more recent
 * @param {string} newTimestamp - ISO timestamp string
 */
export const updateLastSeenPostTimestamp = async (newTimestamp) => {
  try {
    const current = await getLastSeenPostTimestamp();
    
    // If no timestamp exists or new one is more recent, update it
    if (!current.timestamp || new Date(newTimestamp) > new Date(current.timestamp)) {
      await storeLastSeenPostTimestamp(newTimestamp);
      return { success: true, updated: true };
    }
    
    return { success: true, updated: false };
  } catch (error) {
    console.error('Error updating last seen post timestamp:', error);
    return { success: false, error: error.message };
  }
};
