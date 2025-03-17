import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';
import { MessageTab } from './chat/tabs/index'; 
import RequestTab from './chat/tabs/requestTab'; 

const MessengerScreen = () => {
  const [activeTab, setActiveTab] = useState('messages');
  
  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TabButton 
          title="Messages" 
          isActive={activeTab === 'messages'} 
          onPress={() => setActiveTab('messages')}
        />
        <TabButton 
          title="Requests" 
          isActive={activeTab === 'requests'} 
          onPress={() => setActiveTab('requests')}
        />
      </View>
      
      {activeTab === 'messages' ? (
        <MessageTab />
      ) : (
        <RequestTab />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
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
    color: theme.colors.textLight
  },
  activeTabButtonText: {
    color: theme.colors.primary,
    fontWeight: '600'
  }
});

export default MessengerScreen;