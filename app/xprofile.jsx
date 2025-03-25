import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Avatar from '../components/Avatar';
import Icon from '@/assets/icons';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import PostCard from '../components/PostCard';
import MLoading from '../components/MaterialLoader';
import { friendRequestService } from '../services/requestService';
import { profileService } from '../services/profileService';

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
};

const ITEMS_PER_PAGE = 4;

const FriendProfile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId;
  
  const [profileUser, setProfileUser] = useState(null);
  const [profileStats, setProfileStats] = useState({
    postCount: 0,
    friendsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [friendshipLoading, setFriendshipLoading] = useState(false);

  // Check if profile is the current user
  const isCurrentUser = user?.id === userId;

  // If current user, redirect to profile page
  useEffect(() => {
    if (isCurrentUser) {
      router.replace('/profile');
    }
  }, [isCurrentUser, router]);

  // Fetch profile data
  useEffect(() => {
    if (userId && !isCurrentUser) {
      fetchProfileData();
      checkFriendshipStatus();
    }
  }, [userId, isCurrentUser]);

  // Fetch user posts if they are friends
  useEffect(() => {
    if (friendshipStatus === 'accepted' && userId) {
      fetchUserPosts();
    }
  }, [friendshipStatus, userId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfileData(userId);
      
      if (response.success) {
        setProfileUser(response.userData);
        setProfileStats({
          postCount: response.postCount || 0,
          friendsCount: response.friendsCount || 0,
        });
      } else {
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Something went wrong while loading profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    if (!userId) return;
    
    try {
      setFriendshipLoading(true);
      const result = await friendRequestService.checkFriendship(userId);
      if (result.success) {
        setFriendshipStatus(result.status);
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (postsLoading || !hasMore || !userId) return;
    
    try {
      setPostsLoading(true);
      const response = await profileService.getUserPosts(userId, page * ITEMS_PER_PAGE);
      
      if (response.success) {
        // Check if we've reached the end
        if (response.data.length === 0 || response.data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
        
        // Append new posts, avoiding duplicates
        setPosts(prevPosts => {
          const newPosts = response.data.filter(
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
      setPostsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setFriendshipLoading(true);
      const result = await friendRequestService.sendRequest(userId);
      
      if (result.success) {
        Alert.alert('Success', 'Friend request sent successfully');
        setFriendshipStatus('pending');
      } else {
        Alert.alert('Error', result.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setFriendshipLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper bg={darkTheme.colors.background}>
        <View style={styles.loadingContainer}>
          <MLoading />
        </View>
      </ScreenWrapper>
    );
  }

  // Determine friend button state based on friendship status
  let buttonText = 'Add Friend';
  let buttonStyle = styles.addButton;
  let buttonTextStyle = styles.addButtonText;
  let buttonDisabled = false;
  
  switch (friendshipStatus) {
    case 'accepted':
      buttonText = 'Below are your friends posts';
      buttonStyle = styles.friendsButton;
      buttonTextStyle = styles.friendsButtonText;
      buttonDisabled = true;
      break;
    case 'pending':
      buttonText = 'Request Sent';
      buttonStyle = styles.pendingButton;
      buttonTextStyle = styles.pendingButtonText;
      buttonDisabled = true;
      break;
    case 'rejected':
      buttonText = 'Add Friend';
      break;
    default:
      buttonText = 'Add Friend';
  }

  const FooterComponent = () => {
    if (posts.length === 0) return null;

    return (
      <View style={{marginVertical: 0}} paddingBottom={16}>
        {postsLoading && <MLoading />}
        {!hasMore && posts.length > 0 && (
          <Text style={styles.noPosts}>No more posts to load</Text>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper bg={darkTheme.colors.background}>
      <FlatList
        data={friendshipStatus === 'accepted' ? posts : []}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <FriendProfileHeader 
            profileUser={profileUser}
            profileStats={profileStats}
            friendshipStatus={friendshipStatus}
            friendshipLoading={friendshipLoading}
            handleSendRequest={handleSendRequest}
            buttonText={buttonText}
            buttonStyle={buttonStyle}
            buttonTextStyle={buttonTextStyle}
            buttonDisabled={buttonDisabled}
            theme={darkTheme}
          />
        )}
        contentContainerStyle={styles.listStyle}
        keyExtractor={item => item?.id?.toString()}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            currentUser={user}
            router={router}
          />
        )}
        onEndReached={() => {
          if (hasMore && !postsLoading && friendshipStatus === 'accepted') {
            fetchUserPosts();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={FooterComponent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {friendshipStatus === 'accepted' ? (
              <Text style={styles.noPosts}>
                {postsLoading ? <MLoading /> : "No posts found"}
              </Text>
            ) : (
              <View style={styles.lockedContainer}>
                <Icon name="lock" size={hp(8)} color={darkTheme.colors.textLight} />
                <Text style={styles.lockedText}>
                  This content is only visible to friends
                </Text>
              </View>
            )}
          </View>
        )}
      />
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

const FriendProfileHeader = ({ 
  profileUser, 
  profileStats, 
  friendshipStatus,
  friendshipLoading,
  handleSendRequest,
  buttonText,
  buttonStyle,
  buttonTextStyle,
  buttonDisabled,
  theme 
}) => {
  let parsedTags = profileUser?.tags || [];
  if (typeof profileUser?.tags === 'string') {
    try {
      parsedTags = JSON.parse(profileUser.tags);
    } catch (e) {
      parsedTags = [];
    }
  }

  const formattedDate = new Date(profileUser?.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.username, { color: theme.colors.textDark }]}>{profileUser?.name}</Text>
        <TouchableOpacity style={styles.backButton}>
          <Icon name="menu" color={theme.colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Profile Info Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Avatar
            uri={profileUser?.image}
            size={hp(12)}
            rounded={theme.radius.xxl * 1.4}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatsItem 
            value={profileStats.postCount?.toString() || "0"} 
            label="Posts" 
            theme={theme}
            isLoading={false}
          />
          <StatsItem 
            value={profileStats.friendsCount?.toString() || "0"} 
            label="Friends" 
            theme={theme}
            isLoading={false}
          />
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <Text style={[styles.bioName, { color: theme.colors.textDark }]}>{profileUser?.name}</Text>
        {profileUser?.bio && <Text style={[styles.bio, { color: theme.colors.text }]}>{profileUser.bio}</Text>}
        <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>Joined {formattedDate}</Text>
        {profileUser?.address && <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>{profileUser.address}</Text>}
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

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Icon name="mail" color={theme.colors.textLight} />
          <Text style={[styles.contactText, { color: theme.colors.textLight }]}>{profileUser?.email}</Text>
        </View>
        {profileUser?.phoneNumber && (
          <View style={styles.contactItem}>
            <Icon name="call" color={theme.colors.textLight} />
            <Text style={[styles.contactText, { color: theme.colors.textLight }]}>{profileUser.phoneNumber}</Text>
          </View>
        )}
      </View>

      {/* Friend Request Button */}
      {friendshipLoading ? (
        <View style={styles.friendButtonContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.friendRequestButton, buttonStyle]}
          onPress={handleSendRequest}
          disabled={buttonDisabled}
        >
          <Text style={[styles.friendRequestText, buttonTextStyle]}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: wp(4),
  },
  listStyle: {
    paddingBottom: hp(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  backButton: {
    padding: wp(2),
  },
  username: {
    fontSize: hp(2.5),
    fontWeight: '700',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  avatarContainer: {
    marginRight: wp(4),
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: hp(2.2),
    fontWeight: '600',
  },
  statsLabel: {
    fontSize: hp(1.6),
  },
  bioSection: {
    marginBottom: hp(2),
  },
  bioName: {
    fontSize: hp(2),
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  bio: {
    fontSize: hp(1.8),
    marginBottom: hp(1),
  },
  joinedDate: {
    fontSize: hp(1.6),
    marginBottom: hp(0.5),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp(2),
  },
  tagPill: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.full,
    borderWidth: 1,
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  tagPillText: {
    fontSize: hp(1.6),
  },
  contactInfo: {
    marginBottom: hp(3),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  contactText: {
    marginLeft: wp(2),
    fontSize: hp(1.6),
  },
  friendRequestButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginBottom: hp(3),
  },
  friendRequestText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  friendButtonContainer: {
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginBottom: hp(3),
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    color: '#FFFFFF',
  },
  friendsButton: {
    backgroundColor: theme.colors.secondary,
  },
  friendsButtonText: {
    color: '#FFFFFF',
  },
  pendingButton: {
    backgroundColor: theme.colors.secondary,
  },
  pendingButtonText: {
    color: theme.colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(20),
  },
  noPosts: {
    color: darkTheme.colors.textLight,
    fontSize: hp(1.8),
    textAlign: 'center',
  },
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(5),
  },
  lockedText: {
    color: darkTheme.colors.textLight,
    fontSize: hp(1.8),
    textAlign: 'center',
    marginTop: hp(2),
    maxWidth: wp(70),
  },
});

export default FriendProfile;