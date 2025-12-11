import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../constants/theme';
import { hp } from '../helpers/common';
import DigitalTabSkeleton from './DigitalTabSkeleton';
import TheatreTabSkeleton from './TheatreTabSkeleton';

const DigitalReviewTabs = ({ children, loading = false }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Digital', 'Theatre'];

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabHeader}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tabButton,
              activeTab === index && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(index)}
            disabled={loading}
          >
            <Text 
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText,
                loading && styles.disabledTabText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabContent}>
        {loading ? (
          activeTab === 0 ? (
            <DigitalTabSkeleton count={3} />
          ) : (
            <TheatreTabSkeleton count={3} />
          )
        ) : (
          children[activeTab]
        )}
      </View>
    </View>
  );
};

export default DigitalReviewTabs;

const styles = StyleSheet.create({
  tabContainer: {
    width: '100%',
    marginBottom: hp(1),
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: hp(1),
  },
  tabButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.8),
    fontWeight: '500',
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    width: '100%',
  },
  disabledTabText: {
    opacity: 0.5,
  },
});

