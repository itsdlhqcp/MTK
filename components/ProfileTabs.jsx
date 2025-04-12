import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import PostCard from '../components/PostCard';
import MLoading from '../components/MaterialLoader';
import { FlatList } from 'react-native';
import UserReviewsComponent from '../components/userReviewTiles';

// Tab navigator component for Profile screen
const TabNavigator = ({ 
  posts, 
  loading, 
  hasMore, 
  getPosts, 
  user, 
  router, 
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
          <Text style={styles.library}>Post feature coming soon!!</Text>
          // <View style={styles.plotsContainer}>
          //   <FlatList
          //     data={posts}
          //     showsVerticalScrollIndicator={false}
          //     contentContainerStyle={styles.listStyle}
          //     keyExtractor={item => item.id.toString()}
          //     renderItem={({ item }) => (
          //       <PostCard
          //         item={item}
          //         currentUser={user}
          //         router={router}
          //       />
          //     )}
          //     onEndReached={() => {
          //       if (hasMore && !loading) {
          //         getPosts();
          //       }
          //     }}
          //     onEndReachedThreshold={0.5}
          //     scrollEnabled={false} // Important: Disable scrolling here
          //     ListFooterComponent={FooterComponent}
          //     ListEmptyComponent={() => (
          //       <View style={styles.loadingContainer}>
          //         <Text style={[styles.noPosts, { color: activeTheme.colors.primary }]}>
          //           {loading ? <MLoading /> : "Section Coming Soon!!"}
          //         </Text>
          //       </View>
          //     )}
          //   />
          // </View>
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
    minHeight: hp(50), // Set minimum height to show content
  },
  plotsContainer: {
    minHeight: hp(50), // Set minimum height to show content
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