import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { supabase } from "@/lib/supabase";
import Input from '@/components/Input';
import { Button } from 'react-native';
import { updateUser } from '../services/userServices';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../assets/icons';

const PhoneVerification = () => {
  const { user: currentUser, updateUserContext } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    // Validate phone number (basic validation)
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      
      // Use Supabase Auth to send OTP
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        throw error;
      }

      setOtpSent(true);
      Alert.alert('OTP Sent', 'Please check your phone for the OTP');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    // Validate OTP
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);

      // Verify OTP using Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      // Update user profile with verified phone number
      const updateResult = await updateUser(currentUser?.id, {
        phoneNumber: phoneNumber,
        phoneVerified: true
      });

      if (updateResult.success) {
        // Update user context
        updateUserContext({
          ...currentUser,
          phoneNumber: phoneNumber,
          phoneVerified: true
        });

        Alert.alert('Success', 'Phone number verified successfully');
        
        // Reset state
        setOtpSent(false);
        setOtp('');
      } else {
        throw new Error(updateResult.msg);
      }
    } catch (error) {
      Alert.alert('Verification Failed', error.message || 'Unable to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Input
        icon={<Icon name="call" />}
        placeholder="Enter your phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        editable={!otpSent}
      />
      
      {!otpSent ? (
        <Button 
          title="Send OTP" 
          onPress={sendOtp} 
          loading={loading}
        />
      ) : (
        <>
          <Input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />
          <Button 
            title="Verify OTP" 
            onPress={verifyOtp} 
            loading={loading}
          />
          <Button 
            title="Resend OTP" 
            onPress={sendOtp} 
            variant="outline"
          />
        </>
      )}
    </View>
  );
};

export default PhoneVerification;