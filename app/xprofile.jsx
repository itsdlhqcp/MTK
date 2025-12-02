import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Avatar from '../components/Avatar';
import Icon from '@/assets/icons';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import MLoading from '../components/MaterialLoader';
import { friendRequestService } from '../services/requestService';
import { profileService } from '../services/profileService';
import { NetworkUtils } from '../utils/network';
import TabNavigator from '../components/ProfileTabs';
import { useToast } from '../contexts/ToastContext';
import ProfileSkeleton from '../components/ProfileSkeleton';

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

const ITEMS_PER_PAGE = 5;

const FriendProfile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId;
  
  const [profileUser, setProfileUser] = useState(null);
  const [profileStats, setProfileStats] = useState({
    postCount: 0,
    friendsCount: 0,
    reviewCount: 0, 
  });
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasPostsAvailable, setHasPostsAvailable] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const { showToast } = useToast();

  // Check if profile is the current user
  const isCurrentUser = user?.id === userId;

  // Reset navigation state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );

  // Set up network listener
  useEffect(() => {
    const unsubscribe = NetworkUtils.initNetworkListener(setIsConnected);
    return () => unsubscribe();
  }, []);

  // Effect to handle online/offline transitions
  useEffect(() => {
    if (!isConnected) {
      setOfflineMode(true);
      Alert.alert('Network Error', 'You are currently offline. Some features may be unavailable.');
    } else {
      setOfflineMode(false);
    }
  }, [isConnected]);

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

  // Fetch user posts regardless of friendship status
  useEffect(() => {
    if (userId && isConnected) {
      fetchUserPosts();
    }
  }, [userId, isConnected]);

  const fetchProfileData = async () => {
    if (!isConnected) {
      Alert.alert('Network Error', 'Cannot load profile data while offline');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await profileService.getProfileData(userId);
      
      if (response.success) {
        setProfileUser(response.userData);
        setProfileStats({
          postCount: response.postCount || 0,
          friendsCount: response.friendsCount || 0,
          reviewCount: response.reviewCount || 0,
        });
        setHasPostsAvailable(response.postCount > 0);
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
    if (!userId || !isConnected) return;
    
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
    if (postsLoading || !hasMore || !userId || !isConnected) return;
    
    try {
      setPostsLoading(true);
      const response = await profileService.getUserPosts(userId, page * ITEMS_PER_PAGE);
      
      if (response.success) {
        // Check if we've reached the end
        if (response.data.length === 0 || response.data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
        
        // Update post availability based on API response
        setHasPostsAvailable(response.data.length > 0);
        
        // Append new posts, avoiding duplicates
        setPosts(prevPosts => {
          const newPosts = response.data.filter(
            newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
          );
          return [...prevPosts, ...newPosts];
        });
        
        setPage(prev => prev + 1);
      } else {
        showToast('success', 'Failed to fetch posts- Network Problem!!');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Something went wrong while fetching posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!isConnected) {
      showToast('error', 'Cannot send friend request while offline');
      return;
    }
    
    if (isNavigating) return;
    setIsNavigating(true);
    
    try {
      setFriendshipLoading(true);
      const result = await friendRequestService.sendRequest(userId);
      
      if (result.success) {
        showToast('success', 'Friend request sent successfully');
        setFriendshipStatus('pending');
      } else {
        Alert.alert('Error', result.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setFriendshipLoading(false);
      setIsNavigating(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper bg={darkTheme.colors.background}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <ProfileSkeleton />
        </ScrollView>
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
      buttonText = 'We are Friends';
      buttonStyle = styles.friendsButton;
      buttonTextStyle = styles.friendsButtonText;
      buttonDisabled = true;
      break;
    case 'pending':
      buttonText = 'Request Sent xx';
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

  return (
    <ScreenWrapper bg={darkTheme.colors.background}>
      {/* Offline Mode Indicator */}
      {offlineMode && (
        <View style={[styles.offlineBar, { backgroundColor: darkTheme.colors.rose }]}>
          <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
        </View>
      )}
      
      {/* Wrap everything in a ScrollView */}
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Section */}
        <FriendProfileHeader 
          profileUser={profileUser}
          profileStats={profileStats}
          friendshipStatus={friendshipStatus}
          friendshipLoading={friendshipLoading}
          handleSendRequest={handleSendRequest}
          buttonText={buttonText}
          buttonStyle={buttonStyle}
          buttonTextStyle={buttonTextStyle}
          buttonDisabled={buttonDisabled || !isConnected || isNavigating}
          theme={darkTheme}
          router={router}
          isNavigating={isNavigating}
          setIsNavigating={setIsNavigating}
        />
        
        {/* Tab Navigator */}
        <View style={styles.tabSection}>
          <TabNavigator
            posts={posts}
            loading={postsLoading}
            hasMore={hasMore}
            getPosts={isConnected ? fetchUserPosts : null} // Don't load more if offline
            user={profileUser}
            router={router}
            theme={darkTheme}
            navigation={router}
            offlineMode={offlineMode}
            hasPostsAvailable={hasPostsAvailable}
            userId={userId} 
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
  theme,
  router,
  isNavigating,
  setIsNavigating
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
  
  const goBack = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.back();
  };

  // Determine if we should show the friend request button
  const shouldShowFriendButton = friendshipStatus !== 'accepted' && friendshipStatus !== 'pending';

  return (
    <View style={[styles.profileContainer, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.username, { color: theme.colors.textDark }]}>{profileUser?.name}</Text>
        <View style={styles.toppanel}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={goBack}
            disabled={isNavigating}
          >
            <Icon name="menu" color={theme.colors.textDark} />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.backButton}>
            <Icon name="menu" color={theme.colors.textDark} />
          </TouchableOpacity> */}
        </View>
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
              value={profileStats.reviewCount?.toString() || "0"} 
              label="Reviews" 
              theme={theme}
              isLoading={false}
            />
            {profileStats.postCount > 1 && ( 
                <StatsItem 
                value={profileStats.postCount?.toString() || "0"} 
                label="Posts" 
                theme={theme}
                isLoading={false}
              />
             )}
        
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
      {Array.isArray(parsedTags) && parsedTags.length > 0 && (
        <View style={styles.tagsContainer}>
          {parsedTags.map((tag, index) => (
            <View 
              key={index} 
              style={[styles.tagPill, { 
                backgroundColor: theme.colors.secondary,
                borderColor: theme.colors.primary,
                borderWidth: 1.5,
              }]}
            >
              <Text style={[styles.tagPillText, { color: theme.colors.primary }]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Friend Request Button - Only show if not "We are Friends" or "Request Sent" */}
      {shouldShowFriendButton && (
        friendshipLoading ? (
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
        )
      )}
    </View>
  );
};

export default FriendProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabSection: {
    flex: 1,
    borderTopWidth: 1.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: hp(1),
  },
  profileContainer: {
    padding: wp(4),
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
  toppanel: {
    flexDirection: 'row',
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
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginBottom: 0,
    marginTop: hp(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  friendRequestText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: hp(1.8),
  },
  friendButtonContainer: {
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginBottom: 0,
    marginTop: hp(1),
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    color: "white"
  },
  friendsButton: {
    backgroundColor: theme.colors.secondary,
  },
  friendsButtonText: {
    color: theme.colors.primary,
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
});


// working code

// import React, { useState, useEffect, useCallback } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { useFocusEffect } from '@react-navigation/native';
// import { useAuth } from '../contexts/AuthContext';
// import ScreenWrapper from '../components/ScreenWrapper';
// import Avatar from '../components/Avatar';
// import Icon from '@/assets/icons';
// import theme from '../constants/theme';
// import { hp, wp } from '../helpers/common';
// import MLoading from '../components/MaterialLoader';
// import { friendRequestService } from '../services/requestService';
// import { profileService } from '../services/profileService';
// import { NetworkUtils } from '../utils/network';
// import TabNavigator from '../components/ProfileTabs';

// // Dark mode colors
// const darkTheme = {
//   ...theme,
//   colors: {
//     ...theme.colors,
//     background: '#000000',
//     cardBackground: '#121212',
//     textDark: '#FFFFFF',
//     textLight: '#A8A8A8',
//     text: '#FFFFFF',
//     border: '#262626',
//     primary: '#0095F6',
//     secondary: '#262626',
//     rose: '#FF375F',
//   }
// };

// const ITEMS_PER_PAGE = 5;

// const FriendProfile = () => {
//   const { user } = useAuth();
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const userId = params.userId;
  
//   const [profileUser, setProfileUser] = useState(null);
//   const [profileStats, setProfileStats] = useState({
//     postCount: 0,
//     friendsCount: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [posts, setPosts] = useState([]);
//   const [postsLoading, setPostsLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [friendshipStatus, setFriendshipStatus] = useState(null);
//   const [friendshipLoading, setFriendshipLoading] = useState(false);
//   const [isConnected, setIsConnected] = useState(true);
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [hasPostsAvailable, setHasPostsAvailable] = useState(false);
//   const [offlineMode, setOfflineMode] = useState(false);

//   // Check if profile is the current user
//   const isCurrentUser = user?.id === userId;

//   // Reset navigation state when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       setIsNavigating(false);
//     }, [])
//   );

//   // Set up network listener
//   useEffect(() => {
//     const unsubscribe = NetworkUtils.initNetworkListener(setIsConnected);
//     return () => unsubscribe();
//   }, []);

//   // Effect to handle online/offline transitions
//   useEffect(() => {
//     if (!isConnected) {
//       setOfflineMode(true);
//       Alert.alert('Network Error', 'You are currently offline. Some features may be unavailable.');
//     } else {
//       setOfflineMode(false);
//     }
//   }, [isConnected]);

//   // If current user, redirect to profile page
//   useEffect(() => {
//     if (isCurrentUser) {
//       router.replace('/profile');
//     }
//   }, [isCurrentUser, router]);

//   // Fetch profile data
//   useEffect(() => {
//     if (userId && !isCurrentUser) {
//       fetchProfileData();
//       checkFriendshipStatus();
//     }
//   }, [userId, isCurrentUser]);

//   // Fetch user posts regardless of friendship status
//   useEffect(() => {
//     if (userId && isConnected) {
//       fetchUserPosts();
//     }
//   }, [userId, isConnected]);

//   const fetchProfileData = async () => {
//     if (!isConnected) {
//       Alert.alert('Network Error', 'Cannot load profile data while offline');
//       setLoading(false);
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const response = await profileService.getProfileData(userId);
      
//       if (response.success) {
//         setProfileUser(response.userData);
//         setProfileStats({
//           postCount: response.postCount || 0,
//           friendsCount: response.friendsCount || 0,
//         });
//         setHasPostsAvailable(response.postCount > 0);
//       } else {
//         Alert.alert('Error', 'Failed to load profile data');
//       }
//     } catch (error) {
//       console.error('Error fetching profile data:', error);
//       Alert.alert('Error', 'Something went wrong while loading profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkFriendshipStatus = async () => {
//     if (!userId || !isConnected) return;
    
//     try {
//       setFriendshipLoading(true);
//       const result = await friendRequestService.checkFriendship(userId);
//       if (result.success) {
//         setFriendshipStatus(result.status);
//       }
//     } catch (error) {
//       console.error('Error checking friendship status:', error);
//     } finally {
//       setFriendshipLoading(false);
//     }
//   };

//   const fetchUserPosts = async () => {
//     if (postsLoading || !hasMore || !userId || !isConnected) return;
    
//     try {
//       setPostsLoading(true);
//       const response = await profileService.getUserPosts(userId, page * ITEMS_PER_PAGE);
      
//       if (response.success) {
//         // Check if we've reached the end
//         if (response.data.length === 0 || response.data.length < ITEMS_PER_PAGE) {
//           setHasMore(false);
//         }
        
//         // Update post availability based on API response
//         setHasPostsAvailable(response.data.length > 0);
        
//         // Append new posts, avoiding duplicates
//         setPosts(prevPosts => {
//           const newPosts = response.data.filter(
//             newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
//           );
//           return [...prevPosts, ...newPosts];
//         });
        
//         setPage(prev => prev + 1);
//       } else {
//         Alert.alert('Error', 'Failed to fetch posts');
//       }
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       Alert.alert('Error', 'Something went wrong while fetching posts');
//     } finally {
//       setPostsLoading(false);
//     }
//   };

//   const handleSendRequest = async () => {
//     if (!isConnected) {
//       Alert.alert('Error', 'Cannot send friend request while offline');
//       return;
//     }
    
//     if (isNavigating) return;
//     setIsNavigating(true);
    
//     try {
//       setFriendshipLoading(true);
//       const result = await friendRequestService.sendRequest(userId);
      
//       if (result.success) {
//         Alert.alert('Success', 'Friend request sent successfully');
//         setFriendshipStatus('pending');
//       } else {
//         Alert.alert('Error', result.message || 'Failed to send friend request');
//       }
//     } catch (error) {
//       console.error('Error sending friend request:', error);
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setFriendshipLoading(false);
//       setIsNavigating(false);
//     }
//   };

//   if (loading) {
//     return (
//       <ScreenWrapper bg={darkTheme.colors.background}>
//         <View style={styles.loadingContainer}>
//           <MLoading />
//         </View>
//       </ScreenWrapper>
//     );
//   }

//   // Determine friend button state based on friendship status
//   let buttonText = 'Add Friend';
//   let buttonIcon = 'send';
//   let buttonStyle = styles.actionButtonPrimary;
//   let buttonTextStyle = styles.actionButtonTextPrimary;
//   let buttonDisabled = false;
  
//   switch (friendshipStatus) {
//     case 'accepted':
//       buttonText = 'Friends';
//       buttonIcon = 'send';
//       buttonStyle = styles.actionButtonSecondary;
//       buttonTextStyle = styles.actionButtonTextSecondary;
//       buttonDisabled = true;
//       break;
//     case 'pending':
//       buttonText = 'Pending';
//       buttonIcon = 'send';
//       buttonStyle = styles.actionButtonPending;
//       buttonTextStyle = styles.actionButtonTextPending;
//       buttonDisabled = true;
//       break;
//     case 'rejected':
//       buttonText = 'Add Friend';
//       buttonIcon = 'send';
//       break;
//     default:
//       buttonText = 'Add Friend';
//       buttonIcon = 'send';
//   }

//   return (
//     <ScreenWrapper bg={darkTheme.colors.background}>
//       {/* Offline Mode Indicator */}
//       {offlineMode && (
//         <View style={[styles.offlineBar, { backgroundColor: darkTheme.colors.rose }]}>
//           <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
//         </View>
//       )}
      
//       {/* Header with profile info and action buttons */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.backButton} 
//           onPress={() => {
//             if (!isNavigating) {
//               setIsNavigating(true);
//               router.back();
//             }
//           }}
//           disabled={isNavigating}
//         >
//           <Icon name="send" color={darkTheme.colors.textDark} />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, { color: darkTheme.colors.textDark }]}>
//           {profileUser?.name || 'Profile'}
//         </Text>
        
//         {/* Friend Request Action Button - Now in the header */}
//         {friendshipLoading ? (
//           <View style={styles.headerActionButton}>
//             <ActivityIndicator size="small" color={darkTheme.colors.primary} />
//           </View>
//         ) : (
//           <TouchableOpacity 
//             style={[styles.headerActionButton, buttonStyle]}
//             onPress={handleSendRequest}
//             disabled={buttonDisabled || !isConnected || isNavigating}
//           >
//             <Icon name={buttonIcon} size={18} color={buttonDisabled ? darkTheme.colors.primary : '#FFFFFF'} />
//           </TouchableOpacity>
//         )}
//       </View>
      
//       {/* Wrap everything in a ScrollView */}
//       <ScrollView 
//         style={styles.container}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Profile Info Section */}
//         <FriendProfileHeader 
//           profileUser={profileUser}
//           profileStats={profileStats}
//           friendshipStatus={friendshipStatus}
//           theme={darkTheme}
//           router={router}
//           isNavigating={isNavigating}
//           setIsNavigating={setIsNavigating}
//           handleSendRequest={handleSendRequest}
//           buttonText={buttonText}
//           buttonIcon={buttonIcon}
//           buttonStyle={buttonStyle}
//           buttonTextStyle={buttonTextStyle}
//           buttonDisabled={buttonDisabled || !isConnected || isNavigating}
//           friendshipLoading={friendshipLoading}
//         />
        
//         {/* Tab Navigator */}
//         <View style={styles.tabSection}>
//           <TabNavigator
//             posts={posts}
//             loading={postsLoading}
//             hasMore={hasMore}
//             getPosts={isConnected ? fetchUserPosts : null} // Don't load more if offline
//             user={profileUser}
//             router={router}
//             theme={darkTheme}
//             navigation={router}
//             offlineMode={offlineMode}
//             hasPostsAvailable={hasPostsAvailable}
//             userId={userId} 
//           />
//         </View>
//       </ScrollView>
//     </ScreenWrapper>
//   );
// };

// const StatsItem = ({ label, value, theme, isLoading, onPress }) => (
//   <TouchableOpacity style={styles.statsItem} onPress={onPress} disabled={!onPress}>
//     <Text style={[styles.statsValue, { color: theme.colors.textDark }]}>
//       {isLoading ? '...' : value}
//     </Text>
//     <Text style={[styles.statsLabel, { color: theme.colors.textLight }]}>{label}</Text>
//   </TouchableOpacity>
// );

// const FriendProfileHeader = ({ 
//   profileUser, 
//   profileStats, 
//   friendshipStatus,
//   theme,
//   router,
//   isNavigating,
//   setIsNavigating,
//   handleSendRequest,
//   buttonText,
//   buttonIcon,
//   buttonDisabled,
//   friendshipLoading
// }) => {
//   let parsedTags = profileUser?.tags || [];
//   if (typeof profileUser?.tags === 'string') {
//     try {
//       parsedTags = JSON.parse(profileUser.tags);
//     } catch (e) {
//       parsedTags = [];
//     }
//   }

//   const formattedDate = new Date(profileUser?.created_at || Date.now()).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//   });

//   // Function to navigate to friends list
//   const navigateToFriends = () => {
//     if (isNavigating) return;
//     setIsNavigating(true);
//     router.push(`/friends?userId=${profileUser?.id}`);
//   };

//   return (
//     <View style={[styles.profileContainer, { backgroundColor: theme.colors.background }]}>
//       {/* Profile Info Section with Cover Image */}
//       <View style={[styles.coverContainer, { backgroundColor: theme.colors.secondary }]}>
//         {/* Could add actual cover image here */}
//       </View>

//       <View style={styles.profileInfoWrapper}>
//         {/* Avatar with status indicator */}
//         <View style={styles.avatarWithStatus}>
//           <Avatar
//             uri={profileUser?.image}
//             size={hp(12)}
//             rounded={theme.radius.xxl * 1.4}
//           />
//           {friendshipStatus === 'accepted' && (
//             <View style={styles.statusIndicator} />
//           )}
//         </View>

//         {/* Profile Info */}
//         <View style={styles.profileInfo}>
//           <Text style={[styles.profileName, { color: theme.colors.textDark }]}>
//             {profileUser?.name}
//           </Text>
          
//           {/* Stats with interactive elements */}
//           <View style={styles.statsContainer}>
//             <StatsItem 
//               value={profileStats.postCount?.toString() || "0"} 
//               label="Posts" 
//               theme={theme}
//               isLoading={false}
//             />
//             <StatsItem 
//               value={profileStats.friendsCount?.toString() || "0"} 
//               label="Friends" 
//               theme={theme}
//               isLoading={false}
//               onPress={navigateToFriends}
//             />
//           </View>
//         </View>
//       </View>

//       {/* Friend status pill - shows current relationship status */}
//       {friendshipStatus && !friendshipLoading && (
//         <View style={styles.friendshipStatusContainer}>
//           <View style={[
//             styles.friendshipStatusPill, 
//             { backgroundColor: friendshipStatus === 'accepted' ? theme.colors.secondary : theme.colors.background }
//           ]}>
//             <Icon 
//               name={friendshipStatus === 'accepted' ? 'user-check' : friendshipStatus === 'pending' ? 'send' : 'send'} 
//               size={14} 
//               color={friendshipStatus === 'accepted' ? theme.colors.primary : theme.colors.textLight} 
//             />
//             <Text style={[
//               styles.friendshipStatusText, 
//               { color: friendshipStatus === 'accepted' ? theme.colors.primary : theme.colors.textLight }
//             ]}>
//               {friendshipStatus === 'accepted' ? 'Friends' : friendshipStatus === 'pending' ? 'Request Sent' : 'Not Friends'}
//             </Text>
//           </View>
//         </View>
//       )}

//       {/* Bio Section */}
//       <View style={styles.bioSection}>
//         {profileUser?.bio && (
//           <Text style={[styles.bio, { color: theme.colors.text }]}>
//             {profileUser.bio}
//           </Text>
//         )}
//         <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>
//           Joined {formattedDate}
//         </Text>
//         {profileUser?.address && (
//           <View style={styles.locationContainer}>
//             <Icon name="send" size={14} color={theme.colors.textLight} />
//             <Text style={[styles.location, { color: theme.colors.textLight }]}>
//               {profileUser.address}
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* Tags */}
//       {Array.isArray(parsedTags) && parsedTags.length > 0 && (
//         <View style={styles.tagsContainer}>
//           {parsedTags.map((tag, index) => (
//             <View 
//               key={index} 
//               style={[styles.tagPill, { 
//                 backgroundColor: theme.colors.secondary,
//                 borderColor: theme.colors.border 
//               }]}
//             >
//               <Text style={[styles.tagPillText, { color: theme.colors.primary }]}>#{tag}</Text>
//             </View>
//           ))}
//         </View>
//       )}

//       {/* Action Buttons Row */}
//       <View style={styles.actionButtonsContainer}>
//         {/* Message Button */}
//         <TouchableOpacity 
//           style={[styles.actionButton, styles.actionButtonSecondary, { flex: 1 }]}
//           onPress={() => {
//             if (!isNavigating) {
//               setIsNavigating(true);
//               router.push(`/messages?userId=${profileUser?.id}`);
//             }
//           }}
//           disabled={isNavigating}
//         >
//           <Icon name="send" size={18} color={theme.colors.primary} />
//           <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Message</Text>
//         </TouchableOpacity>

//         {/* Friend Request Button - Secondary placement for visibility */}
//         {!buttonDisabled && !friendshipLoading && (
//           <TouchableOpacity 
//             style={[styles.actionButton, styles.actionButtonPrimary, { flex: 1 }]}
//             onPress={handleSendRequest}
//             disabled={buttonDisabled || !isConnected || isNavigating}
//           >
//             <Icon name={buttonIcon} size={18} color="#FFFFFF" />
//             <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>{buttonText}</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// };

// export default FriendProfile;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: wp(4),
//     paddingVertical: hp(1.5),
//     borderBottomWidth: 1,
//     borderBottomColor: darkTheme.colors.border,
//   },
//   headerTitle: {
//     fontSize: hp(2.2),
//     fontWeight: '700',
//     flex: 1,
//     textAlign: 'center',
//   },
//   backButton: {
//     padding: wp(2),
//   },
//   headerActionButton: {
//     width: wp(10),
//     height: wp(10),
//     borderRadius: wp(5),
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   tabSection: {
//     flex: 1,
//   },
//   profileContainer: {
//     paddingBottom: hp(2),
//   },
//   coverContainer: {
//     height: hp(15),
//     width: '100%',
//   },
//   profileInfoWrapper: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     marginTop: -hp(6),
//     paddingHorizontal: wp(4),
//   },
//   avatarWithStatus: {
//     position: 'relative',
//   },
//   statusIndicator: {
//     position: 'absolute',
//     bottom: hp(0.5),
//     right: wp(0.5),
//     width: wp(3),
//     height: wp(3),
//     borderRadius: wp(1.5),
//     backgroundColor: '#4CAF50',
//     borderWidth: 2,
//     borderColor: darkTheme.colors.background,
//   },
//   profileInfo: {
//     flex: 1,
//     marginLeft: wp(3),
//     paddingBottom: hp(1),
//   },
//   profileName: {
//     fontSize: hp(2.5),
//     fontWeight: '700',
//     marginBottom: hp(1),
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'flex-start',
//     gap: wp(4),
//   },
//   statsItem: {
//     alignItems: 'center',
//     flexDirection: 'row',
//     gap: wp(1),
//   },
//   statsValue: {
//     fontSize: hp(1.8),
//     fontWeight: '600',
//   },
//   statsLabel: {
//     fontSize: hp(1.6),
//   },
//   friendshipStatusContainer: {
//     paddingHorizontal: wp(4),
//     marginTop: hp(2),
//   },
//   friendshipStatusPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     borderRadius: hp(2),
//     borderWidth: 1,
//     borderColor: darkTheme.colors.border,
//     gap: wp(1),
//   },
//   friendshipStatusText: {
//     fontSize: hp(1.4),
//     fontWeight: '500',
//   },
//   bioSection: {
//     paddingHorizontal: wp(4),
//     marginTop: hp(2),
//   },
//   bio: {
//     fontSize: hp(1.8),
//     marginBottom: hp(1),
//   },
//   joinedDate: {
//     fontSize: hp(1.4),
//     marginBottom: hp(1),
//   },
//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: wp(1),
//   },
//   location: {
//     fontSize: hp(1.4),
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: hp(2),
//     paddingHorizontal: wp(4),
//   },
//   tagPill: {
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(0.6),
//     borderRadius: theme.radius.full,
//     borderWidth: 1,
//   },
//   tagPillText: {
//     fontSize: hp(1.4),
//   },
//   actionButtonsContainer: {
//     flexDirection: 'row',
//     marginTop: hp(3),
//     paddingHorizontal: wp(4),
//     gap: wp(3),
//   },
//   actionButton: {
//     flexDirection: 'row',
//     paddingVertical: hp(1.2),
//     borderRadius: theme.radius.lg,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: wp(2),
//   },
//   actionButtonPrimary: {
//     backgroundColor: darkTheme.colors.primary,
//   },
//   actionButtonSecondary: {
//     backgroundColor: darkTheme.colors.secondary,
//     borderWidth: 1,
//     borderColor: darkTheme.colors.border,
//   },
//   actionButtonPending: {
//     backgroundColor: darkTheme.colors.secondary,
//     borderWidth: 1,
//     borderColor: darkTheme.colors.border,
//   },
//   actionButtonText: {
//     fontWeight: '600',
//     fontSize: hp(1.6),
//   },
//   actionButtonTextPrimary: {
//     color: '#FFFFFF',
//   },
//   actionButtonTextSecondary: {
//     color: darkTheme.colors.primary,
//   },
//   actionButtonTextPending: {
//     color: darkTheme.colors.textLight,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   offlineBar: {
//     padding: hp(1),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   offlineText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: hp(1.4),
//   },
// });


// actual icon component of working code here


// import React, { useState, useEffect, useCallback } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { useFocusEffect } from '@react-navigation/native';
// import { useAuth } from '../contexts/AuthContext';
// import ScreenWrapper from '../components/ScreenWrapper';
// import Avatar from '../components/Avatar';
// import Icon from '@/assets/icons';
// import theme from '../constants/theme';
// import { hp, wp } from '../helpers/common';
// import MLoading from '../components/MaterialLoader';
// import { friendRequestService } from '../services/requestService';
// import { profileService } from '../services/profileService';
// import { NetworkUtils } from '../utils/network';
// import TabNavigator from '../components/ProfileTabs';

// // Dark mode colors
// const darkTheme = {
//   ...theme,
//   colors: {
//     ...theme.colors,
//     background: '#000000',
//     cardBackground: '#121212',
//     textDark: '#FFFFFF',
//     textLight: '#A8A8A8',
//     text: '#FFFFFF',
//     border: '#262626',
//     primary: '#0095F6',
//     secondary: '#262626',
//     rose: '#FF375F',
//   }
// };

// const ITEMS_PER_PAGE = 5;

// const FriendProfile = () => {
//   const { user } = useAuth();
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const userId = params.userId;
  
//   const [profileUser, setProfileUser] = useState(null);
//   const [profileStats, setProfileStats] = useState({
//     postCount: 0,
//     friendsCount: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [posts, setPosts] = useState([]);
//   const [postsLoading, setPostsLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [friendshipStatus, setFriendshipStatus] = useState(null);
//   const [friendshipLoading, setFriendshipLoading] = useState(false);
//   const [isConnected, setIsConnected] = useState(true);
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [hasPostsAvailable, setHasPostsAvailable] = useState(false);
//   const [offlineMode, setOfflineMode] = useState(false);

//   // Check if profile is the current user
//   const isCurrentUser = user?.id === userId;

//   // Reset navigation state when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       setIsNavigating(false);
//     }, [])
//   );

//   // Set up network listener
//   useEffect(() => {
//     const unsubscribe = NetworkUtils.initNetworkListener(setIsConnected);
//     return () => unsubscribe();
//   }, []);

//   // Effect to handle online/offline transitions
//   useEffect(() => {
//     if (!isConnected) {
//       setOfflineMode(true);
//       Alert.alert('Network Error', 'You are currently offline. Some features may be unavailable.');
//     } else {
//       setOfflineMode(false);
//     }
//   }, [isConnected]);

//   // If current user, redirect to profile page
//   useEffect(() => {
//     if (isCurrentUser) {
//       router.replace('/profile');
//     }
//   }, [isCurrentUser, router]);

//   // Fetch profile data
//   useEffect(() => {
//     if (userId && !isCurrentUser) {
//       fetchProfileData();
//       checkFriendshipStatus();
//     }
//   }, [userId, isCurrentUser]);

//   // Fetch user posts regardless of friendship status
//   useEffect(() => {
//     if (userId && isConnected) {
//       fetchUserPosts();
//     }
//   }, [userId, isConnected]);

//   const fetchProfileData = async () => {
//     if (!isConnected) {
//       Alert.alert('Network Error', 'Cannot load profile data while offline');
//       setLoading(false);
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const response = await profileService.getProfileData(userId);
      
//       if (response.success) {
//         setProfileUser(response.userData);
//         setProfileStats({
//           postCount: response.postCount || 0,
//           friendsCount: response.friendsCount || 0,
//         });
//         setHasPostsAvailable(response.postCount > 0);
//       } else {
//         Alert.alert('Error', 'Failed to load profile data');
//       }
//     } catch (error) {
//       console.error('Error fetching profile data:', error);
//       Alert.alert('Error', 'Something went wrong while loading profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const checkFriendshipStatus = async () => {
//     if (!userId || !isConnected) return;
    
//     try {
//       setFriendshipLoading(true);
//       const result = await friendRequestService.checkFriendship(userId);
//       if (result.success) {
//         setFriendshipStatus(result.status);
//       }
//     } catch (error) {
//       console.error('Error checking friendship status:', error);
//     } finally {
//       setFriendshipLoading(false);
//     }
//   };

//   const fetchUserPosts = async () => {
//     if (postsLoading || !hasMore || !userId || !isConnected) return;
    
//     try {
//       setPostsLoading(true);
//       const response = await profileService.getUserPosts(userId, page * ITEMS_PER_PAGE);
      
//       if (response.success) {
//         // Check if we've reached the end
//         if (response.data.length === 0 || response.data.length < ITEMS_PER_PAGE) {
//           setHasMore(false);
//         }
        
//         // Update post availability based on API response
//         setHasPostsAvailable(response.data.length > 0);
        
//         // Append new posts, avoiding duplicates
//         setPosts(prevPosts => {
//           const newPosts = response.data.filter(
//             newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
//           );
//           return [...prevPosts, ...newPosts];
//         });
        
//         setPage(prev => prev + 1);
//       } else {
//         Alert.alert('Error', 'Failed to fetch posts');
//       }
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       Alert.alert('Error', 'Something went wrong while fetching posts');
//     } finally {
//       setPostsLoading(false);
//     }
//   };

//   const handleSendRequest = async () => {
//     if (!isConnected) {
//       Alert.alert('Error', 'Cannot send friend request while offline');
//       return;
//     }
    
//     if (isNavigating) return;
//     setIsNavigating(true);
    
//     try {
//       setFriendshipLoading(true);
//       const result = await friendRequestService.sendRequest(userId);
      
//       if (result.success) {
//         Alert.alert('Success', 'Friend request sent successfully');
//         setFriendshipStatus('pending');
//       } else {
//         Alert.alert('Error', result.message || 'Failed to send friend request');
//       }
//     } catch (error) {
//       console.error('Error sending friend request:', error);
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setFriendshipLoading(false);
//       setIsNavigating(false);
//     }
//   };

//   if (loading) {
//     return (
//       <ScreenWrapper bg={darkTheme.colors.background}>
//         <View style={styles.loadingContainer}>
//           <MLoading />
//         </View>
//       </ScreenWrapper>
//     );
//   }

//   // Determine friend button state based on friendship status
//   let buttonText = 'Add Friend';
//   let buttonIcon = 'user-plus';
//   let buttonStyle = styles.actionButtonPrimary;
//   let buttonTextStyle = styles.actionButtonTextPrimary;
//   let buttonDisabled = false;
  
//   switch (friendshipStatus) {
//     case 'accepted':
//       buttonText = 'Friends';
//       buttonIcon = 'user-check';
//       buttonStyle = styles.actionButtonSecondary;
//       buttonTextStyle = styles.actionButtonTextSecondary;
//       buttonDisabled = true;
//       break;
//     case 'pending':
//       buttonText = 'Pending';
//       buttonIcon = 'clock';
//       buttonStyle = styles.actionButtonPending;
//       buttonTextStyle = styles.actionButtonTextPending;
//       buttonDisabled = true;
//       break;
//     case 'rejected':
//       buttonText = 'Add Friend';
//       buttonIcon = 'user-plus';
//       break;
//     default:
//       buttonText = 'Add Friend';
//       buttonIcon = 'user-plus';
//   }

//   return (
//     <ScreenWrapper bg={darkTheme.colors.background}>
//       {/* Offline Mode Indicator */}
//       {offlineMode && (
//         <View style={[styles.offlineBar, { backgroundColor: darkTheme.colors.rose }]}>
//           <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
//         </View>
//       )}
      
//       {/* Header with profile info and action buttons */}
//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.backButton} 
//           onPress={() => {
//             if (!isNavigating) {
//               setIsNavigating(true);
//               router.back();
//             }
//           }}
//           disabled={isNavigating}
//         >
//           <Icon name="arrow-left" color={darkTheme.colors.textDark} />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, { color: darkTheme.colors.textDark }]}>
//           {profileUser?.name || 'Profile'}
//         </Text>
        
//         {/* Friend Request Action Button - Now in the header */}
//         {friendshipLoading ? (
//           <View style={styles.headerActionButton}>
//             <ActivityIndicator size="small" color={darkTheme.colors.primary} />
//           </View>
//         ) : (
//           <TouchableOpacity 
//             style={[styles.headerActionButton, buttonStyle]}
//             onPress={handleSendRequest}
//             disabled={buttonDisabled || !isConnected || isNavigating}
//           >
//             <Icon name={buttonIcon} size={18} color={buttonDisabled ? darkTheme.colors.primary : '#FFFFFF'} />
//           </TouchableOpacity>
//         )}
//       </View>
      
//       {/* Wrap everything in a ScrollView */}
//       <ScrollView 
//         style={styles.container}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Profile Info Section */}
//         <FriendProfileHeader 
//           profileUser={profileUser}
//           profileStats={profileStats}
//           friendshipStatus={friendshipStatus}
//           theme={darkTheme}
//           router={router}
//           isNavigating={isNavigating}
//           setIsNavigating={setIsNavigating}
//           handleSendRequest={handleSendRequest}
//           buttonText={buttonText}
//           buttonIcon={buttonIcon}
//           buttonStyle={buttonStyle}
//           buttonTextStyle={buttonTextStyle}
//           buttonDisabled={buttonDisabled || !isConnected || isNavigating}
//           friendshipLoading={friendshipLoading}
//         />
        
//         {/* Tab Navigator */}
//         <View style={styles.tabSection}>
//           <TabNavigator
//             posts={posts}
//             loading={postsLoading}
//             hasMore={hasMore}
//             getPosts={isConnected ? fetchUserPosts : null} // Don't load more if offline
//             user={profileUser}
//             router={router}
//             theme={darkTheme}
//             navigation={router}
//             offlineMode={offlineMode}
//             hasPostsAvailable={hasPostsAvailable}
//             userId={userId} 
//           />
//         </View>
//       </ScrollView>
//     </ScreenWrapper>
//   );
// };

// const StatsItem = ({ label, value, theme, isLoading, onPress }) => (
//   <TouchableOpacity style={styles.statsItem} onPress={onPress} disabled={!onPress}>
//     <Text style={[styles.statsValue, { color: theme.colors.textDark }]}>
//       {isLoading ? '...' : value}
//     </Text>
//     <Text style={[styles.statsLabel, { color: theme.colors.textLight }]}>{label}</Text>
//   </TouchableOpacity>
// );

// const FriendProfileHeader = ({ 
//   profileUser, 
//   profileStats, 
//   friendshipStatus,
//   theme,
//   router,
//   isNavigating,
//   setIsNavigating,
//   handleSendRequest,
//   buttonText,
//   buttonIcon,
//   buttonDisabled,
//   friendshipLoading
// }) => {
//   let parsedTags = profileUser?.tags || [];
//   if (typeof profileUser?.tags === 'string') {
//     try {
//       parsedTags = JSON.parse(profileUser.tags);
//     } catch (e) {
//       parsedTags = [];
//     }
//   }

//   const formattedDate = new Date(profileUser?.created_at || Date.now()).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//   });

//   // Function to navigate to friends list
//   const navigateToFriends = () => {
//     if (isNavigating) return;
//     setIsNavigating(true);
//     router.push(`/friends?userId=${profileUser?.id}`);
//   };

//   return (
//     <View style={[styles.profileContainer, { backgroundColor: theme.colors.background }]}>
//       {/* Profile Info Section with Cover Image */}
//       <View style={[styles.coverContainer, { backgroundColor: theme.colors.secondary }]}>
//         {/* Could add actual cover image here */}
//       </View>

//       <View style={styles.profileInfoWrapper}>
//         {/* Avatar with status indicator */}
//         <View style={styles.avatarWithStatus}>
//           <Avatar
//             uri={profileUser?.image}
//             size={hp(12)}
//             rounded={theme.radius.xxl * 1.4}
//           />
//           {friendshipStatus === 'accepted' && (
//             <View style={styles.statusIndicator} />
//           )}
//         </View>

//         {/* Profile Info */}
//         <View style={styles.profileInfo}>
//           <Text style={[styles.profileName, { color: theme.colors.textDark }]}>
//             {profileUser?.name}
//           </Text>
          
//           {/* Stats with interactive elements */}
//           <View style={styles.statsContainer}>
//             <StatsItem 
//               value={profileStats.postCount?.toString() || "0"} 
//               label="Posts" 
//               theme={theme}
//               isLoading={false}
//             />
//             <StatsItem 
//               value={profileStats.friendsCount?.toString() || "0"} 
//               label="Friends" 
//               theme={theme}
//               isLoading={false}
//               onPress={navigateToFriends}
//             />
//           </View>
//         </View>
//       </View>

//       {/* Friend status pill - shows current relationship status */}
//       {friendshipStatus && !friendshipLoading && (
//         <View style={styles.friendshipStatusContainer}>
//           <View style={[
//             styles.friendshipStatusPill, 
//             { backgroundColor: friendshipStatus === 'accepted' ? theme.colors.secondary : theme.colors.background }
//           ]}>
//             <Icon 
//               name={friendshipStatus === 'accepted' ? 'user-check' : friendshipStatus === 'pending' ? 'clock' : 'user-plus'} 
//               size={14} 
//               color={friendshipStatus === 'accepted' ? theme.colors.primary : theme.colors.textLight} 
//             />
//             <Text style={[
//               styles.friendshipStatusText, 
//               { color: friendshipStatus === 'accepted' ? theme.colors.primary : theme.colors.textLight }
//             ]}>
//               {friendshipStatus === 'accepted' ? 'Friends' : friendshipStatus === 'pending' ? 'Request Sent' : 'Not Friends'}
//             </Text>
//           </View>
//         </View>
//       )}

//       {/* Bio Section */}
//       <View style={styles.bioSection}>
//         {profileUser?.bio && (
//           <Text style={[styles.bio, { color: theme.colors.text }]}>
//             {profileUser.bio}
//           </Text>
//         )}
//         <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>
//           Joined {formattedDate}
//         </Text>
//         {profileUser?.address && (
//           <View style={styles.locationContainer}>
//             <Icon name="map-pin" size={14} color={theme.colors.textLight} />
//             <Text style={[styles.location, { color: theme.colors.textLight }]}>
//               {profileUser.address}
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* Tags */}
//       {Array.isArray(parsedTags) && parsedTags.length > 0 && (
//         <View style={styles.tagsContainer}>
//           {parsedTags.map((tag, index) => (
//             <View 
//               key={index} 
//               style={[styles.tagPill, { 
//                 backgroundColor: theme.colors.secondary,
//                 borderColor: theme.colors.border 
//               }]}
//             >
//               <Text style={[styles.tagPillText, { color: theme.colors.primary }]}>#{tag}</Text>
//             </View>
//           ))}
//         </View>
//       )}

//       {/* Action Buttons Row */}
//       <View style={styles.actionButtonsContainer}>
//         {/* Message Button */}
//         <TouchableOpacity 
//           style={[styles.actionButton, styles.actionButtonSecondary, { flex: 1 }]}
//           onPress={() => {
//             if (!isNavigating) {
//               setIsNavigating(true);
//               router.push(`/messages?userId=${profileUser?.id}`);
//             }
//           }}
//           disabled={isNavigating}
//         >
//           <Icon name="message-circle" size={18} color={theme.colors.primary} />
//           <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Message</Text>
//         </TouchableOpacity>

//         {/* Friend Request Button - Secondary placement for visibility */}
//         {!buttonDisabled && !friendshipLoading && (
//           <TouchableOpacity 
//             style={[styles.actionButton, styles.actionButtonPrimary, { flex: 1 }]}
//             onPress={handleSendRequest}
//             disabled={buttonDisabled || !isConnected || isNavigating}
//           >
//             <Icon name={buttonIcon} size={18} color="#FFFFFF" />
//             <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>{buttonText}</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// };

// export default FriendProfile;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: wp(4),
//     paddingVertical: hp(1.5),
//     borderBottomWidth: 1,
//     borderBottomColor: darkTheme.colors.border,
//   },
//   headerTitle: {
//     fontSize: hp(2.2),
//     fontWeight: '700',
//     flex: 1,
//     textAlign: 'center',
//   },
//   backButton: {
//     padding: wp(2),
//   },
//   headerActionButton: {
//     width: wp(10),
//     height: wp(10),
//     borderRadius: wp(5),
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   tabSection: {
//     flex: 1,
//   },
//   profileContainer: {
//     paddingBottom: hp(2),
//   },
//   coverContainer: {
//     height: hp(15),
//     width: '100%',
//   },
//   profileInfoWrapper: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     marginTop: -hp(6),
//     paddingHorizontal: wp(4),
//   },
//   avatarWithStatus: {
//     position: 'relative',
//   },
//   statusIndicator: {
//     position: 'absolute',
//     bottom: hp(0.5),
//     right: wp(0.5),
//     width: wp(3),
//     height: wp(3),
//     borderRadius: wp(1.5),
//     backgroundColor: '#4CAF50',
//     borderWidth: 2,
//     borderColor: darkTheme.colors.background,
//   },
//   profileInfo: {
//     flex: 1,
//     marginLeft: wp(3),
//     paddingBottom: hp(1),
//   },
//   profileName: {
//     fontSize: hp(2.5),
//     fontWeight: '700',
//     marginBottom: hp(1),
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'flex-start',
//     gap: wp(4),
//   },
//   statsItem: {
//     alignItems: 'center',
//     flexDirection: 'row',
//     gap: wp(1),
//   },
//   statsValue: {
//     fontSize: hp(1.8),
//     fontWeight: '600',
//   },
//   statsLabel: {
//     fontSize: hp(1.6),
//   },
//   friendshipStatusContainer: {
//     paddingHorizontal: wp(4),
//     marginTop: hp(2),
//   },
//   friendshipStatusPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     alignSelf: 'flex-start',
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     borderRadius: hp(2),
//     borderWidth: 1,
//     borderColor: darkTheme.colors.border,
//     gap: wp(1),
//   },
//   friendshipStatusText: {
//     fontSize: hp(1.4),
//     fontWeight: '500',
//   },
//   bioSection: {
//     paddingHorizontal: wp(4),
//     marginTop: hp(2),
//   },
//   bio: {
//     fontSize: hp(1.8),
//     marginBottom: hp(1),
//   },
//   joinedDate: {
//     fontSize: hp(1.4),
//     marginBottom: hp(1),
//   },
//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: wp(1),
//   },
//   location: {
//     fontSize: hp(1.4),
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: hp(2),
//     paddingHorizontal: wp(4),
//   },
//   tagPill: {
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(0.6),
//     borderRadius: theme.radius.full,
//     borderWidth: 1,
//   },
//   tagPillText: {
//     fontSize: hp(1.4),
//   },
//   actionButtonsContainer: {
//     flexDirection: 'row',
//     marginTop: hp(3),
//     paddingHorizontal: wp(4),
//     gap: wp(3),
//   },
//   actionButton: {
//     flexDirection: 'row',
//     paddingVertical: hp(1.2),
//     borderRadius: theme.radius.lg,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: wp(2),
//   },
//   actionButtonPrimary: {
//     backgroundColor: darkTheme.colors.primary,
//   },
//   actionButtonSecondary: {
//     backgroundColor: darkTheme.colors.secondary,
//     borderWidth: 1,
//     borderColor: darkTheme.colors.border,
//   },
//   actionButtonPending: {
//     backgroundColor: darkTheme.colors.secondary,
//     borderWidth: 1,
//     borderColor: darkTheme.colors.border,
//   },
//   actionButtonText: {
//     fontWeight: '600',
//     fontSize: hp(1.6),
//   },
//   actionButtonTextPrimary: {
//     color: '#FFFFFF',
//   },
//   actionButtonTextSecondary: {
//     color: darkTheme.colors.primary,
//   },
//   actionButtonTextPending: {
//     color: darkTheme.colors.textLight,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   offlineBar: {
//     padding: hp(1),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   offlineText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: hp(1.4),
//   },
// });
