import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { getUserData } from '../services/userServices';
import theme from '../constants/theme';
import { hp, wp, truncateEmail, truncateUsername } from '../helpers/common';
import Icon from '@/assets/icons';
import moment from 'moment';

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

// Information Item Component
const InfoItem = ({ icon, title, value, loading }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoItemLeft}>
      <Icon name={icon} size={24} color={instagramTheme.colors.text} />
      <Text style={styles.infoItemTitle}>{title}</Text>
    </View>
    <View style={styles.infoItemRight}>
      {loading ? (
        <ActivityIndicator size="small" color={instagramTheme.colors.primary} />
      ) : (
        <Text style={styles.infoItemValue}>{value || 'Not available'}</Text>
      )}
    </View>
  </View>
);

// Custom Alert Modal
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
      <Pressable style={styles.modalOverlay} onPress={onOk}>
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

const Information = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Fetch user data
  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      const result = await getUserData(user.id);
      
      if (result.success) {
        setUserData(result.data);
      } else {
        throw new Error(result.msg || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showCustomAlert(
        'Error',
        'Failed to load your information. Please try again later.',
        null,
        { 
          showIcon: true, 
          iconType: 'error'
        }
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  // Format date to display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return moment(dateString).format('MMMM D, YYYY'); // Formats to "April 29, 2023"
    } catch (e) {
      return dateString;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      return moment(dateString).fromNow();
    } catch (e) {
      return '';
    }
  };

  return (
    <ScreenWrapper bg={instagramTheme.colors.background}>
      <Header 
        title="Information" 
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
            tintColor={instagramTheme.colors.primary}
            colors={[instagramTheme.colors.primary]}
            progressBackgroundColor={instagramTheme.colors.backgroundSecondary}
            title="Refreshing..."
            titleColor={instagramTheme.colors.textLight}
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Your Information</Text>
          <Text style={styles.headerSubtitle}>
            View detailed information about your account
          </Text>
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <InfoItem
            icon="user"
            title="Username"
            value={user?.name ? truncateUsername(user.name) : undefined}
            loading={loading}
          />
          
          <InfoItem
            icon="mail"
            title="Email"
            value={user?.email ? truncateEmail(user.email) : undefined}
            loading={loading}
          />
          
          <InfoItem
            icon="calender"
            title="Created On"
            value={userData?.created_at ? (
              <View style={styles.dateContainer}>
                <Text style={styles.infoItemValue}>{formatDate(userData?.created_at)}</Text>
                <Text style={styles.timeAgoText}>{formatTimeAgo(userData?.created_at)}</Text>
              </View>
            ) : 'Not available'}
            loading={loading}
          />
          
          <InfoItem
            icon="edit"
            title="Last Updated"
            value={userData?.updated_at ? (
              <View style={styles.dateContainer}>
                <Text style={styles.infoItemValue}>{formatDate(userData?.updated_at)}</Text>
                <Text style={styles.timeAgoText}>{formatTimeAgo(userData?.updated_at)}</Text>
              </View>
            ) : 'Not available'}
            loading={loading}
          />
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          <InfoItem
            icon="user"
            title="Display Name"
            value={userData?.orgname ? truncateUsername(userData.orgname) : undefined}
            loading={loading}
          />
          
          <InfoItem
            icon="spoiler"
            title="Bio"
            value={userData?.bio || 'No bio added'}
            loading={loading}
          />
        </View>

        {/* Account Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          
          <InfoItem
            icon="rocket"
            title="Account Status"
            value={
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: userData?.is_active ? instagramTheme.colors.success : instagramTheme.colors.error }
                ]} />
                <Text style={styles.infoItemValue}>
                  {userData?.is_active ? 'Inactive' : 'Active'}
                </Text>
              </View>
            }
            loading={loading}
          />
          
          <InfoItem
            icon="pen"
            title="Account Type"
            value={userData?.role || 'Standard'}
            loading={loading}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertVisible}
        {...alertConfig}
      />
    </ScreenWrapper>
  );
};

export default Information;

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
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '500',
    color: instagramTheme.colors.textLight,
    marginVertical: hp(2),
    paddingHorizontal: wp(2),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
    paddingHorizontal: wp(2),
    borderBottomWidth: 1,
    borderBottomColor: instagramTheme.colors.border,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  infoItemTitle: {
    fontSize: hp(2),
    fontWeight: '500',
    color: instagramTheme.colors.text,
  },
  infoItemRight: {
    maxWidth: '60%',
  },
  infoItemValue: {
    fontSize: hp(1.8),
    color: instagramTheme.colors.textLight,
    textAlign: 'right',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  timeAgoText: {
    fontSize: hp(1.4),
    color: instagramTheme.colors.textLight,
    opacity: 0.7,
    marginTop: hp(0.3),
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: wp(1.5),
  },
  statusIndicator: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
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
  alertButtonContainer: {
    width: '100%',
  },
  modalButton: {
    paddingVertical: hp(1.5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(5),
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