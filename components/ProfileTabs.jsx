import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import MLoading from '../components/MaterialLoader';
import UserReviewsComponent from '../components/userReviewTiles';
import UserPostsComponent from './UserPostComponent';

// Tab navigator component for Profile screen
const TabNavigator = ({ 
  posts, 
  loading, 
  hasMore, 
  theme: activeTheme,
  navigation // Add navigation prop for the reviews component
}) => {
  // State to manage active tab
  const [activeTab, setActiveTab] = useState('reviews');

  // Footer component for post list
  const FooterComponent = () => {
    if (posts.length === 0) return null;

    return (
      <View style={{marginVertical: 0}} paddingBottom={16}>
        {loading && <MLoading />}
        {!hasMore && posts.length > 0 && (
          <Text style={styles.noPosts}>No more feeds to load !!</Text>
        )}
      </View>
    );
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'reviews':
        return (
          <View style={styles.reviewsContainer}>
            {/* Review Content - Directly render UserReviewsComponent */}
            <View style={styles.reviewContent}>
              <UserReviewsComponent navigation={navigation} />
            </View>
          </View>
        );
      case 'plots':
        return (
            // In below code where i need to pass post components 
          // <Text style={styles.library}>Post feature coming soon!!</Text>
          <View style={styles.reviewContent}>
            <UserPostsComponent navigation={navigation} />
        </View>
        );
      default:
        return null;
    }
  };

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
            Reviews
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'plots' && {
              borderBottomColor: activeTheme.colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('plots')}
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
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
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