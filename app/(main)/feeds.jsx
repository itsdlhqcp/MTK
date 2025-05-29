import { Text, Alert, View, StyleSheet, FlatList, RefreshControl } from 'react-native'
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import theme from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { wp, hp } from '@/helpers/common'
import { fetchPosts, markPostAsViewed, getUnwatchedPostsCount, syncPendingViews } from '../../services/postService'
import { getUserData } from '../../services/userServices'
import FeedLoader from '../../components/FeedLoader'
import { useFocusEffect } from '@react-navigation/native';
import SpotlightCard from '../../components/SpotlightCard';
import { NetworkUtils } from '../../utils/network';
import { useToast } from '../../contexts/ToastContext'
import CustomDotIndicator from '../../components/CutomDotIndicator';

// Convert PostCard to a memoized component for optimized rendering
const MemoizedPostCard = memo(({ item, currentUser, router, isVisible, onPostViewed }) => {
  const hasBeenViewed = useRef(false);

  // Track when post becomes visible and mark as viewed
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

// Memoized Header component
const Header = memo(({ title, notificationCount, setNotificationCount, router, unwatchedCount, showOnlyUnwatched, handleToggleFilter }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.headerActions}>
        {/* Unwatched filter button */}
        {/* <Pressable 
          style={[
            styles.filterButton, 
            showOnlyUnwatched && styles.filterButtonActive
          ]} 
          onPress={handleToggleFilter}
        >
          <Text style={[
            styles.filterButtonText, 
            showOnlyUnwatched && styles.filterButtonTextActive
          ]}>
            {unwatchedCount > 0 ? `Unwatched ${unwatchedCount}` : 'All Posts'}
          </Text>
        </Pressable> */}
        
        {/* Notification icons section - commented out as in your original code */}
        {/* <View style={styles.icons}>
          <Pressable onPress={() => {
            setNotificationCount(0);
            router.push('notifications');
          }}>
            <Icon name="heart" size={hp(3.2)} color='white' />
            {
              notificationCount > 0 && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{notificationCount}</Text>
                </View>
              )
            }
          </Pressable>

          <Pressable onPress={() => router.push('newOtt')}>
            <Icon name="save" size={hp(3)} color="white" />
          </Pressable>
        </View> */}
      </View>
    </View>
  );
});

const Home = () => {
    const {user, setAuth, navigationGuard} = useAuth();
    const router = useRouter();
    
    // Memoize configuration objects to prevent unnecessary recreations
    const viewabilityConfig = useMemo(() => ({ 
      viewAreaCoveragePercentThreshold: 50 
    }), []);
    
    const [visibleItems, setVisibleItems] = useState([]);
  
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
      setVisibleItems(viewableItems.map(item => item.item?.id));
    }).current;

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

    // Protect route on mount and user state change
    useFocusEffect(
        useCallback(() => {
          if (!user) {
            router.replace('/welcome');
          }
        }, [user, router])
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
      
      // Sync with other users' views if needed - for a collaborative feature
      // This would update the UI when other users view posts
      // Uncomment if you want this feature
      /*
      else {
          // When another user views a post, you might want to 
          // update some UI element to show "X people have viewed this"
          if (payload.eventType === 'INSERT') {
              // Update view count for the post if you track this
              setPosts(prevPosts => 
                  prevPosts.map(post => 
                      post?.id === payload.new?.post_id
                          ? { ...post, viewCount: (post.viewCount || 0) + 1 }
                          : post
                  )
              );
          }
      }
      */
    }, [user?.id]);

    // Set up Supabase real-time subscription
    useEffect(() => {
        if (!user?.id || !isConnected) return;
        
        const postChannel = supabase
            .channel('posts')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'posts' }, 
                handlePostEvent
            )
            .subscribe();

        const notificationChannel = supabase
            .channel('notifications')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user?.id}` }, 
                handleNewNotification
            )
            .subscribe();
            
        // New subscription for post_views to update UI in real-time
        const viewsChannel = supabase
            .channel('post_views')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'post_views' },
                handlePostViewEvent
            )
            .subscribe();

        // Initial posts fetch
        getPosts();
        
        // Initial unwatched count
        loadUnwatchedCount();

        return () => {
            supabase.removeChannel(postChannel);
            supabase.removeChannel(notificationChannel);
            supabase.removeChannel(viewsChannel);
        };
    }, [user?.id, handlePostEvent, handleNewNotification, handlePostViewEvent, isConnected, getPosts, loadUnwatchedCount]);

    const isLoadingMore = useRef(false);

    // Modified onRefresh with filter support
    const onRefresh = useCallback(async () => {
      if (!isConnected) {
        showToast('error', 'No network connection');
        return;
      }
      
      try {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        
        const res = await fetchPosts(ITEMS_PER_PAGE, null, showOnlyUnwatched);
        
        if (res.success) {
          setPosts(res.data);
          if (res.data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
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
    }, [isConnected, ITEMS_PER_PAGE, showOnlyUnwatched, loadUnwatchedCount, showToast]);

    // Effect to reload posts when filter changes
    useEffect(() => {
      if (user?.id && isConnected && initialCheckDone) {
        getPosts(true); // Reset posts when filter changes
      }
    }, [showOnlyUnwatched, user?.id, isConnected, initialCheckDone]);

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
        const res = await fetchPosts(
          currentPage * ITEMS_PER_PAGE, 
          null, // userId - null for all posts
          showOnlyUnwatched
        );
        
        if (res.success) {
          if (reset) {
            setPosts(res.data);
            setPage(2);
            setHasMore(res.data.length === ITEMS_PER_PAGE);
          } else {
            // Check if we've reached the end
            if (res.data.length === posts.length) {
              setHasMore(false);
            }
            
            // Append new posts, avoiding duplicates
            setPosts(prevPosts => {
              const newPosts = res.data.filter(
                newPost => !prevPosts.some(existingPost => existingPost?.id === newPost?.id)
              );
              return [...prevPosts, ...newPosts];
            });
            
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
    }, [hasMore, page, posts.length, isConnected, showOnlyUnwatched, showToast, ITEMS_PER_PAGE]);

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
     const renderItem = useCallback(({ item }) => (
      <MemoizedPostCard
        item={item}
        currentUser={user}
        router={router}
        isVisible={visibleItems.includes(item?.id)}
        onPostViewed={handlePostViewed}
      />
    ), [user, router, visibleItems, handlePostViewed]);

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

    // Memoized Header component with unwatched count
    const memoizedHeader = useMemo(() => (
      <Header
        title="Spotlight"
        notificationCount={notificationCount}
        setNotificationCount={setNotificationCount}
        router={router}
        unwatchedCount={unwatchedCount}
        showOnlyUnwatched={showOnlyUnwatched}
        handleToggleFilter={handleToggleFilter}
      />
    ), [notificationCount, router, unwatchedCount, showOnlyUnwatched, handleToggleFilter]);

    return (
      <ScreenWrapper bg={"#121212"}>   
          {/* Offline Mode Indicator */}
            {!isConnected && (
              <View style={styles.offlineBar}>
                <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
              </View>
            )}
        <View style={styles.container}>
          {/* Memoized Header */}
          {memoizedHeader}

          {/* Highly optimized FlatList with RefreshControl */}
          <FlatList
            data={posts}
            extraData={visibleItems} // Only re-render when visible items change
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={handleEndReached}
            onEndReachedThreshold={1}
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
  }
});


























// import { Text, Alert, View, StyleSheet, Pressable, FlatList, RefreshControl } from 'react-native'
// import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import { useAuth } from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { supabase } from '../../lib/supabase'
// import { wp, hp } from '@/helpers/common'
// import { fetchPosts, markPostAsViewed, getUnwatchedPostsCount } from '../../services/postService'
// import { getUserData } from '../../services/userServices'
// import MLoading from '../../components/MaterialLoader'
// import FeedLoader from '../../components/FeedLoader'
// import { useFocusEffect } from '@react-navigation/native';
// import SpotlightCard from '../../components/SpotlightCard';
// import { NetworkUtils } from '../../utils/network';
// import { useToast } from '../../contexts/ToastContext'

// // Convert PostCard to a memoized component for optimized rendering
// const MemoizedPostCard = memo(({ item, currentUser, router, isVisible, onPostViewed }) => {
//   const hasBeenViewed = useRef(false);

//   // Track when post becomes visible and mark as viewed
//   useEffect(() => {
//     if (isVisible && !hasBeenViewed.current && !item.isWatched) {
//       hasBeenViewed.current = true;
//       onPostViewed(item.id);
//     }
//   }, [isVisible, item.id, item.isWatched, onPostViewed]);

//   const postData = useMemo(() => {
//     return {
//       id: item?.id,
//       body: item?.body,
//       file: item?.file,
//       userId: item?.userId,
//       created_at: item?.created_at,
//       tags: item?.tags,
//       name: item?.user?.name,
//       profile: item?.user?.image,
//       comments: item?.comments?.[0]?.count,
//       postLikes: item?.postLikes,
//       isWatched: item?.isWatched
//     };
//   }, [item]);
  
//   return (
//     <View style={styles.postContainer}>
//       <SpotlightCard
//         item={postData}
//         currentUser={currentUser}
//         router={router}
//         isVisible={isVisible}
//       />
//     </View>
//   );
// }, (prevProps, nextProps) => {
//   return (
//     prevProps.item.id === nextProps.item.id &&
//     prevProps.item.body === nextProps.item.body &&
//     prevProps.item.file === nextProps.item.file &&
//     prevProps.isVisible === nextProps.isVisible &&
//     prevProps.currentUser.id === nextProps.currentUser.id &&
//     prevProps.item.isWatched === nextProps.item.isWatched
//   );
// });

// // Create memoized Footer component
// const FooterComponent = memo(({ loading, hasMore, postsLength }) => {
//   if (postsLength === 0) return null;

//   return (
//     <View style={{marginVertical: 0}} paddingBottom={16}>
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
//         {loading ? <MLoading /> : "No Network found!!"}
//       </Text>
//     </View>
//   );
// });

// // Memoized Header component
// const Header = memo(({ title, notificationCount, setNotificationCount, router }) => {
//   return (
//     <View style={styles.header}>
//       <Text style={styles.title}>{title}</Text>
      
//       {/* <View style={styles.icons}>
//         <Pressable onPress={() => {
//           setNotificationCount(0);
//           router.push('notifications');
//         }}>
//           <Icon name="heart" size={hp(3.2)} color='white' />
//           {
//             notificationCount > 0 && (
//               <View style={styles.pill}>
//                 <Text style={styles.pillText}>{notificationCount}</Text>
//               </View>
//             )
//           }
//         </Pressable>

//         <Pressable onPress={() => router.push('newOtt')}>
//                   <Icon name="save" size={hp(3)} color="white" />
//                 </Pressable>
        
//       </View> */}
//     </View>
//   );
// });

// const Home = () => {
//     const {user, setAuth, navigationGuard} = useAuth();
//     const router = useRouter();
    
//     // Memoize configuration objects to prevent unnecessary recreations
//     const viewabilityConfig = useMemo(() => ({ 
//       viewAreaCoveragePercentThreshold: 50 
//     }), []);
    
//     const [visibleItems, setVisibleItems] = useState([]);
  
//     const onViewableItemsChanged = useRef(({ viewableItems }) => {
//       setVisibleItems(viewableItems.map(item => item.item.id));
//     }).current;

//     const handlePostViewed = useCallback(async (postId) => {
//       if (!user?.id) return;

//     const result = await markPostAsViewed(postId, user.id);
//     if (result.success) {
//       // Update local state to reflect viewed status
//       setPosts(prevPosts => 
//         prevPosts.map(post => 
//           post.id === postId 
//             ? { ...post, isWatched: true }
//             : post
//         )
//       );
      
//       // Update unwatched count
//       setUnwatchedCount(prev => Math.max(0, prev - 1));
//     }
//   }, [user?.id]);

//   // Load unwatched count
//   const loadUnwatchedCount = useCallback(async () => {
//     if (!user?.id) return;
    
//     const result = await getUnwatchedPostsCount(user.id);
//     if (result.success) {
//       setUnwatchedCount(result.count);
//     }
//   }, [user?.id]);

//     // Protect route on mount and user state change
//     useFocusEffect(
//         useCallback(() => {
//           if (!user) {
//             router.replace('/welcome');
//           }
//         }, [user, router])
//     );
    
//     // State management
//     const [posts, setPosts] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [refreshing, setRefreshing] = useState(false); // Added for pull-to-refresh
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);
//     const [notificationCount, setNotificationCount] = useState(0);
//     const [isConnected, setIsConnected] = useState(true);
//     const [initialCheckDone, setInitialCheckDone] = useState(false);
//     const { showToast } = useToast();
//     const [showOnlyUnwatched, setShowOnlyUnwatched] = useState(false);
//     const [unwatchedCount, setUnwatchedCount] = useState(0);
//     const ITEMS_PER_PAGE = 22;
//     // Check network status on mount
//     useEffect(() => {
//       const checkNetworkStatus = async () => {
//         const connected = await NetworkUtils.isConnected();
//         setIsConnected(connected);
//         setInitialCheckDone(true);
//       };
      
//       checkNetworkStatus();
      
//       // Set up network listener
//       const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
//         setIsConnected(connected);
//         setInitialCheckDone(true);
//       });
      
//       return () => unsubscribe();
//     }, []);

//     // Handle real-time post updates - memoize handler functions
//     // Enhanced real-time handler to update unwatched count
//     const handlePostEvent = useCallback(async (payload) => {
//       if (payload.eventType === 'INSERT' && payload?.new?.id) {
//         let newPost = {...payload.new};
//         newPost.postLikes = [];
//         newPost.comments = [{count: 0}];
//         newPost.isWatched = false; // New posts are unwatched by default
        
//         let res = await getUserData(newPost.userId);
//         if (res.success) {
//           newPost.user = res.data;
//           setPosts(prevPosts => [newPost, ...prevPosts]);
//           // Increment unwatched count for new posts
//           setUnwatchedCount(prev => prev + 1);
//         }
//       }
      
//       if(payload.eventType === 'DELETE' && payload.old.id){
//         setPosts(prevPosts => 
//           prevPosts.filter(post => post.id !== payload.old.id)
//         );
//       }
      
//       if(payload.eventType === 'UPDATE' && payload.new.id){
//         setPosts(prevPosts => 
//           prevPosts.map(post => 
//             post.id === payload.new.id 
//               ? { ...post, body: payload.new.body, file: payload.new.file }
//               : post
//           )
//         );
//       }
//     }, []);

//     const handleNewNotification = useCallback(async (payload) => {
//         if(payload.eventType === 'INSERT' && payload.new.id){
//             setNotificationCount(prev => prev + 1);
//         }
//     }, []);

//     // Set up Supabase real-time subscription
//     useEffect(() => {
//         if (!user?.id || !isConnected) return;
        
//         const postChannel = supabase
//             .channel('posts')
//             .on('postgres_changes', 
//                 { event: '*', schema: 'public', table: 'posts' }, 
//                 handlePostEvent
//             )
//             .subscribe();

//         const notificationChannel = supabase
//             .channel('notifications')
//             .on('postgres_changes', 
//                 { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, 
//                 handleNewNotification
//             )
//             .subscribe();

//         // Initial posts fetch
//         getPosts();

//         return () => {
//             supabase.removeChannel(postChannel);
//             supabase.removeChannel(notificationChannel);
//         };
//     }, [user?.id, handlePostEvent, handleNewNotification, isConnected]);

// const isLoadingMore = useRef(false);

// // Modified onRefresh with filter support
// const onRefresh = useCallback(async () => {
//   if (!isConnected) {
//     showToast('error', 'No network connection');
//     return;
//   }
  
//   try {
//     setRefreshing(true);
//     setPage(1);
//     setHasMore(true);
    
//     const res = await fetchPosts(ITEMS_PER_PAGE, null, showOnlyUnwatched);
    
//     if (res.success) {
//       setPosts(res.data);
//       if (res.data.length < ITEMS_PER_PAGE) {
//         setHasMore(false);
//       }
//       // Reload unwatched count after refresh
//       await loadUnwatchedCount();
//     } else {
//       showToast('error', 'Failed to refresh feed');
//     }
//   } catch (error) {
//     console.error('Error refreshing posts:', error);
//     showToast('error', 'Something went wrong');
//   } finally {
//     setRefreshing(false);
//   }
// }, [isConnected, ITEMS_PER_PAGE, showOnlyUnwatched, loadUnwatchedCount]);

// // Effect to reload posts when filter changes
// useEffect(() => {
//   if (user?.id && isConnected && initialCheckDone) {
//     getPosts(true); // Reset posts when filter changes
//   }
// }, [showOnlyUnwatched]);

//   // Load unwatched count on mount and user change
//   useEffect(() => {
//     if (user?.id && isConnected) {
//       loadUnwatchedCount();
//     }
//   }, [user?.id, isConnected, loadUnwatchedCount]);

//   // Modified getPosts function with filter support
//   const getPosts = useCallback(async (reset = false) => {
//     if (isLoadingMore.current || (!hasMore && !reset) || !isConnected) return;
    
//     try {
//       isLoadingMore.current = true;
//       setLoading(true);
      
//       const currentPage = reset ? 1 : page;
//       const res = await fetchPosts(
//         currentPage * ITEMS_PER_PAGE, 
//         null, // userId - null for all posts
//         showOnlyUnwatched
//       );
      
//       if (res.success) {
//         if (reset) {
//           setPosts(res.data);
//           setPage(2);
//           setHasMore(res.data.length === ITEMS_PER_PAGE);
//         } else {
//           // Check if we've reached the end
//           if (res.data.length === posts.length) {
//             setHasMore(false);
//           }
          
//           // Append new posts, avoiding duplicates
//           setPosts(prevPosts => {
//             const newPosts = res.data.filter(
//               newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
//             );
//             return [...prevPosts, ...newPosts];
//           });
          
//           setPage(prev => prev + 1);
//         }
//       } else {
//         showToast('error', 'Failed to fetch posts - Network Problem!');
//       }
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       Alert.alert('Error', 'Something went wrong while fetching posts');
//     } finally {
//       setLoading(false);
//       setTimeout(() => {
//         isLoadingMore.current = false;
//       }, 300);
//     }
//   }, [hasMore, page, posts.length, isConnected, showOnlyUnwatched]);

//     // Toggle filter function
//     const handleToggleFilter = useCallback(() => {
//       setShowOnlyUnwatched(prev => {
//         const newValue = !prev;
//         // Reset posts when toggling filter
//         setPosts([]);
//         setPage(1);
//         setHasMore(true);
//         return newValue;
//       });
//     }, []);

//      // Enhanced render item with view tracking
//      const renderItem = useCallback(({ item }) => (
//       <MemoizedPostCard
//         item={item}
//         currentUser={user}
//         router={router}
//         isVisible={visibleItems.includes(item.id)}
//         onPostViewed={handlePostViewed}
//       />
//     ), [user, router, visibleItems, handlePostViewed]);

//     const keyExtractor = useCallback((item) => item.id.toString(), []);
    
//     const handleEndReached = useCallback(() => {
//       if (hasMore && !loading && isConnected) {
//         getPosts();
//       }
//     }, [hasMore, loading, getPosts, isConnected]);
    
//     // Memoize ListFooterComponent and ListEmptyComponent
//     const memoizedFooter = useMemo(() => (
//       <FooterComponent 
//         loading={loading} 
//         hasMore={hasMore} 
//         postsLength={posts.length} 
//       />
//     ), [loading, hasMore, posts.length]);
    
//     const memoizedEmptyComponent = useMemo(() => (
//       <EmptyListComponent loading={loading} />
//     ), [loading]);
    
//     // Memoize RefreshControl component
//     const refreshControl = useMemo(() => (
//       <RefreshControl
//         refreshing={refreshing}
//         onRefresh={onRefresh}
//         tintColor={theme.colors.primary}
//         colors={[theme.colors.primary]}
//         progressBackgroundColor="#232323"
//         progressViewOffset={10}
//       />
//     ), [refreshing, onRefresh]);
    
//     // Memoize FlatList optimization props
//     const listProps = useMemo(() => ({
//       initialNumToRender: 3,
//       maxToRenderPerBatch: 5,
//       windowSize: 5,
//       updateCellsBatchingPeriod: 30,
//       removeClippedSubviews: true,
//       maintainVisibleContentPosition: {
//         minIndexForVisible: 0,
//         autoscrollToTopThreshold: 10,
//       },
//     }), []);

//     return (
//       <ScreenWrapper bg={"#121212"}>   
//           {/* Offline Mode Indicator */}
//             {!isConnected && (
//               <View style={styles.offlineBar}>
//                 <Text style={styles.offlineText}>Offline Mode - Network Unavailable</Text>
//               </View>
//             )}
//         <View style={styles.container}>
//           {/* Memoized Header */}
//           <Header 
//             title="Spotlight" 
//             notificationCount={notificationCount}
//             setNotificationCount={setNotificationCount}
//             router={router}
//           />

//           {/* Highly optimized FlatList with RefreshControl */}
//           <FlatList
//             data={posts}
//             extraData={visibleItems} // Only re-render when visible items change
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listStyle}
//             keyExtractor={keyExtractor}
//             renderItem={renderItem}
//             onViewableItemsChanged={onViewableItemsChanged}
//             viewabilityConfig={viewabilityConfig}
//             onEndReached={handleEndReached}
//             onEndReachedThreshold={0.5}
//             ListFooterComponent={memoizedFooter}
//             ListEmptyComponent={memoizedEmptyComponent}
//             refreshControl={refreshControl} // Add RefreshControl component
//             initialNumToRender={10}  // first batch
//             maxToRenderPerBatch={5}  // scroll chunk
//             windowSize={5}  // active items
//             {...listProps}
//           />
//         </View>
//       </ScreenWrapper>
//     );
// }; 

// export default memo(Home);

// const styles = StyleSheet.create({
//   container: {
//     flex: 1
//   }, 
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center', 
//     backgroundColor: 'rgb(19, 21, 22)',
//     padding: wp(2.4),
//   }, 
//   title:{
//     color: 'white',
//     fontSize: hp(3.2),
//     fontWeight: theme.fonts.bold
//   }, 
//   listStyle: {
//     paddingHorizontal: wp(2),
//     paddingBottom: hp(4)
//   }, 
//   icons: {
//     flexDirection: 'row', 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     gap: 18
//   },
//   noPosts: {
//     fontSize: hp(2),
//     textAlign: 'center', 
//     color: theme.colors.primary
//   },
//   pill:{
//     position: 'absolute', 
//     right: -10, 
//     top: -4, 
//     height: hp(2.2), 
//     width: hp(2.2), 
//     borderRadius: 20, 
//     backgroundColor: theme.colors.roseLight
//   }, 
//   pillText: {
//     color: 'white',
//     fontSize: hp(1.8), 
//     fontWeight: theme.fonts.bold
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: hp(78)
//   },
//   libraryButton: {
//     backgroundColor: "#990000", 
//     paddingVertical: hp(0.3),
//     paddingHorizontal: wp(7.8),
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center'
//   },
//   buttonTextTop: {
//     color: 'white',
//     fontSize: hp(1.7),
//     fontWeight: theme.fonts.bold,
//     lineHeight: hp(2.4)
//   },
//   buttonTextBottom: {
//     color: 'rgba(255, 255, 255, 0.9)', 
//     fontSize: hp(1.6),
//     fontWeight: '500',
//     marginTop: -hp(0.5)
//   },
//   offlineBar: {
//     padding: hp(1),
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: theme.colors.text 
//   },
//   offlineText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     fontSize: hp(1.4),
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12
//   },
//   filterButton: {
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(1),
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: theme.colors.primary,
//     backgroundColor: 'transparent'
//   },
//   filterButtonActive: {
//     backgroundColor: theme.colors.primary
//   },
//   filterButtonText: {
//     color: theme.colors.primary,
//     fontSize: hp(1.8),
//     fontWeight: '600'
//   },
//   filterButtonTextActive: {
//     color: 'white'
//   },
//   postContainer: {
//     position: 'relative',
//     marginBottom: hp(1)
//   }
// });