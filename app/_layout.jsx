import { View, Text, LogBox, Linking, Platform } from 'react-native'
import React, { useEffect } from 'react'
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getUserData } from '../services/userServices'
import { PostProvider } from '../contexts/PostContext';
import { ReviewProvider } from '../contexts/ReviewContext';
import { UserStorageService } from '../Storage/UserStorageService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

 LogBox.ignoreAllLogs(true);

const _layout = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
           <ReviewProvider>
                 <PostProvider>
                     <MainLayout />
                 </PostProvider>
               </ReviewProvider>
           </AuthProvider>
      </GestureHandlerRootView>
  )
}

const MainLayout = () => {
  const { setAuth, setUserData, parseDeepLink, initialized, logout } = useAuth();
  const router = useRouter();

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
        router.push('/home');
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

   // Authentication listener with improved storage handling
   useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change:', _event, session?.user?.id);
      
      if (session) {
        if (_event === 'PASSWORD_RECOVERY') {
          // Don't redirect to home for password recovery
        }else if (_event === 'TOKEN_REFRESHED' && session){
          console.log("Token refreshed successfully, updating session...");
          await UserStorageService.storeUserData(session.user); // Store new session data
          await setAuth(session.user); // Update state
          return; // Prevent unnecessary re-execution
        }else if (_event === 'SIGNED_IN' && session) {
          await updatedUserData(session.user, session.user.email);
        } else if (_event === 'PASSWORD_RESET') {
          // Handle successful password reset
          await setAuth(session.user);
          await updatedUserData(session.user, session.user.email);
        } else if (_event === 'SIGNED_OUT') {
          // Clear user data from secure storage and state
          await setAuth(null);
        } else {
          await setAuth(session?.user);
          await updatedUserData(session?.user, session?.user?.email);
        }
      } else if (_event === 'SIGNED_OUT') {
        // Clear stored data on sign out
        await setAuth(null);
        router.replace('/welcome');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change (after init):', event, session?.user?.id);

        if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('Token refreshed, updating session...');
            
            // Ensure session updates properly
            await setAuth(session.user);
            await updatedUserData(session.user, session.user.email);
            
            setLoading(false); // Ensure loading state is reset
        }
        else if (event === 'SIGNED_IN') {
             await updatedUserData(session.user, session.user.email);
           // await updatedUserData(session.user, session.user.email);
        }
        else if (event === 'SIGNED_OUT') {
            await UserStorageService.clearUserData();
            await setAuth(null);
            router.replace('/welcome');
        }
    });

    return () => subscription.unsubscribe();
}, [initialized]);

  const updatedUserData = async (user, email) => {
    if (!user?.id) return;
    try {
      let res = await getUserData(user.id);
      console.log('got user data', res);
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
    </Stack>
  )
}

export default _layout



































































// import { View, Text, LogBox, Linking, Platform } from 'react-native'
// import React, { useEffect } from 'react'
// import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'
// import { PostProvider } from '../contexts/PostContext';
// import { UserStorageService } from '../Storage/UserStorageService';

// // // Keep existing LogBox configurations
// // LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.','Error Error updating user data: [ReferenceError: Property \'getUserData\' doesn\'t exist]'])
//  LogBox.ignoreAllLogs(true);

//  // below are the logs that are being ignored and need to solve in future

// // LogBox.ignoreLogs([
// //   'Warning: TNodeChildrenRenderer',
// //   'Warning: MemoizedTNodeRenderer',
// //   'Warning: TRenderEngineProvider',
// //   'Warning: A props object containing a "key" prop is being spread into JSX',
// //   'Warning: Text strings must be rendered within a <Text> component.',
// //   'Error updating user data: [ReferenceError: Property \'getUserData\' doesn\'t exist]'
// // ]);

// const _layout = () => {
//   return (
//     <AuthProvider>
//       <PostProvider>
//         <MainLayout />
//       </PostProvider>
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const { setAuth, setUserData, parseDeepLink, initialized, logout } = useAuth();
//   const router = useRouter();

//   // Handle deep linking
//   const handleDeepLink = async ({ url }) => {
//     if (!url) return;

//     try {
//       // Handle password reset flow
//       if (url.includes('#access_token') || url.includes('?access_token')) {
//         const result = await parseDeepLink(url);
//         if (result?.user) {
//           router.push('/auth/reset');
//           return;
//         }
//       }

//       // Handle other deep link scenarios
//       if (url.includes('/auth/reset')) {
//         router.push('/auth/reset');
//       }
//       else if (url.includes('postDetails')) {
//         router.push('/postDetails');
//       }
//       else if (url.includes('releaseDetails')) {
//         router.push('/releaseDetails');
//       }
//       else if (url.includes('home')) {
//         router.push('/home');
//       }
//     } catch (error) {
//       console.error('Deep link handling error:', error);
//     }
//   };

//   // Handle initial deep link
//   useEffect(() => {
//     const handleInitialDeepLink = async () => {
//       const initialUrl = await Linking.getInitialURL();
//       if (initialUrl) {
//         await handleDeepLink({ url: initialUrl });
//       }
//     };

//     handleInitialDeepLink();
//   }, []);

//   // Handle deep links when app is open
//   useEffect(() => {
//     const subscription = Linking.addEventListener('url', handleDeepLink);
//     return () => {
//       subscription.remove();
//     };
//   }, []);

//   // Authentication listener
//   // useEffect(() => {
//   //   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
//   //     console.log('Auth state change:', _event, session?.user?.id);
      
//   //     if (session) {
//   //       if (_event === 'PASSWORD_RECOVERY') {
//   //         // Don't redirect to home for password recovery
//   //        // router.push('/auth/reset');
//   //       }else if (_event === 'PASSWORD_RESET') {
//   //         // Handle successful password reset
//   //         setAuth(session.user);
//   //         await updatedUserData(session.user, session.user.email);
//   //       //  router.replace('/profile');
//   //       }else if (_event === 'SIGNED_OUT') {
//   //         setAuth(null);
//   //         // Remove this line to prevent duplicate navigation
//   //         // router.replace('/welcome'); 
//   //       } else {
//   //         setAuth(session?.user);
//   //         await updatedUserData(session?.user, session?.user?.email);
//   //         // router.replace('/profile');
//   //       }
//   //     } else {
//   //        //setAuth(null);
//   //       router.replace('/welcome');
//   //     }
//   //   });

//   //   return () => {
//   //     subscription.unsubscribe();
//   //   };
//   // }, []);

//   // // if (!initialized) {
//   // //   return <SplashScreen />;  // Make sure you show a loading state
//   // // }

//   //  useEffect(() => {
//   //   if (!initialized) return;

//   //   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//   //     console.log('Auth state change:', event, session?.user?.id);
      
//   //     if (session?.user) {
//   //       if (event === 'PASSWORD_RECOVERY') {
//   //       //  router.push('/auth/reset');
//   //       } else if (event === 'SIGNED_IN') {
//   //         // setAuth(session.user);
//   //         // await updatedUserData(session.user, session.user.email);
//   //        // router.replace('/home');
//   //       }
//   //     } else if (event === 'SIGNED_OUT') {
//   //     //  setAuth(null);
//   //      // router.replace('/welcome');
//   //     }
//   //   });

//   //   return () => subscription.unsubscribe();
//   // }, [initialized]);

//   // const updatedUserData = async (user, email) => {
//   //   if (!user?.id) return;
//   //   try {
//   //     let res = await getUserData(user.id);
//   //     console.log('got user data', res);
//   //     setUserData({ ...res.data, email });
//   //   } catch (error) {
//   //     console.error('Error updating user data:', error);
//   //   }
//   // }

//    // Authentication listener with improved storage handling
//    useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       console.log('Auth state change:', _event, session?.user?.id);
      
//       if (session) {
//         if (_event === 'PASSWORD_RECOVERY') {
//           // Don't redirect to home for password recovery
//         } else if (_event === 'PASSWORD_RESET') {
//           // Handle successful password reset
//           await setAuth(session.user);
//           await updatedUserData(session.user, session.user.email);
//         } else if (_event === 'SIGNED_OUT') {
//           // Clear user data from secure storage and state
//           await setAuth(null);
//         } else {
//           await setAuth(session?.user);
//           await updatedUserData(session?.user, session?.user?.email);
//         }
//       } else if (_event === 'SIGNED_OUT') {
//         // Clear stored data on sign out
//         await setAuth(null);
//         router.replace('/welcome');
//       }
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   // Additional auth state change handler
//   useEffect(() => {
//     if (!initialized) return;

//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log('Auth state change (after init):', event, session?.user?.id);
      
//       if (session?.user) {
//         if (event === 'PASSWORD_RECOVERY') {
//           // Password recovery handled in other effect
//         } else if (event === 'SIGNED_IN') {
//           // Store user data securely
//           await updatedUserData(session.user, session.user.email);
//         }
//       } else if (event === 'SIGNED_OUT') {
//         // Ensure user data is cleared
//         await UserStorageService.clearUserData();
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, [initialized]);

//   const updatedUserData = async (user, email) => {
//     if (!user?.id) return;
//     try {
//       let res = await getUserData(user.id);
//       console.log('got user data', res);
//       if (res.success) {
//         await setUserData({ ...res.data, email });
//       }
//     } catch (error) {
//       console.error('Error updating user data:', error);
//     }
//   }

//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false
//       }}
//     >
//       <Stack.Screen
//         name="releaseDetails"
//         options={{
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//           headerShown: false,
//           gestureEnabled: true,
//           gestureDirection: 'vertical',
//           fullScreenGestureEnabled: true,
//           animationDuration: 200,
//           animationTypeForReplace: 'push',
//           customAnimationOnGesture: true,
//           gestureResponseDistance: {
//             vertical: 800
//           },
//           transitionSpec: {
//             open: {
//               animation: 'timing',
//               config: { duration: 200 },
//             },
//             close: {
//               animation: 'timing',
//               config: { duration: 800 },
//             },
//           },
//           cardStyleInterpolator: ({ current, layouts }) => ({
//             cardStyle: {
//               transform: [{
//                 translateY: current.progress.interpolate({
//                   inputRange: [0, 1],
//                   outputRange: [layouts.screen.height, 0],
//                 }),
//               }],
//             },
//             overlayStyle: {
//               opacity: current.progress.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: [0, 0.5],
//               }),
//             },
//           }),
//         }}
//       />
//     </Stack>
//   )
// }

// export default _layout












// import { View, Text, LogBox, Linking, Platform, DevSettings } from 'react-native'
// import React, { useEffect } from 'react'
// import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'
// import { PostProvider } from '../contexts/PostContext';
// import { UserStorageService } from '../Storage/UserStorageService';

//  LogBox.ignoreAllLogs(true);

// const _layout = () => {
//   return (
//     <AuthProvider>
//       <PostProvider>
//         <MainLayout />
//       </PostProvider>
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const { setAuth, setUserData, parseDeepLink, initialized, logout } = useAuth();
//   const router = useRouter();

//   // Handle deep linking
//   const handleDeepLink = async ({ url }) => {
//     if (!url) return;

//     try {
//       // Handle password reset flow
//       if (url.includes('#access_token') || url.includes('?access_token')) {
//         const result = await parseDeepLink(url);
//         if (result?.user) {
//           router.push('/auth/reset');
//           return;
//         }
//       }

//       // Handle other deep link scenarios
//       if (url.includes('/auth/reset')) {
//         router.push('/auth/reset');
//       }
//       else if (url.includes('postDetails')) {
//         router.push('/postDetails');
//       }
//       else if (url.includes('releaseDetails')) {
//         router.push('/releaseDetails');
//       }
//       else if (url.includes('home')) {
//         router.push('/home');
//       }
//     } catch (error) {
//       console.error('Deep link handling error:', error);
//     }
//   };

//   // Handle initial deep link
//   useEffect(() => {
//     const handleInitialDeepLink = async () => {
//       const initialUrl = await Linking.getInitialURL();
//       if (initialUrl) {
//         await handleDeepLink({ url: initialUrl });
//       }
//     };

//     handleInitialDeepLink();
//   }, []);

//   // Handle deep links when app is open
//   useEffect(() => {
//     const subscription = Linking.addEventListener('url', handleDeepLink);
//     return () => {
//       subscription.remove();
//     };
//   }, []);

//    // Authentication listener with improved storage handling
//    useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       console.log('Auth state change:', _event, session?.user?.id);
      
//       if (session) {
//         if (_event === 'PASSWORD_RECOVERY') {
//           // Don't redirect to home for password recovery
//         } else if (_event === 'PASSWORD_RESET') {
//           // Handle successful password reset
//           await setAuth(session.user);
//           await updatedUserData(session.user, session.user.email);
//         } else if (_event === 'SIGNED_OUT') {
//           // Clear user data from secure storage and state
//           await setAuth(null);
//         } else {
//           await setAuth(session?.user);
//           await updatedUserData(session?.user, session?.user?.email);
//         }
//       } else if (_event === 'SIGNED_OUT') {
//         // Clear stored data on sign out
//         await setAuth(null);
//         router.replace('/welcome');
//       }
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   // Additional auth state change handler
//   // useEffect(() => {
//   //   if (!initialized) return;

//   //   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//   //     console.log('Auth state change (after init):', event, session?.user?.id);
      
//   //     if (session?.user) {
//   //       if (event === 'PASSWORD_RECOVERY') {
//   //         // Password recovery handled in other effect
//   //       } else if (event === 'SIGNED_IN') {
//   //         // Store user data securely
//   //         await updatedUserData(session.user, session.user.email);
//   //       }
//   //     } else if (event === 'SIGNED_OUT') {
//   //       // Ensure user data is cleared
//   //       await UserStorageService.clearUserData();
//   //     }
//   //   });

//   //   return () => subscription.unsubscribe();
//   // }, [initialized]);

//   // Replace both useEffect auth listeners with a single one
// useEffect(() => {
//   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//     console.log('Auth state change:', event, session?.user?.id);
    
//     if (session?.user) {
//       if (event === 'PASSWORD_RECOVERY') {
//         // Don't redirect for password recovery
//       } else if (event === 'PASSWORD_RESET') {
//         await setAuth(session.user);
//         await updatedUserData(session.user, session.user.email);
//       } else if (event === 'TOKEN_REFRESHED') {
//         // Handle token refresh explicitly
//         await setAuth(session.user);
//         await updatedUserData(session.user, session.user.email);
//         DevSettings.reload();   // this is a hack to reload the app (temporary fix)
//       } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
//         await setAuth(session.user);
//         await updatedUserData(session.user, session.user.email);
//       }
//     } else if (event === 'SIGNED_OUT') {
//       await setAuth(null);
//       router.replace('/welcome');
//     }
//   });

//   return () => subscription.unsubscribe();
// }, [initialized]);

//   const updatedUserData = async (user, email) => {
//     if (!user?.id) return;
//     try {
//       let res = await getUserData(user.id);
//       console.log('got user data', res);
//       if (res.success) {
//         await setUserData({ ...res.data, email });
//       }
//     } catch (error) {
//       console.error('Error updating user data:', error);
//     }
//   }

//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false
//       }}
//     >
//       <Stack.Screen
//         name="releaseDetails"
//         options={{
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//           headerShown: false,
//           gestureEnabled: true,
//           gestureDirection: 'vertical',
//           fullScreenGestureEnabled: true,
//           animationDuration: 200,
//           animationTypeForReplace: 'push',
//           customAnimationOnGesture: true,
//           gestureResponseDistance: {
//             vertical: 800
//           },
//           transitionSpec: {
//             open: {
//               animation: 'timing',
//               config: { duration: 200 },
//             },
//             close: {
//               animation: 'timing',
//               config: { duration: 800 },
//             },
//           },
//           cardStyleInterpolator: ({ current, layouts }) => ({
//             cardStyle: {
//               transform: [{
//                 translateY: current.progress.interpolate({
//                   inputRange: [0, 1],
//                   outputRange: [layouts.screen.height, 0],
//                 }),
//               }],
//             },
//             overlayStyle: {
//               opacity: current.progress.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: [0, 0.5],
//               }),
//             },
//           }),
//         }}
//       />
//     </Stack>
//   )
// }

// export default _layout