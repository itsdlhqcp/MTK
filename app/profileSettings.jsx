import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  DevSettings,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';
import Header from '../components/Header';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Updated Instagram-style dark theme colors
const instagramTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#000000',
    backgroundSecondary: '#121212',
    text: '#FFFFFF',
    textLight: '#8E8E8E',
    border: '#262626',
    primary: '#3797EF', // Instagram blue
    error: '#ED4956', // Instagram red
  }
};

const SettingItem = ({ icon, title, onPress, color }) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
  >
    <View style={styles.settingItemLeft}>
      <Icon name={icon} size={24} color={color || instagramTheme.colors.text} />
      <Text style={[styles.settingItemText, { color: color || instagramTheme.colors.text }]}>
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const ProfileSettings = () => {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    Alert.alert('Confirm', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const { error, success } = await logout();
            if (error) throw error;
            if (success) {
              router.setParams({});
              router.replace('/welcome');
              DevSettings.reload();  
            }
          } catch (error) {
            console.error('Logout error:', error.message);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  // In ProfileSettings component (settings page)
  useFocusEffect(
    React.useCallback(() => {
      if (!user) {
        router.replace('/login');
      }
    }, [user])
  );

  return (
    <ScreenWrapper bg={instagramTheme.colors.background}>
      <Header 
        title="Settings and activity" 
        showBackButton={true} 
        textColor={instagramTheme.colors.text}
        backgroundColor={instagramTheme.colors.background}
      />
      <ScrollView style={styles.container}>
        {/* Orders and Payments Section */}
        <SettingItem
          icon="community"
          title="Join the community"
          onPress={() => router.push('/orders')}
        />

        {/* More Info Section */}
        <SectionTitle title="More info and support" />
        <View style={styles.section}>
          <SettingItem
            icon="help"
            title="Help"
            onPress={() => router.push('/help')}
          />
          <SettingItem
            icon="policy"
            title="Privacy Center"
            onPress={() => router.push('/privacy')}
          />
          <SettingItem
            icon="acctstat"
            title="Account Status"
            onPress={() => router.push('/account-status')}
          />
          <SettingItem
            icon="community"
            title="About"
            onPress={() => router.push('/about')}
          />
        </View>

        {/* Login Section */}
        <SectionTitle title="Login" />
        <View style={styles.section}>
          <SettingItem
            icon="rstpass"
            title="Reset password (coming soon)"
            onPress={() => {}}
          />
          <SettingItem
            icon="lgout"
            title="Log out"
            onPress={onLogout}
            color={instagramTheme.colors.error}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    backgroundColor: instagramTheme.colors.background,
  },
  section: {
    marginBottom: hp(3),
    backgroundColor: instagramTheme.colors.backgroundSecondary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: wp(2),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '500',
    color: instagramTheme.colors.textLight,
    marginVertical: hp(2),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: instagramTheme.colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  settingItemText: {
    fontSize: hp(2),
    color: instagramTheme.colors.text,
  },
});

export default ProfileSettings;