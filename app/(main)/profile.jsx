import { View, StyleSheet, TouchableOpacity, Alert, Pressable, Text, ScrollView, useColorScheme } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { UserStorageService } from '../../Storage/UserStorageService'
import { useLocalSearchParams, useRouter } from 'expo-router'
import theme from '../../constants/theme'
import ScreenWrapper from '../../components/ScreenWrapper'
import { wp, hp } from '../../helpers/common'
import Icon from '@/assets/icons'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/Avatar'
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import MLoading from '../../components/MaterialLoader'
import { useFocusEffect } from '@react-navigation/native';
import { friendRequestService } from '../../services/requestService';
import TabNavigator from '../../components/ProfileTabs' // Import the new TabNavigator component

// Dark mode colors
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
}

const ITEMS_PER_PAGE = 4;
// Set cache timeout (in milliseconds)
const CACHE_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hrs

const Profile = () => {
  const { user, navigationGuard } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [profileStats, setProfileStats] = useState({
    postCount: 0,
    friendsCount: 0,
    // Add other stats here if needed
  });
  // Could use either theme based on your preference
  const activeTheme = colorScheme === 'dark' ? darkTheme : darkTheme;
  const params = useLocalSearchParams();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDataTimestamp, setProfileDataTimestamp] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [cachedProfileStats, setCachedProfileStats] = useState(null);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userData = await UserStorageService.getUserData();
        if (userData) {
          setProfileData(userData);
          
          // Load cached profile stats from the user data object
          if (userData.profileStats) {
            setCachedProfileStats(userData.profileStats);
            setProfileStats(userData.profileStats.data);
            setProfileDataTimestamp(userData.profileStats.timestamp);
          }
        }
      } catch (error) {
        console.error('Error loading profile data from storage:', error);
      }
    };
    
    loadProfileData();
  }, []);

  // Navigation guard to redirect if not logged in
  useFocusEffect(
    useCallback(() => {
      if (!user && !profileData) {
        router.replace('/login');
        return;
      }
      
      const shouldFetchProfileStats = () => {
        // Fetch if no cached data exists
        if (!cachedProfileStats) return true;
        
        // Fetch if explicitly requested via refresh param
        if (params.refreshProfile) return true;
        
        // Fetch if cache has expired
        const now = Date.now();
        const cacheAge = now - cachedProfileStats.timestamp;
        if (cacheAge > CACHE_TIMEOUT) return true;
        
        return false;
      };
      
      if (shouldFetchProfileStats()) {
        fetchProfileStats();
      }
    }, [user, profileData, params.refreshProfile, cachedProfileStats])
  );

  const onSettings = () => {
    router.push('/profileSettings');
  };

  const fetchProfileStats = async () => {
    if ((!user && !profileData) || profileLoading) return;
    
    const userId = user?.id || profileData?.id;
    if (!userId) return;
    
    try {
      setProfileLoading(true);
      
      // Fetch post count
      const { data, error, count } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('userId', userId);
      
      // Fetch friends count
      const friendsCountResult = await friendRequestService.getFriendsCount();
      
      if (!error) {
        const newStats = {
          postCount: count || 0,
          friendsCount: friendsCountResult.success ? friendsCountResult.count : 0
        };
        
        setProfileStats(newStats);
        
        // Cache the profile stats with timestamp
        const timestamp = Date.now();
        setProfileDataTimestamp(timestamp);
        
        // Save to storage
        const cacheData = {
          timestamp,
          data: newStats
        };
        
        setCachedProfileStats(cacheData);
        // await UserStorageService.setItem('profileStats', JSON.stringify(cacheData));
        await UserStorageService.storeUserData({ profileStats: cacheData });
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const userId = user?.id || profileData?.id;
    if (userId) {
      getPosts(ITEMS_PER_PAGE, userId);
    }
  }, [user?.id, profileData?.id]);

  const getPosts = useCallback(async () => {
    if (loading || !hasMore || !user?.id) return;
    
    try {
      setLoading(true);
      const res = await fetchPosts(page * ITEMS_PER_PAGE, user.id);
      
      if (res.success) {
        // Check if we've reached the end
        if (res.data.length === 0 || res.data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
        
        // Append new posts, avoiding duplicates
        setPosts(prevPosts => {
          const newPosts = res.data.filter(
            newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
          );
          return [...prevPosts, ...newPosts];
        });
        
        setPage(prev => prev + 1);
      } else {
        Alert.alert('Error', 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Something went wrong while fetching posts');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, user?.id]);

  return (
    <ScreenWrapper bg={activeTheme.colors.background}>
      {/* Wrap everything in a ScrollView */}
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Section */}
        <InstagramProfile 
          user={profileData || user}
          router={router} 
          handleLogout={onSettings} 
          theme={activeTheme}
          postCount={profileStats.postCount}
          friendsCount={profileStats.friendsCount}
          isLoading={profileLoading}
          lastUpdated={profileDataTimestamp ? new Date(profileDataTimestamp).toLocaleTimeString() : null}
        />
        
        {/* Tab Navigator */}
        <View style={styles.tabSection}>
          <TabNavigator
            posts={posts}
            loading={loading}
            hasMore={hasMore}
            getPosts={getPosts}
            user={user}
            router={router}
            theme={activeTheme}
            navigation={router} // Pass navigation for the reviews component
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const StatsItem = ({ label, value, theme, isLoading }) => (
  <View style={styles.statsItem}>
    <Text style={[styles.statsValue, { color: theme.colors.textDark }]}>
      {isLoading ? '...' : value}
    </Text>
    <Text style={[styles.statsLabel, { color: theme.colors.textLight }]}>{label}</Text>
  </View>
);

const InstagramProfile = React.memo(({ user, router, handleLogout, theme, postCount, friendsCount, isLoading, lastUpdated }) => {
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

  return (
    <View style={[styles.profileContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.username, { color: theme.colors.textDark }]}>{user?.name}</Text>

        <Pressable onPress={() => router.push('createFeed')}>
          <Icon name="plus" size={hp(3.2)} color="white" />
        </Pressable>
        <Pressable onPress={() => router.push('newRelease')}>
          <Icon name="plus" size={hp(3.2)} color="green" />
        </Pressable>
        <Pressable onPress={() => router.push('newOtt')}>
          <Icon name="plus" size={hp(3.2)} color="red" />
        </Pressable>
        <TouchableOpacity 
          style={[styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Icon name="menu" color={theme.colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Profile Info Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Avatar
            uri={user?.image}
            size={hp(12)}
            rounded={theme.radius.xxl * 1.4}
          />
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
        </View>

        <View style={styles.statsContainer}>
          <StatsItem 
            value={postCount?.toString() || "0"} 
            label="Posts" 
            theme={theme} 
            isLoading={isLoading}
          />
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
        <Text style={[styles.bioName, { color: theme.colors.textDark }]}>{user?.name}</Text>
        {user?.bio && <Text style={[styles.bio, { color: theme.colors.text }]}>{user.bio}</Text>}
        <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>Joined {formattedDate}</Text>
        {user?.address && <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>{user.address}</Text>}
        {lastUpdated && (
          <Text style={[styles.joinedDate, { color: theme.colors.textLight, fontSize: hp(1.2) }]}>
            Stats updated: {lastUpdated}
          </Text>
        )}
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {Array.isArray(parsedTags) && parsedTags.map((tag, index) => (
          <View 
            key={index} 
            style={[styles.tagPill, { 
              backgroundColor: theme.colors.secondary,
              borderColor: theme.colors.border 
            }]}
          >
            <Text style={[styles.tagPillText, { color: theme.colors.primary }]}>#{tag}</Text>
          </View>
        ))}
      </View>


        {/* Contact Info if its your friend */}
      {/* <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Icon name="mail" color={theme.colors.textLight} />
          <Text style={[styles.contactText, { color: theme.colors.textLight }]}>{user?.email}</Text>
        </View>
        {user?.phoneNumber && (
          <View style={styles.contactItem}>
            <Icon name="call" color={theme.colors.textLight} />
            <Text style={[styles.contactText, { color: theme.colors.textLight }]}>{user.phoneNumber}</Text>
          </View>
        )}
      </View> */}

      {/* Edit Profile Button --> put ! at start */}
      {!user?.verified && (
         <TouchableOpacity 
           style={[styles.editProfileButton, { backgroundColor: theme.colors.secondary }]}
           onPress={() => router.push({
             pathname: 'editProfile',
             params: { returnToRefresh: true }
           })}
         >
           <Text style={[styles.editProfileText, { color: theme.colors.textDark }]}>Verify Profile</Text>
         </TouchableOpacity>
      )}
    </View>
  );
});

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    padding: wp(3.5),
  },
  tabSection: {
    flex: 1,
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
    gap: 8,
    marginBottom: hp(2),
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: hp(1.4),
    fontWeight: '600',
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
  }
})