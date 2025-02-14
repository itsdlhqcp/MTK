import { View, StyleSheet, Text, Alert } from 'react-native'
import React, { Component } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '@/constants/theme'
import Icon from '@/assets/icons'
import Input from "../../components/Input"
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'

class Forgot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      email: ''
    };
    this.router = props.router;
  }

  validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  handleResetPassword = async () => {
    if (!this.state.email) {
      Alert.alert("Reset Password", "Please enter your email address");
      return;
    }
  
    const email = this.state.email.trim();
    
    if (!this.validateEmail(email)) {
      Alert.alert("Reset Password", "Please enter a valid email address");
      return;
    }
  
    this.setState({ loading: true });
  
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'exp://192.168.0.101:8081/auth/reset-password',  
      });
  
      if (error) throw error;
  
      Alert.alert(
        "Reset Password",
        "If an account exists with this email, you will receive password reset instructions.",
        [{ text: "OK", onPress: () => this.router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    return (
      <ScreenWrapper bg="white">
        <StatusBar style="dark"/>
        <View style={styles.container}>
          <BackButton router={this.router}/>
          <View>
            <Text style={styles.welcomeText}>Forgot</Text>
            <Text style={styles.welcomeSmallText}>Password?</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.instructionText}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
            <Input
              icon={<Icon name="mail" size={26} strokeWidth={1.6}/>}
              placeholder="Enter your email"
              onChangeText={value => this.setState({ email: value })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button 
              loaderType="BarIndicator" 
              title="Send Reset Link" 
              loading={this.state.loading} 
              onPress={this.handleResetPassword}
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(4),
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    marginTop: hp(4),
  },
  welcomeSmallText: {
    fontSize: hp(3),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  form: {
    marginTop: hp(6),
    gap: hp(2),
  },
  instructionText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
    marginBottom: hp(2),
  },
});

// Since we can't use hooks in class components, we need a wrapper
const ForgotWithRouter = (props) => {
  const router = useRouter();
  return <Forgot {...props} router={router} />;
};

export default ForgotWithRouter;