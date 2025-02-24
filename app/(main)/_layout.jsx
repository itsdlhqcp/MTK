// import { Tabs } from 'expo-router';
// import React from 'react';
// import { Platform } from 'react-native';

// import { HapticTab } from '@/components/NavTabMain/HapticTab.tsx';
// import { IconSymbol } from '@/components/NavTabMain/ui/IconSymbol.tsx';
// import TabBarBackground from '@/components/NavTabMain/ui/TabBarBackground.tsx';
// import { Colors } from '../../constants/mainTab.ts';
// import { useColorScheme } from '../../hooks/useColorScheme.ts';

// export default function TabLayout() {
//   const colorScheme = useColorScheme();

//   return (
    
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
//         headerShown: false,
//         animationEnabled: false,
//         tabBarButton: HapticTab,
//         tabBarBackground: TabBarBackground,
//         tabBarStyle: Platform.select({
//           ios: {
//             // Use a transparent background on iOS to show the blur effect
//             position: 'absolute',
//           },
//           default: {},
//         }),
//       }}>
//       <Tabs.Screen
//         name="home"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color }) => <IconSymbol size={30} name="house.fill" color={'black'} />,
//         }}
//       />
//       <Tabs.Screen
//         name="upcoming"
//         options={{
//           title: 'Upcoming',
//           tabBarIcon: ({ color }) => <IconSymbol size={30} name="paperplane.fill" color={'black'} />,
//         }}
//       />
//     </Tabs>
//   );
// }

global.Buffer = global.Buffer || require('buffer').Buffer;
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import { router } from 'expo-router';

import { HapticTab } from '@/components/NavTabMain/HapticTab.tsx';
import { IconSymbol } from '@/components/NavTabMain/ui/IconSymbol.tsx';
import TabBarBackground from '@/components/NavTabMain/ui/TabBarBackground.tsx';
import { Colors } from '../../constants/mainTab.ts';
import { useColorScheme } from '../../hooks/useColorScheme.ts';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links when app is opened from closed state
    handleInitialDeepLink();

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (url.includes('reset-password')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/auth/reset-password');
        }
      }
    });
  
    return () => subscription.remove();
  }, []);

  const handleDeepLink =  ({ url })=> {
    // Handle different deep link scenarios
    if (url.includes('reset-password')) {
      const token = url.split('token=')[1];
      if (token) {
        // Navigate to reset password screen with token
        router.push({
          pathname: '/reset-password',
          params: { token }
        });
      }
    }
    // Add more deep link handlers as needed
    else if (url.includes('upcoming')) {
      router.push('/upcoming');
    }
    else if (url.includes('home')) {
      router.push('/home');
    }
  };

  const handleInitialDeepLink = async () => {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      handleDeepLink({ url: initialUrl });
    }
  };

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
          title: 'Upcoming',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="paperplane.fill" color={'black'} />,
        }}
      />
      {/* Hidden screen for reset password flow */}
      <Tabs.Screen
        name="reset-password"
        options={{
          href: null, // This hides the tab but keeps the screen accessible via deep links
        }}
      />
    </Tabs>
  );
}