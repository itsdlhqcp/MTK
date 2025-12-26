import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

// Keys for different types of stored data
const USER_DATA_KEY = 'user_data';
const POSTS_CACHE_KEY = 'posts_cache';
const PROFILE_STATS_KEY = 'profile_stats';
const LAST_SYNC_KEY = 'last_sync_time';
const CONNECTION_STATUS_KEY = 'connection_status';
const SUGGESTIONS_CACHE_KEY = 'suggestions_cache';
const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}image_cache/`;

/**
 * Service to securely store and retrieve user data with offline support
 */
export const UserStorageService = {

  cacheProfileStats: async (stats) => {
    try {
      if (!stats) return false;
      
      const cacheData = {
        timestamp: Date.now(),
        data: stats
      };
      
      // 1. Cache the stats directly
      await SecureStore.setItemAsync(PROFILE_STATS_KEY, JSON.stringify(cacheData));
      
      // 2. Update user data with these stats
      const userData = await UserStorageService.getUserData();
      if (userData) {
        userData.profileStats = cacheData;
        await UserStorageService.storeUserData(userData);
      }
      
      return true;
    } catch (error) {
      console.error('Error caching profile stats:', error);
      return false;
    }
  },
  /**
   * Stores user data securely
   * @param {Object} userData - The user data to store
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  storeUserData: async (userData) => {
    try {
      if (!userData) return false;
      
      // Convert userData object to string for storage
      const userDataString = JSON.stringify(userData);
      await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  },

  /**
   * Retrieves user data from secure storage
   * @returns {Promise<Object|null>} - The user data or null if not found
   */
  getUserData: async () => {
    try {
      const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (!userDataString) return null;
      return JSON.parse(userDataString);
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  },

  /**
   * Clears stored user data
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  clearUserData: async () => {
    try {
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  },
  
  /**
   * Updates specific fields in user data
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  updateUserData: async (updates) => {
    try {
      // Get current data
      const currentData = await UserStorageService.getUserData();
      if (!currentData) return false;
      
      // Merge with updates
      const updatedData = { ...currentData, ...updates };
      
      // Store updated data
      return await UserStorageService.storeUserData(updatedData);
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  },

  /**
   * Cache posts for offline viewing
   * @param {Array} posts - Array of post objects to cache
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  cachePosts: async (posts) => {
    try {
      if (!posts || !Array.isArray(posts)) return false;
      
      // Store posts with timestamp
      const cacheData = {
        timestamp: Date.now(),
        data: posts
      };
      
      await SecureStore.setItemAsync(POSTS_CACHE_KEY, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Error caching posts:', error);
      return false;
    }
  },

  /**
   * Get cached posts
   * @returns {Promise<Array>} - Array of cached posts or empty array if none found
   */
  getCachedPosts: async () => {
    try {
      const postsString = await SecureStore.getItemAsync(POSTS_CACHE_KEY);
      if (!postsString) return [];
      
      const postsData = JSON.parse(postsString);
      return postsData.data || [];
    } catch (error) {
      console.error('Error getting cached posts:', error);
      return [];
    }
  },

  /**
   * Get cached posts with metadata
   * @returns {Promise<Object>} - Object containing posts data and timestamp
   */
  getCachedPostsWithMetadata: async () => {
    try {
      const postsString = await SecureStore.getItemAsync(POSTS_CACHE_KEY);
      if (!postsString) return { timestamp: null, data: [] };
      
      return JSON.parse(postsString);
    } catch (error) {
      console.error('Error getting cached posts with metadata:', error);
      return { timestamp: null, data: [] };
    }
  },

  /**
   * Cache profile stats
   * @param {Object} stats - Profile statistics object
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  cacheProfileStats: async (stats) => {
    try {
      if (!stats) return false;
      
      const cacheData = {
        timestamp: Date.now(),
        data: stats
      };
      
      await SecureStore.setItemAsync(PROFILE_STATS_KEY, JSON.stringify(cacheData));
      
      // Also update user data with these stats
      const userData = await UserStorageService.getUserData();
      if (userData) {
        userData.profileStats = cacheData;
        await UserStorageService.storeUserData(userData);
      }
      
      return true;
    } catch (error) {
      console.error('Error caching profile stats:', error);
      return false;
    }
  },

  /**
   * Get cached profile stats
   * @returns {Promise<Object|null>} - Cached profile stats or null if not found
   */
  getCachedProfileStats: async () => {
    try {
      const statsString = await SecureStore.getItemAsync(PROFILE_STATS_KEY);
      if (!statsString) return null;
      
      return JSON.parse(statsString);
    } catch (error) {
      console.error('Error getting cached profile stats:', error);
      return null;
    }
  },

  /**
   * Set the timestamp of the last successful data sync
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  setLastSyncTime: async () => {
    try {
      const timestamp = Date.now().toString();
      await SecureStore.setItemAsync(LAST_SYNC_KEY, timestamp);
      return true;
    } catch (error) {
      console.error('Error setting last sync time:', error);
      return false;
    }
  },

  /**
   * Get the timestamp of the last successful data sync
   * @returns {Promise<number|null>} - Timestamp or null if not found
   */
  getLastSyncTime: async () => {
    try {
      const timestamp = await SecureStore.getItemAsync(LAST_SYNC_KEY);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  },

  /**
   * Set the current connection status
   * @param {boolean} isOnline - Whether the device is online
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  setConnectionStatus: async (isOnline) => {
    try {
      await SecureStore.setItemAsync(CONNECTION_STATUS_KEY, isOnline ? 'online' : 'offline');
      return true;
    } catch (error) {
      console.error('Error setting connection status:', error);
      return false;
    }
  },

  /**
   * Get the last known connection status
   * @returns {Promise<boolean|null>} - Connection status or null if not found
   */
  getConnectionStatus: async () => {
    try {
      const status = await SecureStore.getItemAsync(CONNECTION_STATUS_KEY);
      return status === 'online';
    } catch (error) {
      console.error('Error getting connection status:', error);
      return null;
    }
  },

  /**
   * Initialize image cache directory
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  initImageCache: async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
      }
      return true;
    } catch (error) {
      console.error('Error initializing image cache directory:', error);
      return false;
    }
  },

  /**
   * Cache an image locally (for avatars and important images)
   * @param {string} uri - Remote URI of the image
   * @param {string} identifier - Unique identifier for the image
   * @returns {Promise<string|null>} - Local URI of the cached image or null if failed
   */
  // cacheImage: async (uri, identifier) => {
  //   try {
  //     if (!uri || !identifier) return null;
      
  //     // Ensure cache directory exists
  //     await UserStorageService.initImageCache();
      
  //     // Generate a file path
  //     const fileExtension = uri.split('.').pop() || 'jpg';
  //     const localUri = `${IMAGE_CACHE_DIR}${identifier}.${fileExtension}`;
      
  //     // Check if already cached
  //     const fileInfo = await FileSystem.getInfoAsync(localUri);
  //     if (fileInfo.exists) {
  //       return localUri;
  //     }
      
  //     // Download and save
  //     const downloadResult = await FileSystem.downloadAsync(uri, localUri);
  //     if (downloadResult.status === 200) {
  //       return localUri;
  //     }
      
  //     return null;
  //   } catch (error) {
  //     console.error('Error caching image:', error);
  //     return null;
  //   }
  // },

  cacheImage: async (uri, identifier) => {
    try {
      if (!uri || typeof uri !== 'string' || !uri.startsWith('http') || !identifier) {
        console.warn('Invalid image URI or identifier:', { uri, identifier });
        return null;
      }
  
      await UserStorageService.initImageCache();
  
      const fileExtension = uri.split('.').pop() || 'jpg';
      const localUri = `${IMAGE_CACHE_DIR}${identifier}.${fileExtension}`;
  
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        return localUri;
      }
  
      const downloadResult = await FileSystem.downloadAsync(uri, localUri);
      if (downloadResult.status === 200) {
        return localUri;
      }
  
      return null;
    } catch (error) {
      console.error('Error caching image:', error);
      return null;
    }
  },
  
  /**
   * Get a cached image
   * @param {string} identifier - Unique identifier for the image
   * @returns {Promise<string|null>} - Local URI of the cached image or null if not found
   */
  getCachedImage: async (identifier) => {
    try {
      if (!identifier) return null;
      
      // Check multiple possible extensions
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      for (const ext of extensions) {
        const localUri = `${IMAGE_CACHE_DIR}${identifier}.${ext}`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        
        if (fileInfo.exists) {
          return localUri;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  },

  /**
   * Clear the image cache
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  clearImageCache: async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(IMAGE_CACHE_DIR);
        await UserStorageService.initImageCache();
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing image cache:', error);
      return false;
    }
  },

  /**
   * Cache user suggestions
   * @param {Array} suggestions - Array of suggested user objects
   * @param {Object} followingStates - Object mapping user IDs to their friendship status
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  cacheSuggestions: async (suggestions, followingStates = {}) => {
    try {
      if (!suggestions || !Array.isArray(suggestions)) return false;
      
      const cacheData = {
        timestamp: Date.now(),
        data: suggestions,
        followingStates: followingStates || {}
      };
      
      await SecureStore.setItemAsync(SUGGESTIONS_CACHE_KEY, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Error caching suggestions:', error);
      return false;
    }
  },

  /**
   * Get cached suggestions
   * @returns {Promise<Object|null>} - Cached suggestions with metadata or null if not found
   */
  getCachedSuggestions: async () => {
    try {
      const suggestionsString = await SecureStore.getItemAsync(SUGGESTIONS_CACHE_KEY);
      if (!suggestionsString) return null;
      
      return JSON.parse(suggestionsString);
    } catch (error) {
      console.error('Error getting cached suggestions:', error);
      return null;
    }
  },

  /**
   * Clear cached suggestions
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  clearCachedSuggestions: async () => {
    try {
      await SecureStore.deleteItemAsync(SUGGESTIONS_CACHE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing cached suggestions:', error);
      return false;
    }
  },

  /**
   * Get storage info about cached data
   * @returns {Promise<Object>} - Storage info
   */
  getStorageInfo: async () => {
    try {
      const cacheSize = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR)
        .then(info => info.exists ? info.size : 0)
        .catch(() => 0);
      
      const lastSync = await UserStorageService.getLastSyncTime();
      
      return {
        imageCacheSize: cacheSize,
        lastSync,
        hasUserData: !!(await UserStorageService.getUserData()),
        hasCachedPosts: !!(await UserStorageService.getCachedPosts()).length,
        hasCachedStats: !!(await UserStorageService.getCachedProfileStats())
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        imageCacheSize: 0,
        lastSync: null,
        hasUserData: false,
        hasCachedPosts: false,
        hasCachedStats: false
      };
    }
  }
};


// import * as SecureStore from 'expo-secure-store';

// const USER_DATA_KEY = 'user_data';

// /**
//  * Service to securely store and retrieve user data
//  */

// export const UserStorageService = {
//   /**
//    * Stores user data securely
//    * @param {Object} userData - The user data to store
//    * @returns {Promise<boolean>} - Whether the operation was successful
//    */
//   storeUserData: async (userData) => {
//     try {
//       if (!userData) return false;
      
//       // Convert userData object to string for storage
//       const userDataString = JSON.stringify(userData);
//       await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
//       //console.log("User data stored successfully:", userData);
//       return true;
//     } catch (error) {
//       console.error('Error storing user data:', error);
//       return false;
//     }
//   },

//   /**
//    * Retrieves user data from secure storage
//    * @returns {Promise<Object|null>} - The user data or null if not found
//    */
//   getUserData: async () => {
//     try {
//       const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
//       if (!userDataString) return null;
//       console.log("Retrieved user data:", JSON.parse(userDataString));
//       return JSON.parse(userDataString);
//     } catch (error) {
//       console.error('Error retrieving user data:', error);
//       return null;
//     }
//   },

//   /**
//    * Clears stored user data
//    * @returns {Promise<boolean>} - Whether the operation was successful
//    */
//   clearUserData: async () => {
//     try {
//       await SecureStore.deleteItemAsync(USER_DATA_KEY);
//       return true;
//     } catch (error) {
//       console.error('Error clearing user data:', error);
//       return false;
//     }
//   },
  
//   /**
//    * Updates specific fields in user data
//    * @param {Object} updates - Object containing fields to update
//    * @returns {Promise<boolean>} - Whether the operation was successful
//    */
//   updateUserData: async (updates) => {
//     try {
//       // Get current data
//       const currentData = await UserStorageService.getUserData();
//       if (!currentData) return false;
      
//       // Merge with updates
//       const updatedData = { ...currentData, ...updates };
      
//       // Store updated data
//       return await UserStorageService.storeUserData(updatedData);
//     } catch (error) {
//       console.error('Error updating user data:', error);
//       return false;
//     }
//   }
// };