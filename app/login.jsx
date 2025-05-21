import { View, StyleSheet, Text, Pressable, StatusBar as RNStatusBar, TouchableOpacity } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '@/constants/theme'
import Icon from '@/assets/icons'
import Input from "../components/Input"
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { LinearGradient } from 'expo-linear-gradient'
import { useToast } from '../contexts/ToastContext'
import { navigate } from 'expo-router/build/global-state/routing'

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });
  const { checkUserStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Colors matching the welcome page
  const colors = {
    red: '#E50914',
    darkRed: '#8B0000',
    blue: '#0066B1',
    darkBlue: '#00284D',
    darkBackground: '#0A0A0A',
    gradientStart: '#00284D', // Dark blue shade
    gradientMiddle: '#141414', // Very dark gray/near black
    gradientEnd: '#8B0000', // Dark red shade
    lightText: '#e0e0e0',
  };

  // Helper function to create a delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || email.trim() === "") {
      return "Email is required";
    } else if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // Validate password
  const validatePassword = (password) => {
    if (!password || password.trim() === "") {
      return "Password is required";
    } else if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validate form
  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({
      email: emailError,
      password: passwordError
    });

    return !emailError && !passwordError;
  };

  const onSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
      });

      if (error) throw error;

      // Check if user is new
      const isNew = await checkUserStatus(user.id);
      
      // Add delay before navigation
      await delay(200);
      
      // Show success toast
      showToast('success', 'Login successful!');
      
      // Navigate based on user status
      if (isNew) {
          router.replace('/auth/newuserscreens/userpreferences');
      } else {
           router.dismissAll();
           router.replace('/home');
      }
    } catch (error) {
        showToast('error', error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* Main background gradient */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.container}>
        <BackButton router={router} iconColor={colors.lightText} />
        
        {/* welcome */}
        <View>
          <Text style={styles.welcomeText}>
            <Text style={{color: colors.red}}>Hey,</Text>
          </Text>
          <Text style={styles.welcomeSmallText}>Welcome Back</Text>
        </View>

        {/* form */}
        <View style={styles.form}>
          <Text style={{fontSize: hp(1.5), color: colors.lightText}}>
            Please login to continue
          </Text>
          
          {/* Email Input */}
          <View>
            <Input
              icon={<Icon name="mail" size={26} strokeWidth={1.6} color={colors.lightText} />}
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors(prev => ({...prev, email: ""}));
                }
              }}
              inputStyle={styles.inputStyle}
              containerStyle={[
                styles.inputContainer,
                errors.email ? styles.inputError : {}
              ]}
              placeholderTextColor="rgba(224, 224, 224, 0.7)"
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>
          
          {/* Password Input */}
          <View>
            <View style={styles.passwordContainer}>
              <Input
                icon={<Icon name="lock" size={26} strokeWidth={1.6} color={colors.lightText} />}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) {
                    setErrors(prev => ({...prev, password: ""}));
                  }
                }}
                inputStyle={styles.inputStyle}
                containerStyle={[
                  styles.inputContainer,
                  styles.passwordInput,
                  errors.password ? styles.inputError : {}
                ]}
                placeholderTextColor="rgba(224, 224, 224, 0.7)"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={togglePasswordVisibility}
              >
                <Icon 
                  name={showPassword ? "eyeoff" : "eye"} 
                  size={22} 
                  strokeWidth={1.6} 
                  color={colors.lightText} 
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>
          
          <Text style={styles.forgotPassword} onPress={() => router.push('/auth/forgot')}>
             Forgot password?</Text>
          
          {/* button */}
          <Button 
            loaderType="BarIndicator" 
            title="Login" 
            loading={loading} 
            onPress={onSubmit} 
            buttonStyle={{
              backgroundColor: colors.red,
              borderRadius: 10,
              elevation: 5,
            }}
            textStyle={{
              fontWeight: 'bold',
              fontSize: hp(1.8),
              color: colors.lightText,
            }}
          />
        </View>

        {/* footer */} 
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?
          </Text>
          <Pressable onPress={() => router.push('signup')}>
            <Text style={[styles.footerText, { 
              color: colors.blue, 
              fontWeight: theme.fonts.semibold,
              textShadowColor: 'rgba(0, 0, 0, 0.5)',
              textShadowOffset: { width: 0.5, height: 0.5 },
              textShadowRadius: 1,
            }]}>Sign up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

export default Login

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  container: {
    flex: 1, 
    gap: 45, 
    paddingHorizontal: wp(5),
    paddingTop:  80,
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold, 
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  }, 
  welcomeSmallText: {
    fontSize: hp(3.3),
    fontWeight: theme.fonts.bold, 
    color: '#e0e0e0', 
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  }, 
  form: {
    gap: 25,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0,
    borderRadius: 10,
  },
  inputStyle: {
    color: '#e0e0e0',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#E50914',
  },
  errorText: {
    color: '#E50914',
    fontSize: hp(1.4),
    marginTop: 5,
    marginLeft: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 0,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  forgotPassword: {
    textAlign: 'right', 
    fontWeight: theme.fonts.semibold, 
    color: '#e0e0e0',
    marginRight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  }, 
  footer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 5,
  },
  footerText: {
    textAlign: 'center', 
    color: '#e0e0e0', 
    fontSize: hp(1.6),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  }
})