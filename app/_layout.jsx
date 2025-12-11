import { LogBox, Linking} from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getUserData } from '../services/userServices'
import { PostProvider } from '../contexts/PostContext';
import { ReviewProvider } from '../contexts/ReviewContext';
import { UserStorageService } from '../Storage/UserStorageService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import mobileAds from 'react-native-google-mobile-ads';

import { ToastProvider } from '../contexts/ToastContext';

 LogBox.ignoreAllLogs(true);
 
 // Suppress VirtualizedList nested ScrollView warning (horizontal ScrollView in vertical FlatList is valid)
 LogBox.ignoreLogs([
   'VirtualizedLists should never be nested',
   'VirtualizedLists should never be nested inside plain ScrollViews',
   /VirtualizedLists should never be nested/,
 ]);
 
 // Additional suppression for console warnings
 if (__DEV__) {
   const originalWarn = console.warn;
   console.warn = (...args) => {
     const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0] || '');
     if (message.includes('VirtualizedLists should never be nested') || 
         message.includes('VirtualizedList') && message.includes('nested') ||
         message.includes('ScrollView') && message.includes('VirtualizedList')) {
       return;
     }
     originalWarn(...args);
   };
 }

const _layout = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ToastProvider>
           <ReviewProvider>
                 <PostProvider>
                         <MainLayout />
                     </PostProvider>
                 </ReviewProvider>
               </ToastProvider>
           </AuthProvider>
      </GestureHandlerRootView>
  )
}

const MainLayout = () => {
  const { setAuth, setUserData, parseDeepLink, initialized, logout } = useAuth();
  const router = useRouter();

  // Initialize Google Mobile Ads SDK
  // useEffect(() => {
  //   const initializeAds = async () => {
  //     try {
  //       // Check if we're in production (not development)
  //       const isProduction = !__DEV__;
  //       
  //       // Configure request configuration
  //       // In production, use empty testDeviceIds array to disable test mode
  //       const requestConfiguration = {
  //         // Disable test mode in production - empty array means no test devices
  //         testDeviceIds: isProduction ? [] : [], 
  //       };
  //       
  //       await mobileAds().setRequestConfiguration(requestConfiguration);
  //       
  //       // Initialize the SDK
  //       await mobileAds().initialize();
  //       
  //       console.log('Google Mobile Ads SDK initialized', { isProduction });
  //     } catch (error) {
  //       console.error('Error initializing Google Mobile Ads:', error);
  //     }
  //   };

  //   initializeAds();
  // }, []);

  // Handle deep linking
  const handleDeepLink = async ({ url }) => {
    if (!url) return;

    try {
      // Handle password reset flow
      if (url.includes('#access_token') || url.includes('?access_token')) {
        const result = await parseDeepLink(url);
        if (result?.user) {
          router.push('/auth/reset');
          return;
        }
      }

      // Handle other deep link scenarios
      if (url.includes('/auth/reset')) {
        router.push('/auth/reset');
      }
      else if (url.includes('postDetails')) {
        router.push('/postDetails');
      }
      else if (url.includes('releaseDetails')) {
        router.push('/releaseDetails');
      }
      else if (url.includes('home')) {
        router.replace('/home');
      }
    } catch (error) {
      console.error('Deep link handling error:', error);
    }
  };

  // Handle initial deep link
  useEffect(() => {
    const handleInitialDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDeepLink({ url: initialUrl });
      }
    };

    handleInitialDeepLink();
  }, []);

  // Handle deep links when app is open
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);


  // yyyy

   // Authentication listener with improved storage handling
  //  useEffect(() => {
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
  //     console.log('Auth state change:', _event, session?.user?.id);
      
  //     if (session) {
  //       if (_event === 'PASSWORD_RECOVERY') {
  //         // Don't redirect to home for password recovery
  //       }else if (_event === 'TOKEN_REFRESHED' && session){
  //         console.log("Token refreshed successfully, updating session...");
  //         // temporary solution as need to handle the refesh token passing
         
  //         await UserStorageService.storeUserData(session.user); // Store new session data
  //         await setAuth(session.user); // Update state
  //         return; // Prevent unnecessary re-execution
  //       }else if (_event === 'SIGNED_IN' && session) {
  //         await updatedUserData(session.user, session.user.email);
  //       } else if (_event === 'PASSWORD_RESET') {
  //         // Handle successful password reset
  //         await setAuth(session.user);
  //         await updatedUserData(session.user, session.user.email);
  //       } 
  //       // else if (_event === 'SIGNED_OUT') {
  //       //   // Clear user data from secure storage and state
  //       //   await setAuth(null);
  //       //   router.replace('/welcome');
  //       // }
  //        else {
  //         await setAuth(session?.user);
  //         await updatedUserData(session?.user, session?.user?.email);
  //       }
  //     } 
  //     // else if (_event === 'SIGNED_OUT') {
  //     //   // Clear stored data on sign out
  //     //   await setAuth(null);
  //     //    router.replace('/welcome');
  //     // }
  //   });

  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // }, []);

  // Additional auth state change handler
  // useEffect(() => {
  //   if (!initialized) return;

  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
  //     console.log('Auth state change (after init):', event, session?.user?.id);
      
  //     if (session?.user) {
  //       if (event === 'PASSWORD_RECOVERY') {
  //         // Password recovery handled in other effect
  //       } else if (event === 'SIGNED_IN') {
  //         // Store user data securely
  //         await updatedUserData(session.user, session.user.email);
  //       }
  //     } else if (event === 'SIGNED_OUT') {
  //       // Ensure user data is cleared
  //       await UserStorageService.clearUserData();
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, [initialized]);


  useEffect(() => {
    const handleInitialDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleDeepLink({ url: initialUrl });
      }
    };

    handleInitialDeepLink();
  }, []);

  // Handle deep links when app is open
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  // SINGLE consolidated authentication listener
  useEffect(() => {
    if (!initialized) return;

    let isProcessing = false; // Prevent concurrent processing

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Prevent concurrent execution
      if (isProcessing) {
        console.log('Auth state change already in progress, skipping:', _event);
        return;
      }

      isProcessing = true;
      console.log('Auth state change:', _event, session?.user?.id);
      
      try {
        if (session?.user) {
          switch (_event) {
            case 'PASSWORD_RECOVERY':
              // Don't redirect to home for password recovery
              break;
              
            case 'TOKEN_REFRESHED':
              console.log("Token refreshed successfully, updating session...");
              // Update storage and state atomically
              await Promise.all([
                UserStorageService.storeUserData(session.user),
                setAuth(session.user)
              ]);
            //  Update user data after auth is set
               await updatedUserData(session.user, session.user.email);
               break;
              
            case 'SIGNED_IN':
              await updatedUserData(session.user, session.user.email);
              break;
              
            case 'PASSWORD_RESET':
              await setAuth(session.user);
              await updatedUserData(session.user, session.user.email);
              break;
              
            default:
              await setAuth(session.user);
              await updatedUserData(session.user, session.user.email);
              break;
          }
        }
        // Handle sign out if needed
        // else if (_event === 'SIGNED_OUT') {
        //   await setAuth(null);
        //   router.replace('/welcome');
        // }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
        isProcessing = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);






  // xxxxxxx

//   useEffect(() => {
//     if (!initialized) return;

//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//         console.log('Auth state change (after init):', event, session?.user?.id);

//         if (event === 'TOKEN_REFRESHED' && session?.user) {
//             console.log('Token refreshed, updating session...');
//             // temporary solution as need to handle the refesh token passing
//             // DevSettings.reload();
//             // NativeModules.DevSetting.reload()
//             await setAuth(session.user);
//             await updatedUserData(session.user, session.user.email);
//             setLoading(false);
//         }
//         else if (event === 'SIGNED_IN') {
//              await updatedUserData(session.user, session.user.email);
//            // await updatedUserData(session.user, session.user.email);
//         }
//         // else if (event === 'SIGNED_OUT') {
//         //     await UserStorageService.clearUserData();
//         //   //  await setAuth(null);
//         //   //  router.replace('/welcome');
//         // }
//     });

//     return () => subscription.unsubscribe();
// }, [initialized]);

  const updatedUserData = async (user, email) => {
    if (!user?.id) return;
    try {
      let res = await getUserData(user.id);
      //console.log('got user data', res);
      if (res.success) {
        await setUserData({ ...res.data, email });
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen
        name="releaseDetails"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
          fullScreenGestureEnabled: true,
          animationDuration: 200,
          animationTypeForReplace: 'push',
          customAnimationOnGesture: true,
          gestureResponseDistance: {
            vertical: 800
          },
          transitionSpec: {
            open: {
              animation: 'timing',
              config: { duration: 200 },
            },
            close: {
              animation: 'timing',
              config: { duration: 800 },
            },
          },
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [{
                translateY: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                }),
              }],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
       <Stack.Screen
        name="releasePeopleSection/releasePeopleDetails"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
          fullScreenGestureEnabled: true,
          animationDuration: 200,
          animationTypeForReplace: 'push',
          customAnimationOnGesture: true,
          gestureResponseDistance: {
            vertical: 800
          },
          transitionSpec: {
            open: {
              animation: 'timing',
              config: { duration: 200 },
            },
            close: {
              animation: 'timing',
              config: { duration: 800 },
            },
          },
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [{
                translateY: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                }),
              }],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
       <Stack.Screen
        name="streamDetails"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
          fullScreenGestureEnabled: true,
          animationDuration: 200,
          animationTypeForReplace: 'push',
          customAnimationOnGesture: true,
          gestureResponseDistance: {
            vertical: 800
          },
          transitionSpec: {
            open: {
              animation: 'timing',
              config: { duration: 200 },
            },
            close: {
              animation: 'timing',
              config: { duration: 800 },
            },
          },
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [{
                translateY: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                }),
              }],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
       <Stack.Screen
        name="streamPeopleSection/streamPeopleDetails"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
          fullScreenGestureEnabled: true,
          animationDuration: 200,
          animationTypeForReplace: 'push',
          customAnimationOnGesture: true,
          gestureResponseDistance: {
            vertical: 800
          },
          transitionSpec: {
            open: {
              animation: 'timing',
              config: { duration: 200 },
            },
            close: {
              animation: 'timing',
              config: { duration: 800 },
            },
          },
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [{
                translateY: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                }),
              }],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
    </Stack>
  )
}

export default _layout