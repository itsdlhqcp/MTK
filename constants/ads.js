// Ad Unit IDs Configuration
// Replace these with your real ad unit IDs from AdMob console

// Test Ad Unit IDs (for development)
export const TEST_AD_UNIT_IDS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111', // Google's test banner ad unit
};

// Production Ad Unit IDs
// TODO: Replace these with your real ad unit IDs from AdMob console
// Go to: https://apps.admob.com → Your App → Ad units → Create new ad unit
export const PRODUCTION_AD_UNIT_IDS = {
  BANNER: 'ca-app-pub-7806969239829181/6300978111', // Replace XXXXX with your real banner ad unit ID
};

// Get the appropriate ad unit ID based on environment
export const getBannerAdUnitId = () => {
  if (__DEV__) {
    return TEST_AD_UNIT_IDS.BANNER;
  }
  return PRODUCTION_AD_UNIT_IDS.BANNER;
};

