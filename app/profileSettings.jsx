import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  RefreshControl,
  Modal,
  Pressable,
  Animated,
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

// Custom Alert Component with Black Background
const CustomAlert = ({ visible, title, message, onCancel, onConfirm, cancelText, confirmText }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <View style={styles.alertButtonsContainer}>
            <Pressable
              style={[styles.alertButton, styles.alertCancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.alertCancelText}>{cancelText || 'Cancel'}</Text>
            </Pressable>
            <Pressable
              style={[styles.alertButton, styles.alertConfirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.alertConfirmText}>{confirmText || 'Confirm'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
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
  const [refreshing, setRefreshing] = useState(false);
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  // Community and help links
  const COMMUNITY_TELEGRAM_LINK = "https://t.me/PlotTwistCommunity";
  const HELP_EMAIL = "mailto:plotwistapk@gmail.com";

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Perform your refresh operations here
      // For example, you might want to fetch updated user data
      // or reload any dynamic content on the settings page
      
      // Simulating a network request with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // You can add any API calls or data refresh logic here
      // For example:
      // await refetchUserData();
      
      console.log('Settings screen refreshed');
      
      // Optional: Show a success message
      // Alert.alert('Success', 'Settings refreshed successfully');
    } catch (error) {
      console.error('Error refreshing settings:', error);
      // Optional: Show an error message
      // Alert.alert('Error', 'Failed to refresh settings');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Function to open external links (Telegram, email, etc.)
  const openExternalLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Could not open the link. Please make sure the required app is installed.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error opening link:", error);
      Alert.alert(
        "Error",
        "Could not open the link. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };

  // Function to handle logout with refresh
  const onLogout = async () => {
    // Show custom black alert instead of default Alert
    setLogoutAlertVisible(true);
  };

  // Function to execute the actual logout when confirmed
  const performLogout = async () => {
    try {
      setLoading(true);
      setRefreshing(true); // Start refresh animation
      
      // Perform logout
      const { error, success } = await logout();
      if (error) throw error;
      
      if (success) {
        // Clear any cached data or state if needed
        // For example, you might want to reset any app-wide state here
        
        // Force a full app refresh to ensure clean state
        // setTimeout(() => {
        //   // Use DevSettings.reload() for developmen
          
        //   // Navigate to welcome screen
        //   // Note: The navigation might not complete if the app reloads first
        //   router.push('/welcome');
        // }, 500);
      }
    } catch (error) {
      console.error('Logout error:', error.message);
      Alert.alert('Error', 'Failed to logout. Please try again.');
      setRefreshing(false); // Stop refresh animation on error
      setLoading(false);
    }
  };

  // In ProfileSettings component (settings page)
  useFocusEffect(
    React.useCallback(() => {
      if (!user) {
        router.dismissAll();
        router.replace('/onboardingGrid');
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
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={instagramTheme.colors.primary} // Color of the refresh spinner
            colors={[instagramTheme.colors.primary]} // Android
            progressBackgroundColor={instagramTheme.colors.backgroundSecondary} // Android
            title="Refreshing..." // iOS
            titleColor={instagramTheme.colors.textLight} // iOS
          />
        }
      >
        {/* Orders and Payments Section */}
        <SettingItem
          icon="community"
          title="Join the community"
          onPress={() => openExternalLink(COMMUNITY_TELEGRAM_LINK)}
        />

        {/* More Info Section */}
        <SectionTitle title="More info and support" />
        <View style={styles.section}>
           <SettingItem
            icon="acctstat"
            title="Account Status"
            onPress={() => router.push('/accountcontrol')}
          />
            <SettingItem
            icon="preferances"
            title="Update Preferences"
            onPress={() => router.push('/updatepreferences')}
          />
          <SettingItem
            icon="help"
            title="Help"
            onPress={() => openExternalLink(HELP_EMAIL)}
          />
          {/* <SettingItem
            icon="policy"
            title="Privacy Center"
            onPress={() => {}}
          /> */}
         
          <SettingItem
            icon="info"
            title="About"
            onPress={() => router.push('/about')}
          />
        </View>

        {/* Login Section */}
        <SectionTitle title="Account Settings" />
        <View style={styles.section}>
          <SettingItem
            icon="rstpass"
            title="Reset password"
            onPress={() => router.push('auth/forgot')}
          />
          <SettingItem
            icon="lgout"
            title="Log out"
            onPress={onLogout}
            color={instagramTheme.colors.error}
          />
        </View>
      </ScrollView>

      {/* Custom Black Logout Alert */}
      <CustomAlert
        visible={logoutAlertVisible}
        title="Confirm"
        message="Are you sure you want to logout?"
        onCancel={() => setLogoutAlertVisible(false)}
        onConfirm={() => {
          setLogoutAlertVisible(false);
          performLogout();
        }}
        cancelText="Cancel"
        confirmText="Logout"
      />
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
  // Custom Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#121212', // Dark background
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#262626',
  },
  alertTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: hp(2),
    color: '#8E8E8E',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  alertCancelButton: {
    backgroundColor: '#262626',
  },
  alertConfirmButton: {
    backgroundColor: instagramTheme.colors.error,
  },
  alertCancelText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
  alertConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
});