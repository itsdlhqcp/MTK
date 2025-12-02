import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import UserReviewsComponent from '../components/userReviewTiles';
import UserPostsComponent from './UserPostComponent';

const TabNavigator = ({ 
  theme: activeTheme,
  navigation,
  hasPostsAvailable = false, // Prop to determine if posts are available
  userId // Add userId as a prop
}) => {
  // Set default active tab to 'reviews' (Studio tab is hidden)
  const [activeTab, setActiveTab] = useState('reviews');
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'reviews':
        return (
          <View style={styles.reviewsContainer}>
            <View style={styles.reviewContent}>
              <UserReviewsComponent navigation={navigation} userId={userId} />
            </View>
          </View>
        );
      case 'plots':
        return (
          <View style={styles.reviewContent}>
            <UserPostsComponent navigation={navigation} userId={userId} />
          </View>
        );
      default:
        return null;
    }
  };

  // If posts are not available, only show reviews without tabs
  if (!hasPostsAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.reviewsContainer}>
          <View style={styles.reviewContent}>
            <UserReviewsComponent navigation={navigation} userId={userId} />
          </View>
        </View>
      </View>
    );
  }

  // Otherwise, render both tabs (Studio tab is hidden but code is kept)
  return (
    <View style={styles.container}>
      {/* Main Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'reviews' && {
              borderBottomColor: activeTheme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'reviews'
                    ? activeTheme.colors.primary
                    : activeTheme.colors.textLight,
                fontWeight: activeTab === 'reviews' ? '600' : 'normal',
              },
            ]}
          >
            Watched List
          </Text>
        </TouchableOpacity>
        {/* Studio tab - hidden but code kept intact */}
        <TouchableOpacity
          style={[
            styles.tab,
            styles.hiddenTab, // Hide the Studio tab
            activeTab === 'plots' && {
              borderBottomColor: activeTheme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => {
            // Studio tab is hidden - keep code but prevent navigation
            // setActiveTab('plots');
          }}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'plots'
                    ? activeTheme.colors.primary
                    : activeTheme.colors.textLight,
                fontWeight: activeTab === 'plots' ? '600' : 'normal',
              },
            ]}
          >
           Studio
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content - Only show reviews section (Studio tab is hidden) */}
      <View style={styles.reviewsContainer}>
        <View style={styles.reviewContent}>
          <UserReviewsComponent navigation={navigation} userId={userId} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: hp(1),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
  },
  hiddenTab: {
    position: 'absolute',
    left: -9999,
    opacity: 0,
    pointerEvents: 'none', // Hide Studio tab but keep code
  },
  tabText: {
    fontSize: hp(1.8),
  },
  reviewsContainer: {
    minHeight: hp(50), 
  },
  plotsContainer: {
    minHeight: hp(50),
  },
  reviewContent: {
    paddingBottom: hp(2),
  },
  listStyle: {
    padding: wp(2),
  },
  loadingContainer: {
    padding: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(20),
  },
  noPosts: {
    textAlign: 'center',
    padding: hp(2),
    color: '#888',
  },
  library: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    alignContent: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  }
});

export default TabNavigator;