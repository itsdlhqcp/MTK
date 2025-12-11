import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '@/helpers/common';
import theme from '@/constants/theme';
import Icon from '@/assets/icons';
import Input from "@/components/Input";
import Button from '@/components/Button';
import { validatePassword } from '@/utils/validation';
import { useToast } from '../../contexts/ToastContext';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../components/BackButton';
import CustomAlert from '../../components/CustomAlert';
import { DevSettings } from 'react-native';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  const { updatePassword, loading, loadingProgress, error, clearError } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // For password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // States for custom alerts
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Colors matching Code X
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
  
  // Separate state to track if button should be disabled during loading
  const [buttonDisabled, setButtonDisabled] = useState(false);

  useEffect(() => {
    // Show custom alert for error messages
    if (error) {
      setErrorMessage(error);
      setErrorAlertVisible(true);
      clearError();
    }
  }, [error, clearError]);

  // Update button disabled state based on loading and error
  useEffect(() => {
    if (loading && error) {
      setButtonDisabled(true);
    } else if (!loading) {
      // Short timeout to ensure the loading state is completely finished
      setTimeout(() => setButtonDisabled(false), 300);
    }
  }, [loading, error]);

  useEffect(() => {
    if (password) {
      const strength = validatePassword(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [password]);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      setErrorAlertVisible(true);
      return;
    }
  
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setErrorAlertVisible(true);
      return;
    }
  
    const validationResult = validatePassword(password);
    if (!validationResult.isValid) {
      setErrorMessage(validationResult.message);
      setErrorAlertVisible(true);
      return;
    }
  
    try {
       // Only show success message if there's no error
       setSuccessAlertVisible(true);
      // Attempt to update password
      await updatePassword(password);
    
    } catch (error) {
      // Check if the error is about same password
      if (error.message === "New password should be different from the old password.") {
        // Show error alert
        setErrorMessage(error.message);
        setErrorAlertVisible(true);
      } else {
        // Log the error
        console.error('Password reset error:', error);
        
        // Show error alert
        setErrorMessage(error.message || 'Failed to reset password');
        setErrorAlertVisible(true);
      }
    }
  };

  const handleSuccessConfirm = () => {
    setSuccessAlertVisible(false);
    // Clear the password fields
    setPassword('');
    setConfirmPassword('');
    router.dismissAll();
    DevSettings.reload();
    router.replace('/home');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* Custom Alerts */}
      <CustomAlert
        visible={successAlertVisible}
        title="Success"
        message="Your password has been updated successfully"
        onCancel={handleSuccessConfirm}
        onConfirm={handleSuccessConfirm}
        cancelText="Cancel"
        confirmText="OK"
      />

      <CustomAlert
        visible={errorAlertVisible}
        title="Error"
        message={errorMessage}
        onCancel={() => setErrorAlertVisible(false)}
        onConfirm={() => setErrorAlertVisible(false)}
        cancelText="OK"
        confirmText="OK"
      />
      
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
          
          {/* Header */}
          <View>
            <Text style={styles.welcomeText}>
              <Text style={{color: colors.red}}>Reset</Text>
            </Text>
            <Text style={styles.welcomeSmallText}>Password</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={{fontSize: hp(1.5), color: colors.lightText}}>
              Please enter your new password below
            </Text>
            
            {/* Password Input */}
            <View>
              <View style={styles.passwordContainer}>
                <Input
                  icon={<Icon name="lock" size={26} strokeWidth={1.6} color={colors.lightText} />}
                  placeholder="New Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  inputStyle={styles.inputStyle}
                  containerStyle={[
                    styles.inputContainer,
                    styles.passwordInput
                  ]}
                  placeholderTextColor="rgba(224, 224, 224, 0.7)"
                  editable={!buttonDisabled}
                  textContentType="newPassword"
                  autoComplete="password-new"
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
              {password && (
                <Text style={[
                  styles.strengthIndicator,
                  { color: passwordStrength.score > 2 ? colors.blue : colors.red }
                ]}>
                  {passwordStrength.feedback}
                </Text>
              )}
            </View>
            
            {/* Confirm Password Input */}
            <View>
              <View style={styles.passwordContainer}>
                <Input
                  icon={<Icon name="lock" size={26} strokeWidth={1.6} color={colors.lightText} />}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  inputStyle={styles.inputStyle}
                  containerStyle={[
                    styles.inputContainer,
                    styles.passwordInput
                  ]}
                  placeholderTextColor="rgba(224, 224, 224, 0.7)"
                  editable={!buttonDisabled}
                  textContentType="newPassword"
                  autoComplete="password-new"
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
            </View>
            
            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must:</Text>
              <View style={styles.requirementItem}>
                <Icon 
                  name={password.length >= 8 ? "check" : "close"} 
                  size={16} 
                  color={password.length >= 8 ? colors.blue : colors.red} 
                />
                <Text style={[styles.requirementText, { color: password.length >= 8 ? colors.blue : colors.lightText }]}>
                  Be at least 8 characters long
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon 
                  name={/[A-Z]/.test(password) ? "check" : "close"} 
                  size={16} 
                  color={/[A-Z]/.test(password) ? colors.blue : colors.red} 
                />
                <Text style={[styles.requirementText, { color: /[A-Z]/.test(password) ? colors.blue : colors.lightText }]}>
                  Contain at least one uppercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon 
                  name={/[a-z]/.test(password) ? "check" : "close"} 
                  size={16} 
                  color={/[a-z]/.test(password) ? colors.blue : colors.red} 
                />
                <Text style={[styles.requirementText, { color: /[a-z]/.test(password) ? colors.blue : colors.lightText }]}>
                  Contain at least one lowercase letter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon 
                  name={/[0-9]/.test(password) ? "check" : "close"} 
                  size={16} 
                  color={/[0-9]/.test(password) ? colors.blue : colors.red} 
                />
                <Text style={[styles.requirementText, { color: /[0-9]/.test(password) ? colors.blue : colors.lightText }]}>
                  Contain at least one number
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon 
                  name={/[^A-Za-z0-9]/.test(password) ? "check" : "close"} 
                  size={16} 
                  color={/[^A-Za-z0-9]/.test(password) ? colors.blue : colors.red} 
                />
                <Text style={[styles.requirementText, { color: /[^A-Za-z0-9]/.test(password) ? colors.blue : colors.lightText }]}>
                  Contain at least one special character
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon 
                  name={password === confirmPassword && password ? "check" : "close"} 
                  size={16} 
                  color={password === confirmPassword && password ? colors.blue : colors.red} 
                />
                <Text style={[styles.requirementText, { color: password === confirmPassword && password ? colors.blue : colors.lightText }]}>
                  Passwords match
                </Text>
              </View>
            </View>
            
            {/* Reset Button */}
            <Button 
              loaderType="BarIndicator" 
              title={loading ? loadingProgress.status || "Processing..." : "Reset Password"} 
              loading={loading} 
              onPress={handleResetPassword}
              disabled={!password || !confirmPassword || passwordStrength.score <= 2 || buttonDisabled}
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

          {/* Footer */} 
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Remember your password?
            </Text>
            <Pressable onPress={() => router.push('profile')}>
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
}

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
  inputStyle: {
    color: '#e0e0e0',
  },
  strengthIndicator: {
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
  requirementsContainer: {
    padding: wp(4),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requirementsTitle: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
    marginBottom: hp(1.5),
    color: '#e0e0e0',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  requirementText: {
    fontSize: hp(1.5),
    marginLeft: wp(2),
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