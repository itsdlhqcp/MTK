import { View, Text, LogBox } from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getUserData } from '../services/userServices'

LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX'])

const _layout = () => {
  return (
    <AuthProvider>
        <MainLayout />
    </AuthProvider>
  )
}

const MainLayout = () => {
  const {setAuth, setUserData} = useAuth(); 
  const router = useRouter();

  useEffect(()=>{
    supabase.auth.onAuthStateChange((_event, session)=>{
      console.log('session user', session?.user)

      if(session){
          //set auth 
          setAuth(session?.user);
          updatedUserData(session?.user, session?.user?.email); 
          router.replace('/home');
          // move to home screen
      }else{
         // set auth null 
         setAuth(null);
         // move to welcome screen
         router.replace('/welcome');
      }
    })

  },[]); 

    const updatedUserData = async (user, email) => {
      let res = await getUserData(user?.id);
     // console.log('got user data', res);
         setUserData({...res.data, email});
    }
    
  return (
    <Stack
    screenOptions={{
        headerShown: false,
        animationEnabled: false,
    }}
    />
  )
}

export default _layout



// import { View, Text } from 'react-native'
// import React, { useEffect } from 'react'
// import { Stack, Tabs, useRouter } from 'expo-router'
// import { AuthProvider, useAuth } from '../contexts/AuthContext'
// import { supabase } from '@/lib/supabase'
// import { getUserData } from '../services/userServices'
// import Icon from 'react-native-vector-icons/Ionicons';

// const layout = () => {
//   return (
//     <AuthProvider>
//         <MainLayout />
//     </AuthProvider>
//   )
// }

// const MainLayout = () => {
//   const { setAuth, setUserData } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     supabase.auth.onAuthStateChange((_event, session) => {
//       console.log('session user', session?.user);

//       if (session) {
//         setAuth(session?.user);
//         updatedUserData(session?.user);
//         router.replace('/home');
//       } else {
//         setAuth(null);
//         router.replace('/welcome');
//       }
//     });
//   }, []);

//   const updatedUserData = async (user) => {
//     let res = await getUserData(user?.id);
//     setUserData(res.data);
//   };

//   return (
//     <Tabs screenOptions={{ headerShown: false }}>
//       <Tabs.Screen
//         name="home"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ focused }) => (
//             <Icon name="home" size={24} color={focused ? 'green' : '#ccc'} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="upcoming"
//         options={{
//           tabBarLabel: 'xxxxx',
//           tabBarIcon: ({ focused }) => (
//             <Icon name="calendar" size={24} color={focused ? '#007bff' : '#ccc'} />
//           ),
//         }}
//       />
//       <Tabs.Screen 
//         name="welcome"
//         options={{
//           href: null // This hides the welcome screen from tabs
//         }}
//       />
//       <Tabs.Screen 
//         name="login"
//         options={{
//           href: null
//         }}
//       />
//       <Tabs.Screen 
//         name="signup"
//         options={{
//           href: null
//         }}
//       />
//       <Tabs.Screen 
//         name="onboardingGrid"
//         options={{
//           href: null
//         }}
//       />
//        <Tabs.Screen 
//         name="index"
//         options={{
//           href: null
//         }}
//       />
//     </Tabs>
//   );
// };

// export default layout





