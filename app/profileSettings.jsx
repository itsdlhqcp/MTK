import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';
import theme from '../constants/theme';
import { supabase } from '../lib/supabase'
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';
import Header from '../components/Header';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const SettingItem = ({ icon, title, onPress, color }) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={onPress}
  >
    <View style={styles.settingItemLeft}>
      <Icon name="plus" size={24} color={color || theme.colors.text} />
      <Text style={[styles.settingItemText, { color: color || theme.colors.text }]}>
        {title}
      </Text>
    </View>
    <Icon name="edit" size={20} color={theme.colors.textLight} />
  </TouchableOpacity>
);

const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const ProfileSettings = () => {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // const onLogout = async () => {
  //   Alert.alert('Confirm', 'Are you sure you want to logout?', [
  //     {
  //       text: 'Cancel',
  //       style: 'cancel'
  //     },
  //     {
  //       text: 'Logout',
  //       style: 'destructive',
  //       onPress: async () => {
  //         try {
  //           setLoading(true);
  //           const { error } = await supabase.auth.signOut();
  //           if (error) throw error;
  //           // setAuth(null);
  //         //  router.push('/login');
  //            router.setParams({});   
  //         } catch (error) {
  //           console.error('Logout error:', error.message);
  //           return { error };
  //         } finally {
  //           setLoading(false);
  //         }
  //       }
  //     }
  //   ]);
  // };

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
            // Use the logout function from AuthContext which handles both
            // secure storage clearing and Supabase signOut
            const { error, success } = await logout();
            
            if (error) throw error;
            
            if (success) {
              // No need to call setAuth(null) as it's handled in the logout function
              router.setParams({});
              // router.replace('/login');  // Navigate to login screen after logout
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
    <ScreenWrapper bg="white">
      <Header title="Settings and activity" showBackButton={true} />
      <ScrollView style={styles.container}>
        {/* Orders and Payments Section */}
        <SettingItem
          icon="credit-card"
          title="Join the community"
          onPress={() => router.push('/orders')}
        />

        {/* More Info Section */}
        <SectionTitle title="More info and support" />
        <View style={styles.section}>
          <SettingItem
            icon="help-circle"
            title="Help"
            onPress={() => router.push('/help')}
          />
          <SettingItem
            icon="shield"
            title="Privacy Center"
            onPress={() => router.push('/privacy')}
          />
          <SettingItem
            icon="user"
            title="Account Status"
            onPress={() => router.push('/account-status')}
          />
          <SettingItem
            icon="info"
            title="About"
            onPress={() => router.push('/about')}
          />
        </View>

        {/* Connected Apps Section */}
        {/* <SectionTitle title="Also from Meta" />
        <View style={styles.section}>
          <SettingItem
            icon="message-circle"
            title="WhatsApp"
            onPress={() => {}}
          />
          <SettingItem
            icon="edit"
            title="Edits"
            onPress={() => {}}
          />
          <SettingItem
            icon="hash"
            title="Threads"
            onPress={() => {}}
          />
          <SettingItem
            icon="facebook"
            title="Facebook"
            onPress={() => {}}
          />
        </View> */}

        {/* Login Section */}
        <SectionTitle title="Login" />
        <View style={styles.section}>
          <SettingItem
            icon="plus-circle"
            title="Reset password (coming soon)"
            onPress={() => {}}
          />
          <SettingItem
            icon="log-out"
            title="Log out"
            onPress={onLogout}
            color={theme.colors.error}
          />
          {/* <SettingItem
            icon="users"
            title="Log out all accounts"
            onPress={onLogout}
            color={theme.colors.error}
          /> */}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  section: {
    marginBottom: hp(3),
    backgroundColor: 'white',
    borderRadius: theme.radius.sm,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '500',
    color: theme.colors.text,
    marginVertical: hp(2),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  settingItemText: {
    fontSize: hp(2),
    color: theme.colors.text,
  },
});

export default ProfileSettings;