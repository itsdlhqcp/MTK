import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Linking, ImageBackground } from 'react-native'
import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import Icon from '@/assets/icons'
import Input from "../components/Input"
import { supabase } from '@/lib/supabase'
import { useToast } from '../contexts/ToastContext'

const SignUp = () => {
  const router = useRouter(); 
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  // Form validation states
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    server: '',
    terms: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Colors matching the design
  const colors = {
    red: '#E50914',
    darkRed: '#8B0000',
    blue: '#0066B1',
    darkBlue: '#00284D',
    darkBackground: '#0A0A0A',
    lightText: '#e0e0e0',
    inputBorder: '#444444',
    placeholderText: '#888888',
  };

  // Privacy policy link handler
  const openPrivacyPolicy = () => {
    Linking.openURL('https://sites.google.com/view/plottwist-privacy-policy/home?authuser=1');
  };

  // Terms of service link handler
  const openTermsOfService = () => {
    // Add your terms of service URL here
    Linking.openURL('https://sites.google.com/view/plottwist-terms-and-conditions/home?authuser=1');
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

  // Handle input changes with validation
  const handleNameChange = (value) => {
    setName(value);
    setErrors(prev => ({...prev, name: '', server: ''}));
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    setErrors(prev => ({...prev, email: '', server: ''}));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({...prev, password: ''}));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle checkbox toggles
  const toggleTermsAcceptance = () => {
    setAcceptTerms(!acceptTerms);
    if (!acceptTerms) {
      setErrors(prev => ({...prev, terms: ''}));
    }
  };

  const togglePrivacyAcceptance = () => {
    setAcceptPrivacy(!acceptPrivacy);
    if (!acceptPrivacy) {
      setErrors(prev => ({...prev, terms: ''}));
    }
  };

  // Validate form
  const validateForm = () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const termsError = (!acceptTerms || !acceptPrivacy) ? 'Please accept the terms and privacy policy' : '';
    
    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
      terms: termsError,
      server: ''
    });

    return !nameError && !emailError && !passwordError && !termsError;
  };

  const onSubmit = async () => {
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
        if (error.message.includes("Database error saving new user") || 
            error.message.toLowerCase().includes("already exists") ||
            error.message.toLowerCase().includes("duplicate")) {
          setErrors(prev => ({
            ...prev, 
            email: 'The username cant be registered under this email',
            server: 'An account with this username already exists. Please use a different username or try logging in'
          }));
        } else {
          setErrors(prev => ({...prev, server: error.message}));
          showToast('error', error.message);
        }
      } else {
        showToast('success', 'Your account has been created successfully!!');
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        if (error.message.includes("Database error saving new user") ||
            error.message.toLowerCase().includes("already exists") ||
            error.message.toLowerCase().includes("duplicate")) {
          setErrors(prev => ({
            ...prev, 
            email: 'This email is already registered',
            server: 'An account with this email already exists. Please use a different email or try logging in.'
          }));
          showToast('error', 'This email is already registered');
        } else {
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
      
      {/* Background Image */}
      <ImageBackground
        source={require('../assets/grid-images/1734767810180SONIC.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark overlay for better text readability */}
        <View style={styles.overlay} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <BackButton router={router} iconColor={colors.lightText} />
            
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>Join PlotTwist</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Server error message */}
              {errors.server ? (
                <View style={styles.serverErrorContainer}>
                  <Text style={styles.serverErrorText}>{errors.server}</Text>
                </View>
              ) : null}
              
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="Email Address"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
              
              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="Username"
                  value={name}
                  onChangeText={handleNameChange}
                  inputStyle={styles.inputStyle}
                  containerStyle={[
                    styles.inputContainer,
                    errors.name ? styles.inputError : {}
                  ]}
                  placeholderTextColor={colors.placeholderText}
                />
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
              </View>
              
              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.passwordContainer}>
                  <Input
                    placeholder="Password"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
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
                      size={18} 
                      strokeWidth={1.6} 
                      color={colors.placeholderText} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>
              
              {/* Terms and Privacy Checkboxes */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={styles.checkboxRow} 
                  onPress={toggleTermsAcceptance}
                >
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                    {acceptTerms && (
                      <Icon name="check" size={12} strokeWidth={2} color="#333" />
                    )}
                  </View>
                  <Text style={styles.checkboxText}>
                   I confirm I have read and agree to the {' '}
                    <Text style={styles.linkText} onPress={openTermsOfService}>
                      Terms of Use 
                    </Text>
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.checkboxRow} 
                  onPress={togglePrivacyAcceptance}
                >
                  <View style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]}>
                    {acceptPrivacy && (
                      <Icon name="check" size={12} strokeWidth={2} color="#333" />
                    )}
                  </View>
                  <Text style={styles.checkboxText}>
                    I accept the{' '}
                    <Text style={styles.linkText} onPress={openPrivacyPolicy}>
                      Privacy Policy
                    </Text>
                    {' '}and acknowledge the data usage terms outlined
                  </Text>
                </TouchableOpacity>
              </View>
              
              {errors.terms ? (
                <Text style={styles.errorText}>{errors.terms}</Text>
              ) : null}
              
              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.signInButton}
                  onPress={() => router.push('login')}
                >
                  <Text style={styles.signInButtonText}>SIGN IN</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.goButton, (!acceptTerms || !acceptPrivacy) && styles.goButtonDisabled]}
                  onPress={onSubmit}
                  disabled={loading || !acceptTerms || !acceptPrivacy}
                >
                  <Text style={styles.goButtonText}>
                    {loading ? 'Creating...' : 'SIGN UP'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Artwork from{' '}
                <Text style={styles.footerLinkText}>Onward (2023)</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

export default SignUp;

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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: hp(2),
  },
  container: {
    flex: 1, 
    paddingHorizontal: wp(6),
    paddingTop: 85,
  },
  headerContainer: {
    marginTop: hp(6),
    marginBottom: hp(4),
  },
  headerTitle: {
    fontSize: hp(4),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'left',
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: hp(1.2),
    minHeight: hp(5),
  },
  inputStyle: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '400',
  },
  inputError: {
    borderBottomColor: '#E50914',
  },
  errorText: {
    color: '#E50914',
    fontSize: hp(1.4),
    marginTop: 5,
  },
  serverErrorContainer: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: '#E50914',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  serverErrorText: {
    color: '#E50914',
    fontSize: hp(1.4),
    textAlign: 'center',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 0,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  checkboxContainer: {
    marginTop: 20,
    gap: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  checkboxText: {
    flex: 1,
    fontSize: hp(1.6),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  linkText: {
    color: '#fff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  signInButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: hp(1.6),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  goButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 35,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  goButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goButtonText: {
    color: '#fff',
    fontSize: hp(1.6),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    alignItems: 'flex-start',
  },
  footerText: {
    fontSize: hp(1.3),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footerLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});