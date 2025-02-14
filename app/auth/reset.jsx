import { View, StyleSheet, Text, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import ScreenWrapper from '@/components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { hp, wp } from '@/helpers/common'
import theme from '@/constants/theme'
import Icon from '@/assets/icons'
import Input from "@/components/Input"
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useLocalSearchParams()

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      Alert.alert(
        'Success',
        'Your password has been reset successfully',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      )
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

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
          />
          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Button
            loaderType="BarIndicator"
            title="Reset Password"
            loading={loading}
            onPress={handleResetPassword}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
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