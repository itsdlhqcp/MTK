import * as SecureStore from 'expo-secure-store';

const USER_DATA_KEY = 'user_data';

/**
 * Service to securely store and retrieve user data
 * 
 * 
 */


export const UserStorageService = {
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
  }
};