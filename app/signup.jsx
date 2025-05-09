import { View, StyleSheet, Text, Pressable, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '@/constants/theme'
import Icon from '@/assets/icons'
import Input from "../components/Input"
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useToast } from '../contexts/ToastContext'

const SignUp = () => {
  const router = useRouter(); 
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Form validation states
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    server: '' // Added server error field for API-related errors
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Colors matching the login page
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

  // Validation functions
  const validateName = (value) => {
    if (!value || value.trim().length < 3) {
      return 'Name must be at least 3 characters long';
    }
    return '';
  };

  const validateEmail = (value) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!value || value.trim() === "") {
      return "Email is required";
    } else if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return '';
  };

  const validatePassword = (value) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    if (!value || value.trim() === "") {
      return "Password is required";
    } else if (!passwordRegex.test(value)) {
      return 'Password should be 6-20 characters with at least one number, one lowercase, and one uppercase letter';
    }
    return '';
  };

  const validateConfirmPassword = (value) => {
    if (!value || value.trim() === "") {
      return "Please confirm your password";
    } else if (value !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  // Handle input changes with validation
  const handleNameChange = (value) => {
    setName(value);
    // Clear name and server errors when user starts typing again
    setErrors(prev => ({...prev, name: '', server: ''}));
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    // Clear email and server errors when user starts typing again
    setErrors(prev => ({...prev, email: '', server: ''}));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({...prev, password: ''}));
    }
    // Also validate confirm password if it has a value
    if (confirmPassword) {
      const confirmError = value !== confirmPassword ? 'Passwords do not match' : '';
      setErrors(prev => ({...prev, confirmPassword: confirmError}));
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: ''}));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Validate form
  const validateForm = () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      server: '' // Clear any server errors when validating the form
    });

    return !nameError && !emailError && !passwordError && !confirmPasswordError;
  };

  const onSubmit = async () => {
    // Clear any previous server errors
    setErrors(prev => ({...prev, server: ''}));
    
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
  
    try {
      const {data: {session}, error} = await supabase.auth.signUp({
        email: email.trim(), 
        password: password.trim(),
        options: {
          data: {
            name: name.trim()
          }
        }
      });
      
      if (error) {
        // Check if error message contains indication of duplicate/existing user
        if (error.message.includes("Database error saving new user") || 
            error.message.toLowerCase().includes("already exists") ||
            error.message.toLowerCase().includes("duplicate")) {
          // Set email validation error instead of showing Alert
          setErrors(prev => ({
            ...prev, 
            email: 'The username cant be registered under this email',
            server: 'An account with this username already exists. Please use a different username or try logging in'
          }));
        } else {
          // For other errors, display them in the server error field
          setErrors(prev => ({...prev, server: error.message}));
          showToast('error', error.message);
        }
      } else {
        // Success case - show toast and redirect
        showToast('success', 'Your account has been created successfully!!');
        setTimeout(() => {
          router.replace('/login');
        }, 1500); // Give the toast time to be seen before navigation
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes("Database error saving new user") ||
            error.message.toLowerCase().includes("already exists") ||
            error.message.toLowerCase().includes("duplicate")) {
          // Set email validation error instead of showing Alert
          setErrors(prev => ({
            ...prev, 
            email: 'This email is already registered',
            server: 'An account with this email already exists. Please use a different email or try logging in.'
          }));
          showToast('error', 'This email is already registered');
        } else {
          // For other errors, display them in the server error field
          setErrors(prev => ({...prev, server: error.message}));
          showToast('error', error.message);
        }
      } else {
        setErrors(prev => ({...prev, server: 'An unexpected error occurred. Please try again later.'}));
        showToast('error', 'An unexpected error occurred. Please try again later.');
      }
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
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <BackButton router={router} iconColor={colors.lightText} />
          
          {/* welcome */}
          <View>
            <Text style={styles.welcomeText}>
              <Text style={{color: colors.red}}>Let's,</Text>
            </Text>
            <Text style={styles.welcomeSmallText}>Get Started</Text>
          </View>

          {/* form */}
          <View style={styles.form}>
            <Text style={{fontSize: hp(1.5), color: colors.lightText}}>
              Please fill the details to create an account
            </Text>
            
            {/* Server error message - displays any API or server-related errors */}
            {errors.server ? (
              <View style={styles.serverErrorContainer}>
                <Text style={styles.serverErrorText}>{errors.server}</Text>
              </View>
            ) : null}
            
            {/* Name Input */}
            <View>
              <Input
                icon={<Icon name="user" size={26} strokeWidth={1.6} color={colors.lightText} />}
                placeholder="Enter username"
                value={name}
                onChangeText={handleNameChange}
                inputStyle={styles.inputStyle}
                containerStyle={[
                  styles.inputContainer,
                  errors.name ? styles.inputError : {}
                ]}
                placeholderTextColor="rgba(224, 224, 224, 0.7)"
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>
            
            {/* Email Input */}
            <View>
              <Input
                icon={<Icon name="mail" size={26} strokeWidth={1.6} color={colors.lightText} />}
                placeholder="Enter your email"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
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
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
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
            
            {/* Confirm Password Input */}
            <View>
              <View style={styles.passwordContainer}>
                <Input
                  icon={<Icon name="lock" size={26} strokeWidth={1.6} color={colors.lightText} />}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                  inputStyle={styles.inputStyle}
                  containerStyle={[
                    styles.inputContainer,
                    styles.passwordInput,
                    errors.confirmPassword ? styles.inputError : {}
                  ]}
                  placeholderTextColor="rgba(224, 224, 224, 0.7)"
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={toggleConfirmPasswordVisibility}
                >
                  <Icon 
                    name={showConfirmPassword ? "eyeoff" : "eye"} 
                    size={22} 
                    strokeWidth={1.6} 
                    color={colors.lightText} 
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>
            
            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to our 
                <Text style={{color: colors.blue, fontWeight: theme.fonts.semibold}}> Terms of Service </Text> 
                and 
                <Text style={{color: colors.blue, fontWeight: theme.fonts.semibold}}> Privacy Policy</Text>
              </Text>
            </View>
            
            {/* SignUp Button */}
            <Button 
              loaderType="BarIndicator" 
              title="Sign Up" 
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
              Already have an Account?
            </Text>
            <Pressable onPress={() => router.push('login')}>
              <Text style={[styles.footerText, { 
                color: colors.blue, 
                fontWeight: theme.fonts.semibold,
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 0.5, height: 0.5 },
                textShadowRadius: 1,
              }]}>
                Login
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignUp;

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
    gap: 30, 
    paddingHorizontal: wp(5),
    paddingTop: 55,
    paddingBottom: hp(3),
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
  inputWithIconContainer: {
    position: 'relative',
  },
  inputStyle: {
    color: '#e0e0e0',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#E50914',
  },
  inputSuccess: {
    borderWidth: 1,
    borderColor: '#4BB543',
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
  serverErrorContainer: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: '#E50914',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  serverErrorText: {
    color: '#E50914',
    fontSize: hp(1.4),
    textAlign: 'center',
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
  statusIcon: {
    position: 'absolute',
    right: 15,
    top: 0,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  termsContainer: {
    marginVertical: hp(1),
  },
  termsText: {
    fontSize: hp(1.4),
    color: '#e0e0e0',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  footer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 5,
    marginTop: hp(3),
  },
  footerText: {
    textAlign: 'center', 
    color: '#e0e0e0', 
    fontSize: hp(1.6),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  }
});