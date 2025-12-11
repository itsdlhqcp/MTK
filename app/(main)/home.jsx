import { Text, View, StyleSheet, FlatList, Pressable, TextInput, RefreshControl, Modal, Animated, TouchableOpacity, Dimensions, PanResponder, Alert } from 'react-native'
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import theme from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import PollCard from '../../components/PollCard';
import { fetchPolls } from '../../services/pollservice';
import { supabase } from '../../lib/supabase'
import { wp, hp } from '@/helpers/common'
import Avatar from '../../components/Avatar'
import { fetchPosts, searchTwists } from '../../services/homeService'
import { getUserData } from '../../services/userServices'
import Icon from '@/assets/icons'
import MLoading from '../../components/MaterialLoader'
import FeedLoader from '../../components/FeedLoader'
import { useFocusEffect } from '@react-navigation/native'
import { ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler'
import TwistCard from '../../components/TwistCard'
import { NetworkUtils } from '../../utils/network';
import { adminIds } from '../../constants/admin'
import { useToast } from '../../contexts/ToastContext'
import CustomDotIndicator from '../../components/CutomDotIndicator'
import EpisodeGridSection from '../../components/EpisodeGridSection'
import EpisodeGrid from '../../components/EpisodeGrid'
import { friendRequestService } from '../../services/requestService'

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MemoizedTwistCard = memo(({ item, currentUser, router, isVisible }) => {
  return (
    <TwistCard
      item={item}
      currentUser={currentUser}
      router={router}
      isVisible={isVisible}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.item.body === nextProps.item.body &&
    prevProps.item.file === nextProps.item.file &&
    JSON.stringify(prevProps.item.postLikes) === JSON.stringify(nextProps.item.postLikes) &&
    prevProps.currentUser?.id === nextProps.currentUser?.id
  );
});

// Create lightweight Footer component
const FooterComponent = memo(({ loading, hasMore, postsLength }) => {
  if (postsLength === 0) return null;

  return (
    <View style={{ marginVertical: 0, paddingBottom: 16 }}>
      {loading && <FeedLoader />}
      {!hasMore && postsLength > 0 && (
        <Text style={styles.noPosts}>No more feeds to load !!</Text>
      )}
    </View>
  );
});

// Create lightweight EmptyList component
const EmptyListComponent = memo(({ loading, isSearching }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.noPosts}>
        {loading ? <CustomDotIndicator size={6} startColor={theme.colors.blue}/> : isSearching ? "No results found" : <CustomDotIndicator size={6} startColor={theme.colors.blue}/>}
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
      <View style={styles.sideNavOverlay} pointerEvents="box-none" {...panResponder.panHandlers}>
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
          
          {/* Logout Button at Bottom */}
          <View style={styles.sideNavFooter}>
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

// Lightweight Header component
const Header = memo(({ username, router, setIsNavigating, isNavigating, isadmin, requestCount, onMenuPress }) => (
  <View style={styles.header}>
    <Pressable 
      style={styles.welcomeContainer}
      onPress={onMenuPress}
    >
      <Text style={styles.username}>{username}</Text>
    </Pressable>

    <View style={styles.icons}>
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
      {/* Notification Button - Keep in header */}
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
    </View>
  </View>
));

const SearchBar = memo(({ searchQuery, setSearchQuery, onClearSearch, isSearching }) => {
  const inputRef = useRef(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Handle back button press from search
  const handleBackPress = () => {
    if (localSearch || isSearching) {
      setLocalSearch('');
      onClearSearch();
      return;
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 500); // Reduced debounce time for better UX

    return () => clearTimeout(delayDebounce);
  }, [localSearch]);

  return (
    <View style={styles.searchContainer}>
      {(isSearching || localSearch) && (
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrowLeft" size={hp(2.5)} color="white" />
        </Pressable>
      )}
      <TextInput
        ref={inputRef}
        style={[
          styles.searchInput,
          (isSearching || localSearch) && styles.searchInputActive
        ]}
        placeholder="Search plots..."
        placeholderTextColor="#888"
        value={localSearch}
        onChangeText={setLocalSearch}
      />
      <Pressable style={styles.searchButton}>
        <Icon name="search" size={hp(2.5)} color="white" />
      </Pressable>
    </View>
  );
});

// Lightweight TrendingItem component
const TrendingItem = memo(({ post, router }) => (
  <Pressable
    style={styles.trendingItem}
    onPress={() => router.push(`post/${post?.id}`)}
  >
    <Avatar
      uri={post.file || "https://via.placeholder.com/150"}
      size={hp(20)}
      rounded={theme.radius.xs}
      style={styles.trendingImage}
    />
    <View style={styles.trendingOverlay}>
      <Text style={styles.trendingUsername}>
        {post.user?.userName || "Anonymous"}
      </Text>
      <Text numberOfLines={2} style={styles.trendingBody}>
        {post.body || ""}
      </Text>
    </View>
  </Pressable>
));

// Simplified TrendingSection component
const TrendingSection = memo(({ trendingPosts, loading, router }) => {
  if (loading && trendingPosts.length === 0) return <MLoading />;
  if (trendingPosts.length === 0) return null;

  // Show only first 4 posts
  const displayPosts = trendingPosts.slice(0, 4);

  return (
    <View style={styles.trendingSection}>
      <Text style={styles.sectionTitle}>Trending Plots</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingList}
      >
        {displayPosts.map((post) => (
          <TrendingItem 
            key={post?.id.toString()} 
            post={post} 
            router={router} 
          />
        ))}
      </ScrollView>
      <View style={styles.indicator}>
        {displayPosts.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              index === 0 ? styles.activeDot : {}
            ]}
          />
        ))}
      </View>
    </View>
  );
});

const Feeds = () => {
  const { user, navigationGuard, logout } = useAuth();
  const router = useRouter();

    useFocusEffect(
      useCallback(() => {
        setIsNavigating(false);
      }, [])
    );
  
  // Optimized configuration
  const viewabilityConfig = useMemo(() => ({
    viewAreaCoveragePercentThreshold: 20, // Reduced from 50 for better performance
    minimumViewTime: 300 // Add minimum view time to reduce rapid updates
  }), []);
  
  const [visibleItems, setVisibleItems] = useState([]);
  const visibleItemsRef = useRef([]);

  // Optimize viewability tracking to avoid state updates when not needed
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const newVisibleIds = viewableItems.map(item => item.item?.id);
    
    // Only update state if visible items changed significantly
    if (JSON.stringify(newVisibleIds) !== JSON.stringify(visibleItemsRef.current)) {
      visibleItemsRef.current = newVisibleIds;
      setVisibleItems(newVisibleIds);
    }
  }).current;

  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [notificatuionCount, setNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [polls, setPolls] = useState([]);
  const [allFeedItems, setAllFeedItems] = useState([]);
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;
  const dragX = useRef(0);
  const isDragging = useRef(false);
  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 25;
  const NAVBAR_WIDTH = SCREEN_WIDTH * 0.8; 

  useFocusEffect(
    React.useCallback(() => {
      setIsNavigating(false);
      // Close side navbar when page loses focus
      setSideNavVisible(false);
      // Home page is now active - no redirect needed
    }, [router])
  );

  // PanResponder for dragging the navbar
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      // Only respond if starting from left edge (within 20px) or if navbar is open
      const startX = evt.nativeEvent.pageX;
      return (startX < 20 && !sideNavVisible) || (sideNavVisible && !isDragging.current);
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Respond to horizontal movements
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: (evt, gestureState) => {
      isDragging.current = true;
      if (!sideNavVisible && evt.nativeEvent.pageX < 20) {
        // Opening from left edge
        setSideNavVisible(true);
        slideAnim.setValue(-NAVBAR_WIDTH);
      }
      dragX.current = 0;
      slideAnim.setOffset(slideAnim._value);
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

  // Use refs for post handlers to avoid recreating functions
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

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

  // Handle search query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim() === '') {
        setIsSearching(false);
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      setLoading(true);
      
      try {
        const result = await searchTwists(searchQuery);
        if (result.success) {
          setSearchResults(result.data);
        } else {
          console.error('Search failed:', result.msg);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching twists:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    performSearch();
  }, [searchQuery]);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
  }, []);

  // Add these new handler functions
const handlePollEvent = useCallback(async (payload) => {
  if (payload.eventType === 'INSERT' && payload?.new?.id) {
    let newPoll = { ...payload.new, type: 'poll' };
    
    try {
      let res = await getUserData(newPoll.user_id);
      if (res.success) {
        newPoll.user = res.data;
        setPolls(prevPolls => [newPoll, ...prevPolls]);
      }
    } catch (error) {
      console.error('Error fetching user data for poll:', error);
    }
  }
  else if (payload.eventType === 'DELETE' && payload.old?.id) {
    setPolls(prevPolls => 
      prevPolls.filter(poll => poll?.id !== payload.old?.id)
    );
  }
}, []);

const handlePollVoteEvent = useCallback((payload) => {
  if (payload.eventType === 'INSERT') {
    const { poll_id, option_id } = payload.new;
    
    setPolls(prevPolls => 
      prevPolls.map(poll => {
        if (poll.id === poll_id) {
          const updatedOptions = poll.poll_options.map(option => {
            if (option.id === option_id) {
              return { ...option, vote_count: option.vote_count + 1 };
            }
            return option;
          });
          
          return {
            ...poll,
            poll_options: updatedOptions,
            total_votes: poll.total_votes + 1
          };
        }
        return poll;
      })
    );
  }
}, []);

  // Handle real-time post updates with optimized functions
  const handlePostEvent = useCallback(async (payload) => {
    // handle insert new post on main stream
    if (payload.eventType === 'INSERT' && payload?.new?.id) {
      let newPost = { ...payload.new };
      newPost.postLikes = [];
      newPost.comments = [{ count: 0 }];
      
      try {
        let res = await getUserData(newPost.userId);
        if (res.success) {
          newPost.user = res.data;
          setPosts(prevPosts => {
            // Check if post already exists to prevent duplicates
            const postExists = prevPosts.some(post => post?.id === newPost?.id);
            if (postExists) {
              return prevPosts;
            }
            return [newPost, ...prevPosts];
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    // Handle post deletion on real-time
    else if (payload.eventType === 'DELETE' && payload.old?.id) {
      setPosts(prevPosts => 
        prevPosts.filter(post => post?.id !== payload.old?.id)
      );
    }
    // Handle post update on real-time
    else if (payload.eventType === 'UPDATE' && payload.new?.id) {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post?.id === payload.new?.id 
            ? { ...post, body: payload.new.body, file: payload.new.file } 
            : post
        )
      );
    }
  }, []);

  const handleNewNotification = useCallback((payload) => {
    if (payload.eventType === 'INSERT' && payload.new?.id) {
      setNotificationCount(prev => prev + 1);
    }
  }, []);

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

// Update the existing useEffect that sets up Supabase channels
  useEffect(() => {
    // Wait for initial network check and user to be available
    if (!initialCheckDone || !user?.id || !isConnected) return;
    
    let isMounted = true;
    let postChannel;
    let notificationChannel;
    let pollChannel;
    
    // Reset state for fresh data load
    setPage(1);
    setPosts([]);
    setPolls([]);
    setHasMore(true);
    
    // Fetch request count
    fetchIncomingRequestCount();
    
    const setupChannels = async () => {
      // Existing post channel setup
      postChannel = supabase
        .channel('twists')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'twists' },
          handlePostEvent
        )
        .subscribe();

      // Existing notification channel setup
      notificationChannel = supabase
        .channel('notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user?.id}` },
          handleNewNotification
        )
        .subscribe();

      // Add poll channel setup
      pollChannel = supabase
        .channel('polls-home')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'polls' },
          handlePollEvent
        )
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'poll_votes' },
          handlePollVoteEvent
        )
        .subscribe();

      // Initial data fetch - use reset mode for fresh load
      if (isMounted) {
        await getPosts(true); // Pass true to reset page
        await getTrendingPosts();
        await getPolls();
      }
    };
    
    setupChannels();

    return () => {
      isMounted = false;
      if (postChannel) supabase.removeChannel(postChannel);
      if (notificationChannel) supabase.removeChannel(notificationChannel);
      if (pollChannel) supabase.removeChannel(pollChannel);
    };
  }, [user?.id, isConnected, initialCheckDone, getPosts, getTrendingPosts, getPolls, handlePostEvent, handleNewNotification, handlePollEvent, handlePollVoteEvent, fetchIncomingRequestCount]);

  // Note: displayPosts is now computed in useMemo, so we don't need this useEffect anymore
  // Keeping setAllFeedItems for backward compatibility, but it's now handled in displayPosts useMemo

  // Fetch trending posts with loading state management
  const getTrendingPosts = useCallback(async () => {
    // Skip fetching if offline
    if (!isConnected) {
      console.log('Skipping trending posts fetch - device is offline');
      return;
    }
    try {
      setLoading(true);
      const res = await fetchPosts(4);

      if (res.success) {
        setTrendingPosts(res.data);
      }
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);


  // Add this function after getTrendingPosts
const getPolls = useCallback(async () => {
  if (!isConnected) {
    console.log('Skipping polls fetch - device is offline');
    return;
  }
  
  try {
    const res = await fetchPolls(50);
    if (res.success) {
      // Add type identifier to polls
      const pollsWithType = res.data.map(poll => ({ ...poll, type: 'poll' }));
      setPolls(pollsWithType);
    }
  } catch (error) {
    console.error('Error fetching polls:', error);
  }
}, [isConnected]);

  // Optimized post fetching with proper state management
  const getPosts = useCallback(async (resetPage = false) => {
    // Skip fetching if offline
    if (!isConnected) {
      console.log('Skipping fetch - device is offline');
      return;
    }

    // Don't fetch if already loading (unless it's a reset)
    if (loading && !resetPage) return;

    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      const res = await fetchPosts(currentPage * ITEMS_PER_PAGE);

      if (res.success) {
        if (resetPage) {
          // Reset mode - replace all posts
          setPosts(res.data);
          setPage(2);
          setHasMore(res.data.length === ITEMS_PER_PAGE);
        } else {
          // Check if we've reached the end
          if (res.data.length <= postsRef.current.length) {
            setHasMore(false);
          } else {
            // Batch update to reduce renders
            const newPosts = res.data.filter(
              newPost => !postsRef.current.some(existingPost => existingPost?.id === newPost?.id)
            );
            
            if (newPosts.length > 0) {
              setPosts(prevPosts => [...prevPosts, ...newPosts]);
            }
            
            setPage(prev => prev + 1);
            setHasMore(res.data.length === ITEMS_PER_PAGE);
          }
        }
      } else {
        showToast('error', 'Failed to fetch posts - Network Problem!!');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast('error', 'Error loading posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, isConnected, loading, showToast]);

  // Handle pull-to-refresh
  // Update the existing handleRefresh function
  const handleRefresh = useCallback(() => {
    if (isSearching) {
      handleClearSearch();
    }
    
    setRefreshing(true);
    setPage(1);
    setPosts([]);
    setPolls([]); // Add this line
    setHasMore(true);
    
    // Fetch both posts and polls
    Promise.all([getPosts(), getPolls()]).finally(() => {
      setRefreshing(false);
    });
  }, [getPosts, getPolls, isSearching, handleClearSearch]);

 // Replace the existing renderItem function
  const renderItem = useCallback(({ item }) => {
    if (item.type === 'poll') {
      return (
        <PollCard 
          item={item} 
          onVoteUpdate={(pollId, updatedPollData) => {
            setPolls(prevPolls => 
              prevPolls.map(poll => 
                poll.id === pollId ? updatedPollData : poll
              )
            );
          }}
        />
      );
    } else {
      return (
        <MemoizedTwistCard
          item={item}
          currentUser={user}
          router={router}
          isVisible={visibleItems.includes(item?.id)}
        />
      );
    }
  }, [user, router, visibleItems]);

  // Update keyExtractor to handle both posts and polls
const keyExtractor = useCallback((item) => `${item.type}-${item?.id.toString()}`, []);

  // Optimized end reached handler with debounce behavior
  const lastFetchTime = useRef(Date.now());
  const handleEndReached = useCallback(() => {
    if (isSearching) return;
    
    const now = Date.now();
    if (hasMore && !loading && now - lastFetchTime.current > 500 && isConnected) {
      lastFetchTime.current = now;
      getPosts();
    }
  }, [hasMore, loading, getPosts, isConnected, isSearching]);

  // Filter episodes (posts with cover_image) from regular posts and deduplicate
  const episodes = useMemo(() => {
    const filteredEpisodes = posts.filter(post => post.cover_image && (post.episode_type === 'pdf' || post.episode_type === 'section_based'));
    
    // Deduplicate episodes by id
    const uniqueEpisodes = [];
    const seenIds = new Set();
    
    filteredEpisodes.forEach(episode => {
      const episodeId = episode?.id?.toString();
      if (episodeId && !seenIds.has(episodeId)) {
        seenIds.add(episodeId);
        uniqueEpisodes.push(episode);
      }
    });
    
    return uniqueEpisodes;
  }, [posts]);

  // Filter regular posts (without cover_image) for the feed
  const regularPosts = useMemo(() => {
    return posts.filter(post => !post.cover_image || (post.episode_type === 'regular'));
  }, [posts]);

  // Get newly released episodes (most recent) - already deduplicated
  const newlyReleasedEpisodes = useMemo(() => {
    return [...episodes]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
  }, [episodes]);

  // Get top picks episodes (could be based on likes, views, etc. - for now, use recent) - already deduplicated
  const topPicksEpisodes = useMemo(() => {
    return [...episodes]
      .sort((a, b) => {
        // Sort by likes count if available, otherwise by date
        const aLikes = a.twistLikes?.length || 0;
        const bLikes = b.twistLikes?.length || 0;
        if (aLikes !== bLikes) return bLikes - aLikes;
        return new Date(b.created_at) - new Date(a.created_at);
      })
      .slice(0, 6);
  }, [episodes]);

  // Get the current posts to display (search results or all posts)
  // Update displayPosts to exclude episodes (they're shown in sections)
  const displayPosts = useMemo(() => {
    if (isSearching) return searchResults;
    
    // Combine regular posts and polls, excluding episodes
    const combinedItems = [
      ...regularPosts.map(post => ({ ...post, type: 'post', sortDate: new Date(post.created_at) })),
      ...polls.map(poll => ({ ...poll, type: 'poll', sortDate: new Date(poll.created_at) }))
    ];
    
    return combinedItems.sort((a, b) => b.sortDate - a.sortDate);
  }, [isSearching, searchResults, regularPosts, polls]);

  // Memoize components to prevent unnecessary recreations
  const memoizedFooter = useMemo(() => (
    <FooterComponent
      loading={loading}
      hasMore={!isSearching && hasMore}
      postsLength={displayPosts.length}
    />
  ), [loading, hasMore, displayPosts.length, isSearching]);

  const memoizedEmptyComponent = useMemo(() => (
    <EmptyListComponent loading={loading} isSearching={isSearching} />
  ), [loading, isSearching]);

  const handleEpisodePress = useCallback((episode) => {
    if (router && !isNavigating) {
      setIsNavigating(true);
      // Route to episode details page for episodes with cover images
      router.push({
        pathname: '/episodeDetails',
        params: { episodeId: episode.id }
      });
    }
  }, [router, isNavigating]);

  const ListHeaderComponent = useCallback(() => (
    <View>
      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
      />
      
      {/* Episode Sections - Only show when not searching */}
      {!isSearching && (
        <>
          {/* Newly Released */}
          {newlyReleasedEpisodes.length > 0 && (
            <EpisodeGridSection
              title="Newly Released"
              episodes={newlyReleasedEpisodes}
              onEpisodePress={handleEpisodePress}
              onSeeAllPress={() => {
                router.push({
                  pathname: '/allEpisodes',
                  params: { 
                    title: 'Newly Released',
                    episodes: JSON.stringify(newlyReleasedEpisodes)
                  }
                });
              }}
            />
          )}

          {/* Top Picks for You */}
          {topPicksEpisodes.length > 0 && (
            <EpisodeGrid
              title="Top Picks for You"
              episodes={topPicksEpisodes}
              onEpisodePress={handleEpisodePress}
              maxItems={6}
            />
          )}
        </>
      )}
    </View>
  ), [searchQuery, handleClearSearch, isSearching, newlyReleasedEpisodes, topPicksEpisodes, handleEpisodePress]);

  // Optimized FlatList props
  const listProps = useMemo(() => ({
    initialNumToRender: 2, // Reduced from 3
    maxToRenderPerBatch: 2, // Reduced from 5
    windowSize: 5,
    updateCellsBatchingPeriod: 50, // Increased from 30
    removeClippedSubviews: true,
    maintainVisibleContentPosition: {
      minIndexForVisible: 0,
      autoscrollToTopThreshold: 10,
    },
  }), []);

  const isadmin = adminIds.includes(user?.id) || user?.role === 'sadmin';

  return (
    <ScreenWrapper bg={"#121212"}>
        {/* Offline Mode Indicator */}
        {!isConnected && (
          <View style={styles.offlineBar}>
            <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
          </View>
        )}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container} {...(!sideNavVisible ? panResponder.panHandlers : {})}>
          {/* Memoized Header */}
          <Header
           username="PlotTwist"
           router={router}
           setIsNavigating={setIsNavigating}
           isNavigating={isNavigating}
           requestCount={incomingRequestCount}
           isadmin={isadmin}
           onMenuPress={() => setSideNavVisible(true)}
          />
          
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

          {/* Highly optimized FlatList */}
          <FlatList
            data={displayPosts}
            extraData={visibleItems}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.7} 
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={memoizedFooter}
            ListEmptyComponent={memoizedEmptyComponent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                colors={[theme.colors.blue]}
                tintColor={theme.colors.blue} 
                progressBackgroundColor={theme.colors.textDark} 
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            nestedScrollEnabled={true}
            {...listProps}
          />
        </View>
      </GestureHandlerRootView>
    </ScreenWrapper>
  );
}

export default memo(Feeds);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(3.2),
    paddingVertical: hp(1.2),
    backgroundColor: 'rgb(19, 21, 22)',
  },
  welcomeContainer: {
    flexDirection: 'column',
  },
  welcomeText: {
    color: '#888',
    fontSize: hp(1.8),
  },
  username: {
    color: 'white',
    fontSize: hp(3),
    fontWeight: theme.fonts.bold
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: wp(0.4),
    marginVertical: hp(0.7),
    backgroundColor: 'rgba(33, 149, 243, 0.03)',
    borderRadius: 24,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    color: 'white',
    fontSize: hp(1.8),
  },
  searchButton: {
    padding: hp(1.2),
  },
  trendingSection: {
    marginVertical: hp(2),
  },
  sectionTitle: {
    color: 'white',
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
  },
  trendingList: {
    paddingHorizontal: wp(2),
  },
  trendingItem: {
    marginRight: wp(3),
    position: 'relative',
    borderRadius: theme.radius.xs,
    overflow: 'hidden',
  },
  trendingImage: {
    width: wp(35),
    height: hp(20),
    borderRadius: theme.radius.xs,
  },
  indicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1.5),
  },
  indicatorDot: {
    width: wp(1.5),
    height: wp(1.5),
    borderRadius: wp(2),
    backgroundColor: '#555',
    marginHorizontal: wp(1),
  },
  activeDot: {
    backgroundColor: '#FFD700',
    width: wp(3),
  },
  listStyle: {
    paddingHorizontal: wp(1.2),
    paddingBottom: hp(4)
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.primary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(78),
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: wp(2),
    borderBottomLeftRadius: theme.radius.xs,
    borderBottomRightRadius: theme.radius.xs,
  },
  trendingUsername: {
    color: '#FFD700',
    fontSize: hp(1.6),
    fontWeight: theme.fonts.bold,
    marginBottom: hp(0.5),
  },
  trendingBody: {
    color: 'white',
    fontSize: hp(1.4),
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginLeft: wp(-4),
  },
  communityIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    color: '#888888',
    fontSize: hp(1),
    fontWeight: '500',
    marginTop: hp(0.2),
  },
  iconContainer: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -hp(0.5),
    right: -hp(0.5),
    backgroundColor: '#FF3B30',
    borderRadius: hp(1),
    minWidth: hp(1.8),
    height: hp(1.8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1),
    borderWidth: 1.5,
    borderColor: '#121212',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: hp(1.1),
    fontWeight: 'bold',
  },
   libraryButton: {
    backgroundColor: theme.colors.text,
    paddingVertical: hp(0.2), 
    paddingHorizontal: wp(5.5),
    borderRadius: 16, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonTextTop: {
    color: 'white',
    fontSize: hp(1.4),
    fontWeight: theme.fonts.bold,
    lineHeight: hp(2.0),
  },
  
  buttonTextBottom: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: hp(1.6), 
    fontWeight: '500',
    marginTop: -hp(0.4),
  },
  offlineBar: {
    padding: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text, 
  },
  offlineText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: hp(1.4),
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
  offlineBar: {
    backgroundColor: '#FF3B30',
    padding: hp(0.7),
    alignItems: 'center',
  },
  offlineText: {
    color: 'white',
    fontSize: hp(1.4),
    fontWeight: '500',
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
  },
});