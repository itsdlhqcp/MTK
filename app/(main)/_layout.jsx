global.Buffer = global.Buffer || require('buffer').Buffer;
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Linking, View } from 'react-native';
import { router } from 'expo-router';
import { HapticTab } from '@/components/NavTabMain/HapticTab.tsx';
import { IconSymbol } from '@/components/NavTabMain/ui/IconSymbol.tsx';
import TabBarBackground from '@/components/NavTabMain/ui/TabBarBackground.tsx';
import { Colors } from '../../constants/mainTab.ts';
import { useColorScheme } from '../../hooks/useColorScheme.ts';
import { Pressable } from 'react-native';
import Avatar from '@/components/Avatar'; 
import { useAuth } from '../../contexts/AuthContext';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { hp } from '../../helpers/common.js';
import theme from '../../constants/theme.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, navigationGuard } = useAuth();
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarCacheTime, setAvatarCacheTime] = useState(null);
  
  // Cache timeout in milliseconds
  const AVATAR_CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

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
      {!focused && (
        <View 
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'red',
            marginTop: 2,
          }}
        />
      )}
    </View>
  );
 
  return (
    <Tabs
    screenOptions={{
      tabBarActiveTintColor: '#15f81b', // Change this to green
      tabBarInactiveTintColor: 'green',
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
        tabBarIcon: ({ color }) => <IconSymbol size={30} name="house.fill" color={'grey'} />,
      }}
    />
      <Tabs.Screen
      name="feeds"
      options={{
        title: 'Feeds',
        tabBarIcon: ({ color }) => <IconSymbol size={30} name="newspaper.fill" color={'grey'} />,
      }}
    />
    <Tabs.Screen
      name="upcoming"
      options={{
        title: 'Upcoming',
        tabBarIcon: ({ color }) => <IconSymbol size={30} name="music.note.tv.fill" color={'grey'} />,
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
  );
}