import { View, StyleSheet, Text, Pressable} from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { StatusBar }from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '@/constants/theme'
import Icon from '@/assets/icons'
import Input from "../components/Input"
import Button from '@/components/Button'
import { Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const Login = () => {
 
  const router = useRouter();
  const emailRef = useRef();
  const passwordRef = useRef(); 
  const { checkUserStatus } = useAuth();
  const [loading, setLoading] = useState(false);

  // Helper function to create a delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const onSubmit = async () => {
     if (!emailRef.current || !passwordRef.current){
      Alert.alert("Login", "Please fill in all fields");
      return;
     }
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email: emailRef.current.trim(),
          password: passwordRef.current.trim()
      });

      if (error) throw error;

      // Check if user is new
      const isNew = await checkUserStatus(user.id);
      
      // Add 3000ms delay before navigation
      await delay(200);
      
      // Navigate based on user status
      if (isNew) {
          router.replace('/auth/newuserscreens/userpreferences');
      } else {
          router.replace('/home');
      }
    } catch (error) {
        Alert.alert('Login', error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg="white">
       <StatusBar style="dark"/>
       <View style={styles.container}>
          <BackButton router={router} />
          {/* welcome */}
          <View>
            <Text style={styles.welcomeText}>Hey,</Text>
            <Text style={styles.welcomeSmallText}>Welcome Back</Text>
          </View>

          {/* form  */}
          <View style={styles.form}>
            <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
              Please login to continue
            </Text>
            <Input
              icon={<Icon name="mail" size={26} strokeWidth={1.6}/>}
              placeholder="Enter your email"
              onChangeText={value=> emailRef.current = value}
            />
            <Input
              icon={<Icon name="lock" size={26} strokeWidth={1.6}/>}
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={value=> passwordRef.current = value}
            />
            <Text style={styles.forgotPassword} onPress={() => router.push('/auth/forgot')}>
              try hassle-free login &gt;&gt;</Text>
              {/* button */}
              <Button loaderType="BarIndicator" title="Login" loading={loading} onPress={onSubmit} />
          </View>

          {/* footer */} 
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?
              </Text>
              <Pressable>
                <Text onPress={()=> router.push('signup')}
                style={[styles.footerText, { color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold }]}>Sign up</Text>
              </Pressable>
          </View>
       </View>
    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    gap: 45, 
    paddingHorizontal: wp(5),
  }, 
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold, 
    color: theme.colors.text, 
  }, 
  welcomeSmallText: {
    fontSize: hp(3.3),
    fontWeight: theme.fonts.bold, 
    color: theme.colors.text, 
  }, 
  form: {
    gap: 25,
  }, 
  forgotPassword: {
    textAlign: 'right', 
    fontWeight: theme.fonts.semibold, 
    color: theme.colors.text,
    marginRight: 14
  }, 
  footer:{
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 5,
  },
  footerText: {
    textAlign: 'center', 
    color: theme.colors.text, 
    fontSize: hp(1.6)
  }
})