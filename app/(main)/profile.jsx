import { View, StyleSheet, TouchableOpacity, Alert, Pressable, Text, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserStorageService } from '../../Storage/UserStorageService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import theme from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import { wp, hp } from '../../helpers/common';
import Icon from '@/assets/icons';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';
import { fetchPosts } from '../../services/postService';
import { useFocusEffect } from '@react-navigation/native';
import { friendRequestService } from '../../services/requestService';
import TabNavigator from '../../components/ProfileTabs';
import { NetworkUtils } from '../../utils/network';
import { adminIds } from '../../constants/admin';
import { useToast } from '../../contexts/ToastContext';
import ProfileSkeleton from '../../components/ProfileSkeleton';

const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#000000',
    cardBackground: '#121212',
    textDark: '#FFFFFF',
    textLight: '#A8A8A8',
    text: '#FFFFFF',
    border: '#262626',
    primary: '#0095F6',
    secondary: '#262626',
    rose: '#FF375F',
  }
};

const ITEMS_PER_PAGE = 6;
// Set cache timeout (in milliseconds)
const CACHE_TIMEOUT = 88 * 60 * 60 * 1000; // 12 hrs

const Profile = () => {
  const { user, navigationGuard } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [page, setPage] = useState(1);
  const [profileStats, setProfileStats] = useState({
    postCount: 0,
    friendsCount: 0,
    reviewCount: 0
  });
  const activeTheme = colorScheme === 'dark' ? darkTheme : darkTheme;
  const params = useLocalSearchParams();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDataTimestamp, setProfileDataTimestamp] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [cachedProfileStats, setCachedProfileStats] = useState(null);
  const [isConnected, setIsConnected] = useState(true); // New state for network connection
  const [offlineMode, setOfflineMode] = useState(false); // Track if we're in offline mode
  const [hasPostsAvailable, setHasPostsAvailable] = useState(false); // New state to track post availability
  const { showToast } = useToast();

  // Set up network listener
  useEffect(() => {
    const unsubscribe = NetworkUtils.initNetworkListener(setIsConnected);
    return () => unsubscribe();
  }, []);

  // Effect to handle online/offline transitions
  useEffect(() => {
    const handleConnectionChange = async () => {
      if (isConnected) {
        // We're back online, try to sync data
        setOfflineMode(false);
        fetchProfileStats(); // Refresh data when back online
        
        // Reset page and fetch fresh posts
        setPage(1);
        setPosts([]);
        const currentUser = user || profileData;
        const userId = currentUser?.id;
        if (userId) {
          getPosts(ITEMS_PER_PAGE, userId);
        }
      } else {
        // We're offline, use cached data
        setOfflineMode(true);
        loadCachedPosts();
      }
    };

    handleConnectionChange();
  }, [isConnected]);

  // Load cached posts when offline
  const loadCachedPosts = async () => {
    const cachedPosts = await UserStorageService.getCachedPosts();
    if (cachedPosts.length > 0) {
      setPosts(cachedPosts);
      setHasPostsAvailable(true); // Update post availability based on cache
    } else {
      setHasPostsAvailable(false);
    }
  };

  // Replace the precacheImages function with this:
  const precacheImages = useCallback(async (userData, postsData) => {
    // Create an array of image URIs to precache
    const imagesToCache = [];
    
    // Add profile image
    if (userData?.image) {
      const userId = userData.id;
      if (userId) {
        // Cache the profile image
        await UserStorageService.cacheImage(userData.image, `profile_${userId}`);
      }
    }
    
    // Add post images
    if (postsData && postsData.length > 0) {
      for (const post of postsData) {
        if (post.image && post.id) {
          // Cache each post image
          await UserStorageService.cacheImage(post.image, `post_${post.id}`);
        }
      }
    }
  }, []);

  const loadCachedProfileStats = async () => {
    try {
      // First try to get stats from user data (preferred)
      const userData = await UserStorageService.getUserData();
      if (userData?.profileStats?.data) {
        setCachedProfileStats(userData.profileStats);
        setProfileStats(userData.profileStats.data);
        setProfileDataTimestamp(userData.profileStats.timestamp);
        return true;
      }
      
      // Fall back to standalone profile stats cache if needed
      const cachedStats = await UserStorageService.getCachedProfileStats();
      if (cachedStats?.data) {
        setCachedProfileStats(cachedStats);
        setProfileStats(cachedStats.data);
        setProfileDataTimestamp(cachedStats.timestamp);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error loading cached profile stats:', error);
      return false;
    }
  };

  // Load profile data from storage and sync with user from auth context
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // If user is available from auth context, use it immediately and update storage
        if (user && user.id) {
          console.log('Profile - Setting profileData from user:', user.id, user.name);
          setProfileData(user);
          // Update storage with current user data
          await UserStorageService.storeUserData(user);
          // Load cached profile stats
          await loadCachedProfileStats();
        } else {
          // Fallback: try to load from storage if user is not available
          const userData = await UserStorageService.getUserData();
          if (userData && userData.id) {
            console.log('Profile - Setting profileData from storage:', userData.id, userData.name);
            setProfileData(userData);
            // Load cached profile stats
            await loadCachedProfileStats();
          } else {
            console.log('Profile - No user data found in storage');
          }
        }
      } catch (error) {
        console.error('Error loading profile data from storage:', error);
        // If storage fails but user is available, use user directly
        if (user && user.id) {
          console.log('Profile - Using user directly after storage error');
          setProfileData(user);
        }
      }
    };
    
    loadProfileData();
  }, [user?.id]); // Add user.id as dependency to update when user changes

  // Navigation guard to redirect if not logged in
  useFocusEffect(
    useCallback(() => {
      if (!user && !profileData) {
        router.replace('/login');
        return;
      }
      
      const shouldFetchProfileStats = () => {
        // Don't fetch if offline
        if (!isConnected) return false;
        
        // Fetch if no cached data exists
        if (!cachedProfileStats) return true;
        
        // Fetch if explicitly requested via refresh param
        if (params.refreshProfile) return true;
        
        // Fetch if cache has expired
        const now = Date.now();
        const cacheAge = now - (cachedProfileStats.timestamp || 0);
        if (cacheAge > CACHE_TIMEOUT) return true;
        
        return false;
      };

     
      
      if (shouldFetchProfileStats()) {
        fetchProfileStats();
      }
    }, [user, profileData, params.refreshProfile, cachedProfileStats, isConnected])
  );

  const onSettings = () => {
    router.push('/profileSettings');
  };

  const fetchProfileStats = async () => {
    const currentUser = user || profileData;
    if (!currentUser || profileLoading || !isConnected) return;
    
    const userId = currentUser.id;
    if (!userId) return;
    
    try {
      setProfileLoading(true);
      
      // Fetch post count
      const { data, error, count } = await supabase
        .from('twists')
        .select('id', { count: 'exact' })
        .eq('userId', userId);
      
      // Fetch friends count
      const friendsCountResult = await friendRequestService.getFriendsCount();
      
      // Fetch reviews count from dpeopreviews table
      const { count: dpeopreviewsCount, error: dpeopreviewsError } = await supabase
        .from('dpeopreviews')
        .select('id', { count: 'exact' })
        .eq('userId', userId);
      
      // Fetch reviews count from reviews table
      const { count: reviewsCount, error: reviewsError } = await supabase
        .from('reviews')
        .select('id', { count: 'exact' })
        .eq('userId', userId);
      
      if (!error && !dpeopreviewsError && !reviewsError) {
        // Calculate total reviews count
        const totalReviewsCount = (dpeopreviewsCount) + (reviewsCount);
        
        const newStats = {
          postCount: count || 0,
          friendsCount: friendsCountResult.success ? friendsCountResult.count : 0,
          reviewCount: totalReviewsCount
        };
        
        // 1. Update local state
        setProfileStats(newStats);
        
        // 2. Update the post availability state based on post count
        setHasPostsAvailable(count > 0);
        
        // 3. Cache the profile stats with timestamp
        const timestamp = Date.now();
        setProfileDataTimestamp(timestamp);
        
        // 4. Create cache data object
        const cacheData = {
          timestamp,
          data: newStats
        };
        
        // 5. Update cached stats state
        setCachedProfileStats(cacheData);
        
        // 6. Use UserStorageService to directly cache profile stats
        await UserStorageService.cacheProfileStats(newStats);
        
        // 7. Set last sync time
        await UserStorageService.setLastSyncTime();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      // If online fetch fails, still use cached data if available
      if (cachedProfileStats) {
        setProfileStats(cachedProfileStats.data);
      }
      return false;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = user || profileData;
    const userId = currentUser?.id;
    if (userId && isConnected) {
      getPosts(ITEMS_PER_PAGE, userId);
    } else if (!isConnected) {
      loadCachedPosts();
    }
  }, [user?.id, profileData?.id, isConnected]);

  const getPosts = useCallback(async () => {
    const currentUser = user || profileData;
    if (loading || !hasMore || !isConnected || !currentUser?.id) return;
    
    try {
      setLoading(true);
      const res = await fetchPosts(page * ITEMS_PER_PAGE, currentUser.id);
      
      if (res.success) {
        // Check if we've reached the end
        if (res.data.length === 0 || res.data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
        
        // Update post availability based on API response
        setHasPostsAvailable(res.data.length > 0);
        
        // Append new posts, avoiding duplicates
        setPosts(prevPosts => {
          const newPosts = res.data.filter(
            newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
          );
          const updatedPosts = [...prevPosts, ...newPosts];
          
          // Cache posts for offline access
          UserStorageService.cachePosts(updatedPosts);
          
          // Precache images
          const currentUser = user || profileData;
          precacheImages(currentUser, updatedPosts);
          
          return updatedPosts;
        });
        
        setPage(prev => prev + 1);
      } else {
        showToast('success', 'Failed to fetch posts!! - Network Problem');
        setHasPostsAvailable(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Something went wrong while fetching posts');
      // If online fetch fails, try using cached posts
      loadCachedPosts();
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, user, profileData, isConnected, precacheImages]);

  // Add onRefresh function for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!isConnected) {
      // Show alert if offline
      Alert.alert('Offline Mode', 'Cannot refresh while offline. Please connect to the internet and try again.');
      setRefreshing(false);
      return;
    }
    
    try {
      setRefreshing(true);
      
      // Reset pagination
      setPage(1);
      setHasMore(true);
      setPosts([]);
      
      // Fetch fresh data
      await fetchProfileStats();
      
      const currentUser = user || profileData;
      const userId = currentUser?.id;
      if (userId) {
        const res = await fetchPosts(ITEMS_PER_PAGE, userId);
        
        if (res.success) {
          setPosts(res.data);
          setHasPostsAvailable(res.data.length > 0);
          
          // Cache posts for offline access
          UserStorageService.cachePosts(res.data);
          
          // Precache images
          precacheImages(currentUser, res.data);
          
          // Update pagination
          if (res.data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
          } else {
            setPage(2);
          }
        } else {
          Alert.alert('Error', 'Failed to refresh posts');
        }
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      Alert.alert('Error', 'Something went wrong while refreshing');
    } finally {
      setRefreshing(false);
    }
  }, [isConnected, user, profileData, fetchProfileStats, precacheImages]);

  // Get current user data - prioritize user from auth context
  // Always use the most up-to-date user from auth context if available
  const currentUser = user || profileData;
  
  // Sync profileData when user changes to ensure we have the latest data
  useEffect(() => {
    if (user && user.id) {
      // If user from auth context is available, update profileData
      if (!profileData || profileData.id !== user.id || profileData.image !== user.image) {
        console.log('Profile - Syncing profileData with user from auth context');
        setProfileData(user);
      }
    }
  }, [user?.id, user?.image]);
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (currentUser) {
      console.log('Profile - Current user data:', {
        id: currentUser.id,
        name: currentUser.name,
        hasImage: !!currentUser.image,
        imageValue: currentUser.image,
        hasOrgname: !!currentUser.orgname,
        hasBio: !!currentUser.bio,
        userSource: user ? 'auth' : 'storage'
      });
    } else {
      console.log('Profile - No user data available');
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.image]);
  
  // Don't render if no user data is available (navigation guard should redirect)
  if (!currentUser) {
    return (
      <ScreenWrapper bg={activeTheme.colors.background}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <ProfileSkeleton />
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // Removed separate skeleton check - now showing skeleton inline within the main render

  return (
    <ScreenWrapper bg={activeTheme.colors.background}>
      {/* Offline Mode Indicator */}
      {offlineMode && (
        <View style={[styles.offlineBar, { backgroundColor: theme.colors.text }]}>
          <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
        </View>
      )}
      
      {/* Wrap everything in a ScrollView with RefreshControl */}
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[activeTheme.colors.primary]}
            title="Pull to refresh"
            titleColor={activeTheme.colors.textLight}
            tintColor={theme.colors.blue} 
            progressBackgroundColor={theme.colors.textDark}
          />
        }
      >
        {/* Profile Info Section */}
        {profileLoading && !profileData ? (
          <ProfileSkeleton />
        ) : (
          <InstagramProfile 
            user={currentUser}
            router={router} 
            handleLogout={onSettings} 
            theme={activeTheme}
            postCount={profileStats.postCount}
            friendsCount={profileStats.friendsCount}
            reviewCount={profileStats.reviewCount}
            isLoading={profileLoading}
            lastUpdated={profileDataTimestamp ? new Date(profileDataTimestamp).toLocaleTimeString() : null}
            offlineMode={offlineMode}
          />
        )}
        
        {/* Tab Navigator - Now passes hasPostsAvailable prop */}
        <View style={styles.tabSection}>
          <TabNavigator
            posts={posts}
            loading={loading}
            hasMore={hasMore}
            getPosts={isConnected ? getPosts : null} // Don't load more if offline
            user={user}
            router={router}
            theme={activeTheme}
            navigation={router}
            offlineMode={offlineMode}
            hasPostsAvailable={hasPostsAvailable} // Pass the posts availability flag
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const StatsItem = ({ label, value, theme, isLoading }) => (
  <View style={styles.statsItem}>
    <Text style={[styles.statsValue, { color: theme.colors.textDark }]}>
      {isLoading ? '...' : value}
    </Text>
    <Text style={[styles.statsLabel, { color: theme.colors.textLight }]}>{label}</Text>
  </View>
);

const InstagramProfile = ({ user, router, handleLogout, theme, postCount, friendsCount, reviewCount, isLoading, offlineMode }) => {
  // Safety check: Don't render if user is not available
  if (!user) {
    return (
      <View style={[styles.profileContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.username, { color: theme.colors.textDark }]}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  // Debug: Log image value
  useEffect(() => {
    console.log('InstagramProfile - User image:', {
      hasUser: !!user,
      userId: user?.id,
      imageValue: user?.image,
      imageType: typeof user?.image,
      imageLength: user?.image?.length
    });
  }, [user?.id, user?.image]);

  // below is useeffect which record the naviagtion
 const [isNavigating, setIsNavigating] = useState(false);

 // which reset on coming the page 
   useFocusEffect(
     React.useCallback(() => {
       setIsNavigating(false);
     }, [])
   );
  const formattedDate = new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  let parsedTags = user?.tags || [];
  if (typeof user?.tags === 'string') {
    try {
      parsedTags = JSON.parse(user.tags);
    } catch (e) {
      parsedTags = [];
    }
  }

  const verifyProfile = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push({
      pathname: 'editProfile',
      params: { returnToRefresh: true },
    });
  };

  const isadmin = adminIds.includes(user?.id);

  return (
    <View style={[styles.profileContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.username, { color: theme.colors.textDark }]}>{user?.name || user?.orgname || 'User'}</Text>

        {/* {!offlineMode && (
          <>
            <Pressable onPress={() => router.push('createFeed')}>
              <Icon name="plus" size={hp(3.2)} color="white" />
            </Pressable>
            <Pressable onPress={() => router.push('newRelease')}>
              <Icon name="plus" size={hp(3.2)} color="green" />
            </Pressable>
            <Pressable onPress={() => router.push('newOtt')}>
              <Icon name="plus" size={hp(3.2)} color="red" />   addfriend
            </Pressable>
          </>
        )} */}
        <View style={styles.toppanel}>
          {/* admin icon menu */}

          {isadmin && (
               <TouchableOpacity 
               style={[styles.logoutButton]} 
               disabled={isNavigating}
               onPress={() => {
                 if (!isNavigating) {
                   setIsNavigating(true);
                   router.push('AdminPanel');
                 }
               }}
             >
               <Icon name="admin" color={theme.colors.textDark} />
             </TouchableOpacity>
          )}
         {/* menu icon here */}
        <TouchableOpacity 
          style={[styles.logoutButton]} 
          onPress={() => {
            if (!isNavigating) {
              setIsNavigating(true);
              handleLogout();
            }
          }}
        >
          <Icon name="menu" color={theme.colors.textDark} />
        </TouchableOpacity>
        </View>
       
      </View>

      {/* Profile Info Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Avatar
            key={`avatar-${user?.id}-${user?.image}`}
            uri={user?.image}
            size={hp(12)}
            rounded={theme.radius.xxl * 1.4}
          />
          {!offlineMode && (
            <Pressable 
              style={[styles.editIcon, { backgroundColor: theme.colors.cardBackground }]}
            >
              <Icon 
                name="edit" 
                strokeWidth={2.5} 
                color={theme.colors.textLight} 
                size={hp(3)} 
                onPress={() => router.push({
                  pathname: 'editProfile',
                  params: { returnToRefresh: true }
                })} 
              />
            </Pressable>
          )}
        </View>

        <View style={styles.statsContainer}>
          <StatsItem 
            value={reviewCount?.toString() || "0"} 
            label="Reviews" 
            theme={theme} 
            isLoading={isLoading}
          />
           {postCount > 1 && (
            <StatsItem 
              value={postCount?.toString() || "0"} 
              label="Posts" 
              theme={theme} 
              isLoading={isLoading}
            />
          )}
          <StatsItem 
            value={friendsCount?.toString() || "0"} 
            label="Friends" 
            theme={theme} 
            isLoading={isLoading}
          />
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <Text style={[styles.bioName, { color: theme.colors.textDark }]}>{user?.orgname || user?.name || 'User'}</Text>
        {user?.bio && <Text style={[styles.bio, { color: theme.colors.text }]}>{user.bio}</Text>}
        <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>Joined {formattedDate}</Text>
        {user?.address && <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>{user.address}</Text>}
      </View>

      {/* Tags */}
      {/* {Array.isArray(parsedTags) && parsedTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {parsedTags.map((tag, index) => (
            <View 
              key={index} 
              style={[styles.tagPill, { 
                backgroundColor: theme.colors.secondary,
                borderColor: theme.colors.primary,
                borderWidth: 1,
              }]}
            >
              <Text style={[styles.tagPillText, { color: theme.colors.primary }]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )} */}

      {/* Edit Profile Button - hide in offline mode */}
      {/* {!user?.verified && !offlineMode && (
         <TouchableOpacity 
           style={[styles.editProfileButton, { backgroundColor: theme.colors.secondary }]}
           onPress={verifyProfile}
         >
           <Text style={[styles.editProfileText, { color: theme.colors.textDark }]}>Verify Profile</Text>
         </TouchableOpacity>
      )} */}
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBar: {
    padding: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: hp(1.4),
  },
  profileContainer: {
    padding: wp(3.5),
  },
  tabSection: {
    flex: 1,
    borderTopWidth: 1.3,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  username: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  avatarContainer: {
    position: 'relative',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: wp(4),
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: hp(1.6),
  },
  bioSection: {
    marginBottom: hp(2),
  },
  bioName: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  bio: {
    fontSize: hp(1.6),
    marginBottom: hp(0.5),
  },
  joinedDate: {
    fontSize: hp(1.4),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2.5),
    marginBottom: hp(2),
    marginTop: hp(0.5),
  },
  tagPill: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tagPillText: {
    fontSize: hp(1.5),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  contactInfo: {
    gap: hp(1.5),
    marginBottom: hp(3),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  contactText: {
    fontSize: hp(1.6),
  },
  editProfileButton: {
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    padding: 7,
    borderRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(40)
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center', 
    color: theme.colors.primary
  },
  listStyle: {
    paddingHorizontal: wp(2)
  },
  scrollContainer: {
    flexGrow: 1,
  },
  toppanel: {
    flexDirection: 'row',
  }
});