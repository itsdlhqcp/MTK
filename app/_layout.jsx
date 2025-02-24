// import { View, Text, LogBox } from 'react-native'
// import React, { useEffect } from 'react'
// import { Stack, useRouter } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'

// LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])


// const _layout = () => {
//   return (
//     <AuthProvider>
//         <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const {setAuth, setUserData} = useAuth(); 
//   const router = useRouter();

//   useEffect(()=>{
//     supabase.auth.onAuthStateChange((_event, session)=>{
//       console.log('session user', session?.user)

//       if(session){
//           //set auth 
//           setAuth(session?.user);
//           updatedUserData(session?.user, session?.user?.email); 
//           router.replace('/home');
//           // move to home screen
//       }else{
//          // set auth null 
//          setAuth(null);
//          // move to welcome screen
//          router.replace('/welcome');
//       }
//     })

//   },[]); 

//     const updatedUserData = async (user, email) => {
//       let res = await getUserData(user?.id);
//      // console.log('got user data', res);
//          setUserData({...res.data, email});
//     }
    
//   return (
//     <Stack
//     screenOptions={{
//         headerShown: false
//     }}
//     >
//       <Stack.Screen
//        name="postDetails"
//       //  options={{
//       //   presentation: 'modal'
//       //  }}
//       options={{
//         presentation: 'modal',
//         animation: 'slide_from_bottom',
//         headerShown: false,  // We'll handle header in the component
//         // Add these options for smooth animation
//         gestureEnabled: true,
//         gestureDirection: 'vertical',
//         fullScreenGestureEnabled: true,
//         animationDuration: 200,
//     }}
//       />
//        {/* <Stack.Screen 
//         name="forgot" 
//         options={{
//           headerShown: false,
//         }} 
//       /> */}
//     </Stack>
//   )
// }

// export default _layout






// import { View, Text, LogBox } from 'react-native'
// import React, { useEffect } from 'react'
// import { Stack, useRouter } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'

// LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])


// const _layout = () => {
//   return (
//     <AuthProvider>
//         <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const {setAuth, setUserData} = useAuth(); 
//   const router = useRouter();

//   useEffect(()=>{
//     supabase.auth.onAuthStateChange((_event, session)=>{
//       console.log('session user', session?.user)

//       if(session){
//           setAuth(session?.user);
//           updatedUserData(session?.user, session?.user?.email); 
//           router.replace('/home');
//       }else{
//          // set auth null 
//          setAuth(null);
//          // move to welcome screen
//          router.replace('/welcome');
//       }
//     })

//   },[]); 

//     const updatedUserData = async (user, email) => {
//       let res = await getUserData(user?.id);
//          setUserData({...res.data, email});
//     }
    
//   return (
//     <Stack
//     screenOptions={{
//         headerShown: false
//     }}
//     >
//       <Stack.Screen
//        name="postDetails"
//       options={{
//         presentation: 'modal',
//         animation: 'slide_from_bottom',
//         headerShown: false,  
//         gestureEnabled: true,
//         gestureDirection: 'vertical',
//         fullScreenGestureEnabled: true,
//         animationDuration: 200,
//     }}
//       />
//     </Stack>
//   )
// }

// export default _layout





// import { View, Text, LogBox } from 'react-native'
// import React, { useEffect } from 'react'
// import { Stack, useRouter } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'

// LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])

// const _layout = () => {
//   return (
//     <AuthProvider>
//         <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const {setAuth, setUserData} = useAuth(); 
//   const router = useRouter();

//   useEffect(()=>{
//     supabase.auth.onAuthStateChange((_event, session)=>{
//       console.log('session user', session?.user)
//       if(session){
//           setAuth(session?.user);
//           updatedUserData(session?.user, session?.user?.email); 
//           router.replace('/home');
//       }else{
//          // set auth null 
//          setAuth(null);
//          // move to welcome screen
//          router.replace('/welcome');
//       }
//     })
//   },[]); 

//   const updatedUserData = async (user, email) => {
//     let res = await getUserData(user?.id);
//     setUserData({...res.data, email});
//   }
    
//   return (
//     <Stack
//       screenOptions={{
//           headerShown: false
//       }}
//     >
//       <Stack.Screen
//         name="postDetails"
//         options={{
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//           headerShown: false,  
//           gestureEnabled: true,
//           gestureDirection: 'vertical',
//           fullScreenGestureEnabled: true,
//           animationDuration: 200,
//         }}
//       />
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
//         }}
//       />
//     </Stack>
//   )
// }

// export default _layout








// import { View, Text, LogBox } from 'react-native'
// import React, { useEffect } from 'react'
// import { Stack, useRouter } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'

// LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])

// const _layout = () => {
//   return (
//     <AuthProvider>
//         <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const {setAuth, setUserData} = useAuth(); 
//   const router = useRouter();

//   useEffect(()=>{
//     supabase.auth.onAuthStateChange((_event, session)=>{
//       console.log('session user', session?.user)
//       if(session){
//           setAuth(session?.user);
//           updatedUserData(session?.user, session?.user?.email); 
//           router.replace('/home');
//       }else{
//          // set auth null 
//          setAuth(null);
//          // move to welcome screen
//          router.replace('/welcome');
//       }
//     })
//   },[]); 

//   const updatedUserData = async (user, email) => {
//     let res = await getUserData(user?.id);
//     setUserData({...res.data, email});
//   }
    
//   return (
//     <Stack
//       screenOptions={{
//           headerShown: false
//       }}
//     >
//       <Stack.Screen
//         name="postDetails"
//         options={{
//           presentation: 'modal',
//           animation: 'slide_from_bottom',
//           headerShown: false,  
//           gestureEnabled: true,
//           gestureDirection: 'vertical',
//           fullScreenGestureEnabled: true,
//           animationDuration: 200,
//           animationTypeForReplace: 'push',
//           // Add custom animations for closing
//           customAnimationOnGesture: true,
//           gestureResponseDistance: {
//             vertical: 800  // Increase gesture response area
//           },
//           transitionSpec: {
//             open: {
//               animation: 'timing',
//               config: {
//                 duration: 200,
//               },
//             },
//             close: {
//               animation: 'timing',
//               config: {
//                 duration: 200,
//               },
//             },
//           },
//           cardStyleInterpolator: ({ current, layouts }) => ({
//             cardStyle: {
//               transform: [
//                 {
//                   translateY: current.progress.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [layouts.screen.height, 0],
//                   }),
//                 },
//               ],
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
//           // Add custom animations for closing
//           customAnimationOnGesture: true,
//           gestureResponseDistance: {
//             vertical: 800  // Increase gesture response area
//           },
//           transitionSpec: {
//             open: {
//               animation: 'timing',
//               config: {
//                 duration: 200,
//               },
//             },
//             close: {
//               animation: 'timing',
//               config: {
//                 duration: 800,
//               },
//             },
//           },
//           cardStyleInterpolator: ({ current, layouts }) => ({
//             cardStyle: {
//               transform: [
//                 {
//                   translateY: current.progress.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [layouts.screen.height, 0],
//                   }),
//                 },
//               ],
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







// updated on friday nonn 3 pm

// import { View, Text, LogBox, Linking, Platform } from 'react-native'
// import React, { useEffect } from 'react'
// import { Stack, useRouter } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'

// // Keep existing LogBox configurations
// LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])

// const _layout = () => {
//   return (
//     <AuthProvider>
//         <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const {setAuth, setUserData} = useAuth(); 
//   const router = useRouter();

//   useEffect(() => {
//     // Handle deep links when app is already open
//     const subscription = Linking.addEventListener('url', handleDeepLink);

//     // Handle deep links when app is opened from closed state
//     handleInitialDeepLink();

//     return () => {
//       subscription.remove();
//     };
//   }, []);

//   // Handle deep linking
//   const handleDeepLink = ({ url }) => {
//     // Handle different deep link scenarios
//     if (url.includes('reset-password')) {
//       const token = url.split('token=')[1];
//       if (token) {
//         router.push({
//           pathname: '/reset-password',
//           params: { token }
//         });
//       }
//     }
//     else if (url.includes('postDetails')) {
//       router.push('/postDetails');
//     }
//     else if (url.includes('releaseDetails')) {
//       router.push('/releaseDetails');
//     }
//     else if (url.includes('home')) {
//       router.push('/home');
//     }
//   };

//   const handleInitialDeepLink = async () => {
//     const initialUrl = await Linking.getInitialURL();
//     if (initialUrl) {
//       handleDeepLink({ url: initialUrl });
//     }
//   };

//   // Authentication listener
//   useEffect(() => {
//     supabase.auth.onAuthStateChange(async (_event, session) => {
//       console.log('session user', session?.user)
//       if(session){
//         setAuth(session?.user);
//         await updatedUserData(session?.user, session?.user?.email); 
//         router.replace('/home');
//       } else {
//         setAuth(null);
//         router.replace('/welcome');
//       }
//     });

//     // Add reset password specific deep link listener
//     const resetPasswordSubscription = Linking.addEventListener('url', async ({ url }) => {
//       if (url.includes('reset-password')) {
//         const { data: { session } } = await supabase.auth.getSession();
//         if (session) {
//           router.replace('/auth/reset-password');
//         }
//       }
//     });

//     return () => {
//       resetPasswordSubscription.remove();
//     };
//   },[]); 

//   const updatedUserData = async (user, email) => {
//     let res = await getUserData(user?.id);
//     setUserData({...res.data, email});
//   }
    
//   return (
//     <Stack
//       screenOptions={{
//           headerShown: false
//       }}
//     >
//       <Stack.Screen
//         name="postDetails"
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
//               config: {
//                 duration: 200,
//               },
//             },
//             close: {
//               animation: 'timing',
//               config: {
//                 duration: 200,
//               },
//             },
//           },
//           cardStyleInterpolator: ({ current, layouts }) => ({
//             cardStyle: {
//               transform: [
//                 {
//                   translateY: current.progress.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [layouts.screen.height, 0],
//                   }),
//                 },
//               ],
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
//               config: {
//                 duration: 200,
//               },
//             },
//             close: {
//               animation: 'timing',
//               config: {
//                 duration: 800,
//               },
//             },
//           },
//           cardStyleInterpolator: ({ current, layouts }) => ({
//             cardStyle: {
//               transform: [
//                 {
//                   translateY: current.progress.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [layouts.screen.height, 0],
//                   }),
//                 },
//               ],
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
//       {/* Add a hidden screen for reset password flow */}
//       <Stack.Screen
//         name="reset-password"
//         options={{
//           href: null // This hides the screen but keeps it accessible via deep links
//         }}
//       />
//     </Stack>
//   )
// }

// export default _layout







// import { View, Text, LogBox, Linking, Platform } from 'react-native'
// import React, { useEffect } from 'react'
// import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'

// // SplashScreen.preventAutoHideAsync(); 

// // Keep existing LogBox configurations
// LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])

// const _layout = () => {
//   return (
//     <AuthProvider>
//       <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const { setAuth, setUserData, parseDeepLink } = useAuth();
//   const router = useRouter();

// // for better navigation protection
// //   useEffect(() => {
// //     const inAuthGroup = segments[0] === "(auth)";
// //     const inProtectedGroup = segments[0] === "(app)";

// //     if (!user && inProtectedGroup) {
// //         // Redirect to the sign-in page
// //         router.replace('/welcome');
// //     } else if (user && inAuthGroup) {
// //         // Redirect away from the sign-in page
// //         router.replace('/home');
// //     }
// // }, [user, segments]);

//     // Global navigation protection
//   // Global navigation protection
// //   useEffect(() => {
// //     const protectedRoutes = ['home', 'profile'];
// //     const inProtectedRoute = protectedRoutes.includes(segments[0]);
    
// //     if (inProtectedRoute && !user) {
// //         router.replace('/login');
// //     }
// // }, [user, segments]);

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
//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       console.log('Auth state change:', _event, session?.user?.id);
      
//       if (session) {
//         if (_event === 'PASSWORD_RECOVERY') {
//           // Don't redirect to home for password recovery
//           router.push('/auth/reset');
//         } else {
//           setAuth(session?.user);
//           await updatedUserData(session?.user, session?.user?.email);
//           // router.replace('/profile');
//         }
//       } else {
//         setAuth(null);
//         router.replace('/welcome');
//       }
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   const updatedUserData = async (user, email) => {
//     if (!user?.id) return;
//     try {
//       let res = await getUserData(user.id);
//       setUserData({ ...res.data, email });
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
//       {/* Keep your existing modal screens */}
//       <Stack.Screen
//         name="postDetails"
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
//               config: { duration: 200 },
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
//       {/* Reset password screen */}
//       <Stack.Screen
//         name="auth/reset"
//         options={{
//           headerShown: false,
//           gestureEnabled: false,
//         }}
//       />
//     </Stack>
//   )
// }

// export default _layout











// ############# working code :- (latests 19)

// import { View, Text, LogBox, Linking, Platform } from 'react-native'
// import React, { useEffect } from 'react'
// import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'

// // Keep existing LogBox configurations
// LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])

// const _layout = () => {
//   return (
//     <AuthProvider>
//       <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const { setAuth, setUserData, parseDeepLink, initialized } = useAuth();
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
//   useEffect(() => {
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       console.log('Auth state change:', _event, session?.user?.id);
      
//       if (session) {
//         if (_event === 'PASSWORD_RECOVERY') {
//           // Don't redirect to home for password recovery
//           router.push('/auth/reset');
//         } else {
//           setAuth(session?.user);
//           await updatedUserData(session?.user, session?.user?.email);
//           // router.replace('/profile');
//         }
//       } else {
//         setAuth(null);
//         router.replace('/welcome');
//       }
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   // useEffect(() => {
//   //   if (!initialized) return;

//   //   const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//   //     console.log('Auth state change:', event, session?.user?.id);
      
//   //     if (session?.user) {
//   //       if (event === 'PASSWORD_RECOVERY') {
//   //         router.push('/auth/reset');
//   //       } else if (event === 'SIGNED_IN') {
//   //         // setAuth(session.user);
//   //         // await updatedUserData(session.user, session.user.email);
//   //         router.replace('/home');
//   //       }
//   //     } else if (event === 'SIGNED_OUT') {
//   //       setAuth(null);
//   //       router.replace('/welcome');
//   //     }
//   //   });

//   //   return () => subscription.unsubscribe();
//   // }, [initialized]);

//   const updatedUserData = async (user, email) => {
//     if (!user?.id) return;
//     try {
//       let res = await getUserData(user.id);
//       console.log('got user data', res);
//       setUserData({ ...res.data, email });
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
//       {/* Keep your existing modal screens */}
//       <Stack.Screen
//         name="postDetails"
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
//               config: { duration: 200 },
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
//       {/* Reset password screen */}
//       {/* <Stack.Screen
//         name="auth/reset"
//         options={{
//           headerShown: false,
//           gestureEnabled: false,
//         }}
//       /> */}
//     </Stack>
//   )
// }

// export default _layout




















import { View, Text, LogBox, Linking, Platform } from 'react-native'
import React, { useEffect } from 'react'
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getUserData } from '../services/userServices'

// Keep existing LogBox configurations
LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])

const _layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}

const MainLayout = () => {
  const { setAuth, setUserData, parseDeepLink, initialized } = useAuth();
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

  // Authentication listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change:', _event, session?.user?.id);
      
      if (session) {
        if (_event === 'PASSWORD_RECOVERY') {
          // Don't redirect to home for password recovery
         // router.push('/auth/reset');
        } else {
          setAuth(session?.user);
          await updatedUserData(session?.user, session?.user?.email);
          // router.replace('/profile');
        }
      } else {
        setAuth(null);
        router.replace('/welcome');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

   useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        if (event === 'PASSWORD_RECOVERY') {
        //  router.push('/auth/reset');
        } else if (event === 'SIGNED_IN') {
          // setAuth(session.user);
          // await updatedUserData(session.user, session.user.email);
         // router.replace('/home');
        }
      } else if (event === 'SIGNED_OUT') {
        setAuth(null);
      //  router.replace('/welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  const updatedUserData = async (user, email) => {
    if (!user?.id) return;
    try {
      let res = await getUserData(user.id);
      console.log('got user data', res);
      setUserData({ ...res.data, email });
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
      {/* Keep your existing modal screens */}
      <Stack.Screen
        name="postDetails"
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
              config: { duration: 200 },
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
      {/* Reset password screen */}
      {/* <Stack.Screen
        name="auth/reset"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      /> */}
    </Stack>
  )
}

export default _layout














































