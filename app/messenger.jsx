import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';
import RequestTab from './chat/tabs/requestTab';
import NotificationsTab from '../components/NotificationTab';
import ScreenWrapper from '../components/ScreenWrapper';

const MessengerScreen = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  
  const TabButton = ({ title, isActive, onPress, count }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title} {count > 0 && `(${count})`}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <ScreenWrapper bg="#121212">
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TabButton 
          title="Notifications" 
          isActive={activeTab === 'notifications'} 
          onPress={() => setActiveTab('notifications')}
        />
        <TabButton 
          title="Requests" 
          isActive={activeTab === 'requests'} 
          onPress={() => setActiveTab('requests')}
        />
      </View>
      
      {activeTab === 'notifications' ? (
        <NotificationsTab />
      ) : (
        <RequestTab />
      )}
    </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212' // Dark background like Instagram
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333' // Darker border for dark theme
  },
  tabButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center'
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary
  },
  tabButtonText: {
    fontSize: hp(1.8),
    color: '#8e8e8e' // Light gray for inactive tabs
  },
  activeTabButtonText: {
    color: '#fff', // White text for active tab
    fontWeight: '600'
  }
});

export default MessengerScreen;