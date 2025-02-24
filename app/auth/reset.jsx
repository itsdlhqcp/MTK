// import { View, StyleSheet, Text, Alert } from 'react-native'
// import React, { useState, useEffect } from 'react'
// import { useLocalSearchParams } from 'expo-router'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { StatusBar } from 'expo-status-bar'
// import { hp, wp } from '@/helpers/common'
// import theme from '@/constants/theme'
// import Icon from '@/assets/icons'
// import Input from "@/components/Input"
// import Button from '@/components/Button'
// import { supabase } from '@/lib/supabase'

// export default function ResetPassword() {
//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [loading, setLoading] = useState(false)
//   const { token } = useLocalSearchParams()

//   const handleResetPassword = async () => {
//     if (!password || !confirmPassword) {
//       Alert.alert('Error', 'Please fill in all fields')
//       return
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match')
//       return
//     }

//     if (password.length < 6) {
//       Alert.alert('Error', 'Password must be at least 6 characters')
//       return
//     }

//     setLoading(true)
//     try {
//       const { error } = await supabase.auth.updateUser({
//         password: password
//       })

//       if (error) throw error

//       Alert.alert(
//         'Success',
//         'Your password has been reset successfully',
//         [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
//       )
//     } catch (error) {
//       Alert.alert('Error', error.message)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <ScreenWrapper bg="white">
//       <StatusBar style="dark" />
//       <View style={styles.container}>
//         <View>
//           <Text style={styles.welcomeText}>Reset</Text>
//           <Text style={styles.welcomeSmallText}>Password</Text>
//         </View>
//         <View style={styles.form}>
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="New Password"
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//           />
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="Confirm Password"
//             secureTextEntry
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//           />
//           <Button
//             loaderType="BarIndicator"
//             title="Reset Password"
//             loading={loading}
//             onPress={handleResetPassword}
//           />
//         </View>
//       </View>
//     </ScreenWrapper>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: wp(4),
//   },
//   welcomeText: {
//     fontSize: hp(4),
//     fontWeight: theme.fonts.bold,
//     color: theme.colors.primary,
//     marginTop: hp(4),
//   },
//   welcomeSmallText: {
//     fontSize: hp(3),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//   },
//   form: {
//     marginTop: hp(6),
//     gap: hp(2),
//   },
// })


// below code works fine in login state #####################################################

// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Text, Alert } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { StatusBar } from 'expo-status-bar';
// import { useAuth } from '../../contexts/AuthContext';
// import { hp, wp } from '@/helpers/common';
// import theme from '@/constants/theme';
// import Icon from '@/assets/icons';
// import Input from "@/components/Input";
// import Button from '@/components/Button';
// import { validatePassword } from '@/utils/validation';

// export default function ResetPasswordScreen() {
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
//   const { updatePassword, loading, resetSession } = useAuth();
//   const router = useRouter();
//   const { token } = useLocalSearchParams();

//   const handleResetPassword = async () => {
//     if (!password || !confirmPassword) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return;
//     }

//     const validationResult = validatePassword(password);
//     if (!validationResult.isValid) {
//       Alert.alert('Error', validationResult.message);
//       return;
//     }

//     try {
//       const { error, success } = await updatePassword(password);

//       if (error) throw error;

//       if (success) {
//         Alert.alert(
//           'Success',
//           'Your password has been reset successfully',
//           [{ text: 'OK', onPress: () => router.replace('/login') }]
//         );
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     }
//   };

//   useEffect(() => {
//     if (password) {
//       const strength = validatePassword(password);
//       setPasswordStrength(strength);
//     }
//   }, [password]);

//   // Redirect to login if no reset session is available
//   useEffect(() => {
//     if (!resetSession) {
//       router.replace('/home');
//     }
//   }, [resetSession]);

//   return (
//     <ScreenWrapper bg="white">
//       {/* Rest of your component JSX remains the same */}
//     </ScreenWrapper>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: wp(4),
//   },
//   welcomeText: {
//     fontSize: hp(4),
//     fontWeight: theme.fonts.bold,
//     color: theme.colors.primary,
//     marginTop: hp(4),
//   },
//   welcomeSmallText: {
//     fontSize: hp(3),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//   },
//   form: {
//     marginTop: hp(6),
//     gap: hp(2),
//   },
// })







/// updated rest but not forworking even both cases

// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Text, Alert } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { StatusBar } from 'expo-status-bar';
// import Input from "@/components/Input";
// import { hp, wp } from '@/helpers/common';
// import Icon from '@/assets/icons';
// import theme from '@/constants/theme';
// import Button from '@/components/Button';
// import { validatePassword } from '@/utils/validation';
// import { useAuth } from '@/contexts/AuthContext';
// import * as Linking from 'expo-linking';

// export default function ResetPasswordScreen() {
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
//   const [isValidatingToken, setIsValidatingToken] = useState(true);
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const { updatePassword, loginWithToken, loading } = useAuth();

//   // Validate tokens on mount
//   useEffect(() => {
//     const validateTokens = async () => {
//       try {
//         setIsValidatingToken(true);
        
//         // Get tokens from URL params
//         const tokens = {
//           access_token: params?.access_token,
//           refresh_token: params?.refresh_token
//         };

//         if (!tokens.access_token || !tokens.refresh_token) {
//           throw new Error('Missing reset tokens');
//         }

//         // Attempt to login with tokens to validate them
//         const { error } = await loginWithToken(tokens);
//         if (error) throw error;

//       } catch (error) {
//         console.error('Token validation error:', error);
//         Alert.alert(
//           'Error',
//           'Invalid or expired reset link. Please request a new password reset.',
//           [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
//         );
//       } finally {
//         setIsValidatingToken(false);
//       }
//     };

//     validateTokens();
//   }, []);

//   const handleResetPassword = async () => {
//     try {
//       // Basic validation
//       if (!password || !confirmPassword) {
//         throw new Error('Please fill in all fields');
//       }

//       if (password !== confirmPassword) {
//         throw new Error('Passwords do not match');
//       }

//       const validationResult = validatePassword(password);
//       if (!validationResult.isValid) {
//         throw new Error(validationResult.message);
//       }

//       // Get tokens from params
//       const tokens = {
//         access_token: params?.access_token,
//         refresh_token: params?.refresh_token
//       };

//       if (!tokens.access_token || !tokens.refresh_token) {
//         throw new Error('Invalid reset link. Please request a new password reset.');
//       }

//       const { error, success } = await updatePassword(
//         password,
//         tokens.access_token,
//         tokens.refresh_token
//       );

//       if (error) throw error;

//       if (success) {
//         Alert.alert(
//           'Success',
//           'Your password has been reset successfully',
//           [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
//         );
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
//     }
//   };

//   // Update password strength feedback
//   useEffect(() => {
//     if (password) {
//       const strength = validatePassword(password);
//       setPasswordStrength(strength);
//     }
//   }, [password]);

//   if (isValidatingToken) {
//     return (
//       <ScreenWrapper bg="white">
//         <View style={styles.container}>
//           <Text>Validating reset link...</Text>
//         </View>
//       </ScreenWrapper>
//     );
//   }

//   return (
//     <ScreenWrapper bg="white">
//       <StatusBar style="dark" />
//       <View style={styles.container}>
//         <View>
//           <Text style={styles.welcomeText}>Reset</Text>
//           <Text style={styles.welcomeSmallText}>Password</Text>
//         </View>
//         <View style={styles.form}>
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="New Password"
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//             textContentType="newPassword"
//             autoComplete="password-new"
//           />
//           {password && (
//             <Text style={[
//               styles.strengthIndicator,
//               { color: passwordStrength.score > 2 ? theme.colors.success : theme.colors.error }
//             ]}>
//               {passwordStrength.feedback}
//             </Text>
//           )}
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="Confirm Password"
//             secureTextEntry
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             textContentType="newPassword"
//             autoComplete="password-new"
//           />
//           <Button
//             loaderType="BarIndicator"
//             title="Reset Password"
//             loading={loading}
//             onPress={handleResetPassword}
//             disabled={!password || !confirmPassword || passwordStrength.score <= 2}
//           />
//         </View>
//       </View>
//     </ScreenWrapper>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: wp(4),
//   },
//   welcomeText: {
//     fontSize: hp(4),
//     fontWeight: theme.fonts.bold,
//     color: theme.colors.primary,
//     marginTop: hp(4),
//   },
//   welcomeSmallText: {
//     fontSize: hp(3),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//   },
//   form: {
//     marginTop: hp(6),
//     gap: hp(2),
//   },
// })

















































































































































































































































































































































































































































































































































































































//***** working code for */


// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Text, Alert } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { StatusBar } from 'expo-status-bar';
// import { hp, wp } from '@/helpers/common';
// import theme from '@/constants/theme';
// import Icon from '@/assets/icons';
// import Input from "@/components/Input";
// import Button from '@/components/Button';
// import { supabase } from '@/lib/supabase';
// import { validatePassword } from '@/utils/validation';

// export default function ResetPasswordScreen() {
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
//   const router = useRouter();
//   const { token } = useLocalSearchParams();

//   const handleResetPassword = async () => {
//     if (!password || !confirmPassword) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return;
//     }

//     const validationResult = validatePassword(password);
//     if (!validationResult.isValid) {
//       Alert.alert('Error', validationResult.message);
//       return;
//     }

//     setLoading(true);
//     try {
//       const { error } = await supabase.auth.updateUser({
//         password: password
//       });

//       if (error) throw error;

//       Alert.alert(
//         'Success',
//         'Your password has been reset successfully',
//         [{ text: 'OK', onPress: () => router.replace('/login') }]
//       );
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (password) {
//       const strength = validatePassword(password);
//       setPasswordStrength(strength);
//     }
//   }, [password]);

//   return (
//     <ScreenWrapper bg="white">
//       <StatusBar style="dark" />
//       <View style={styles.container}>
//         <View>
//           <Text style={styles.welcomeText}>Reset</Text>
//           <Text style={styles.welcomeSmallText}>Password</Text>
//         </View>
//         <View style={styles.form}>
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="New Password"
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//             textContentType="newPassword"
//             autoComplete="password-new"
//           />
//           {password && (
//             <Text style={[
//               styles.strengthIndicator,
//               { color: passwordStrength.score > 2 ? theme.colors.success : theme.colors.error }
//             ]}>
//               {passwordStrength.feedback}
//             </Text>
//           )}
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="Confirm Password"
//             secureTextEntry
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             textContentType="newPassword"
//             autoComplete="password-new"
//           />
//           <Button
//             loaderType="BarIndicator"
//             title="Reset Password"
//             loading={loading}
//             onPress={handleResetPassword}
//             disabled={!password || !confirmPassword || passwordStrength.score <= 2}
//           />
//         </View>
//       </View>
//     </ScreenWrapper>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: wp(4),
//   },
//   welcomeText: {
//     fontSize: hp(4),
//     fontWeight: theme.fonts.bold,
//     color: theme.colors.primary,
//     marginTop: hp(4),
//   },
//   welcomeSmallText: {
//     fontSize: hp(3),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//   },
//   form: {
//     marginTop: hp(6),
//     gap: hp(2),
//   },
// })










// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Text, Alert } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import ScreenWrapper from '@/components/ScreenWrapper';
// import { StatusBar } from 'expo-status-bar';
// import { hp, wp } from '@/helpers/common';
// import theme from '@/constants/theme';
// import Icon from '@/assets/icons';
// import Input from "@/components/Input";
// import Button from '@/components/Button';
// import { supabase } from '@/lib/supabase';
// import { validatePassword } from '@/utils/validation';

// export default function ResetPasswordScreen() {
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
//   const router = useRouter();
//   const { token } = useLocalSearchParams();

//   const handleResetPassword = async () => {
//     if (!password || !confirmPassword) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert('Error', 'Passwords do not match');
//       return;
//     }

//     const validationResult = validatePassword(password);
//     if (!validationResult.isValid) {
//       Alert.alert('Error', validationResult.message);
//       return;
//     }

//     setLoading(true);
//     try {
//       const { error, success } = await supabase.auth.updateUser({
//         password: password
//       });

//       if (error) throw error;

//       // Alert.alert(
//       //   'Success',
//       //   'Your password has been reset successfully',
//       //   [{ text: 'OK', onPress: () => router.replace('/login') }]
//       // );
//       if (success) {
//         Alert.alert(
//           'Success',
//           'Your password has been reset successfully',
//           [{ text: 'OK', onPress: () => router.replace('/login') }]
//         );
//       }
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (password) {
//       const strength = validatePassword(password);
//       setPasswordStrength(strength);
//     }
//   }, [password]);

//     // Redirect to login if no reset session is available
//     // useEffect(() => {
//     //   if (!resetSession) {
//     //     router.replace('/login');
//     //   }
//     // }, [resetSession]);

//   return (
//     <ScreenWrapper bg="white">
//       <StatusBar style="dark" />
//       <View style={styles.container}>
//         <View>
//           <Text style={styles.welcomeText}>Reset</Text>
//           <Text style={styles.welcomeSmallText}>Password</Text>
//         </View>
//         <View style={styles.form}>
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="New Password"
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//             textContentType="newPassword"
//             autoComplete="password-new"
//           />
//           {password && (
//             <Text style={[
//               styles.strengthIndicator,
//               { color: passwordStrength.score > 2 ? theme.colors.success : theme.colors.error }
//             ]}>
//               {passwordStrength.feedback}
//             </Text>
//           )}
//           <Input
//             icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
//             placeholder="Confirm Password"
//             secureTextEntry
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             textContentType="newPassword"
//             autoComplete="password-new"
//           />
//           <Button
//             loaderType="BarIndicator"
//             title="Reset Password"
//             loading={loading}
//             onPress={handleResetPassword}
//             disabled={!password || !confirmPassword || passwordStrength.score <= 2}
//           />
//         </View>
//       </View>
//     </ScreenWrapper>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: wp(4),
//   },
//   welcomeText: {
//     fontSize: hp(4),
//     fontWeight: theme.fonts.bold,
//     color: theme.colors.primary,
//     marginTop: hp(4),
//   },
//   welcomeSmallText: {
//     fontSize: hp(3),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text,
//   },
//   form: {
//     marginTop: hp(6),
//     gap: hp(2),
//   },
// })




import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '@/helpers/common';
import theme from '@/constants/theme';
import Icon from '@/assets/icons';
import Input from "@/components/Input";
import Button from '@/components/Button';
import { validatePassword } from '@/utils/validation';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  const { updatePassword, loading } = useAuth();
  const router = useRouter();
  const { token } = useLocalSearchParams();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const validationResult = validatePassword(password);
    if (!validationResult.isValid) {
      Alert.alert('Error', validationResult.message);
      return;
    }

    try {
      const { error, success } = await updatePassword(password);

      if (error) throw error;

      if (success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    if (password) {
      const strength = validatePassword(password);
      setPasswordStrength(strength);
    }
  }, [password]);

  // Redirect to login if no reset session is available
  // useEffect(() => {
  //   if (!resetSession) {
  //     router.replace('/home');
  //   }
  // }, [resetSession]);

  return (
    <ScreenWrapper bg="white">
    <StatusBar style="dark" />
    <View style={styles.container}>
      <View>
        <Text style={styles.welcomeText}>Reset</Text>
        <Text style={styles.welcomeSmallText}>Password</Text>
      </View>
      <View style={styles.form}>
        <Input
          icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
          placeholder="New Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          textContentType="newPassword"
          autoComplete="password-new"
        />
        {password && (
          <Text style={[
            styles.strengthIndicator,
            { color: passwordStrength.score > 2 ? theme.colors.success : theme.colors.error }
          ]}>
            {passwordStrength.feedback}
          </Text>
        )}
        <Input
          icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          textContentType="newPassword"
          autoComplete="password-new"
        />
        <Button
          loaderType="BarIndicator"
          title="Reset Password"
          loading={loading}
          onPress={handleResetPassword}
          disabled={!password || !confirmPassword || passwordStrength.score <= 2}
        />
      </View>
    </View>
  </ScreenWrapper>
  );
}

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
})