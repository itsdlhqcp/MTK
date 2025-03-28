import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { supabase } from "@/lib/supabase";
import { updateUser } from '../services/userServices';
import { useAuth } from '../contexts/AuthContext';
import { StyleSheet } from 'react-native';
import theme from '@/constants/theme';
import { hp, wp } from '@/helpers/common';

const PhoneVerification = () => {
  const { user: currentUser, updateUserContext } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for countdown
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Effect to manage countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const sendOtp = async () => {
    // Phone number validation
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Send OTP via Supabase
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        throw error;
      }

      setOtpSent(true);
      // Set countdown to 25 seconds
      setCountdown(25);
      setCanResend(false);
      Alert.alert('OTP Sent', 'Please check your phone for the OTP');
    } catch (error: Error | any) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    // OTP validation
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      // Update user profile
      const updateResult = await updateUser(currentUser?.id, {
        phoneNumber: phoneNumber,
        phoneVerified: true
      });

      if (updateResult.success) {
        updateUserContext({
          ...currentUser,
          phoneNumber: phoneNumber,
          phoneVerified: true
        });

        Alert.alert('Success', 'Phone number verified successfully');
        
        // Reset state
        setOtpSent(false);
        setOtp('');
        setCountdown(0);
        setCanResend(false);
      } else {
        throw new Error(updateResult.msg);
      }
    } catch (error: Error | any) {
      setError(error.message || 'Unable to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {!otpSent ? (
          <View style={styles.inputContainer}>
            <View style={styles.phoneInputWrapper}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor={theme.colors.gray}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={sendOtp}
                disabled={loading}
              >
                <Text style={styles.sendButtonText}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : <Text style={styles.errorText}>Verify account by linking your phone number</Text>}
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.otpInputWrapper}>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={theme.colors.gray}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={verifyOtp}
                disabled={loading}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            {!canResend ? (
              <Text style={styles.countdownText}>
                Resend OTP after <Text style={styles.countdownNumber}>{countdown}</Text> seconds
              </Text>
            ) : (
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={sendOtp}
              >
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    backgroundColor: "",
  },
  content: {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    gap: hp(1.5),
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  otpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  phoneInput: {
    flex: 1,
    height: hp(6),
    paddingHorizontal: wp(3),
    fontSize: hp(2),
    color: theme.colors.dark,
  },
  otpInput: {
    flex: 1,
    height: hp(6),
    paddingHorizontal: wp(3),
    fontSize: hp(2),
    color: theme.colors.dark,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: hp(2),
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: hp(2),
  },
  errorText: {
    color: 'red',
    fontSize: hp(1.8),
    textAlign: 'center',
    marginTop: hp(1),
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: hp(1.5),
  },
  resendButtonText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: hp(2),
  },
  countdownText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    textAlign: 'center',
    marginTop: hp(1),
  },
  countdownNumber: {
    color: theme.colors.dark,
    fontWeight: 'bold',
  },
});

export default PhoneVerification;
// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   Alert, 
//   TouchableOpacity, 
//   KeyboardAvoidingView, 
//   Platform, 
//   ScrollView 
// } from 'react-native';
// import { supabase } from "@/lib/supabase";
// import { updateUser } from '../services/userServices';
// import { useAuth } from '../contexts/AuthContext';
// import Icon from '../assets/icons';
// import { StyleSheet } from 'react-native';
// import theme from '@/constants/theme';
// import { hp, wp } from '@/helpers/common';
// import { TextInput } from 'react-native';

// const PhoneVerification = () => {
//   const { user: currentUser, updateUserContext } = useAuth();
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const sendOtp = async () => {
//     // Validate phone number (basic validation)
//     if (!phoneNumber || phoneNumber.length < 10) {
//       setError('Please enter a valid phone number');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');
      
//       // Use Supabase Auth to send OTP
//       const { data, error } = await supabase.auth.signInWithOtp({
//         phone: phoneNumber,
//       });

//       if (error) {
//         throw error;
//       }

//       setOtpSent(true);
//       Alert.alert('OTP Sent', 'Please check your phone for the OTP');
//     } catch (error) {
//       setError(error.message || 'Failed to send OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verifyOtp = async () => {
//     // Validate OTP
//     if (!otp || otp.length !== 6) {
//       setError('Please enter a valid 6-digit OTP');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');

//       // Verify OTP using Supabase Auth
//       const { data, error } = await supabase.auth.verifyOtp({
//         phone: phoneNumber,
//         token: otp,
//         type: 'sms'
//       });

//       if (error) {
//         throw error;
//       }

//       // Update user profile with verified phone number
//       const updateResult = await updateUser(currentUser?.id, {
//         phoneNumber: phoneNumber,
//         phoneVerified: true
//       });

//       if (updateResult.success) {
//         // Update user context
//         updateUserContext({
//           ...currentUser,
//           phoneNumber: phoneNumber,
//           phoneVerified: true
//         });

//         Alert.alert('Success', 'Phone number verified successfully');
        
//         // Reset state
//         setOtpSent(false);
//         setOtp('');
//       } else {
//         throw new Error(updateResult.msg);
//       }
//     } catch (error) {
//       setError(error.message || 'Unable to verify OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView 
//         contentContainerStyle={styles.scrollContainer}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View style={styles.verificationContainer}>
//           <Text style={styles.title}>
//             {!otpSent ? 'Verify Phone Number' : 'Enter OTP'}
//           </Text>
          
//           {!otpSent ? (
//             <View style={styles.inputContainer}>
//               <View style={styles.iconInputWrapper}>
//                 <Icon name="call" style={styles.icon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter your phone number"
//                   placeholderTextColor={theme.colors.gray}
//                   value={phoneNumber}
//                   onChangeText={setPhoneNumber}
//                   keyboardType="phone-pad"
//                   editable={!otpSent}
//                 />
//               </View>
              
//               {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
//               <TouchableOpacity 
//                 style={styles.primaryButton} 
//                 onPress={sendOtp}
//                 disabled={loading}
//               >
//                 <Text style={styles.buttonText}>
//                   {loading ? 'Sending...' : 'Send OTP'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View style={styles.inputContainer}>
//               <View style={styles.iconInputWrapper}>
//                 <Icon name="lock" style={styles.icon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Enter 6-digit OTP"
//                   placeholderTextColor={theme.colors.gray}
//                   value={otp}
//                   onChangeText={setOtp}
//                   keyboardType="numeric"
//                   maxLength={6}
//                 />
//               </View>
              
//               {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
//               <View style={styles.buttonGroup}>
//                 <TouchableOpacity 
//                   style={styles.primaryButton} 
//                   onPress={verifyOtp}
//                   disabled={loading}
//                 >
//                   <Text style={styles.buttonText}>
//                     {loading ? 'Verifying...' : 'Verify OTP'}
//                   </Text>
//                 </TouchableOpacity>
                
//                 <TouchableOpacity 
//                   style={styles.secondaryButton} 
//                   onPress={sendOtp}
//                 >
//                   <Text style={styles.secondaryButtonText}>Resend OTP</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//     paddingBottom: wp(9),
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     paddingHorizontal: wp(5),
//   },
//   verificationContainer: {
//     backgroundColor: 'white',
//     borderRadius: theme.radius.xl,
//     padding: wp(6),
//     shadowColor: theme.colors.dark,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   title: {
//     fontSize: hp(3),
//     fontWeight: 'bold',
//     color: theme.colors.dark,
//     textAlign: 'center',
//     marginBottom: hp(3),
//   },
//   inputContainer: {
//     gap: hp(2),
//   },
//   iconInputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: theme.colors.border,
//     borderRadius: theme.radius.lg,
//     paddingHorizontal: wp(4),
//   },
//   icon: {
//     marginRight: wp(3),
//     color: theme.colors.primary,
//   },
//   input: {
//     flex: 1,
//     height: hp(6),
//     fontSize: hp(2),
//     color: theme.colors.dark,
//   },
//   errorText: {
//     color: theme.colors.error,
//     fontSize: hp(1.8),
//     textAlign: 'center',
//     marginTop: hp(1),
//   },
//   buttonGroup: {
//     gap: hp(2),
//   },
//   primaryButton: {
//     backgroundColor: theme.colors.primary,
//     height: hp(6.6),
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: theme.radius.xl,
//   },
//   secondaryButton: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: theme.colors.primary,
//     height: hp(6.6),
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: theme.radius.xl,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: hp(2.5),
//     fontWeight: 'bold',
//   },
//   secondaryButtonText: {
//     color: theme.colors.primary,
//     fontSize: hp(2.5),
//     fontWeight: 'bold',
//   },
// });

// export default PhoneVerification;

// import React, { useState } from 'react';
// import { Alert, View } from 'react-native';
// import { supabase } from "@/lib/supabase";
// import Input from '@/components/Input';
// import Button from '@/components/Button';
// import { updateUser } from '../services/userServices';
// import { useAuth } from '../contexts/AuthContext';
// import Icon from '../assets/icons';

// const PhoneVerification = () => {
//   const { user: currentUser, updateUserContext } = useAuth();
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [otp, setOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const sendOtp = async () => {
//     // Validate phone number (basic validation)
//     if (!phoneNumber || phoneNumber.length < 10) {
//       Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
//       return;
//     }

//     try {
//       setLoading(true);
      
//       // Use Supabase Auth to send OTP
//       const { data, error } = await supabase.auth.signInWithOtp({
//         phone: phoneNumber,
//       });

//       if (error) {
//         throw error;
//       }

//       setOtpSent(true);
//       Alert.alert('OTP Sent', 'Please check your phone for the OTP');
//     } catch (error) {
//       Alert.alert('Error', error.message || 'Failed to send OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verifyOtp = async () => {
//     // Validate OTP
//     if (!otp || otp.length !== 6) {
//       Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
//       return;
//     }

//     try {
//       setLoading(true);

//       // Verify OTP using Supabase Auth
//       const { data, error } = await supabase.auth.verifyOtp({
//         phone: phoneNumber,
//         token: otp,
//         type: 'sms'
//       });

//       if (error) {
//         throw error;
//       }

//       // Update user profile with verified phone number
//       const updateResult = await updateUser(currentUser?.id, {
//         phoneNumber: phoneNumber,
//         phoneVerified: true
//       });

//       if (updateResult.success) {
//         // Update user context
//         updateUserContext({
//           ...currentUser,
//           phoneNumber: phoneNumber,
//           phoneVerified: true
//         });

//         Alert.alert('Success', 'Phone number verified successfully');
        
//         // Reset state
//         setOtpSent(false);
//         setOtp('');
//       } else {
//         throw new Error(updateResult.msg);
//       }
//     } catch (error) {
//       Alert.alert('Verification Failed', error.message || 'Unable to verify OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View>
//       <Input
//         icon={<Icon name="call" />}
//         placeholder="Enter your phone number"
//         value={phoneNumber}
//         onChangeText={setPhoneNumber}
//         keyboardType="phone-pad"
//         editable={!otpSent}
//       />
      
//       {!otpSent ? (
//         <Button 
//           title="Send OTP" 
//           onPress={sendOtp} 
//           loading={loading}
//         />
//       ) : (
//         <>
//           <Input
//             placeholder="Enter 6-digit OTP"
//             value={otp}
//             onChangeText={setOtp}
//             keyboardType="numeric"
//             maxLength={6}
//           />
//           <Button 
//             title="Verify OTP" 
//             onPress={verifyOtp} 
//             loading={loading}
//           />
//           <Button 
//             title="Resend OTP" 
//             onPress={sendOtp} 
//             variant="outline"
//           />
//         </>
//       )}
//     </View>
//   );
// };

// export default PhoneVerification;