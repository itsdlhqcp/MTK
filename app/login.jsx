import { View, StyleSheet, Text, Pressable, StatusBar as RNStatusBar, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native'
import React, { useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import Icon from '@/assets/icons'
import Input from "../components/Input"
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getUserData } from '../services/userServices'

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  });
  const { checkUserStatus, setAuth, setUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Colors matching the new design
  const colors = {
    red: '#E50914',
    darkRed: '#8B0000',
    blue: '#0066B1',
    darkBlue: '#00284D',
    green: '#00C851',
    darkBackground: '#0A0A0A',
    lightText: '#FFFFFF',
    placeholderText: 'rgba(255, 255, 255, 0.7)',
    inputBackground: 'rgba(0, 0, 0, 0.3)',
    overlayColor: 'rgba(0, 0, 0, 0.6)',
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

      // Update auth context with user data first
      await setAuth(user);
      
      // Fetch and set user data
      const userDataRes = await getUserData(user.id);
      if (userDataRes.success) {
        await setUserData({ ...userDataRes.data, email: user.email });
      }
      
      // Check if user is new
      const isNew = await checkUserStatus(user.id);
      
      // Add delay to ensure state is updated
      await delay(300);
      
      // Show success toast
      showToast('success', 'Login successful!');
      
      // Navigate based on user status - use push instead of replace to avoid conflicts
      if (isNew) {
          router.dismissAll();
          router.push('/auth/newuserscreens/userpreferences');
      } else {
           router.dismissAll();
           router.push('/feeds');
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
      
      {/* Background Image with Overlay */}
      <ImageBackground 
        source={require('../assets/grid-images/space.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay for better text readability */}
        <View style={styles.overlay} />
        
        <View style={styles.container}>
          <BackButton router={router} iconColor={colors.lightText} />
          
          {/* Main Content Container */}
          <View style={styles.contentContainer}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Sign in to PlotTwist</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Username/Email Input */}
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="Email"
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
                  placeholderTextColor={colors.placeholderText}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>
              
              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.passwordContainer}>
                  <Input
                    placeholder="Password"
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
                    placeholderTextColor={colors.placeholderText}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={togglePasswordVisibility}
                  >
                    <Icon 
                      name={showPassword ? "eyeoff" : "eye"} 
                      size={22} 
                      strokeWidth={1.6} 
                      color={colors.placeholderText} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {/* JOIN Button */}
              <Pressable 
                style={styles.joinButton}
                onPress={() => router.push('signup')}
                disabled={loading}
              >
                <Text style={styles.joinButtonText}>JOIN</Text>
              </Pressable>
              
              {/* RESET PASSWORD Button */}
              <Pressable 
                style={styles.resetButton}
                onPress={() => router.push('/auth/forgot')}
                disabled={loading}
              >
                <Text style={styles.resetButtonText}>RESET PASSWORD</Text>
              </Pressable>
              
              {/* GO Button with Loading Indicator */}
              <Pressable 
                style={[
                  styles.goButton,
                  loading && styles.goButtonDisabled
                ]}
                onPress={onSubmit}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator 
                      size="small" 
                      color="#FFFFFF" 
                      style={styles.loadingSpinner}
                    />
                  </View>
                ) : (
                  <Text style={styles.goButtonText}>SIGN IN</Text>
                )}
              </Pressable>
            </View>

            {/* Footer Text */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Artwork by dlhq (2023)
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  )
}

export default Login

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1, 
    paddingHorizontal: wp(5),
    paddingTop: 50,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: hp(10),
  },
  titleContainer: {
    marginBottom: hp(4),
  },
  titleText: {
    fontSize: hp(4),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  form: {
    width: '100%',
    maxWidth: wp(85),
    gap: hp(2),
    marginBottom: hp(3),
  },
  inputWrapper: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 0,
    borderRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(1),
  },
  inputStyle: {
    color: '#FFFFFF',
    fontSize: hp(2),
    paddingHorizontal: 0,
  },
  inputError: {
    borderBottomColor: '#E50914',
  },
  errorText: {
    color: '#E50914',
    fontSize: hp(1.4),
    marginTop: 5,
    textAlign: 'left',
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
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: wp(85),
    gap: wp(3),
    marginTop: hp(2),
  },
  joinButton: {
    flex: 1,
    backgroundColor: 'rgba(150, 139, 139, 0.2)',
    paddingVertical: hp(1.8),
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1.5,
    backgroundColor: 'rgba(150, 139, 139, 0.2)',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(2),
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  goButton: {
    flex: 0.8,
    backgroundColor: '#00C851',
    paddingVertical: hp(1.8),
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButtonDisabled: {
    backgroundColor: '#00A644', 
  },
  goButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  footerContainer: {
    position: 'absolute',
    bottom: hp(3),
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: hp(1.4),
    textAlign: 'center',
  },
})

