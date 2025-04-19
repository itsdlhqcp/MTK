import { Text, View, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native'
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import theme from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { wp, hp } from '@/helpers/common'
import Avatar from '../../components/Avatar'
import { fetchPosts } from '../../services/homeService'
import { getUserData } from '../../services/userServices'
import Icon from '@/assets/icons'
import MLoading from '../../components/MaterialLoader'
import FeedLoader from '../../components/FeedLoader'
import { useFocusEffect } from '@react-navigation/native'
import { ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler'
import TwistCard from '../../components/TwistCard'
import { NetworkUtils } from '../../utils/network';

// Convert TwistCard to a memoized component for optimized rendering
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
  // Custom comparison function for memo - comparing only necessary props
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.item.body === nextProps.item.body &&
    prevProps.item.file === nextProps.item.file &&
    JSON.stringify(prevProps.item.postLikes) === JSON.stringify(nextProps.item.postLikes) &&
    prevProps.currentUser.id === nextProps.currentUser.id
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
const EmptyListComponent = memo(({ loading }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.noPosts}>
        {loading ? <MLoading /> : "No feeds found!!"}
      </Text>
    </View>
  );
});


{/* <Pressable 
style={styles.libraryButton}
onPress={() => router.push('library')}  
> */}
{/* <Text style={styles.buttonTextTop}>PloTwist</Text> */}
{/* <Text style={styles.buttonTextBottom}>Library</Text>
</Pressable> */}



// Lightweight Header component
const Header = memo(({ username, router }) => (
  <View style={styles.header}>
    <View style={styles.welcomeContainer}>
      <Text style={styles.username}>{username}</Text>
    </View>

    <View style={styles.icons}>
   
       
        <Pressable 
          onPress={() => router.push('library')}
        >
          <Icon name="library" size={hp(3.2)} color='white' />
          {/* {
            notificationCount > 0 && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{notificationCount}</Text>
              </View>
            )
          } */}
        </Pressable>
      <Pressable onPress={() => router.push('addTwist')}>
        <Icon name="plus" size={hp(3.5)} color="white" />
      </Pressable>
      <Pressable onPress={() => router.push('/messenger')}>
        <Icon name="dm" size={hp(3.5)} color="white" />
      </Pressable>
     
    </View>
  </View>
));

const SearchBar = memo(({ searchQuery, setSearchQuery }) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 2000); // Adds a debounce of 300ms

    return () => clearTimeout(delayDebounce);
  }, [localSearch]);

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a video topic"
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
    onPress={() => router.push(`post/${post.id}`)}
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
            key={post.id.toString()} 
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
  
  // Optimized configuration
  const viewabilityConfig = useMemo(() => ({
    viewAreaCoveragePercentThreshold: 20, // Reduced from 50 for better performance
    minimumViewTime: 300 // Add minimum view time to reduce rapid updates
  }), []);
  
  const [visibleItems, setVisibleItems] = useState([]);
  const visibleItemsRef = useRef([]);

  // Optimize viewability tracking to avoid state updates when not needed
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const newVisibleIds = viewableItems.map(item => item.item.id);
    
    // Only update state if visible items changed significantly
    if (JSON.stringify(newVisibleIds) !== JSON.stringify(visibleItemsRef.current)) {
      visibleItemsRef.current = newVisibleIds;
      setVisibleItems(newVisibleIds);
    }
  }).current;

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace('/welcome');
      }
    }, [user, router])
  );

  // State management
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [notificatuionCount, setNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const ITEMS_PER_PAGE = 6; // Increased from 4 to reduce the number of pagination events

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
    else if (payload.eventType === 'DELETE' && payload.old.id) {
      setPosts(prevPosts => 
        prevPosts.filter(post => post.id !== payload.old.id)
      );
    }
    // Handle post update on real-time
    else if (payload.eventType === 'UPDATE' && payload.new.id) {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === payload.new.id 
            ? { ...post, body: payload.new.body, file: payload.new.file } 
            : post
        )
      );
    }
  }, []);

  const handleNewNotification = useCallback((payload) => {
    if (payload.eventType === 'INSERT' && payload.new.id) {
      setNotificationCount(prev => prev + 1);
    }
  }, []);

  // Set up Supabase real-time subscription with cleanup
  useEffect(() => {
    if (!user?.id || !isConnected) return;
    
    let isMounted = true;
    let postChannel;
    let notificationChannel;
    
    const setupChannels = async () => {
      // Create channels
      postChannel = supabase
        .channel('twists')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'twists' },
          handlePostEvent
        )
        .subscribe();

      notificationChannel = supabase
        .channel('notifications')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` },
          handleNewNotification
        )
        .subscribe();

      // Initial posts fetch
      if (isMounted) {
        await getPosts();
        await getTrendingPosts();
      }
    };
    
    setupChannels();

    return () => {
      isMounted = false;
      if (postChannel) supabase.removeChannel(postChannel);
      if (notificationChannel) supabase.removeChannel(notificationChannel);
    };
  }, [user?.id, isConnected]);

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
            newPost => !postsRef.current.some(existingPost => existingPost.id === newPost.id)
          );
          
          if (newPosts.length > 0) {
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
          }
          
          setPage(prev => prev + 1);
        }
      } else {
        Alert.alert('Error', 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, hasMore, page, isConnected]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setPosts([]);
    setHasMore(true);
    getPosts();
  }, [getPosts]);

  // Optimized renderItem for FlatList
  const renderItem = useCallback(({ item }) => (
    <MemoizedTwistCard
      item={item}
      currentUser={user}
      router={router}
      isVisible={visibleItems.includes(item.id)}
    />
  ), [user, router, visibleItems]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Optimized end reached handler with debounce behavior
  const lastFetchTime = useRef(Date.now());
  const handleEndReached = useCallback(() => {
    const now = Date.now();
    if (hasMore && !loading && now - lastFetchTime.current > 500 && isConnected) {
      lastFetchTime.current = now;
      getPosts();
    }
  }, [hasMore, loading, getPosts, isConnected]);

  // Filter posts based on search query - optimized to prevent unnecessary filtering
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    
    const lowerQuery = searchQuery.toLowerCase();
    return posts.filter(post =>
      post.body?.toLowerCase().includes(lowerQuery) ||
      post.user?.userName?.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, posts]);

  // Memoize components to prevent unnecessary recreations
  const memoizedFooter = useMemo(() => (
    <FooterComponent
      loading={loading}
      hasMore={hasMore}
      postsLength={filteredPosts.length}
    />
  ), [loading, hasMore, filteredPosts.length]);

  const memoizedEmptyComponent = useMemo(() => (
    <EmptyListComponent loading={loading} />
  ), [loading]);

  const ListHeaderComponent = useCallback(() => (
    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
  ), [searchQuery]);

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
          <Header username="PlotTwist" router={router} />

          {/* Highly optimized FlatList */}
          <FlatList
            data={filteredPosts}
            extraData={visibleItems}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3} // Reduced from 0.5
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={memoizedFooter}
            ListEmptyComponent={memoizedEmptyComponent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    backgroundColor: 'rgb(21, 23, 24)',
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
    marginHorizontal: wp(4),
    marginVertical: hp(1.5),
    backgroundColor: '#222',
    borderRadius: theme.radius.sm,
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
    paddingHorizontal: wp(4),
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
    paddingHorizontal: wp(1.4),
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
    minHeight: hp(30),
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
   // New styles for the library button
   libraryButton: {
    backgroundColor: theme.colors.text, // Or any color you prefer #990000 #1C3E76
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
    color: 'rgba(255, 255, 255, 0.9)', // Slightly transparent for hierarchy
    fontSize: hp(2),
    fontWeight: '500',
    marginTop: -hp(0.5)
  },
  offlineBar: {
    padding: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text, // Red color for the offline banner
  },
  offlineText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: hp(1.4),
  }

});