import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, StatusBar as RNStatusBar, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import ScreenWrapper from '@/components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import BackButton from '@/components/BackButton';
import { useRouter } from 'expo-router';
import { hp, wp } from '@/helpers/common';
import theme from '@/constants/theme';
import Icon from '@/assets/icons';
import Input from "@/components/Input";
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { requestPasswordReset, loading } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState({
    email: ""
  });

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

  const validateEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || email.trim() === "") {
      return "Email is required";
    } else if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    
    setErrors({
      email: emailError
    });

    return !emailError;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const { error, success } = await requestPasswordReset(email.trim());

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (success) {
        Alert.alert(
          'Check Your Email',
          'If an account exists with this email, you will receive passwordless login instructions.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
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
            <Text style={{color: colors.red}}>Let's</Text>
          </Text>
          <Text style={styles.welcomeSmallText}>Authenticate</Text>
        </View>

        {/* form */}
        <View style={styles.form}>
          <Text style={{fontSize: hp(1.5), color: colors.lightText}}>
            Enter your email for passwordless login
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
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>
          
          <Text style={styles.instructionText}>
            We'll send you a magic link to sign in without a password
          </Text>
          
          {/* button */}
          <Button 
            loaderType="BarIndicator" 
            title="Send Magic Link" 
            loading={loading} 
            onPress={handleResetPassword} 
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
            Remember your password?
          </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={[styles.footerText, { 
              color: colors.blue, 
              fontWeight: theme.fonts.semibold,
              textShadowColor: 'rgba(0, 0, 0, 0.5)',
              textShadowOffset: { width: 0.5, height: 0.5 },
              textShadowRadius: 1,
            }]}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    gap: 45, 
    paddingHorizontal: wp(5),
    paddingTop: RNStatusBar.currentHeight || 20,
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
  instructionText: {
    fontSize: hp(1.5),
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