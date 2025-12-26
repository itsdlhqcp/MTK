import { Audio } from 'expo-av';

let bellSound = null;
let bellSoundUnmute = null;
let reviewSound = null;
let isInitialized = false;

/**
 * Initialize and load bell sound files
 */
export const initializeBellSounds = async () => {
  if (isInitialized && bellSound && bellSoundUnmute) {
    return { success: true };
  }

  try {
    // Set audio mode to allow playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load bell sound for activation (subscribe)
    if (!bellSound) {
      bellSound = new Audio.Sound();
      await bellSound.loadAsync(require('../assets/sounds/notification.mp3'));
    }

    // For deactivation, we can use the same sound or a different one
    // Using the same sound for now - can be changed later
    if (!bellSoundUnmute) {
      bellSoundUnmute = new Audio.Sound();
      await bellSoundUnmute.loadAsync(require('../assets/sounds/notification.mp3'));
    }

    isInitialized = true;
    return { success: true };
  } catch (error) {
    console.error('Error initializing bell sounds:', error);
    isInitialized = false;
    return { success: false, error };
  }
};

/**
 * Initialize and load review sound file
 */
export const initializeReviewSound = async () => {
  if (reviewSound) {
    return { success: true };
  }

  try {
    // Set audio mode to allow playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load review sound
    if (!reviewSound) {
      reviewSound = new Audio.Sound();
      await reviewSound.loadAsync(require('../assets/sounds/review.mp3'));
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing review sound:', error);
    return { success: false, error };
  }
};

/**
 * Play bell sound when activating (subscribing)
 */
export const playBellActivateSound = async () => {
  try {
    if (!bellSound) {
      await initializeBellSounds();
    }

    // Stop any currently playing sound
    if (bellSound) {
      await bellSound.stopAsync();
      await bellSound.setPositionAsync(0);
    }

    // Play the sound
    if (bellSound) {
      await bellSound.setVolumeAsync(0.15); // 15% volume
      await bellSound.playAsync();
    }
  } catch (error) {
    console.error('Error playing bell activate sound:', error);
    // Fail silently - don't break the UI if sound fails
  }
};

/**
 * Play bell sound when deactivating (unsubscribing)
 */
export const playBellDeactivateSound = async () => {
  try {
    if (!bellSoundUnmute) {
      await initializeBellSounds();
    }

    // Stop any currently playing sound
    if (bellSoundUnmute) {
      await bellSoundUnmute.stopAsync();
      await bellSoundUnmute.setPositionAsync(0);
    }

    // Play the sound (slightly lower volume for deactivation)
    if (bellSoundUnmute) {
      await bellSoundUnmute.setVolumeAsync(0.12); // 12% volume for deactivation
      await bellSoundUnmute.playAsync();
    }
  } catch (error) {
    console.error('Error playing bell deactivate sound:', error);
    // Fail silently - don't break the UI if sound fails
  }
};

/**
 * Play review sound when review is submitted
 */
export const playReviewSound = async () => {
  try {
    if (!reviewSound) {
      await initializeReviewSound();
    }

    // Stop any currently playing sound
    if (reviewSound) {
      await reviewSound.stopAsync();
      await reviewSound.setPositionAsync(0);
    }

    // Play the sound
    if (reviewSound) {
      await reviewSound.setVolumeAsync(0.18); // 18% volume
      await reviewSound.playAsync();
    }
  } catch (error) {
    console.error('Error playing review sound:', error);
    // Fail silently - don't break the UI if sound fails
  }
};

/**
 * Cleanup sounds when done
 */
export const cleanupBellSounds = async () => {
  try {
    if (bellSound) {
      await bellSound.unloadAsync();
      bellSound = null;
    }
    if (bellSoundUnmute) {
      await bellSoundUnmute.unloadAsync();
      bellSoundUnmute = null;
    }
    if (reviewSound) {
      await reviewSound.unloadAsync();
      reviewSound = null;
    }
    isInitialized = false;
  } catch (error) {
    console.error('Error cleaning up bell sounds:', error);
  }
};

