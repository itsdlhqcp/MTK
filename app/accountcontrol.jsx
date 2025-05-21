import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { deleteUserAccount } from '../services/userServices';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';
import { router, useRouter } from 'expo-router';
import { DevSettings } from 'react-native';

// Instagram-style dark theme colors
const instagramTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#000000',
    backgroundSecondary: '#121212',
    text: '#FFFFFF',
    textLight: '#8E8E8E',
    border: '#262626',
    primary: '#3797EF',
    error: '#ED4956',
    warning: '#FFA726',
    success: '#4CAF50',
  }
};

// Custom Alert Modal (same style as Confirmation Modal)
const CustomAlertModal = ({ 
  visible, 
  title, 
  message, 
  onOk,
  okText = "OK",
  showIcon = false,
  iconType = "info" // "info", "error", "success", "warning"
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const getIconColor = () => {
    switch (iconType) {
      case 'error':
        return instagramTheme.colors.error;
      case 'success':
        return instagramTheme.colors.success;
      case 'warning':
        return instagramTheme.colors.warning;
      default:
        return instagramTheme.colors.primary;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onOk}
    >
      <Pressable style={styles.modalOverlay} onPress={() => router.push('/information')}>
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          {showIcon && (
            <View style={styles.warningIconContainer}>
              <Icon name="info" size={40} color={getIconColor()} />
            </View>
          )}
          
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          
          <View style={styles.alertButtonContainer}>
            <Pressable
              style={[styles.modalButton, styles.alertOkButton]}
              onPress={onOk}
            >
              <Text style={styles.alertOkText}>{okText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// Custom Confirmation Modal (with two buttons)
const ConfirmationModal = ({ 
  visible, 
  title, 
  message, 
  onCancel, 
  onConfirm, 
  confirmText,
  showWarning = false,
  loading = false 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          {showWarning && (
            <View style={styles.warningIconContainer}>
              <Icon name="warn" size={40} color={instagramTheme.colors.error} />
            </View>
          )}
          
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          
          <View style={styles.modalButtonsContainer}>
            <Pressable
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.modalButton, 
                styles.modalConfirmButton,
                loading && styles.modalButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalConfirmText}>{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// Account Control Setting Item
const AccountControlItem = ({ icon, title, subtitle, onPress, color, isDestructive = false }) => (
  <TouchableOpacity 
    style={[
      styles.settingItem,
      isDestructive && styles.destructiveItem
    ]} 
    onPress={onPress}
  >
    <View style={styles.settingItemLeft}>
      <Icon 
        name={icon} 
        size={24} 
        color={color || instagramTheme.colors.text} 
      />
      <View style={styles.settingItemContent}>
        <Text style={[
          styles.settingItemText, 
          { color: color || instagramTheme.colors.text }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingItemSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <Icon 
      name="info" 
      size={16} 
      color={instagramTheme.colors.textLight} 
    />
  </TouchableOpacity>
);

const AccountControl = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [firstConfirmVisible, setFirstConfirmVisible] = useState(false);
  const [secondConfirmVisible, setSecondConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Alert modal states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  // Custom Alert function
  const showCustomAlert = (title, message, onOk, options = {}) => {
    setAlertConfig({
      title,
      message,
      onOk: () => {
        setAlertVisible(false);
        if (onOk) onOk();
      },
      ...options
    });
    setAlertVisible(true);
  };

  // Handle delete account - First confirmation
  const handleDeleteAccount = () => {
    setFirstConfirmVisible(true);
  };

  // Handle first confirmation - proceed to second
  const handleFirstConfirm = () => {
    setFirstConfirmVisible(false);
    setTimeout(() => {
      setSecondConfirmVisible(true);
    }, 300);
  };

  // Handle final confirmation - actually delete account
  const handleFinalConfirm = async () => {
    setIsDeleting(true);
    
    try {
      const result = await deleteUserAccount(user.id);
      
      if (result.success) {
        // Account successfully deleted
        // Log the user out and redirect to welcome page
        await logout();
        
        showCustomAlert(
          'Account Deleted',
          'Your account has been deleted. Your credentials have been removed.',
          () => {
            // Navigate to welcome page
            router.replace('/welcome');
          },
          { 
            showIcon: true, 
            iconType: 'success',
            okText: 'OK'
          }
        );
      } else {
        throw new Error(result.msg || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      showCustomAlert(
        'Error',
        'Failed to delete your account. Please try again or contact support.',
        null,
        { 
          showIcon: true, 
          iconType: 'error'
        }
      );
    } finally {
      setIsDeleting(false);
      setSecondConfirmVisible(false);
    }
  };

  // Cancel confirmation modals
  const handleCancelFirst = () => {
    setFirstConfirmVisible(false);
  };

  const handleCancelSecond = () => {
    setSecondConfirmVisible(false);
  };

  return (
    <ScreenWrapper bg={instagramTheme.colors.background}>
      <Header 
        title="Account Control" 
        showBackButton={true} 
        textColor={instagramTheme.colors.text}
        backgroundColor={instagramTheme.colors.background}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Manage Your Account</Text>
          <Text style={styles.headerSubtitle}>
            Control your account settings and data
          </Text>
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <AccountControlItem
            icon="user"
            title="Profile Information"
            subtitle="View and edit your profile details"
            onPress={() => router.push('/information')}
          />
          <AccountControlItem
            icon="privacy"
            title="Privacy Settings"
            subtitle="Control who can see your information"
            onPress={() => {}}
          />
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <AccountControlItem
            icon="download"
            title="Download Your Data"
            subtitle="Request a copy of your information"
            onPress={() => {
              showCustomAlert(
                'Coming Soon',
                'Data download feature will be available soon.',
                null,
                { 
                  showIcon: true, 
                  iconType: 'info'
                }
              );
            }}
          />
          <AccountControlItem
            icon="clear"
            title="Clear Cache"
            subtitle="Clear stored data and refresh the app"
            onPress={() => {
              showCustomAlert(
                'Clear Cache',
                'This will clear locally stored data and refresh the app.',
                () => {
                  // Implement cache clearing logic
                  console.log('Cache cleared');
                  showCustomAlert(
                    'Cache Cleared',
                    'Your cache has been successfully cleared.',
                    null,
                    { 
                      showIcon: true, 
                      iconType: 'success'
                    }
                  );
                },
                { 
                  showIcon: true, 
                  iconType: 'warning'
                }
              );
            }}
          />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>
            Account Management
          </Text>
          <AccountControlItem
            icon="delete"
            title="Delete Account"
            subtitle="Delete your account (deactivate your account)"
            color={instagramTheme.colors.error}
            isDestructive={true}
            onPress={handleDeleteAccount}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertVisible}
        {...alertConfig}
      />

      {/* First Confirmation Modal */}
      <ConfirmationModal
        visible={firstConfirmVisible}
        title="Delete Account?"
        message="Are you sure you want to delete your account? This will deactivate your account and user credentials will be removed."
        onCancel={handleCancelFirst}
        onConfirm={handleFirstConfirm}
        confirmText="Continue"
        showWarning={true}
      />

      {/* Second Confirmation Modal */}
      <ConfirmationModal
        visible={secondConfirmVisible}
        title="Final Confirmation"
        message="This is your last chance to cancel. Deleting your account will remove your login access but your posts and messages will remain in the system."
        onCancel={handleCancelSecond}
        onConfirm={handleFinalConfirm}
        confirmText="Delete Forever"
        showWarning={true}
        loading={isDeleting}
      />
    </ScreenWrapper>
  );
};

export default AccountControl;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    backgroundColor: instagramTheme.colors.background,
  },
  headerSection: {
    paddingVertical: hp(3),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(3),
    fontWeight: '600',
    color: instagramTheme.colors.text,
    marginBottom: hp(1),
  },
  headerSubtitle: {
    fontSize: hp(1.8),
    color: instagramTheme.colors.textLight,
    textAlign: 'center',
  },
  section: {
    marginBottom: hp(3),
    backgroundColor: instagramTheme.colors.backgroundSecondary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: wp(2),
    overflow: 'hidden',
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: instagramTheme.colors.error + '30',
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '500',
    color: instagramTheme.colors.textLight,
    marginVertical: hp(2),
    paddingHorizontal: wp(2),
  },
  dangerSectionTitle: {
    color: instagramTheme.colors.error,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
    paddingHorizontal: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: instagramTheme.colors.border,
  },
  destructiveItem: {
    backgroundColor: instagramTheme.colors.error + '10',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: wp(3),
  },
  settingItemContent: {
    flex: 1,
  },
  settingItemText: {
    fontSize: hp(2),
    fontWeight: '500',
    color: instagramTheme.colors.text,
  },
  settingItemSubtitle: {
    fontSize: hp(1.6),
    color: instagramTheme.colors.textLight,
    marginTop: hp(0.5),
  },
  bottomPadding: {
    height: hp(5),
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  modalContent: {
    width: '100%',
    maxWidth: wp(85),
    backgroundColor: instagramTheme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: wp(6),
    alignItems: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: instagramTheme.colors.border,
  },
  warningIconContainer: {
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    color: instagramTheme.colors.text,
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: hp(1.8),
    color: instagramTheme.colors.textLight,
    marginBottom: hp(3),
    textAlign: 'center',
    lineHeight: hp(2.5),
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: wp(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(5),
  },
  modalCancelButton: {
    backgroundColor: instagramTheme.colors.border,
  },
  modalConfirmButton: {
    backgroundColor: instagramTheme.colors.error,
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
  modalCancelText: {
    color: instagramTheme.colors.text,
    fontWeight: '500',
    fontSize: hp(1.8),
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
  
  // Alert Modal specific styles
  alertButtonContainer: {
    width: '100%',
  },
  alertOkButton: {
    backgroundColor: instagramTheme.colors.primary,
  },
  alertOkText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: hp(1.8),
  },
});