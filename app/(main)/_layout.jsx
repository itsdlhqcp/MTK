import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/NavTabMain/HapticTab.tsx';
import { IconSymbol } from '@/components/NavTabMain/ui/IconSymbol.tsx';
import TabBarBackground from '@/components/NavTabMain/ui/TabBarBackground.tsx';
import { Colors } from '../../constants/mainTab.ts';
import { useColorScheme } from '../../hooks/useColorScheme.ts';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        headerShown: false,
        animationEnabled: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="house.fill" color={'black'} />,
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="paperplane.fill" color={'black'} />,
        }}
      />
    </Tabs>
  );
}
