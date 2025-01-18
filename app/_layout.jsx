import { View, Text, LogBox } from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getUserData } from '../services/userServices'

LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer','Warning: MemoizedTNodeRenderer','Warning: TRenderEngineProvider','Warning: A props object containing a "key" prop is being spread into JSX', 'Warning: Text strings must be rendered within a <Text> component.'])

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
        headerShown: false
    }}
    >
      <Stack.Screen
       name="postDetails"
      //  options={{
      //   presentation: 'modal'
      //  }}
      options={{
        presentation: 'modal',
        animation: 'slide_from_bottom',
        headerShown: false,  // We'll handle header in the component
        // Add these options for smooth animation
        gestureEnabled: true,
        gestureDirection: 'vertical',
        fullScreenGestureEnabled: true,
        animationDuration: 200,
    }}
      />
    </Stack>
  )
}

export default _layout