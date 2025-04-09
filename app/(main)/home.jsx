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
   
       <Pressable onPress={() => {
          setNotificationCount(0);
          router.push('notifications');
        }}>
          <Icon name="heart" size={hp(3.2)} color='white' />
          {/* {
            notificationCount > 0 && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{notificationCount}</Text>
              </View>
            )
          } */}
        </Pressable>
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
  const ITEMS_PER_PAGE = 6; // Increased from 4 to reduce the number of pagination events

  // Use refs for post handlers to avoid recreating functions
  const postsRef = useRef(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

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
    if (!user?.id) return;
    
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
  }, [user?.id]);

  // Fetch trending posts with loading state management
  const getTrendingPosts = useCallback(async () => {
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
  }, []);

  // Optimized post fetching with proper state management
  const getPosts = useCallback(async () => {
    if (loading || !hasMore) return;

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
  }, [loading, hasMore, page]);

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
    if (hasMore && !loading && now - lastFetchTime.current > 500) {
      lastFetchTime.current = now;
      getPosts();
    }
  }, [hasMore, loading, getPosts]);

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

});



// import { Text, View, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native'
// import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import { useAuth } from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { supabase } from '../../lib/supabase'
// import { wp, hp } from '@/helpers/common'
// import Avatar from '../../components/Avatar'
// import { fetchPosts } from '../../services/homeService'
// import { getUserData } from '../../services/userServices'
// import Icon from '@/assets/icons'
// import MLoading from '../../components/MaterialLoader'
// import FeedLoader from '../../components/FeedLoader'
// import { useFocusEffect } from '@react-navigation/native'
// import { ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler'
// import TwistCard from '../../components/TwistCard'

// // Convert TwistCard to a memoized component for optimized rendering
// const MemoizedTwistCard = memo(({ item, currentUser, router, isVisible }) => {
//   return (
//     <TwistCard
//       item={item}
//       currentUser={currentUser}
//       router={router}
//       isVisible={isVisible}
//     />
//   );
// }, (prevProps, nextProps) => {
//   // Custom comparison function for memo
//   // Return true if nothing important changed (to prevent re-render)
//   return (
//     prevProps.item.id === nextProps.item.id &&
//     prevProps.item.body === nextProps.item.body &&
//     prevProps.item.file === nextProps.item.file &&
//     prevProps.isVisible === nextProps.isVisible &&
//     prevProps.currentUser.id === nextProps.currentUser.id
//   );
// });

// // Create memoized Footer component
// const FooterComponent = memo(({ loading, hasMore, postsLength }) => {
//   if (postsLength === 0) return null;

//   return (
//     <View style={{ marginVertical: 0 }} paddingBottom={16}>
//       {loading && <FeedLoader />}
//       {!hasMore && postsLength > 0 && (
//         <Text style={styles.noPosts}>No more feeds to load !!</Text>
//       )}
//     </View>
//   );
// });

// // Create memoized EmptyList component
// const EmptyListComponent = memo(({ loading }) => {
//   return (
//     <View style={styles.loadingContainer}>
//       <Text style={styles.noPosts}>
//         {loading ? <MLoading /> : "No feeds found!!"}
//       </Text>
//     </View>
//   );
// });

// // Memoized Header component
// const Header = memo(({ username, router }) => {
//   return (
//     <View style={styles.header}>
//       <View style={styles.welcomeContainer}>
//         <Text style={styles.username}>{username}</Text>
//       </View>

//       <View style={styles.icons}>
//         <Pressable onPress={() => router.push('addTwist')}>
//           <Icon name="plus" size={hp(3.5)} color="white" />
//         </Pressable>
//         <Pressable onPress={() => router.push('/messenger')}>
//           <Icon name="dm" size={hp(3.5)} color="white" />
//         </Pressable>
//       </View>
//     </View>
//   );
// });

// // Memoized SearchBar component
// const SearchBar = memo(({ searchQuery, setSearchQuery }) => {
//   return (
//     <View style={styles.searchContainer}>
//       <TextInput
//         style={styles.searchInput}
//         placeholder="Search for a video topic"
//         placeholderTextColor="#888"
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//       />
//       <Pressable style={styles.searchButton}>
//         <Icon name="search" size={hp(2.5)} color="white" />
//       </Pressable>
//     </View>
//   );
// });

// // Memoized TrendingItem component
// const TrendingItem = memo(({ post, router }) => {
//   return (
//     <Pressable
//       style={styles.trendingItem}
//       onPress={() => router.push(`post/${post.id}`)}
//     >
//       <Avatar
//         uri={post.file || "https://via.placeholder.com/150"}
//         size={hp(20)}
//         rounded={theme.radius.xs}
//         style={styles.trendingImage}
//       />
//       <View style={styles.trendingOverlay}>
//         <Text style={styles.trendingUsername}>
//           {post.user?.userName || "Anonymous"}
//         </Text>
//         <Text numberOfLines={2} style={styles.trendingBody}>
//           {post.body || ""}
//         </Text>
//       </View>
//     </Pressable>
//   );
// });

// // Memoized TrendingSection component
// const TrendingSection = memo(({ trendingPosts, loading, router }) => {
//   if (trendingPosts.length === 0 && loading) {
//     return <MLoading />;
//   }

//   // If no posts are loading and no trending posts exist, just return null
//   if (trendingPosts.length === 0 && !loading) {
//     return null;
//   }

//   // Show the first 4 posts in the trending section
//   const displayPosts = trendingPosts.slice(0, 4);

//   return (
//     <View style={styles.trendingSection}>
//       <Text style={styles.sectionTitle}>Trending Plots</Text>
//       <GestureHandlerRootView>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.trendingList}
//         >
//           {displayPosts.map((post) => (
//             <TrendingItem 
//               key={post.id.toString()} 
//               post={post} 
//               router={router} 
//             />
//           ))}
//         </ScrollView>
//       </GestureHandlerRootView>
//       <View style={styles.indicator}>
//         {displayPosts.map((_, index) => (
//           <View
//             key={index}
//             style={[
//               styles.indicatorDot,
//               index === 0 ? styles.activeDot : {}
//             ]}
//           />
//         ))}
//       </View>
//     </View>
//   );
// });

// const Feeds = () => {
//   const { user, navigationGuard } = useAuth();
//   const router = useRouter();
  
//   // Memoize configuration objects to prevent unnecessary recreations
//   const viewabilityConfig = useMemo(() => ({
//     viewAreaCoveragePercentThreshold: 50
//   }), []);
  
//   const [visibleItems, setVisibleItems] = useState([]);

//   const onViewableItemsChanged = useRef(({ viewableItems }) => {
//     setVisibleItems(viewableItems.map(item => item.item.id));
//   }).current;

//   useFocusEffect(
//     useCallback(() => {
//       if (!user) {
//         router.replace('/welcome');
//       }
//     }, [user, router])
//   );

//   // State management
//   const [posts, setPosts] = useState([]);
//   const [trendingPosts, setTrendingPosts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [page, setPage] = useState(1);
//   const [notificatuionCount, setNotificationCount] = useState(0);
//   const [searchQuery, setSearchQuery] = useState('');
//   const ITEMS_PER_PAGE = 4;

//   // Handle real-time post updates - memoize handler functions
//   const handlePostEvent = useCallback(async (payload) => {
//     // handle insert new post on main stream
//     if (payload.eventType === 'INSERT' && payload?.new?.id) {
//       let newPost = { ...payload.new };
//       newPost.postLikes = [];
//       newPost.comments = [{ count: 0 }];
//       let res = await getUserData(newPost.userId);
//       if (res.success) {
//         newPost.user = res.data;
//         setPosts(prevPosts => [newPost, ...prevPosts]);
//       }
//     }
//     // Handle post deletion on real-time
//     if (payload.eventType === 'DELETE' && payload.old.id) {
//       setPosts(prevPosts => 
//         prevPosts.filter(post => post.id !== payload.old.id)
//       );
//     }
//     // Handle post update on real-time
//     if (payload.eventType === 'UPDATE' && payload.new.id) {
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === payload.new.id 
//             ? { ...post, body: payload.new.body, file: payload.new.file } 
//             : post
//         )
//       );
//     }
//   }, []);

//   const handleNewNotification = useCallback(async (payload) => {
//     if (payload.eventType === 'INSERT' && payload.new.id) {
//       setNotificationCount(prev => prev + 1);
//     }
//   }, []);

//   // Set up Supabase real-time subscription
//   useEffect(() => {
//     if (!user?.id) return;
    
//     const postChannel = supabase
//       .channel('twists')
//       .on('postgres_changes',
//         { event: '*', schema: 'public', table: 'twists' },
//         handlePostEvent
//       )
//       .subscribe();

//     const notificationChannel = supabase
//       .channel('notifications')
//       .on('postgres_changes',
//         { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` },
//         handleNewNotification
//       )
//       .subscribe();

//     // Initial posts fetch
//     getPosts();
//     getTrendingPosts();

//     return () => {
//       supabase.removeChannel(postChannel);
//       supabase.removeChannel(notificationChannel);
//     }
//   }, [user?.id, handlePostEvent, handleNewNotification]);

//   // Fetch trending posts - memoized
//   const getTrendingPosts = useCallback(async () => {
//     try {
//       setLoading(true);
//       // Use the first 4 posts from the main posts array
//       const res = await fetchPosts(4);

//       if (res.success) {
//         setTrendingPosts(res.data);
//       }
//     } catch (error) {
//       console.error('Error fetching trending posts:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch posts with pagination - memoized
//   const getPosts = useCallback(async () => {
//     if (loading || !hasMore) return;

//     try {
//       setLoading(true);
//       const res = await fetchPosts(page * ITEMS_PER_PAGE);

//       if (res.success) {
//         // Check if we've reached the end
//         if (res.data.length === posts.length) {
//           setHasMore(false);
//         }

//         // Append new posts, avoiding duplicates
//         setPosts(prevPosts => {
//           const newPosts = res.data.filter(
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
//       setLoading(false);
//     }
//   }, [loading, hasMore, page, posts.length]);

//   // Memoize list optimization functions
//   const renderItem = useCallback(({ item }) => (
//     <MemoizedTwistCard
//       item={item}
//       currentUser={user}
//       router={router}
//       isVisible={visibleItems.includes(item.id)}
//     />
//   ), [user, router, visibleItems]);

//   const keyExtractor = useCallback((item) => item.id.toString(), []);

//   const handleEndReached = useCallback(() => {
//     if (hasMore && !loading) {
//       getPosts();
//     }
//   }, [hasMore, loading, getPosts]);

//   // Filter posts based on search query - memoized
//   const filteredPosts = useMemo(() => 
//     searchQuery
//       ? posts.filter(post =>
//         post.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         post.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase())
//       )
//       : posts
//   , [searchQuery, posts]);

//   // Memoize ListFooterComponent and ListEmptyComponent
//   const memoizedFooter = useMemo(() => (
//     <FooterComponent
//       loading={loading}
//       hasMore={hasMore}
//       postsLength={filteredPosts.length}
//     />
//   ), [loading, hasMore, filteredPosts.length]);

//   const memoizedEmptyComponent = useMemo(() => (
//     <EmptyListComponent loading={loading} />
//   ), [loading]);

//   // Memoize the ListHeaderComponent
//   const ListHeaderComponent = useCallback(() => (
//     <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
//   ), [searchQuery, setSearchQuery]);

//   // Memoize FlatList optimization props
//   const listProps = useMemo(() => ({
//     initialNumToRender: 3,
//     maxToRenderPerBatch: 5,
//     windowSize: 5,
//     updateCellsBatchingPeriod: 30,
//     removeClippedSubviews: true,
//     maintainVisibleContentPosition: {
//       minIndexForVisible: 0,
//       autoscrollToTopThreshold: 10,
//     },
//   }), []);

//   return (
//     <ScreenWrapper bg={"#121212"}>
//       <GestureHandlerRootView style={{ flex: 1 }}>
//         <View style={styles.container}>
//           {/* Memoized Header */}
//           <Header username="PlotTwist" router={router} />

//           {/* Highly optimized FlatList */}
//           <FlatList
//             data={filteredPosts}
//             extraData={visibleItems} // Only re-render when visible items change
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listStyle}
//             keyExtractor={keyExtractor}
//             renderItem={renderItem}
//             onViewableItemsChanged={onViewableItemsChanged}
//             viewabilityConfig={viewabilityConfig}
//             onEndReached={handleEndReached}
//             onEndReachedThreshold={0.5}
//             ListHeaderComponent={ListHeaderComponent}
//             ListFooterComponent={memoizedFooter}
//             ListEmptyComponent={memoizedEmptyComponent}
//             {...listProps}
//           />
//         </View>
//       </GestureHandlerRootView>
//     </ScreenWrapper>
//   );
// }

// export default memo(Feeds);

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(4),
//     paddingVertical: hp(2),
//     backgroundColor: '#121212',
//   },
//   welcomeContainer: {
//     flexDirection: 'column',
//   },
//   welcomeText: {
//     color: '#888',
//     fontSize: hp(1.8),
//   },
//   username: {
//     color: 'white',
//     fontSize: hp(3),
//     fontWeight: theme.fonts.bold
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     marginHorizontal: wp(4),
//     marginVertical: hp(1.5),
//     backgroundColor: '#222',
//     borderRadius: theme.radius.sm,
//     alignItems: 'center',
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: hp(1.2),
//     paddingHorizontal: wp(3),
//     color: 'white',
//     fontSize: hp(1.8),
//   },
//   searchButton: {
//     padding: hp(1.2),
//   },
//   trendingSection: {
//     marginVertical: hp(2),
//   },
//   sectionTitle: {
//     color: 'white',
//     fontSize: hp(2.2),
//     fontWeight: theme.fonts.bold,
//     marginHorizontal: wp(4),
//     marginBottom: hp(1.5),
//   },
//   trendingList: {
//     paddingHorizontal: wp(4),
//   },
//   trendingItem: {
//     marginRight: wp(3),
//     position: 'relative',
//     borderRadius: theme.radius.xs,
//     overflow: 'hidden',
//   },
//   trendingImage: {
//     width: wp(35),
//     height: hp(20),
//     borderRadius: theme.radius.xs,
//   },
//   indicator: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: hp(1.5),
//   },
//   indicatorDot: {
//     width: wp(1.5),
//     height: wp(1.5),
//     borderRadius: wp(2),
//     backgroundColor: '#555',
//     marginHorizontal: wp(1),
//   },
//   activeDot: {
//     backgroundColor: '#FFD700',
//     width: wp(3),
//   },
//   listStyle: {
//     paddingHorizontal: wp(1.4),
//     paddingBottom: hp(4)
//   },
//   noPosts: {
//     fontSize: hp(2),
//     textAlign: 'center',
//     color: theme.colors.primary
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: hp(30),
//   },
//   trendingOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     padding: wp(2),
//     borderBottomLeftRadius: theme.radius.xs,
//     borderBottomRightRadius: theme.radius.xs,
//   },
//   trendingUsername: {
//     color: '#FFD700',
//     fontSize: hp(1.6),
//     fontWeight: theme.fonts.bold,
//     marginBottom: hp(0.5),
//   },
//   trendingBody: {
//     color: 'white',
//     fontSize: hp(1.4),
//   },
//   icons: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 18
//   },
// })



// import { Text, View, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native'
// import React, { useEffect, useRef, useState } from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import { useAuth } from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { supabase } from '../../lib/supabase'
// import { wp, hp } from '@/helpers/common'
// import Avatar from '../../components/Avatar'
// import { fetchPosts } from '../../services/homeService'
// import { getUserData } from '../../services/userServices'
// import Icon from '@/assets/icons'
// import MLoading from '../../components/MaterialLoader'
// import FeedLoader from '../../components/FeedLoader'
// import { useFocusEffect } from '@react-navigation/native'
// import { ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler'
// import TwistCard from '../../components/TwistCard'

// const Feeds = () => {
//     const { user, navigationGuard } = useAuth();
//     const router = useRouter();
//     const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
//     const [visibleItems, setVisibleItems] = useState([]);

//     const onViewableItemsChanged = useRef(({ viewableItems }) => {
//         setVisibleItems(viewableItems.map(item => item.item.id));
//       }).current;

//     useFocusEffect(
//         React.useCallback(() => {
//             if (!user) {
//                 router.replace('/welcome');
//             }
//         }, [user])
//     );
    
//     // State management
//     const [posts, setPosts] = useState([]);
//     const [trendingPosts, setTrendingPosts] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);
//     const [notificatuionCount, setNotificationCount] = useState(0);
//     const [searchQuery, setSearchQuery] = useState('');
//     const ITEMS_PER_PAGE = 4;

//     const handlePostEvent = async (payload) => {
//         // handle insert new post on main stream
//         if (payload.eventType === 'INSERT' && payload?.new?.id) {
//             let newPost = {...payload.new};
//             newPost.postLikes = [];
//             newPost.comments = [{count: 0}];
//             let res = await getUserData(newPost.userId);
//             if (res.success) {
//                 newPost.user = res.data;
//                 setPosts(prevPosts => [newPost, ...prevPosts]);
//             }
//         }
//         // Handle post deletion on real-time
//         if(payload.eventType === 'DELETE' && payload.old.id){
//             setPosts(prevPosts=>{
//                 let updatedPosts = prevPosts.filter(post => post.id != payload.old.id);
//                 return updatedPosts;
//             })
//         }
//         // Handle post update on real-time
//         if(payload.eventType === 'UPDATE' && payload.new.id){
//             setPosts(prevPosts=>{
//                 let updatedPosts = prevPosts.map(post=>{
//                     if(post.id == payload.new.id){
//                         post.body = payload.new.body; 
//                         post.file = payload.new.file;
//                     }
//                     return post;
//                 })
//                 return updatedPosts;
//             })
//         }
//     }

//     const handleNewNotification = async (payload) => {
//         if(payload.eventType === 'INSERT' && payload.new.id){
//             setNotificationCount(prev=>prev+1);
//         }
//     }

//     // Set up Supabase real-time subscription
//     useEffect(() => {
//         const postChannel = supabase
//             .channel('twists')
//             .on('postgres_changes', 
//                 { event: '*', schema: 'public', table: 'twists' }, 
//                 handlePostEvent
//             )
//             .subscribe();

//         let notificationChannel = supabase
//             .channel('notifications')
//             .on('postgres_changes', 
//                 { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, 
//                 handleNewNotification
//             )
//             .subscribe();

//         // Initial posts fetch
//         getPosts();
//         getTrendingPosts();

//         return () => {
//             supabase.removeChannel(postChannel);
//             supabase.removeChannel(notificationChannel);
//         }
//     }, [])

//     // Replace the getTrendingPosts function with this:
// const getTrendingPosts = async () => {
//     try {
//         setLoading(true);
//         // Use the first 4 posts from the main posts array
//         const res = await fetchPosts(4);
        
//         if (res.success) {
//             setTrendingPosts(res.data);
//         }
//     } catch (error) {
//         console.error('Error fetching trending posts:', error);
//     } finally {
//         setLoading(false);
//     }
// }

//     // Fetch posts with pagination
//     const getPosts = async () => {
//         if (loading || !hasMore) return;
        
//         try {
//             setLoading(true);
//             const res = await fetchPosts(page * ITEMS_PER_PAGE);
            
//             if (res.success) {
//                 // Check if we've reached the end
//                 if (res.data.length == posts.length) {
//                     setHasMore(false);
//                 }
                
//                 // Append new posts, avoiding duplicates
//                 setPosts(prevPosts => {
//                     const newPosts = res.data.filter(
//                         newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
//                     );
//                     return [...prevPosts, ...newPosts];
//                 });
                
//                 setPage(prev => prev + 1);
//             } else {
//                 Alert.alert('Error', 'Failed to fetch posts');
//             }
//         } catch (error) {
//             console.error('Error fetching posts:', error);
//             Alert.alert('Error', 'Something went wrong while fetching posts');
//         } finally {
//             setLoading(false);
//         }
//     }

//     // Update the renderTrendingPosts function to display more information about each post
// const renderTrendingPosts = () => {
//     if (trendingPosts.length === 0 && loading) {
//         return <MLoading />;
//     }

//     // If no posts are loading and no trending posts exist, just return null
//     if (trendingPosts.length === 0 && !loading) {
//         return null;
//     }

//     // Show the first 4 posts in the trending section
//     const displayPosts = trendingPosts.slice(0, 4);

//     return (
//         <View style={styles.trendingSection}>
//             <Text style={styles.sectionTitle}>Trending Plots</Text>
//             <GestureHandlerRootView>
//                 <ScrollView 
//                     horizontal 
//                     showsHorizontalScrollIndicator={false}
//                     contentContainerStyle={styles.trendingList}
//                 >
//                     {displayPosts.map((post, index) => (
//                         <Pressable 
//                             key={post.id.toString()}
//                             style={styles.trendingItem}
//                             onPress={() => router.push(`post/${post.id}`)}
//                         >
//                             <Avatar 
//                                 uri={post.file || "https://via.placeholder.com/150"} 
//                                 size={hp(20)} 
//                                 rounded={theme.radius.xs}
//                                 style={styles.trendingImage}
//                             />
//                             <View style={styles.trendingOverlay}>
//                                 <Text style={styles.trendingUsername}>
//                                     {post.user?.userName || "Anonymous"}
//                                 </Text>
//                                 <Text numberOfLines={2} style={styles.trendingBody}>
//                                     {post.body || ""}
//                                 </Text>
//                             </View>
//                         </Pressable>
//                     ))}
//                 </ScrollView>
//             </GestureHandlerRootView>
//             <View style={styles.indicator}>
//                 {displayPosts.map((_, index) => (
//                     <View 
//                         key={index} 
//                         style={[
//                             styles.indicatorDot, 
//                             index === 0 ? styles.activeDot : {}
//                         ]} 
//                     />
//                 ))}
//             </View>
//         </View>
//     );
// }

//     const FooterComponent = () => {
//         // Only render if there are posts
//         if (posts.length === 0) return null;
    
//         return (
//             <View style={{marginVertical: 0}} paddingBottom={16}>
//                 {loading && <FeedLoader />}
//                 {!hasMore && posts.length > 0 && (
//                     <Text style={styles.noPosts}>No more feeds to load !!</Text>
//                 )}
//             </View>
//         );
//     };

//     // Filter posts based on search query
//     const filteredPosts = searchQuery 
//         ? posts.filter(post => 
//             post.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             post.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//         : posts;

//     return (
//         <ScreenWrapper bg={"#121212"}>
//         <GestureHandlerRootView style={{ flex: 1 }}>
//             <View style={styles.container}>
//                 {/* Header - Fixed at top */}
//                 <View style={styles.header}>
//                     <View style={styles.welcomeContainer}>
//                         <Text style={styles.username}>{ "PlotTwist"}</Text>
//                     </View>

//                     <View style={styles.icons}>
//                         <Pressable onPress={() => router.push('addTwist')}>
//                                 <Icon name="plus" size={hp(3.5)} color="white" />
//                             </Pressable>
//                         <Pressable onPress={() => router.push('/messenger')}>
//                                 <Icon name="dm" size={hp(3.5)} color="white" />
//                             </Pressable>
                    
//                     </View>
                   
//                 </View>
                
//                 {/* Main Content */}
//                 <FlatList
//                     data={filteredPosts}
//                     showsVerticalScrollIndicator={false}
//                     contentContainerStyle={styles.listStyle}
//                     keyExtractor={item => item.id.toString()}
//                     onViewableItemsChanged={onViewableItemsChanged}
//                     viewabilityConfig={viewabilityConfig}
//                     ListHeaderComponent={() => (
//                         <>
//                             {/* Search Bar - Now part of scrollable content */}
//                             <View style={styles.searchContainer}>
//                                 <TextInput
//                                     style={styles.searchInput}
//                                     placeholder="Search for a video topic"
//                                     placeholderTextColor="#888"
//                                     value={searchQuery}
//                                     onChangeText={setSearchQuery}
//                                 />
//                                 <Pressable style={styles.searchButton}>
//                                     <Icon name="search" size={hp(2.5)} color="white" />
//                                 </Pressable>
//                             </View>
                            
//                         </>
//                     )}
//                     renderItem={({ item }) => (
//                         <TwistCard
//                             item={item}
//                             currentUser={user}
//                             router={router}
//                             isVisible={visibleItems.includes(item.id)}
//                         />
//                     )}
//                     onEndReached={() => {
//                         if (hasMore && !loading) {
//                             getPosts();
//                         }
//                     }}
//                     onEndReachedThreshold={0.5}
//                     ListFooterComponent={FooterComponent}
//                     ListEmptyComponent={() => (
//                         <View style={styles.loadingContainer}>
//                             <Text style={styles.noPosts}>
//                                 {loading ? <MLoading /> : "No feeds found!!"}
//                             </Text>
//                         </View>
//                     )}
//                 />
//             </View>
//         </GestureHandlerRootView>
//     </ScreenWrapper>
//     );
// }

// export default Feeds

// const additionalStyles = {
//     trendingOverlay: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         backgroundColor: 'rgba(0, 0, 0, 0.6)',
//         padding: wp(2),
//         borderBottomLeftRadius: theme.radius.xs,
//         borderBottomRightRadius: theme.radius.xs,
//     },
//     trendingUsername: {
//         color: '#FFD700',
//         fontSize: hp(1.6),
//         fontWeight: theme.fonts.bold,
//         marginBottom: hp(0.5),
//     },
//     trendingBody: {
//         color: 'white',
//         fontSize: hp(1.4),
//     },
//     // Update the trendingItem style to ensure proper layout
//     trendingItem: {
//         marginRight: wp(3),
//         position: 'relative',
//         borderRadius: theme.radius.xs,
//         overflow: 'hidden',
//     },
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
        
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: wp(4),
//         paddingVertical: hp(2),
//         backgroundColor: '#121212',
//     },
//     welcomeContainer: {
//         flexDirection: 'column',
//     },
//     welcomeText: {
//         color: '#888',
//         fontSize: hp(1.8),
//     },
//     username: {
//         color: 'white',
//         fontSize: hp(3),
//         fontWeight: theme.fonts.bold
//     },
//     searchContainer: {
//         flexDirection: 'row',
//         marginHorizontal: wp(4),
//         marginVertical: hp(1.5),
//         backgroundColor: '#222',
//         borderRadius: theme.radius.sm,
//         alignItems: 'center',
//     },
//     searchInput: {
//         flex: 1,
//         paddingVertical: hp(1.2),
//         paddingHorizontal: wp(3),
//         color: 'white',
//         fontSize: hp(1.8),
//     },
//     searchButton: {
//         padding: hp(1.2),
//     },
//     trendingSection: {
//         marginVertical: hp(2),
//     },
//     sectionTitle: {
//         color: 'white',
//         fontSize: hp(2.2),
//         fontWeight: theme.fonts.bold,
//         marginHorizontal: wp(4),
//         marginBottom: hp(1.5),
//     },
//     trendingList: {
//         paddingHorizontal: wp(4),
//     },
//     trendingItem: {
//         marginRight: wp(3),
//     },
//     trendingImage: {
//         width: wp(35),
//         height: hp(20),
//         borderRadius: theme.radius.xs,
//     },
//     indicator: {
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginTop: hp(1.5),
//     },
//     indicatorDot: {
//         width: wp(1.5),
//         height: wp(1.5),
//         borderRadius: wp(2),
//         backgroundColor: '#555',
//         marginHorizontal: wp(1),
//     },
//     activeDot: {
//         backgroundColor: '#FFD700',
//         width: wp(3),
//     },
//     listStyle: {
//         paddingHorizontal: wp(1.4),
//         paddingBottom: hp(4)
//     },
//     noPosts: {
//         fontSize: hp(2),
//         textAlign: 'center',
//         color: theme.colors.primary
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         minHeight: hp(30),
//     },
//     trendingOverlay: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         backgroundColor: 'rgba(0, 0, 0, 0.6)',
//         padding: wp(2),
//         borderBottomLeftRadius: theme.radius.xs,
//         borderBottomRightRadius: theme.radius.xs,
//     },
//     trendingUsername: {
//         color: '#FFD700',
//         fontSize: hp(1.6),
//         fontWeight: theme.fonts.bold,
//         marginBottom: hp(0.5),
//     },
//     trendingBody: {
//         color: 'white',
//         fontSize: hp(1.4),
//     },
//     icons: {
//         flexDirection: 'row', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         gap: 18
//       },
// })