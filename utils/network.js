// networkUtils.js
import NetInfo from '@react-native-community/netinfo';
import { UserStorageService } from '../Storage/UserStorageService';

export const NetworkUtils = {
  // Initialize network listener
  initNetworkListener: (setIsConnected) => {
    return NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsConnected(isConnected);
      UserStorageService.setConnectionStatus(isConnected);
    });
  },

  // Check if currently connected
  isConnected: async () => {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  }
};