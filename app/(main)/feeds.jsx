import { Text, Alert, View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Pressable, Modal, Animated, Dimensions, PanResponder, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import theme from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { wp, hp } from '@/helpers/common'
import { fetchPosts, fetchNewPostsSince, markPostAsViewed, getUnwatchedPostsCount, syncPendingViews } from '../../services/postService'
import { getUserData } from '../../services/userServices'
import { getLastSeenPostTimestamp, updateLastSeenPostTimestamp, storeLastSeenPostTimestamp } from '../../services/timestampService'
import FeedLoader from '../../components/FeedLoader'
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import SpotlightCard from '../../components/SpotlightCard';
import { NetworkUtils } from '../../utils/network';
import { useToast } from '../../contexts/ToastContext'
import CustomDotIndicator from '../../components/CutomDotIndicator';
import Icon from '../../assets/icons'
import { friendRequestService } from '../../services/requestService'
import { adminIds } from '../../constants/admin'
import UserSuggestion from '../../components/UserSuggestion'
import Reviews from '../../components/Reviews'
import WatchNow from '../../components/WatchNow'

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MemoizedPostCard = memo(({ item, currentUser, router, isVisible, onPostViewed }) => {
  const hasBeenViewed = useRef(false);

  useEffect(() => {
    if (isVisible && !hasBeenViewed.current && !item.isWatched) {
      hasBeenViewed.current = true;
      onPostViewed(item?.id);
    }
  }, [isVisible, item?.id, item.isWatched, onPostViewed]);

  const postData = useMemo(() => {
    return {
      id: item?.id,
      body: item?.body,
      file: item?.file,
      userId: item?.userId,
      created_at: item?.created_at,
      tags: item?.tags,
      name: item?.user?.name,
      profile: item?.user?.image,
      comments: item?.comments?.[0]?.count,
      postLikes: item?.postLikes,
      isWatched: item?.isWatched
    };
  }, [item]);
  
  return (
    <View style={styles.postContainer}>
      <SpotlightCard
        item={postData}
        currentUser={currentUser}
        router={router}
        isVisible={isVisible}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.body === nextProps.item.body &&
    prevProps.item?.file === nextProps.item.file &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.currentUser?.id === nextProps.currentUser?.id &&
    prevProps.item?.isWatched === nextProps.item.isWatched
  );
});

// Create memoized Footer component
const FooterComponent = memo(({ loading, hasMore, postsLength }) => {
  if (postsLength === 0) return null;

  return (
    <View style={{marginVertical: 0}} paddingBottom={16}>
      {loading && <FeedLoader />}
      {!hasMore && postsLength > 0 && (
        <Text style={styles.noPosts}>No more feeds to load !!</Text>
      )}
    </View>
  );
});

// Create memoized EmptyList component
const EmptyListComponent = memo(({ loading }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.noPosts}>
         {loading ? <CustomDotIndicator count={3} /> : "No Network found!!"}
      </Text>
    </View>
  );
});

// Side Navbar Component
const SideNavbar = memo(({ visible, onClose, router, setIsNavigating, isNavigating, isadmin, slideAnim, panResponder, onLogoutPress }) => {
  const handleNavItemPress = (path) => {
    if (!isNavigating) {
      setIsNavigating(true);
      router.push(path);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.sideNavOverlay} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.sideNavBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.sideNavContainer,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.sideNavHeader}>
            <Text style={styles.sideNavTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={hp(2.5)} color='white' />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.sideNavContent} showsVerticalScrollIndicator={false}>
            {/* Community Tab */}
            <TouchableOpacity 
              style={styles.sideNavItem}
              onPress={() => handleNavItemPress('community')}
              disabled={true}
            >
              <View style={styles.sideNavItemContent}>
                <Icon name="community" size={hp(2.8)} color='white' />
                <Text style={styles.sideNavItemText}>Community</Text>
                <Text style={styles.comingSoonBadge}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
            
            {/* Library Tab */}
            <TouchableOpacity 
              style={styles.sideNavItem}
              onPress={() => handleNavItemPress('library')}
              disabled={isNavigating}
            >
              <View style={styles.sideNavItemContent}>
                <Icon name="library" size={hp(2.8)} color='white' />
                <Text style={styles.sideNavItemText}>Library</Text>
              </View>
            </TouchableOpacity>
            
            {/* Admin Only Tabs */}
            {isadmin && (
              <>
                {/* Add Twist Tab */}
                <TouchableOpacity 
                  style={styles.sideNavItem}
                  onPress={() => handleNavItemPress('addTwist')}
                  disabled={isNavigating}
                >
                  <View style={styles.sideNavItemContent}>
                    <Icon name="plus" size={hp(2.8)} color='white' />
                    <Text style={styles.sideNavItemText}>Create Post</Text>
                  </View>
                </TouchableOpacity>
                
                {/* Poll Screen Tab */}
                <TouchableOpacity 
                  style={styles.sideNavItem}
                  onPress={() => handleNavItemPress('pollScreen')}
                  disabled={isNavigating}
                >
                  <View style={styles.sideNavItemContent}>
                    <Icon name="rocket" size={hp(2.8)} color={theme.colors.blue} />
                    <Text style={styles.sideNavItemText}>Create Poll</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
          
          {/* Settings and Logout Buttons at Bottom */}
          <View style={styles.sideNavFooter}>
            {/* Settings Tab */}
            <TouchableOpacity 
              style={styles.sideNavItem}
              onPress={() => handleNavItemPress('/profileSettings')}
              disabled={isNavigating}
            >
              <View style={styles.sideNavItemContent}>
                <Icon name="preferances" size={hp(2.8)} color='white' />
                <Text style={styles.sideNavItemText}>Settings</Text>
              </View>
            </TouchableOpacity>
            
            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.sideNavLogoutItem}
              onPress={onLogoutPress}
              disabled={isNavigating}
            >
              <View style={styles.sideNavItemContent}>
                <Icon name="lgout" size={hp(2.8)} color='#FF3B30' />
                <Text style={[styles.sideNavItemText, styles.sideNavLogoutText]}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

// Memoized Header component
const Header = memo(({ title, notificationCount, setNotificationCount, router, unwatchedCount, showOnlyUnwatched, handleToggleFilter, onFilterIconPress, requestCount, setIsNavigating, isNavigating, onMenuPress }) => {
  return (
    <View style={styles.header}>
      <Pressable 
        style={styles.titleContainer}
        onPress={onMenuPress}
      >
        <Text style={styles.title}>{title}</Text>
      </Pressable>
      
      <View style={styles.headerActions}>
        {/* Search User Button */}
        <Pressable 
          disabled={isNavigating}
          onPress={() => {
            if (!isNavigating) {
              setIsNavigating(true);
              router.push('find');
            }
          }}
          style={styles.iconContainer}
        >
          <Icon name="addfriend" size={hp(3.3)} color='white' />
        </Pressable>
        {/* Notification Button */}
        <Pressable 
          disabled={isNavigating}
          onPress={() => {
            if (!isNavigating) {
              setIsNavigating(true);
              router.push('/messenger');
            }
          }}
          style={styles.iconContainer}
        >
          <Icon name="notsqr" size={hp(3.3)} color='white' />
          {requestCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {requestCount > 99 ? '99+' : requestCount}
              </Text>
            </View>
          )}
        </Pressable>
        <TouchableOpacity onPress={onFilterIconPress}>
          <Icon name="filter" size={hp(3.3)} color='white' />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Component to show "You have covered all feeds" tag
const AllFeedsCoveredTag = memo(() => {
  return (
    <View style={styles.allFeedsCoveredContainer}>
      <View style={styles.allFeedsCoveredTag}>
        <View style={styles.allFeedsCoveredIconContainer}>
          <Text style={styles.allFeedsCoveredIcon}>✓</Text>
        </View>
        <Text style={styles.allFeedsCoveredText}>You have covered all feeds</Text>
      </View>
    </View>
  );
});

// Updated FilterBubbles Component with label/value support
// const FilterBubbles = memo(({ activeFilter, onFilterChange, filterOptions }) => {
  const FilterBubbles = memo(({ activeFilter, onFilterChange, filterOptions }) => {
    return (
      <View style={styles.filterContainer}>
        <GestureScrollView
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          simultaneousHandlers={[]} // Empty array prevents interference with parent gestures
          shouldCancelWhenOutside={false}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterBubble,
                activeFilter === filter.value && styles.filterBubbleActive
              ]}
              onPress={() => onFilterChange(filter.value)}
            >
              <Text style={[
                styles.filterBubbleText,
                activeFilter === filter.value && styles.filterBubbleTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </GestureScrollView>
      </View>
    );
  });
 

const Home = () => {
    const {user, setAuth, navigationGuard, logout} = useAuth();
    const router = useRouter();
    
    // Memoize configuration objects to prevent unnecessary recreations
    const viewabilityConfig = useMemo(() => ({ 
      viewAreaCoveragePercentThreshold: 50 
    }), []);

    const handleFilterIconPress = useCallback(() => {
      setShowFilters(prev => !prev);
    }, []);
    
    const [visibleItems, setVisibleItems] = useState([]);
    const [sideNavVisible, setSideNavVisible] = useState(false);
    const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;
    const dragX = useRef(0);
    const isDragging = useRef(false);
    const NAVBAR_WIDTH = SCREEN_WIDTH * 0.8;
  
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
      setVisibleItems(viewableItems.map(item => item.item?.id));
    }).current;

    useFocusEffect(
      React.useCallback(() => {
        setIsNavigating(false);
        // Close side navbar when page loses focus
        setSideNavVisible(false);
      }, [])
    );

    // PanResponder for dragging the navbar
    const panResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Don't respond to taps when navbar is open - only to drag gestures
        if (sideNavVisible) {
          return false;
        }
        
        // Don't capture if this is likely a button tap - check if there are interactive elements
        // We'll let onMoveShouldSetPanResponder handle the actual gesture detection
        return false;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        // Don't aggressively capture - let buttons handle their own touches first
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // More lenient detection for horizontal swipes
        const startX = evt.nativeEvent.pageX;
        const isFromLeftEdge = startX < 40;
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5; // More strict horizontal requirement
        const hasMinimumMovement = Math.abs(gestureState.dx) > 20; // Increased threshold to avoid capturing button taps
        
        // If navbar is open, only respond to significant drag gestures (not taps)
        // Require more movement to distinguish drags from taps
        if (sideNavVisible) {
          const significantMovement = Math.abs(gestureState.dx) > 15; // Higher threshold for drags
          return isHorizontalSwipe && significantMovement;
        }
        
        // Only respond to clear swipe gestures from left edge (not taps)
        // Require significant horizontal movement to distinguish from button taps
        if (isFromLeftEdge && gestureState.dx > 0 && hasMinimumMovement && isHorizontalSwipe) {
          return true;
        }
        
        return false;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // Only capture clear swipe gestures, not taps
        const startX = evt.nativeEvent.pageX;
        const isFromLeftEdge = startX < 40;
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5; // More strict
        const isRightwardSwipe = gestureState.dx > 20; // Require significant movement
        
        return isFromLeftEdge && isHorizontalSwipe && isRightwardSwipe && !sideNavVisible;
      },
      onPanResponderGrant: (evt, gestureState) => {
        // Only process if this is a drag gesture, not a tap
        // If navbar is open and movement is minimal, don't start dragging
        if (sideNavVisible && Math.abs(gestureState.dx) < 15) {
          return;
        }
        
        isDragging.current = true;
        const startX = evt.nativeEvent.pageX;
        
        // Open navbar if starting from left edge (only when closed)
        if (!sideNavVisible && startX < 40) {
          setSideNavVisible(true);
          slideAnim.setValue(-NAVBAR_WIDTH);
        }
        
        dragX.current = 0;
        const currentValue = slideAnim._value || -NAVBAR_WIDTH;
        slideAnim.setOffset(currentValue);
        slideAnim.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isDragging.current) {
          dragX.current = gestureState.dx;
          let newValue = gestureState.dx;
          
          // Clamp the value between -NAVBAR_WIDTH and 0
          if (newValue < -NAVBAR_WIDTH) newValue = -NAVBAR_WIDTH;
          if (newValue > 0) newValue = 0;
          
          slideAnim.setValue(newValue);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        slideAnim.flattenOffset();
        
        const threshold = NAVBAR_WIDTH * 0.3; // Close if dragged more than 30% of width
        
        if (dragX.current < -threshold) {
          // Close navbar
          setSideNavVisible(false);
          Animated.timing(slideAnim, {
            toValue: -NAVBAR_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back open
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        slideAnim.flattenOffset();
        if (sideNavVisible) {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }), [sideNavVisible, NAVBAR_WIDTH]);

    // Handle side navbar open/close with animation
    useEffect(() => {
      if (sideNavVisible && !isDragging.current) {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (!sideNavVisible && !isDragging.current) {
        Animated.timing(slideAnim, {
          toValue: -NAVBAR_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [sideNavVisible, NAVBAR_WIDTH]);

    // State management
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false); // Added for pull-to-refresh
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isConnected, setIsConnected] = useState(true);
    const [initialCheckDone, setInitialCheckDone] = useState(false);
    const { showToast } = useToast();
    const [showOnlyUnwatched, setShowOnlyUnwatched] = useState(false);
    const [unwatchedCount, setUnwatchedCount] = useState(0);
    const [activeFilter, setActiveFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);
    const [incomingRequestCount, setIncomingRequestCount] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const [allPostsSeen, setAllPostsSeen] = useState(false); // Track if all posts are seen
    const [allPosts, setAllPosts] = useState([]); // Store all posts when all are seen
    const suggestionsLoadTriggerRef = useRef(false); // Ref to trigger suggestions loading
    
    // UPDATED: Filter options with label/value structure
    const filterOptions = useMemo(() => [
      { label: 'All', value: 'All' },
      { label: 'English', value: 'en' },
      { label: 'Malayalam', value: 'ml' },
      { label: 'Hindi', value: 'hi' },
      { label: 'Anime', value: 'am' },
      { label: 'Tamil', value: 'tl' },
      { label: 'Kannada', value: 'kn' },
      { label: 'Telugu', value: 'te' },
      { label: 'Korean', value: 'kr' },
      { label: 'Japanese', value: 'jp' }
    ], []);
    
    const ITEMS_PER_PAGE = 60;
    
    // Handle post view changes
    const handlePostViewed = useCallback(async (postId) => {
      if (!user?.id) return;

      const result = await markPostAsViewed(postId, user?.id);
      if (result.success) {
        // Update local state to reflect viewed status
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post?.id === postId 
              ? { ...post, isWatched: true }
              : post
          )
        );
        
        // Don't update unwatched count here as it will be updated by the real-time subscription
        // or in the offline case, it will be updated when connection is restored
        if (result.offline) {
          // If this was processed offline, we update local state immediately
          setUnwatchedCount(prev => Math.max(0, prev - 1));
        }
      }
    }, [user?.id]);

    // Load unwatched count
    const loadUnwatchedCount = useCallback(async () => {
      if (!user?.id) return;
      
      const result = await getUnwatchedPostsCount(user?.id);
      if (result.success) {
        setUnwatchedCount(result.count);
      }
    }, [user?.id]);

    // Add function to fetch request count
    const fetchIncomingRequestCount = useCallback(async () => {
      if (!user?.id || !isConnected) return;
      
      try {
        const res = await friendRequestService.getRequests();
        if (res.success) {
          setIncomingRequestCount(res.data.incoming.length);
        }
      } catch (error) {
        console.error('Error fetching request count:', error);
      }
    }, [user?.id, isConnected]);

    // Protect route on mount and user state change
    useFocusEffect(
        useCallback(() => {
          if (!user) {
            router.replace('/welcome');
          }
          if (user?.id && isConnected) {
            fetchIncomingRequestCount();
          }
          setIsNavigating(false);
        }, [user, router, isConnected, fetchIncomingRequestCount])
    );
    
    // Check network status on mount
    useEffect(() => {
      const checkNetworkStatus = async () => {
        const connected = await NetworkUtils.isConnected();
        setIsConnected(connected);
        setInitialCheckDone(true);
      };
      
      checkNetworkStatus();
      
      // Set up network listener
      const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
        setIsConnected(connected);
        setInitialCheckDone(true);
      });
      
      return () => unsubscribe();
    }, []);
    
    // Sync pending views when coming back online
    useEffect(() => {
      // Sync pending views when connection is restored
      if (isConnected && user?.id) {
        syncPendingViews(user.id).then(result => {
          if (result.success && result.syncedCount > 0) {
            // Optionally show a toast
            showToast('success', `Synced ${result.syncedCount} viewed posts`);
            
            // Refresh unwatched count after sync
            loadUnwatchedCount();
            
            // Optionally refresh posts if needed
            if (result.syncedCount > 5) {
              getPosts(true); // Reset and reload posts
            }
          }
        });
      }
    }, [isConnected, user?.id, showToast, loadUnwatchedCount]);

    // Handle real-time post updates - memoize handler functions
    // Enhanced real-time handler to update unwatched count
    const handlePostEvent = useCallback(async (payload) => {
      if (payload.eventType === 'INSERT' && payload?.new?.id) {
        let newPost = {...payload.new};
        newPost.postLikes = [];
        newPost.comments = [{count: 0}];
        newPost.isWatched = false; // New posts are unwatched by default
        
        let res = await getUserData(newPost.userId);
        if (res.success) {
          newPost.user = res.data;
          setPosts(prevPosts => [newPost, ...prevPosts]);
          // Increment unwatched count for new posts
          setUnwatchedCount(prev => prev + 1);
        }
      }
      
      if(payload.eventType === 'DELETE' && payload.old?.id){
        setPosts(prevPosts => 
          prevPosts.filter(post => post?.id !== payload.old?.id)
        );
      }
      
      if(payload.eventType === 'UPDATE' && payload.new?.id){
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post?.id === payload.new?.id 
              ? { ...post, body: payload.new.body, file: payload.new.file }
              : post
          )
        );
      }
    }, []);

    const handleNewNotification = useCallback(async (payload) => {
        if(payload.eventType === 'INSERT' && payload.new?.id){
            setNotificationCount(prev => prev + 1);
        }
    }, []);
    
    // Handle post view events
    const handlePostViewEvent = useCallback(async (payload) => {
      // Only process events related to the current user
      if (payload.new?.user_id === user?.id) {
          // When a post is marked as viewed
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // Update post in state to show as watched
              setPosts(prevPosts => 
                  prevPosts.map(post => 
                      post?.id === payload.new?.post_id
                          ? { ...post, isWatched: true }
                          : post
                  )
              );
              
              // If this is a new view, decrement the unwatched count
              if (payload.eventType === 'INSERT') {
                  setUnwatchedCount(prev => Math.max(0, prev - 1));
              }
          }
          
          // If a view is deleted (rare case)
          if (payload.eventType === 'DELETE') {
              // Check if the user still has any views for this post
              const { data, error } = await supabase
                  .from('post_views')
                  .select('id')
                  .eq('user_id', user?.id)
                  .eq('post_id', payload.old?.post_id)
                  .limit(1);
                  
              if (!error && data.length === 0) {
                  // No more views exist, mark as unwatched
                  setPosts(prevPosts => 
                      prevPosts.map(post => 
                          post?.id === payload.old?.post_id
                              ? { ...post, isWatched: false }
                              : post
                      )
                  );
                  
                  // Increment unwatched count
                  setUnwatchedCount(prev => prev + 1);
              }
          }
      }
    
    }, [user?.id]);

useEffect(() => {
  if (!user?.id || !isConnected) return;
  
  // DISABLED: Real-time post subscription - now using timestamp-based polling instead
  // This reduces server load and scales better for large user bases
  // Posts are fetched on refresh using cursor-based pagination with timestamps
  // 
  // const postChannel = supabase
  //     .channel(`posts-${user?.id}`)
  //     .on('postgres_changes', 
  //         { event: '*', schema: 'public', table: 'posts' }, 
  //         handlePostEvent
  //     )
  //     .subscribe();

  // Keep notification channel for real-time notifications
  const notificationChannel = supabase
      .channel(`notifications-${user?.id}`) // Make channel name unique
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user?.id}` }, 
          handleNewNotification
      )
      .subscribe();
      
  // Keep post_views subscription to update UI in real-time when user views posts
  const viewsChannel = supabase
      .channel(`post_views-${user?.id}`) // Make channel name unique
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'post_views' },
          handlePostViewEvent
      )
      .subscribe();

  // Keep friend request channel for real-time friend request updates
  const requestChannel = supabase
      .channel(`friend-requests-${user?.id}`)
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${user?.id}` },
          (payload) => {
            fetchIncomingRequestCount();
          }
      )
      .subscribe();

  // Reset allPostsSeen on mount
  setAllPostsSeen(false);
  setAllPosts([]);
  
  // Initial posts fetch
  getPosts();
  
  // Initial unwatched count
  loadUnwatchedCount();
  
  // Initial request count
  fetchIncomingRequestCount();

  return () => {
      // Clean up subscriptions properly
      // supabase.removeChannel(postChannel); // Disabled
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(viewsChannel);
      if (requestChannel) supabase.removeChannel(requestChannel);
  };
}, [user?.id, handleNewNotification, handlePostViewEvent, isConnected, fetchIncomingRequestCount]);

    const isLoadingMore = useRef(false);

    // Modified onRefresh: On refresh, only fetch posts user hasn't viewed yet
    // Viewed posts are excluded from the request - only unseen posts appear at top
    const onRefresh = useCallback(async () => {
      if (!isConnected) {
        showToast('error', 'No network connection');
        return;
      }
      
      if (!user?.id) {
        showToast('error', 'User not found');
        return;
      }
      
      try {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        
        // Fetch only UNSEEN posts (posts user hasn't viewed yet)
        // This excludes viewed posts from the request - they won't appear in the feed
        // Pass null for userId (to get all posts), user.id as viewerUserId (to filter by viewer)
        const res = await fetchPosts(ITEMS_PER_PAGE, null, true, activeFilter, null, user.id);
        
        if (res.success) {
          if (res.data.length === 0) {
            // All posts are seen - show "You have covered all feeds" tag
            // and fetch all posts (including seen ones) to display below
            setAllPostsSeen(true);
            
            // Fetch all posts (including seen ones) to display below the tag
            const allPostsRes = await fetchPosts(ITEMS_PER_PAGE, null, false, activeFilter, null, null);
            
            if (allPostsRes.success) {
              setAllPosts(allPostsRes.data);
              setPosts([]); // Clear unseen posts since there are none
              setHasMore(allPostsRes.data.length === ITEMS_PER_PAGE);
            } else {
              setAllPosts([]);
            }
            
            showToast('success', 'You have covered all feeds!');
          } else {
            // There are unseen posts - show only unseen posts
            setAllPostsSeen(false);
            setAllPosts([]);
            setPosts(res.data);
            setHasMore(res.data.length === ITEMS_PER_PAGE);
            
            // Update timestamp to the newest unseen post
            const newestPost = res.data[0]; // Already sorted by created_at desc
            await updateLastSeenPostTimestamp(newestPost.created_at);
            
            showToast('success', `Showing ${res.data.length} unseen post${res.data.length > 1 ? 's' : ''}`);
          }
          
          // Reload unwatched count after refresh
          await loadUnwatchedCount();
        } else {
          showToast('error', 'Failed to refresh feed');
        }
      } catch (error) {
        console.error('Error refreshing posts:', error);
        showToast('error', 'Something went wrong');
      } finally {
        setRefreshing(false);
      }
    }, [isConnected, ITEMS_PER_PAGE, activeFilter, loadUnwatchedCount, showToast, user?.id]);
    
    // Effect to reload posts when filter changes
    useEffect(() => {
      if (user?.id && isConnected && initialCheckDone) {
        setAllPostsSeen(false); // Reset allPostsSeen when filter changes
        setAllPosts([]);
        getPosts(true); // Reset posts when filter changes
      }
    }, [showOnlyUnwatched, activeFilter, user?.id, isConnected, initialCheckDone]);

    // Load unwatched count on mount and user change
    useEffect(() => {
      if (user?.id && isConnected) {
        loadUnwatchedCount();
      }
    }, [user?.id, isConnected, loadUnwatchedCount]);

    // Modified getPosts function with filter support
    const getPosts = useCallback(async (reset = false) => {
      if (isLoadingMore.current || (!hasMore && !reset) || !isConnected) return;
      
      try {
        isLoadingMore.current = true;
        setLoading(true);
        
        const currentPage = reset ? 1 : page;
        
        // If all posts are seen, fetch all posts (including seen ones) for pagination
        const fetchUnwatchedOnly = !allPostsSeen && showOnlyUnwatched;
        const viewerId = fetchUnwatchedOnly ? user?.id : null;
        
        const res = await fetchPosts(
          currentPage * ITEMS_PER_PAGE, 
          null, // userId - null for all posts
          fetchUnwatchedOnly,
          activeFilter, // Pass the filter code (ml, am, kd, etc.)
          null, // sinceTimestamp
          viewerId
        );
        
        if (res.success) {
          if (reset) {
            if (allPostsSeen) {
              setAllPosts(res.data);
            } else {
              setPosts(res.data);
            }
            setPage(2);
            setHasMore(res.data.length === ITEMS_PER_PAGE);
            
            // Store timestamp of the newest post after initial load
            if (res.data.length > 0 && !allPostsSeen) {
              await storeLastSeenPostTimestamp(res.data[0].created_at);
            }
          } else {
            // Check if we've reached the end
            const currentPosts = allPostsSeen ? allPosts : posts;
            if (res.data.length === currentPosts.length) {
              setHasMore(false);
            }
            
            // Append new posts, avoiding duplicates
            if (allPostsSeen) {
              setAllPosts(prevPosts => {
                const newPosts = res.data.filter(
                  newPost => !prevPosts.some(existingPost => existingPost?.id === newPost?.id)
                );
                return [...prevPosts, ...newPosts];
              });
            } else {
              setPosts(prevPosts => {
                const newPosts = res.data.filter(
                  newPost => !prevPosts.some(existingPost => existingPost?.id === newPost?.id)
                );
                return [...prevPosts, ...newPosts];
              });
            }
            
            setPage(prev => prev + 1);
          }
        } else {
          showToast('error', 'Failed to fetch posts - Network Problem!');
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        Alert.alert('Error', 'Something went wrong while fetching posts');
      } finally {
        setLoading(false);
        setTimeout(() => {
          isLoadingMore.current = false;
        }, 300);
      }
    }, [hasMore, page, posts.length, allPosts.length, allPostsSeen, isConnected, showOnlyUnwatched, activeFilter, showToast, ITEMS_PER_PAGE, user?.id]);

    // Toggle filter function
    const handleToggleFilter = useCallback(() => {
      setShowOnlyUnwatched(prev => {
        const newValue = !prev;
        // Reset posts when toggling filter
        setPosts([]);
        setPage(1);
        setHasMore(true);
        return newValue;
      });
    }, []);

     // Enhanced render item with view tracking
     const renderItem = useCallback(({ item, index }) => {
      const postCard = (
        <MemoizedPostCard
          item={item}
          currentUser={user}
          router={router}
          isVisible={visibleItems.includes(item?.id)}
          onPostViewed={handlePostViewed}
        />
      );

      // Show suggestion component after the second post (index 1)
      if (index === 1) {
        return (
          <View>
            {postCard}
            <UserSuggestion currentUserId={user?.id} />
          </View>
        );
      }

      // Show reviews component after the 4th post (index 3)
      if (index === 3) {
        return (
          <View>
            {postCard}
            <Reviews />
          </View>
        );
      }

      // Show Watch Now component after the 6th post (index 5)
      if (index === 5) {
        return (
          <View>
            {postCard}
            <WatchNow />
          </View>
        );
      }

      // Show suggestion component after the 14th post (index 13)
      if (index === 13) {
        return (
          <View>
            {postCard}
            <UserSuggestion currentUserId={user?.id} />
          </View>
        );
      }

      return postCard;
    }, [user, router, visibleItems, handlePostViewed]);

    const keyExtractor = useCallback((item) => item?.id.toString(), []);
    
    const handleEndReached = useCallback(() => {
      if (hasMore && !loading && isConnected) {
        getPosts();
      }
    }, [hasMore, loading, getPosts, isConnected]);
    
    // Memoize ListFooterComponent and ListEmptyComponent
    const memoizedFooter = useMemo(() => (
      <FooterComponent 
        loading={loading} 
        hasMore={hasMore} 
        postsLength={posts.length} 
      />
    ), [loading, hasMore, posts.length]);
    
    const memoizedEmptyComponent = useMemo(() => (
      <EmptyListComponent loading={loading} />
    ), [loading]);
    
    // Memoize RefreshControl component
    const refreshControl = useMemo(() => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.colors.primary}
        colors={[theme.colors.primary]}
        progressBackgroundColor="#232323"
        progressViewOffset={10}
      />
    ), [refreshing, onRefresh]);

    // UPDATED: Filter change handler to use filter codes
    const handleFilterChange = useCallback((filterValue) => {
      console.log('🔄 [FILTER CHANGE] Switching to filter:', filterValue);
      setActiveFilter(filterValue);
      setPosts([]);
      setPage(1);
      setHasMore(true);
    }, []);
    
    // Memoize FlatList optimization props
    const listProps = useMemo(() => ({
      initialNumToRender: 3,
      maxToRenderPerBatch: 5,
      windowSize: 5,
      updateCellsBatchingPeriod: 30,
      removeClippedSubviews: true,
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      },
    }), []);

    const isadmin = adminIds.includes(user?.id) || user?.role === 'sadmin';

    // Memoized Header component with unwatched count
    const memoizedHeader = useMemo(() => (
      <Header
        title="PlotTwist"
        notificationCount={notificationCount}
        setNotificationCount={setNotificationCount}
        router={router}
        unwatchedCount={unwatchedCount}
        showOnlyUnwatched={showOnlyUnwatched}
        handleToggleFilter={handleToggleFilter}
        onFilterIconPress={handleFilterIconPress}
        requestCount={incomingRequestCount}
        setIsNavigating={setIsNavigating}
        isNavigating={isNavigating}
        onMenuPress={() => setSideNavVisible(true)}
      />
    ), [notificationCount, router, unwatchedCount, showOnlyUnwatched, handleToggleFilter, handleFilterIconPress, incomingRequestCount, isNavigating]);

    return (
      <ScreenWrapper bg={"#121212"}>   
          {/* Offline Mode Indicator */}
            {!isConnected && (
              <View style={styles.offlineBar}>
                <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
              </View>
            )}
        <View style={styles.container} {...panResponder.panHandlers}>
          {/* Memoized Header */}
          {memoizedHeader}

          {/* Side Navbar */}
          <SideNavbar
            visible={sideNavVisible}
            onClose={() => setSideNavVisible(false)}
            router={router}
            setIsNavigating={setIsNavigating}
            isNavigating={isNavigating}
            isadmin={isadmin}
            slideAnim={slideAnim}
            panResponder={panResponder}
            onLogoutPress={() => setLogoutAlertVisible(true)}
          />
          
          {/* Logout Confirmation Modal */}
          <Modal
            transparent={true}
            visible={logoutAlertVisible}
            animationType="fade"
            onRequestClose={() => setLogoutAlertVisible(false)}
          >
            <View style={styles.logoutModalOverlay}>
              <View style={styles.logoutModalContent}>
                <Text style={styles.logoutModalTitle}>Confirm</Text>
                <Text style={styles.logoutModalMessage}>Are you sure you want to logout?</Text>
                <View style={styles.logoutModalButtons}>
                  <TouchableOpacity
                    style={[styles.logoutModalButton, styles.logoutModalCancelButton]}
                    onPress={() => setLogoutAlertVisible(false)}
                  >
                    <Text style={styles.logoutModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.logoutModalButton, styles.logoutModalConfirmButton]}
                    onPress={async () => {
                      setLogoutAlertVisible(false);
                      try {
                        const { error } = await logout();
                        if (error) {
                          Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                      } catch (error) {
                        Alert.alert('Error', 'Failed to logout. Please try again.');
                      }
                    }}
                  >
                    <Text style={styles.logoutModalConfirmText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* UPDATED: Filter Bubbles with new structure */}
          {showFilters && (
            <FilterBubbles 
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions}
            />
          )}

          {/* Highly optimized FlatList with RefreshControl */}
          <FlatList
            data={allPostsSeen ? allPosts : posts}
            extraData={visibleItems} // Only re-render when visible items change
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={handleEndReached}
            onEndReachedThreshold={1}
            ListHeaderComponent={allPostsSeen ? <AllFeedsCoveredTag /> : null}
            ListFooterComponent={memoizedFooter}
            ListEmptyComponent={memoizedEmptyComponent}
            refreshControl={refreshControl} // Add RefreshControl component
            initialNumToRender={10}  // first batch
            maxToRenderPerBatch={5}  // scroll chunk
            windowSize={5}  // active items
            {...listProps}
          />
        </View>
      </ScreenWrapper>
    );
}; 

export default memo(Home);

const styles = StyleSheet.create({
  container: {
    flex: 1
  }, 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    backgroundColor: 'rgb(19, 21, 22)',
    padding: wp(2.4),
  }, 
  titleContainer: {
    flex: 1,
  },
  title:{
    color: 'white',
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold
  }, 
  listStyle: {
    paddingHorizontal: wp(2),
    paddingBottom: hp(4)
  }, 
  icons: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 18
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center', 
    color: theme.colors.primary
  },
  pill:{
    position: 'absolute', 
    right: -10, 
    top: -4, 
    height: hp(2.2), 
    width: hp(2.2), 
    borderRadius: 20, 
    backgroundColor: theme.colors.roseLight
  }, 
  pillText: {
    color: 'white',
    fontSize: hp(1.8), 
    fontWeight: theme.fonts.bold
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(78)
  },
  libraryButton: {
    backgroundColor: "#990000", 
    paddingVertical: hp(0.3),
    paddingHorizontal: wp(7.8),
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonTextTop: {
    color: 'white',
    fontSize: hp(1.7),
    fontWeight: theme.fonts.bold,
    lineHeight: hp(2.4)
  },
  buttonTextBottom: {
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: hp(1.6),
    fontWeight: '500',
    marginTop: -hp(0.5)
  },
  offlineBar: {
    padding: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text 
  },
  offlineText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: hp(1.4),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#121212',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterButton: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent'
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary
  },
  filterButtonText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: '600'
  },
  filterButtonTextActive: {
    color: 'white'
  },
  postContainer: {
    position: 'relative',
    marginBottom: hp(1)
  },
  filterContainer: {
    paddingVertical: hp(1),
    backgroundColor: 'rgb(19, 21, 22)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  filterScrollContent: {
    paddingHorizontal: wp(2),
    flexDirection: 'row',
    alignItems: 'center'
  },
  filterBubble: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    marginRight: wp(2),
    minWidth: wp(18),
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBubbleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  filterBubbleText: {
    color: theme.colors.primary,
    fontSize: hp(1.6),
    fontWeight: '600',
    textAlign: 'center'
  },
  filterBubbleTextActive: {
    color: 'white',
    fontWeight: '700'
  },
  allFeedsCoveredContainer: {
    width: '100%',
    paddingVertical: hp(0.5),
    paddingHorizontal: 0,
    backgroundColor: 'transparent'
  },
  allFeedsCoveredTag: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    gap: wp(2),
    shadowColor: 'rgba(76, 175, 80, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  allFeedsCoveredIconContainer: {
    width: hp(2.2),
    height: hp(2.2),
    borderRadius: hp(1.1),
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(76, 175, 80, 0.5)'
  },
  allFeedsCoveredIcon: {
    fontSize: hp(1.4),
    color: '#4CAF50',
    fontWeight: 'bold',
    lineHeight: hp(1.6)
  },
  allFeedsCoveredText: {
    color: '#4CAF50',
    fontSize: hp(1.5),
    fontWeight: theme.fonts.bold,
    textAlign: 'center',
    letterSpacing: 0.2
  },
  sideNavOverlay: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sideNavBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideNavContainer: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: '#1E1E1E',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sideNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingTop: hp(4),
  },
  sideNavTitle: {
    color: '#FFFFFF',
    fontSize: hp(2.5),
    fontWeight: 'bold',
  },
  closeButton: {
    padding: wp(2),
  },
  sideNavContent: {
    flex: 1,
    paddingTop: hp(2),
  },
  sideNavItem: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  sideNavItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  sideNavItemText: {
    color: '#FFFFFF',
    fontSize: hp(2),
    fontWeight: '500',
    flex: 1,
  },
  comingSoonBadge: {
    color: '#888888',
    fontSize: hp(1.3),
    fontStyle: 'italic',
  },
  sideNavFooter: {
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    paddingTop: hp(1),
    paddingBottom: hp(2),
  },
  sideNavLogoutItem: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  sideNavLogoutText: {
    color: '#FF3B30',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: wp(6),
    width: wp(80),
    alignItems: 'center',
  },
  logoutModalTitle: {
    color: '#FFFFFF',
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  logoutModalMessage: {
    color: '#E0E0E0',
    fontSize: hp(1.8),
    textAlign: 'center',
    marginBottom: hp(3),
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: wp(3),
    width: '100%',
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutModalCancelButton: {
    backgroundColor: '#2D2D2D',
  },
  logoutModalConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  logoutModalCancelText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  logoutModalConfirmText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
  }
});