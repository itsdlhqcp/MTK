import { Text, Alert, View, StyleSheet, Pressable, FlatList } from 'react-native'
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import theme from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { wp, hp } from '@/helpers/common'
import Icon from '@/assets/icons'
import { fetchPosts } from '../../services/postService'
import { getUserData } from '../../services/userServices'
import MLoading from '../../components/MaterialLoader'
import FeedLoader from '../../components/FeedLoader'
import { useFocusEffect } from '@react-navigation/native';
import SpotlightCard from '../../components/SpotlightCard';
import { NetworkUtils } from '../../utils/network';

// Convert PostCard to a memoized component for optimized rendering
const MemoizedPostCard = memo(({ item, currentUser, router, isVisible }) => {
  // Use useMemo for expensive calculations inside the component
  const postData = useMemo(() => {
    return {
      id: item.id,
      body: item.body,
      file: item.file,
      userId: item.userId,
      created_at: item.created_at,
      tags: item.tags,
      name: item.user.name,
      profile: item.user.image,
      comments: item?.comments?.[0]?.count
    };
  }, [item.id, item.body, item.file, item.userId, item.created_at, item.tags, item.user.name, item.user.image]);
  
  return (
    <SpotlightCard
      item={postData}
      currentUser={currentUser}
      router={router}
      isVisible={isVisible}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - expand to include more relevant props
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.body === nextProps.item.body &&
    prevProps.item.file === nextProps.item.file &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.currentUser.id === nextProps.currentUser.id &&
    JSON.stringify(prevProps.item.comments) === JSON.stringify(nextProps.item.comments)
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
const EmptyListComponent = memo(({ loading, isConnected }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.noPosts}>
        {loading ? <MLoading /> : !isConnected ? "No Network found!!" : "No posts available"}
      </Text>
    </View>
  );
});

// Memoized Header component
const Header = memo(({ title, notificationCount, setNotificationCount, router }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.icons}>
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
      </View>
    </View>
  );
});

const Home = () => {
    const {user, setAuth, navigationGuard} = useAuth();
    const router = useRouter();
    
    // Memoize configuration objects to prevent unnecessary recreations
    const viewabilityConfig = useMemo(() => ({ 
      viewAreaCoveragePercentThreshold: 50,
      minimumViewTime: 300,
    }), []);
    
    const [visibleItems, setVisibleItems] = useState([]);
  
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
      setVisibleItems(viewableItems.map(item => item.item.id));
    }).current;

    // Protect route on mount and user state change
    useFocusEffect(
        useCallback(() => {
          if (!user) {
            router.replace('/welcome');
          }
        }, [user, router])
    );
    
    // State management with useReducer for better state updates
    const [state, dispatch] = React.useReducer(
      (state, action) => {
        switch (action.type) {
          case 'SET_POSTS':
            return { ...state, posts: action.payload };
          case 'ADD_POSTS':
            // Filter duplicates when adding posts
            const newPosts = action.payload.filter(
              newPost => !state.posts.some(p => p.id === newPost.id)
            );
            return { ...state, posts: [...state.posts, ...newPosts] };
          case 'SET_LOADING':
            return { ...state, loading: action.payload };
          case 'SET_HAS_MORE':
            return { ...state, hasMore: action.payload };
          case 'SET_PAGE':
            return { ...state, page: action.payload };
          case 'SET_NOTIFICATION_COUNT':
            return { ...state, notificationCount: action.payload };
          case 'SET_CONNECTIVITY':
            return { ...state, isConnected: action.payload };
          case 'ADD_NEW_POST':
            // Add at the beginning and avoid duplicates
            if (state.posts.some(p => p.id === action.payload.id)) {
              return state;
            }
            return { ...state, posts: [action.payload, ...state.posts] };
          case 'DELETE_POST':
            return { 
              ...state, 
              posts: state.posts.filter(post => post.id !== action.payload) 
            };
          case 'UPDATE_POST':
            return {
              ...state,
              posts: state.posts.map(post => 
                post.id === action.payload.id ? 
                { ...post, ...action.payload } : post
              )
            };
          default:
            return state;
        }
      },
      {
        posts: [],
        loading: false,
        hasMore: true,
        page: 1,
        notificationCount: 0,
        isConnected: true,
        initialCheckDone: false,
      }
    );
    
    const { posts, loading, hasMore, page, notificationCount, isConnected } = state;
    const ITEMS_PER_PAGE = 12;

    // Check network status on mount with better error handling
    useEffect(() => {
      const checkNetworkStatus = async () => {
        try {
          const connected = await NetworkUtils.isConnected();
          dispatch({ type: 'SET_CONNECTIVITY', payload: connected });
        } catch (error) {
          console.error('Error checking network:', error);
          dispatch({ type: 'SET_CONNECTIVITY', payload: false });
        }
      };
      
      checkNetworkStatus();
      
      // Set up network listener
      const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
        dispatch({ type: 'SET_CONNECTIVITY', payload: connected });
      });
      
      return () => unsubscribe();
    }, []);

    // Handle real-time post updates with improved error handling
    const handlePostEvent = useCallback(async (payload) => {
        try {
          // handle insert new post on main stream
          if (payload.eventType === 'INSERT' && payload?.new?.id) {
              let newPost = {...payload.new};
              newPost.postLikes = [];
              newPost.comments = [{count: 0}];
              let res = await getUserData(newPost.userId);
              if (res.success) {
                  newPost.user = res.data;
                  dispatch({ type: 'ADD_NEW_POST', payload: newPost });
              }
          }
          // Handle post deletion on real-time
          if(payload.eventType === 'DELETE' && payload.old.id){
              dispatch({ type: 'DELETE_POST', payload: payload.old.id });
          }
          // Handle post update on real-time
          if(payload.eventType === 'UPDATE' && payload.new.id){
              dispatch({ 
                type: 'UPDATE_POST', 
                payload: { 
                  id: payload.new.id, 
                  body: payload.new.body, 
                  file: payload.new.file 
                }
              });
          }
        } catch (error) {
          console.error('Error handling post event:', error);
        }
    }, []);

    const handleNewNotification = useCallback(async (payload) => {
        if(payload.eventType === 'INSERT' && payload.new.id){
            dispatch({ 
              type: 'SET_NOTIFICATION_COUNT', 
              payload: notificationCount + 1 
            });
        }
    }, [notificationCount]);

    // Set up Supabase real-time subscription with better error handling
    useEffect(() => {
        if (!user?.id || !isConnected) return;
        
        try {
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
                  { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, 
                  handleNewNotification
              )
              .subscribe();

          // Initial posts fetch
          getPosts();

          return () => {
              supabase.removeChannel(postChannel);
              supabase.removeChannel(notificationChannel);
          };
        } catch (error) {
          console.error('Error setting up subscriptions:', error);
        }
    }, [user?.id, handlePostEvent, handleNewNotification, isConnected]);

    const isLoadingMore = useRef(false);

    // Improved getPosts function with better error handling and state management
    const getPosts = useCallback(async () => {
        // Use ref to prevent multiple simultaneous calls
        if (isLoadingMore.current || !hasMore || !isConnected) return;
        
        try {
            isLoadingMore.current = true; // Lock before state update
            dispatch({ type: 'SET_LOADING', payload: true });
            
            const res = await fetchPosts(page * ITEMS_PER_PAGE);
            
            if (res.success) {
                // Check if we've reached the end
                if (res.data.length === 0 || res.data.length < ITEMS_PER_PAGE) {
                    dispatch({ type: 'SET_HAS_MORE', payload: false });
                }
                
                // Add new posts
                dispatch({ type: 'ADD_POSTS', payload: res.data });
                dispatch({ type: 'SET_PAGE', payload: page + 1 });
            } else {
                console.error('Error response from fetchPosts:', res.error);
                Alert.alert('Error', 'Failed to fetch posts');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            Alert.alert('Error', 'Something went wrong while fetching posts');
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
            // Release the lock after a slight delay to prevent rapid successive calls
            setTimeout(() => {
                isLoadingMore.current = false;
            }, 300);
        }
    }, [hasMore, page, isConnected]);

    // Calculate estimated item size for getItemLayout
    const estimatedItemSize = useMemo(() => hp(50), []);
    
    // getItemLayout for better performance
    const getItemLayout = useCallback((data, index) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }), [estimatedItemSize]);

    // Memoize list optimization functions
    const renderItem = useCallback(({ item }) => (
      <MemoizedPostCard
        item={item}
        currentUser={user}
        router={router}
        isVisible={visibleItems.includes(item.id)}
      />
    ), [user, router, visibleItems]);

    const keyExtractor = useCallback((item) => item.id.toString(), []);
    
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
      <EmptyListComponent loading={loading} isConnected={isConnected} />
    ), [loading, isConnected]);
    
    // Memoize FlatList optimization props
    const listProps = useMemo(() => ({
      initialNumToRender: 3,
      maxToRenderPerBatch: 3,
      windowSize: 5,
      updateCellsBatchingPeriod: 50,
      removeClippedSubviews: true,
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      },
      getItemLayout,
    }), [getItemLayout]);

    // Decide which list component to use based on post count  FlashList is best ever for performance
    const ListComponent = useMemo(() => posts.length > 50 ? FlashList : FlatList, [posts.length]);

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
          <Header 
            title="Spotlight" 
            notificationCount={notificationCount}
            setNotificationCount={(count) => dispatch({ 
              type: 'SET_NOTIFICATION_COUNT', 
              payload: count 
            })}
            router={router}
          />

          {/* Highly optimized List */}
          <ListComponent
            data={posts}
            estimatedItemSize={estimatedItemSize}
            extraData={visibleItems} // Only re-render when visible items change
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={memoizedFooter}
            ListEmptyComponent={memoizedEmptyComponent}
            {...listProps}
          />
        </View>
      </ScreenWrapper>
    );
};

// import { Text, Alert, View, StyleSheet, Pressable, FlatList } from 'react-native'
// import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import { useAuth } from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { supabase } from '../../lib/supabase'
// import { wp, hp } from '@/helpers/common'
// import Icon from '@/assets/icons'
// import { fetchPosts } from '../../services/postService'
// import { getUserData } from '../../services/userServices'
// import MLoading from '../../components/MaterialLoader'
// import FeedLoader from '../../components/FeedLoader'
// import { useFocusEffect } from '@react-navigation/native';
// import SpotlightCard from '../../components/SpotlightCard';
// import { NetworkUtils } from '../../utils/network';

// // Convert PostCard to a memoized component for optimized rendering
// const MemoizedPostCard = memo(({ item, currentUser, router, isVisible }) => {
//   // Use useMemo for expensive calculations inside the component
//   const postData = useMemo(() => {
//     return {
//       id: item.id,
//       body: item.body,
//       file: item.file,
//       userId: item.userId,
//       created_at: item.created_at,
//       tags: item.tags,
//       name: item.user.name,
//       profile: item.user.image,
//       comments: item?.comments?.[0]?.count
//       // Add other needed properties here SpotlightCard
//     };
//   }, [item.id, item.body, item.file, item.userId, item.created_at, item.tags, item.user.name, item.user.image]);

//   // console.log("postData", item);
  
//   return (
//     <SpotlightCard
//       item={postData}
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
      
//       <View style={styles.icons}>
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
        
//       </View>
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
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);
//     const [notificationCount, setNotificationCount] = useState(0);
//     const [isConnected, setIsConnected] = useState(true);
//     const [initialCheckDone, setInitialCheckDone] = useState(false);
//     const ITEMS_PER_PAGE = 12;

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
//     const handlePostEvent = useCallback(async (payload) => {
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
//             setPosts(prevPosts => 
//                 prevPosts.filter(post => post.id !== payload.old.id)
//             );
//         }
//         // Handle post update on real-time
//         if(payload.eventType === 'UPDATE' && payload.new.id){
//             setPosts(prevPosts => 
//                 prevPosts.map(post => 
//                     post.id === payload.new.id 
//                         ? { ...post, body: payload.new.body, file: payload.new.file }
//                         : post
//                 )
//             );
//         }
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

// // Modify your getPosts function
// const getPosts = useCallback(async () => {
//     // Use ref to prevent multiple simultaneous calls
//     if (isLoadingMore.current || !hasMore || !isConnected) return;
    
//     try {
//         isLoadingMore.current = true; // Lock before state update
//         setLoading(true);
        
//         const res = await fetchPosts(page * ITEMS_PER_PAGE);
        
//         if (res.success) {
//             // Check if we've reached the end
//             if (res.data.length === posts.length) {
//                 setHasMore(false);
//             }
            
//             // Append new posts, avoiding duplicates
//             setPosts(prevPosts => {
//                 const newPosts = res.data.filter(
//                     newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
//                 );
//                 return [...prevPosts, ...newPosts];
//             });
            
//             setPage(prev => prev + 1);
//         } else {
//             Alert.alert('Error', 'Failed to fetch posts');
//         }
//     } catch (error) {
//         console.error('Error fetching posts:', error);
//         Alert.alert('Error', 'Something went wrong while fetching posts');
//     } finally {
//         setLoading(false);
//         // Release the lock after a slight delay to prevent rapid successive calls
//         setTimeout(() => {
//             isLoadingMore.current = false;
//         }, 300);
//     }
// }, [hasMore, page, posts.length, isConnected]);

//     // Memoize list optimization functions
//     const renderItem = useCallback(({ item }) => (
//       <MemoizedPostCard
//         item={item}
//         currentUser={user}
//         router={router}
//         isVisible={visibleItems.includes(item.id)}
//       />
//     ), [user, router, visibleItems]);

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

//           {/* Highly optimized FlatList */}
//           <FlatList
//             data={posts}
//           //  removeClippedSubviews={true}
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
//             {...listProps}
//           />
//         </View>
//       </ScreenWrapper>
//     );
// }; 

export default memo(Home);

const styles = StyleSheet.create({
  container: {
    flex: 1
  }, 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
   // marginBottom: 10,)rgb(12, 21, 36)
    backgroundColor: 'rgb(21, 23, 24)',
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
    }
})