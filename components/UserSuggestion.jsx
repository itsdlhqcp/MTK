import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { wp, hp, truncateUsername } from '@/helpers/common';
import theme from '../constants/theme';
import { friendRequestService } from '../services/requestService';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useRouter } from 'expo-router';
import Avatar from './Avatar';
import SkeletonLoader from './SkeletonLoader';
import { UserStorageService } from '../Storage/UserStorageService';

const UserSuggestionCard = memo(({ user, onFollowPress, isFollowing, isLoading }) => {
  const router = useRouter();
  
  const handleProfilePress = () => {
    router.push(`/xprofile?userId=${user.id}`);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8}>
        <Avatar
          uri={user.image}
          size={hp(8)}
          rounded={theme.radius.full}
          style={styles.avatar}
        />
      </TouchableOpacity>
      <Text style={styles.username} numberOfLines={1}>
        {truncateUsername(user.name || 'User')}
      </Text>
      <TouchableOpacity
        style={[
          styles.followButton,
          isFollowing && styles.followButtonFollowing,
          isLoading && styles.followButtonLoading
        ]}
        onPress={() => onFollowPress(user.id)}
        disabled={isLoading || isFollowing}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator 
            size="small" 
            color="#FFFFFF" 
          />
        ) : (
          <Text style={[
            styles.followButtonText,
            isFollowing && styles.followButtonTextFollowing
          ]}>
            {isFollowing ? 'Requested' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
});

// Global cache to share data across all component instances (for in-memory sharing)
let globalSuggestionsCache = {
  data: null,
  loading: false,
  followingStates: {},
  hasLoaded: false
};

const UserSuggestion = memo(({ currentUserId }) => {
  const router = useRouter();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const { showToast } = useToast();
  const isFetchingRef = useRef(false);

  // Load cached suggestions from storage immediately
  const loadCachedSuggestions = useCallback(async () => {
    try {
      const cachedData = await UserStorageService.getCachedSuggestions();
      if (cachedData && cachedData.data && Array.isArray(cachedData.data) && cachedData.data.length > 0) {
        // Update in-memory cache
        globalSuggestionsCache.data = cachedData.data;
        globalSuggestionsCache.followingStates = cachedData.followingStates || {};
        globalSuggestionsCache.hasLoaded = true;
        
        // Update component state
        setSuggestedUsers(cachedData.data);
        setFollowingStates(cachedData.followingStates || {});
        setLoading(false);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading cached suggestions:', error);
      return false;
    }
  }, []);

  const fetchSuggestedUsers = useCallback(async (showLoader = false) => {
    if (!currentUserId || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      globalSuggestionsCache.loading = true;
      if (showLoader) {
        setLoading(true);
      }
      
      // Get current user's outgoing friend requests (users they've already requested)
      const { data: userData } = await supabase.auth.getUser();
      const senderId = userData.user.id;

      // Get all pending outgoing requests
      const { data: outgoingRequests } = await supabase
        .from('friend_requests')
        .select('receiver_id')
        .eq('sender_id', senderId)
        .in('status', ['pending', 'accepted']);

      const excludedUserIds = new Set([
        senderId, // Exclude current user
        ...(outgoingRequests?.map(req => req.receiver_id) || []) // Exclude users with existing requests
      ]);

      // Get all users with profile photos, excluding current user and those with requests
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, image')
        .not('image', 'is', null)
        .neq('id', senderId)
        .limit(20);

      if (error) {
        console.error('Error fetching suggested users:', error);
        globalSuggestionsCache.loading = false;
        setLoading(false);
        return;
      }

      // Filter out users with existing requests
      const filteredUsers = (users || []).filter(user => !excludedUserIds.has(user.id));

      // Check friendship status for each user
      const friendshipData = {};
      for (const user of filteredUsers) {
        const result = await friendRequestService.checkFriendship(user.id);
        if (result.success) {
          friendshipData[user.id] = result.status;
        }
      }

      // Only show users where status is 'none' (no request sent)
      const suggestedUsersList = filteredUsers.filter(user => 
        friendshipData[user.id] === 'none' || !friendshipData[user.id]
      );

      const finalUsers = suggestedUsersList.slice(0, 10); // Limit to 10 users
      
      // Update global in-memory cache
      globalSuggestionsCache.data = finalUsers;
      globalSuggestionsCache.followingStates = friendshipData;
      globalSuggestionsCache.hasLoaded = true;
      globalSuggestionsCache.loading = false;
      
      // Store in persistent storage
      await UserStorageService.cacheSuggestions(finalUsers, friendshipData);
      
      // Update local state
      setSuggestedUsers(finalUsers);
      setFollowingStates(friendshipData);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
      globalSuggestionsCache.loading = false;
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentUserId]);

  // Load cached suggestions immediately on mount, then fetch fresh data in background
  useEffect(() => {
    if (!currentUserId) return;

    const initializeSuggestions = async () => {
      // First, try to load from persistent storage
      const hasCachedData = await loadCachedSuggestions();
      
      // Always fetch fresh data in the background to update cache
      // If we have cached data, fetch silently (don't show loader)
      // If no cached data, show loader while fetching
      if (!hasCachedData) {
        // No cached data, show loader while fetching
        fetchSuggestedUsers(true);
      } else {
        // Has cached data, fetch silently in background
        fetchSuggestedUsers(false);
      }
    };

    initializeSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // Only depend on currentUserId

  const handleFollowPress = useCallback(async (userId) => {
    if (!currentUserId) return;

    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    try {
      const result = await friendRequestService.sendRequest(userId);
      
      if (result.success) {
        showToast('success', 'Follow request sent');
        
        // Remove from suggestions after sending request and update states
        setSuggestedUsers(prev => {
          const updatedSuggestions = prev.filter(user => user.id !== userId);
          
          setFollowingStates(prevStates => {
            const updatedFollowingStates = { ...prevStates, [userId]: 'pending' };
            
            // Update in-memory cache
            globalSuggestionsCache.data = updatedSuggestions;
            globalSuggestionsCache.followingStates = updatedFollowingStates;
            
            // Update persistent storage
            UserStorageService.cacheSuggestions(updatedSuggestions, updatedFollowingStates);
            
            return updatedFollowingStates;
          });
          
          return updatedSuggestions;
        });
      } else {
        showToast('error', result.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
      showToast('error', 'Something went wrong');
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  }, [currentUserId, showToast]);

  // Skeleton card component for loading state
  const SkeletonCard = memo(() => (
    <View style={styles.card}>
      <SkeletonLoader
        width={hp(8)}
        height={hp(8)}
        borderRadius={hp(4)}
        shimmerColor="rgba(255, 255, 255, 0.4)"
        style={styles.skeletonAvatar}
      />
      <SkeletonLoader
        width={wp(18)}
        height={hp(1.5)}
        borderRadius={4}
        shimmerColor="rgba(255, 255, 255, 0.4)"
        style={styles.skeletonUsername}
      />
      <SkeletonLoader
        width={wp(18)}
        height={hp(3.2)}
        borderRadius={theme.radius.md}
        shimmerColor="rgba(255, 255, 255, 0.4)"
        style={styles.skeletonButton}
      />
    </View>
  ));

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Suggestions for you</Text>
          <TouchableOpacity onPress={() => router.push('/find')} activeOpacity={0.7}>
            <Text style={styles.searchLink}>Search</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          simultaneousHandlers={[]}
          shouldCancelWhenOutside={false}
          bounces={false}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (suggestedUsers.length === 0) {
    return null; // Don't show if no suggestions
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggestions for you</Text>
        <TouchableOpacity onPress={() => router.push('/find')} activeOpacity={0.7}>
          <Text style={styles.searchLink}>Search</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        bounces={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        {suggestedUsers.map((user) => (
          <UserSuggestionCard
            key={user.id}
            user={user}
            onFollowPress={handleFollowPress}
            isFollowing={followingStates[user.id] === 'pending' || followingStates[user.id] === 'accepted'}
            isLoading={loadingStates[user.id]}
          />
        ))}
      </ScrollView>
    </View>
  );
});

export default UserSuggestion;

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(2),
    marginHorizontal: wp(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
    paddingHorizontal: wp(2),
  },
  title: {
    fontSize: hp(2),
    fontWeight: theme.fonts.bold,
    color: '#FFFFFF',
  },
  searchLink: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: wp(2),
    gap: wp(3),
  },
  card: {
    alignItems: 'center',
    width: wp(22),
    marginRight: wp(2),
  },
  avatar: {
    marginBottom: hp(1),
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  username: {
    fontSize: hp(1.5),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: hp(1),
    fontWeight: theme.fonts.medium,
    maxWidth: wp(22),
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    minWidth: wp(18),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(3.2),
  },
  followButtonFollowing: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  followButtonLoading: {
    opacity: 0.8,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.4),
    fontWeight: theme.fonts.bold,
  },
  followButtonTextFollowing: {
    color: '#999',
  },
  skeletonLoadingContainer: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  skeletonAvatar: {
    marginBottom: hp(1),
  },
  skeletonUsername: {
    marginBottom: hp(1),
  },
  skeletonButton: {
    marginTop: 0,
  },
});

