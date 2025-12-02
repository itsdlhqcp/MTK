import { Text, View, StyleSheet, FlatList, Pressable, TextInput, RefreshControl } from 'react-native'
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

// Lightweight Header component
const Header = memo(({ username, router, setIsNavigating, isNavigating, isadmin }) => (
  <View style={styles.header}>
    <View style={styles.welcomeContainer}>
      <Text style={styles.username}>{username}</Text>
    </View>

    <View style={styles.icons}>
      {isadmin && (
        <Pressable 
          disabled={isNavigating}
          onPress={() => {
            if (!isNavigating) {
              setIsNavigating(true);
              router.push('addTwist');
            }
          }}
        >
          <Icon name="plus" size={hp(3.2)} color='white' />
        </Pressable>
      )} 
            {isadmin && (
                 <Pressable 
                 disabled={isNavigating}
                 onPress={() => {
                   if (!isNavigating) {
                     setIsNavigating(true);
                     router.push('pollScreen');
                   }
                 }}
               >
                 <Icon name="rocket" size={hp(3.2)} color={theme.colors.blue} />
               </Pressable>
               )}
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
  const { user, navigationGuard } = useAuth();
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
  const { showToast } = useToast();
  const ITEMS_PER_PAGE = 25; 

  useFocusEffect(
    React.useCallback(() => {
      setIsNavigating(false);
      // Redirect to feeds (spotlight) if someone navigates to home
      router.replace('/feeds');
    }, [router])
  );

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
          setPosts(prevPosts => [newPost, ...prevPosts]);
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

// Update the existing useEffect that sets up Supabase channels
  useEffect(() => {
    if (!user?.id || !isConnected) return;
    
    let isMounted = true;
    let postChannel;
    let notificationChannel;
    let pollChannel; // Add this line
    
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

      // Initial data fetch
      if (isMounted) {
        await getPosts();
        await getTrendingPosts();
        await getPolls(); // Add this line
      }
    };
    
    setupChannels();

    return () => {
      isMounted = false;
      if (postChannel) supabase.removeChannel(postChannel);
      if (notificationChannel) supabase.removeChannel(notificationChannel);
      if (pollChannel) supabase.removeChannel(pollChannel); // Add this line
    };
  }, [user?.id, isConnected]);

  // Add this useEffect to combine and sort posts and polls by date
  useEffect(() => {
    const combinedItems = [
      ...posts.map(post => ({ ...post, type: 'post', sortDate: new Date(post.created_at) })),
      ...polls.map(poll => ({ ...poll, type: 'poll', sortDate: new Date(poll.created_at) }))
    ];
    
    // Sort by date (newest first)
    const sortedItems = combinedItems.sort((a, b) => b.sortDate - a.sortDate);
    
    setAllFeedItems(sortedItems);
  }, [posts, polls]);

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
  const getPosts = useCallback(async () => {
    if (loading || !hasMore) return;

    // Skip fetching if offline
    if (!isConnected) {
      console.log('Skipping fetch - device is offline');
      return;
    }

    try {
      setLoading(true);
      const res = await fetchPosts(page * ITEMS_PER_PAGE);

      if (res.success) {
        // Check if we've reached the end
        if (res.data.length === postsRef.current.length) {
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
        }
      } else {
        showToast('success', 'Failed to fetch posts- Network Problem!!');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, hasMore, page, isConnected]);

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

  // Get the current posts to display (search results or all posts)
 // Update the displayPosts logic
const displayPosts = useMemo(() => {
  return isSearching ? searchResults : allFeedItems;
}, [isSearching, searchResults, allFeedItems]);

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

  const ListHeaderComponent = useCallback(() => (
    <SearchBar 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery} 
      onClearSearch={handleClearSearch}
      isSearching={isSearching}
    />
  ), [searchQuery, handleClearSearch, isSearching]);

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
        <View style={styles.container}>
          {/* Memoized Header */}
          <Header
           username="PlotTwist"
           router={router}
           setIsNavigating={setIsNavigating}
           isNavigating={isNavigating}
           isadmin={isadmin}
          />

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
    gap: 12
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
});