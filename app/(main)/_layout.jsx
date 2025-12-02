global.Buffer = global.Buffer || require('buffer').Buffer;
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { HapticTab } from '@/components/NavTabMain/HapticTab.tsx';
import { IconSymbol } from '@/components/NavTabMain/ui/IconSymbol.tsx';
import Icon from '@/assets/icons' 
import TabBarBackground from '@/components/NavTabMain/ui/TabBarBackground.tsx';
import { useColorScheme } from '../../hooks/useColorScheme.ts';
import Avatar from '@/components/Avatar'; 
import { useAuth } from '../../contexts/AuthContext';
import { hp } from '../../helpers/common.js';
import theme from '../../constants/theme.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, navigationGuard } = useAuth();
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarCacheTime, setAvatarCacheTime] = useState(null);
  const pathname = usePathname();
  
  // Cache timeout in milliseconds
  const AVATAR_CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  // Tab routes in order (excluding hidden home tab)
  const tabRoutes = ['feeds', 'upcoming', 'profile'];
  const allTabRoutes = ['home', 'feeds', 'upcoming', 'profile']; // Keep for internal reference
  
  // Get current tab index (for visible tabs only)
  const getCurrentTabIndex = () => {
    const currentRoute = pathname.split('/')[1] || 'feeds';
    // If on home, map to feeds (first visible tab)
    const route = currentRoute === 'home' ? 'feeds' : currentRoute;
    return tabRoutes.indexOf(route);
  };

  // Load and cache avatar image
  useEffect(() => {
    const loadCachedAvatar = async () => {
      try {
        // Try to load cached avatar data
        const cachedAvatarData = await AsyncStorage.getItem('userAvatarCache');
        
        if (cachedAvatarData) {
          const { uri, timestamp } = JSON.parse(cachedAvatarData);
          const now = Date.now();
          const cacheAge = now - timestamp;
          
          // Use cached avatar if it's not expired
          if (cacheAge < AVATAR_CACHE_TIMEOUT) {
            setAvatarUri(uri);
            setAvatarCacheTime(timestamp);
            return;
          }
        }
        
        // If we reach here, either cache is expired or doesn't exist
        // Only update cache if user has an image
        if (user?.image) {
          const timestamp = Date.now();
          setAvatarUri(user.image);
          setAvatarCacheTime(timestamp);
          
          // Save to cache
          await AsyncStorage.setItem('userAvatarCache', JSON.stringify({
            uri: user.image,
            timestamp
          }));
        }
      } catch (error) {
        console.error('Error loading cached avatar:', error);
        // Fallback to user image if cache fails
        setAvatarUri(user?.image);
      }
    };
    
    loadCachedAvatar();
  }, [user?.image]);

  // Update cache when user image changes
  useEffect(() => {
    const updateAvatarCache = async () => {
      // Only update if user image exists and is different from cached one
      if (user?.image && user.image !== avatarUri) {
        try {
          const timestamp = Date.now();
          setAvatarUri(user.image);
          setAvatarCacheTime(timestamp);
          
          // Save to cache
          await AsyncStorage.setItem('userAvatarCache', JSON.stringify({
            uri: user.image,
            timestamp
          }));
        } catch (error) {
          console.error('Error updating avatar cache:', error);
        }
      }
    };
    
    updateAvatarCache();
  }, [user?.image]);
  
  // Handle swipe gesture
  const handleSwipeGesture = (event) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      const currentIndex = getCurrentTabIndex();
      let newIndex;
      
      // Swipe threshold (minimum distance to trigger navigation)
      const swipeThreshold = 50;
      
      if (translationX > swipeThreshold && currentIndex > 0) {
        // Swipe right - go to previous tab
        newIndex = currentIndex - 1;
      } else if (translationX < -swipeThreshold && currentIndex < tabRoutes.length - 1) {
        // Swipe left - go to next tab
        newIndex = currentIndex + 1;
      }
      
      if (newIndex !== undefined && newIndex !== currentIndex && newIndex >= 0 && newIndex < tabRoutes.length) {
        const targetRoute = tabRoutes[newIndex];
        router.push(targetRoute);
      }
    }
  };
  
  // Custom tab bar icon for profile tab with notification dot below
  const ProfileTabIcon = ({ focused, color }) => (
    <View style={{ alignItems: 'center' }}>
      <Avatar 
        uri={avatarUri || user?.image}
        size={focused? hp(3.6): hp(3.4)}
        rounded={theme.radius.xs}
        style={{
          borderWidth: focused? 1.4: 1.3,
          borderColor:  focused? 'white': '#FFD700',
          marginTop: hp(2.5)
        }}
      />
      {/* {!focused && (
        <View 
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'red',
            marginTop: 2,
          }}
        />
      )} */}
    </View>
  );
 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={handleSwipeGesture}
        onHandlerStateChange={handleSwipeGesture}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <View style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: 'white', // Change this to green
              tabBarInactiveTintColor: 'gray',
              headerShown: false,
              animationEnabled: false,
              tabBarButton: HapticTab,
              tabBarBackground: TabBarBackground,
              tabBarStyle: Platform.select({
                ios: {
                  // Use a transparent background on iOS to show the blur effect
                  position: 'absolute',
                  borderTopWidth: 0
                },
                default: {
                  position: 'absolute',
                  borderTopWidth: 0
                },
              }),
            }}>
            <Tabs.Screen
              name="home"
              options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <IconSymbol size={27} name="house.fill" color={'grey'} />,
                href: null, // Hide from tab bar
              }}
            />
            <Tabs.Screen
              name="feeds"
              options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <Icon name="home" size={hp(3)} color={'#959695'} />,
              }}
            />
            <Tabs.Screen
              name="upcoming"
              options={{
                title: 'Upcoming',
                tabBarIcon: ({ color }) => <Icon name="calender" size={hp(2.7)} color={'#959695'} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ProfileTabIcon,
                tabBarLabel: '', // Remove the label text to just show the avatar with dot
              }}
              listeners={{
                tabPress: (e) => {
                  // Prevent default behavior
                  e.preventDefault();
                  // Navigate to profile screen
                  router.push('profile');
                },
              }}
            />
          </Tabs>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}