import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  DevSettings,
  Linking,
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

  // WhatsApp group links
  const COMMUNITY_WHATSAPP_LINK = "https://chat.whatsapp.com/FBWhvCMDwMDBp2EV7ZKfHQ";
  const HELP_WHATSAPP_LINK = "https://chat.whatsapp.com/KlRsYEmS6qyIRGQ46pHQZA";

  // Function to open WhatsApp links
  const openWhatsAppLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "WhatsApp is not installed on your device or the link is invalid.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error opening WhatsApp link:", error);
      Alert.alert(
        "Error",
        "Could not open WhatsApp. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };

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
          onPress={() => openWhatsAppLink(COMMUNITY_WHATSAPP_LINK)}
        />

        {/* More Info Section */}
        <SectionTitle title="More info and support" />
        <View style={styles.section}>
          <SettingItem
            icon="help"
            title="Help"
            onPress={() => openWhatsAppLink(HELP_WHATSAPP_LINK)}
          />
          <SettingItem
            icon="policy"
            title="Privacy Center"
            onPress={() => {}}
          />
          <SettingItem
            icon="acctstat"
            title="Account Status"
            onPress={() => {}}
          />
          <SettingItem
            icon="community"
            title="About"
            onPress={() => {}}
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

export default ProfileSettings;

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