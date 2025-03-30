// both pure and memo combined technque

// import { Text, Alert, View, StyleSheet, Pressable, FlatList, Image, TouchableOpacity } from 'react-native'
// import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import { useAuth } from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { supabase } from '../../lib/supabase'
// import { wp, hp } from '@/helpers/common'
// import PostCard from '../../components/PostCard'
// import Icon from '@/assets/icons'
// import { fetchPosts } from '../../services/postService'
// import { getUserData } from '../../services/userServices'
// import { ActivityIndicator } from 'react-native'
// import { useFocusEffect } from '@react-navigation/native';

// // Pure React Native optimization: Create a lightweight avatar component
// const OptimizedAvatar = memo(({ uri, size }) => {
//   if (!uri) {
//     return (
//       <View 
//         style={[
//           styles.avatarPlaceholder, 
//           { width: size, height: size, borderRadius: size / 2 }
//         ]} 
//       />
//     );
//   }
  
//   return (
//     <Image
//       source={{ uri }}
//       style={[
//         styles.avatar, 
//         { width: size, height: size, borderRadius: size / 2 }
//       ]}
//     //   defaultSource={require('@/assets/default-avatar.png')}
//     />
//   );
// });

// // Pure React Native optimization: Create a simplified loading component
// const SimpleLoader = memo(() => (
//   <View style={styles.loaderContainer}>
//     <ActivityIndicator size="small" color={theme.colors.primary} />
//   </View>
// ));

// // Pure React Native optimization: Optimized post card using only core components
// class PurePostCard extends React.PureComponent {
//   shouldComponentUpdate(nextProps) {
//     // Custom update logic for maximum performance
//     return (
//       this.props.item.id !== nextProps.item.id ||
//       this.props.item.body !== nextProps.item.body ||
//       this.props.item.file !== nextProps.item.file ||
//       this.props.isVisible !== nextProps.isVisible ||
//       this.props.currentUser.id !== nextProps.currentUser.id
//     );
//   }
  
//   render() {
//     const { item, currentUser, router, isVisible } = this.props;
    
//     // Optimization: Return a lightweight placeholder when not visible
//     if (!isVisible) {
//       return <View style={styles.postCardPlaceholder} />;
//     }
    
//     const username = item.user?.username || 'User';
//     const avatarUrl = item.user?.avatarUrl;
//     const hasImage = item.file && item.file.length > 0;
//     const isLiked = item.postLikes?.some(like => like.userId === currentUser.id);
//     const likesCount = item.postLikes?.length || 0;
//     const commentsCount = item.comments?.[0]?.count || 0;
    
//     return (
//       <View style={styles.postCard}>
//         {/* Post Header */}
//         <View style={styles.postHeader}>
//           <TouchableOpacity 
//             onPress={() => router.push(`profile/${item.userId}`)}
//             style={styles.profileContainer}
//           >
//             <OptimizedAvatar uri={avatarUrl} size={hp(5)} />
//             <Text style={styles.username}>{username}</Text>
//           </TouchableOpacity>
          
//           {item.userId === currentUser.id && (
//             <TouchableOpacity onPress={() => router.push(`post/${item.id}`)}>
//               <Icon name="edit" size={hp(2.2)} color="white" />
//             </TouchableOpacity>
//           )}
//         </View>
        
//         {/* Post Content */}
//         {item.body && (
//           <Text style={styles.postBody}>{item.body}</Text>
//         )}
        
//         {/* Post Image - Only render if exists */}
//         {hasImage && (
//           <Image 
//             source={{ uri: item.file }}
//             style={styles.postImage}
//             resizeMode="cover"
//           />
//         )}
        
//         {/* Post Actions */}
//         <View style={styles.postActions}>
//           <TouchableOpacity style={styles.actionButton}>
//             <Icon 
//             //   name={isLiked ? "heart-filled" : "heart"} 
//               name="heart"
//               size={hp(2.5)} 
//               color={isLiked ? theme.colors.primary : "white"} 
//             />
//             <Text style={styles.actionText}>{likesCount}</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={styles.actionButton}
//             onPress={() => router.push(`comments/${item.id}`)}
//           >
//             <Icon name="comment" size={hp(2.5)} color="white" />
//             <Text style={styles.actionText}>{commentsCount}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }
// }

// // Pure React Native footer component
// class PureFooterComponent extends React.PureComponent {
//   render() {
//     const { loading, hasMore, postsLength } = this.props;
    
//     if (postsLength === 0) return null;

//     return (
//       <View style={styles.footerContainer}>
//         {loading && <SimpleLoader />}
//         {!hasMore && postsLength > 0 && (
//           <Text style={styles.noPosts}>No more feeds to load !!</Text>
//         )}
//       </View>
//     );
//   }
// }

// // Pure React Native empty component
// class PureEmptyComponent extends React.PureComponent {
//   render() {
//     const { loading } = this.props;
    
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={styles.noPosts}>
//           {loading ? <SimpleLoader /> : "No feeds found!!"}
//         </Text>
//       </View>
//     );
//   }
// }

// // Pure React Native header
// class PureHeader extends React.PureComponent {
//   shouldComponentUpdate(nextProps) {
//     return this.props.notificationCount !== nextProps.notificationCount;
//   }
  
//   render() {
//     const { title, notificationCount, onNotificationPress, onCreatePress, onReleasePress, onOttPress } = this.props;
    
//     return (
//       <View style={styles.header}>
//         <Text style={styles.title}>{title}</Text>
        
//         <View style={styles.icons}>
//           <TouchableOpacity onPress={onNotificationPress}>
//             <Icon name="heart" size={hp(3.2)} color='white' />
//             {
//               notificationCount > 0 && (
//                 <View style={styles.pill}>
//                   <Text style={styles.pillText}>{notificationCount}</Text>
//                 </View>
//               )
//             }
//           </TouchableOpacity>
//           <TouchableOpacity onPress={onCreatePress}>
//             <Icon name="plus" size={hp(3.2)} color="white" />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={onReleasePress}>
//             <Icon name="plus" size={hp(3.2)} color="green" />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={onOttPress}>
//             <Icon name="plus" size={hp(3.2)} color="red" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }
// }

// class Home extends React.PureComponent {
//   constructor(props) {
//     super(props);
    
//     this.state = {
//       posts: [],
//       loading: false,
//       hasMore: true,
//       page: 1,
//       notificationCount: 0,
//       visibleItems: []
//     };
    
//     this.ITEMS_PER_PAGE = 12;
    
//     // Create refs for all handlers to prevent recreations
//     this.viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
//     this.flatlistRef = React.createRef();
    
//     // Bind methods
//     this.handlePostEvent = this.handlePostEvent.bind(this);
//     this.handleNewNotification = this.handleNewNotification.bind(this);
//     this.getPosts = this.getPosts.bind(this);
//     this.renderItem = this.renderItem.bind(this);
//     this.handleEndReached = this.handleEndReached.bind(this);
//     this.keyExtractor = this.keyExtractor.bind(this);
//     this.handleNotificationPress = this.handleNotificationPress.bind(this);
//     this.handleCreatePress = this.handleCreatePress.bind(this);
//     this.handleReleasePress = this.handleReleasePress.bind(this);
//     this.handleOttPress = this.handleOttPress.bind(this);
//   }
  
//   // Lifecycle methods
//   componentDidMount() {
//     this.setupSubscriptions();
//     this.getPosts();
//   }
  
//   componentDidUpdate(prevProps) {
//     if (prevProps.user?.id !== this.props.user?.id && this.props.user?.id) {
//       this.setupSubscriptions();
//     }
    
//     if (!this.props.user) {
//       this.props.router.replace('/welcome');
//     }
//   }
  
//   componentWillUnmount() {
//     this.cleanupSubscriptions();
//   }
  
//   // Set up Supabase subscriptions
//   setupSubscriptions() {
//     if (!this.props.user?.id) return;
    
//     this.cleanupSubscriptions();
    
//     this.postChannel = supabase
//       .channel('posts')
//       .on('postgres_changes', 
//           { event: '*', schema: 'public', table: 'posts' }, 
//           this.handlePostEvent
//       )
//       .subscribe();

//     this.notificationChannel = supabase
//       .channel('notifications')
//       .on('postgres_changes', 
//           { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${this.props.user.id}` }, 
//           this.handleNewNotification
//       )
//       .subscribe();
//   }
  
//   cleanupSubscriptions() {
//     if (this.postChannel) {
//       supabase.removeChannel(this.postChannel);
//     }
    
//     if (this.notificationChannel) {
//       supabase.removeChannel(this.notificationChannel);
//     }
//   }
  
//   // Handle real-time events
//   async handlePostEvent(payload) {
//     // Handle insert new post on main stream
//     if (payload.eventType === 'INSERT' && payload?.new?.id) {
//       let newPost = {...payload.new};
//       newPost.postLikes = [];
//       newPost.comments = [{count: 0}];
//       let res = await getUserData(newPost.userId);
//       if (res.success) {
//         newPost.user = res.data;
//         this.setState(prevState => ({
//           posts: [newPost, ...prevState.posts]
//         }));
//       }
//     }
    
//     // Handle post deletion on real-time
//     if (payload.eventType === 'DELETE' && payload.old.id) {
//       this.setState(prevState => ({
//         posts: prevState.posts.filter(post => post.id !== payload.old.id)
//       }));
//     }
    
//     // Handle post update on real-time
//     if (payload.eventType === 'UPDATE' && payload.new.id) {
//       this.setState(prevState => ({
//         posts: prevState.posts.map(post => 
//           post.id === payload.new.id 
//             ? { ...post, body: payload.new.body, file: payload.new.file }
//             : post
//         )
//       }));
//     }
//   }
  
//   async handleNewNotification(payload) {
//     if (payload.eventType === 'INSERT' && payload.new.id) {
//       this.setState(prevState => ({
//         notificationCount: prevState.notificationCount + 1
//       }));
//     }
//   }
  
//   // Handle post loading
//   async getPosts() {
//     const { loading, hasMore, page, posts } = this.state;
    
//     if (loading || !hasMore) return;
    
//     try {
//       this.setState({ loading: true });
      
//       const res = await fetchPosts(page * this.ITEMS_PER_PAGE);
      
//       if (res.success) {
//         // Check if we've reached the end
//         if (res.data.length === posts.length) {
//           this.setState({ hasMore: false });
//         }
        
//         // Append new posts, avoiding duplicates
//         this.setState(prevState => {
//           const newPosts = res.data.filter(
//             newPost => !prevState.posts.some(existingPost => existingPost.id === newPost.id)
//           );
//           return {
//             posts: [...prevState.posts, ...newPosts],
//             page: prevState.page + 1
//           };
//         });
//       } else {
//         Alert.alert('Error', 'Failed to fetch posts');
//       }
//     } catch (error) {
//       console.error('Error fetching posts:', error);
//       Alert.alert('Error', 'Something went wrong while fetching posts');
//     } finally {
//       this.setState({ loading: false });
//     }
//   }
  
//   // FlatList handlers
//   renderItem({ item }) {
//     return (
//       <PurePostCard
//         item={item}
//         currentUser={this.props.user}
//         router={this.props.router}
//         isVisible={this.state.visibleItems.includes(item.id)}
//       />
//     );
//   }
  
//   keyExtractor(item) {
//     return item.id.toString();
//   }
  
//   handleEndReached() {
//     if (this.state.hasMore && !this.state.loading) {
//       this.getPosts();
//     }
//   }
  
//   onViewableItemsChanged = ({ viewableItems }) => {
//     this.setState({
//       visibleItems: viewableItems.map(item => item.item.id)
//     });
//   }
  
//   // Header button handlers
//   handleNotificationPress() {
//     this.setState({ notificationCount: 0 });
//     this.props.router.push('notifications');
//   }
  
//   handleCreatePress() {
//     this.props.router.push('createFeed');
//   }
  
//   handleReleasePress() {
//     this.props.router.push('newRelease');
//   }
  
//   handleOttPress() {
//     this.props.router.push('newOtt');
//   }
  
//   render() {
//     const { posts, loading, hasMore, notificationCount, visibleItems } = this.state;
    
//     return (
//       <ScreenWrapper bg={"#121212"}>   
//         <View style={styles.container}>
//           {/* Pure Header */}
//           <PureHeader 
//             title="PloTwist" 
//             notificationCount={notificationCount}
//             onNotificationPress={this.handleNotificationPress}
//             onCreatePress={this.handleCreatePress}
//             onReleasePress={this.handleReleasePress}
//             onOttPress={this.handleOttPress}
//           />

//           {/* Highly optimized FlatList */}
//           <FlatList
//             ref={this.flatlistRef}
//             data={posts}
//             extraData={visibleItems}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listStyle}
//             keyExtractor={this.keyExtractor}
//             renderItem={this.renderItem}
//             onViewableItemsChanged={this.onViewableItemsChanged}
//             viewabilityConfig={this.viewabilityConfig}
//             onEndReached={this.handleEndReached}
//             onEndReachedThreshold={0.5}
//             initialNumToRender={3}
//             maxToRenderPerBatch={5}
//             windowSize={5}
//             updateCellsBatchingPeriod={30}
//             removeClippedSubviews={true}
//             maintainVisibleContentPosition={{
//               minIndexForVisible: 0,
//               autoscrollToTopThreshold: 10,
//             }}
//             ListFooterComponent={
//               <PureFooterComponent 
//                 loading={loading} 
//                 hasMore={hasMore} 
//                 postsLength={posts.length} 
//               />
//             }
//             ListEmptyComponent={
//               <PureEmptyComponent loading={loading} />
//             }
//           />
//         </View>
//       </ScreenWrapper>
//     );
//   }
// }

// // Use functional wrapper to access hooks and provide them to the class component
// const HomeWrapper = () => {
//   const { user } = useAuth();
//   const router = useRouter();
  
//   return <Home user={user} router={router} />;
// };

// export default HomeWrapper;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingBottom: 5
//   }, 
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center', 
//     marginBottom: 10,
//     backgroundColor: '#121212',
//     padding: wp(3.2),
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
//   footerContainer: {
//     paddingVertical: 16,
//     alignItems: 'center'
//   },
//   loaderContainer: {
//     paddingVertical: 10,
//     alignItems: 'center'
//   },
//   // Post card styles
//   postCard: {
//     backgroundColor: '#1E1E1E',
//     borderRadius: 10,
//     padding: wp(3),
//     marginBottom: wp(3)
//   },
//   postCardPlaceholder: {
//     height: hp(15),
//     backgroundColor: '#1E1E1E',
//     borderRadius: 10,
//     marginBottom: wp(3)
//   },
//   postHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: wp(2)
//   },
//   profileContainer: {
//     flexDirection: 'row',
//     alignItems: 'center'
//   },
//   avatar: {
//     backgroundColor: '#333'
//   },
//   avatarPlaceholder: {
//     backgroundColor: '#333'
//   },
//   username: {
//     color: 'white',
//     marginLeft: wp(2),
//     fontWeight: '500'
//   },
//   postBody: {
//     color: 'white',
//     marginBottom: wp(2)
//   },
//   postImage: {
//     width: '100%',
//     height: hp(20),
//     borderRadius: 8,
//     marginBottom: wp(2)
//   },
//   postActions: {
//     flexDirection: 'row',
//     marginTop: wp(1)
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: wp(4)
//   },
//   actionText: {
//     color: 'white',
//     marginLeft: wp(1)
//   }
// })

// integrated memorizaation technique in below code 

import { Text, Alert, View, StyleSheet, Pressable, FlatList } from 'react-native'
import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import theme from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { wp, hp } from '@/helpers/common'
import Icon from '@/assets/icons'
import PostCard from '../../components/PostCard'
import Avatar from '../../components/Avatar'
import { fetchPosts } from '../../services/postService'
import { getUserData } from '../../services/userServices'
import MLoading from '../../components/MaterialLoader'
import FeedLoader from '../../components/FeedLoader'
import { useFocusEffect } from '@react-navigation/native';

// Convert PostCard to a memoized component for optimized rendering
const MemoizedPostCard = memo(({ item, currentUser, router, isVisible }) => {
  // Use useMemo for expensive calculations inside the component
  const postData = useMemo(() => {
    return {
      id: item.id,
      body: item.body,
      file: item.file,
      userId: item.userId,
      // Add other needed properties here
    };
  }, [item.id, item.body, item.file, item.userId]);
  
  return (
    <PostCard
      item={postData}
      currentUser={currentUser}
      router={router}
      isVisible={isVisible}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Return true if nothing important changed (to prevent re-render)
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.body === nextProps.item.body &&
    prevProps.item.file === nextProps.item.file &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.currentUser.id === nextProps.currentUser.id
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
        {loading ? <MLoading /> : "No feeds found!!"}
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
        <Pressable onPress={() => router.push('createFeed')}>
          <Icon name="plus" size={hp(3.2)} color="white" />
        </Pressable>
        <Pressable onPress={() => router.push('newRelease')}>
          <Icon name="plus" size={hp(3.2)} color="green" />
        </Pressable>
        <Pressable onPress={() => router.push('newOtt')}>
          <Icon name="plus" size={hp(3.2)} color="red" />
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
      viewAreaCoveragePercentThreshold: 50 
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
    
    // State management
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [notificationCount, setNotificationCount] = useState(0);
    const ITEMS_PER_PAGE = 12;

    // Handle real-time post updates - memoize handler functions
    const handlePostEvent = useCallback(async (payload) => {
        // handle insert new post on main stream
        if (payload.eventType === 'INSERT' && payload?.new?.id) {
            let newPost = {...payload.new};
            newPost.postLikes = [];
            newPost.comments = [{count: 0}];
            let res = await getUserData(newPost.userId);
            if (res.success) {
                newPost.user = res.data;
                setPosts(prevPosts => [newPost, ...prevPosts]);
            }
        }
        // Handle post deletion on real-time
        if(payload.eventType === 'DELETE' && payload.old.id){
            setPosts(prevPosts => 
                prevPosts.filter(post => post.id !== payload.old.id)
            );
        }
        // Handle post update on real-time
        if(payload.eventType === 'UPDATE' && payload.new.id){
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === payload.new.id 
                        ? { ...post, body: payload.new.body, file: payload.new.file }
                        : post
                )
            );
        }
    }, []);

    const handleNewNotification = useCallback(async (payload) => {
        if(payload.eventType === 'INSERT' && payload.new.id){
            setNotificationCount(prev => prev + 1);
        }
    }, []);

    // Set up Supabase real-time subscription
    useEffect(() => {
        if (!user?.id) return;
        
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
    }, [user?.id, handlePostEvent, handleNewNotification]);

    // Fetch posts with pagination
    const getPosts = useCallback(async () => {
        if (loading || !hasMore) return;
        
        try {
            setLoading(true);
            const res = await fetchPosts(page * ITEMS_PER_PAGE);
            
            if (res.success) {
                // Check if we've reached the end
                if (res.data.length === posts.length) {
                    setHasMore(false);
                }
                
                // Append new posts, avoiding duplicates
                setPosts(prevPosts => {
                    const newPosts = res.data.filter(
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
            setLoading(false);
        }
    }, [loading, hasMore, page, posts.length]);

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
      if (hasMore && !loading) {
        getPosts();
      }
    }, [hasMore, loading, getPosts]);
    
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

    return (
      <ScreenWrapper bg={"#121212"}>   
        <View style={styles.container}>
          {/* Memoized Header */}
          <Header 
            title="PloTwist" 
            notificationCount={notificationCount}
            setNotificationCount={setNotificationCount}
            router={router}
          />

          {/* Highly optimized FlatList */}
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
            onEndReachedThreshold={0.5}
            ListFooterComponent={memoizedFooter}
            ListEmptyComponent={memoizedEmptyComponent}
            {...listProps}
          />
        </View>
      </ScreenWrapper>
    );
};

export default memo(Home);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: "5px"
  }, 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 10,
    backgroundColor: '#121212',
    padding: wp(3.2),
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
  }
})



// import { Text, Alert, View, StyleSheet, Pressable, FlatList } from 'react-native'
// import React, { useEffect, useRef, useState } from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import { useAuth } from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { supabase } from '../../lib/supabase'
// import { wp, hp } from '@/helpers/common'
// import Icon from '@/assets/icons'
// import PostCard from '../../components/PostCard'
// import Avatar from '../../components/Avatar'
// import { fetchPosts } from '../../services/postService'
// import { getUserData } from '../../services/userServices'
// import MLoading from '../../components/MaterialLoader'
// import FeedLoader from '../../components/FeedLoader'
// import { useFocusEffect } from '@react-navigation/native';

// // Convert PostCard to a PureComponent for optimized rendering
// class PostCardPure extends React.PureComponent {
//   render() {
//     const { item, currentUser, router, isVisible } = this.props;
    
//     return (
//       <PostCard
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         isVisible={isVisible}
//       />
//     );
//   }
// }

// // Create a PureComponent for the Footer
// class FooterComponentPure extends React.PureComponent {
//   render() {
//     const { loading, hasMore, postsLength } = this.props;
    
//     // Only render if there are posts
//     if (postsLength === 0) return null;

//     return (
//       <View style={{marginVertical: 0}} paddingBottom={16}>
//         {loading && <FeedLoader />}
//         {!hasMore && postsLength > 0 && (
//           <Text style={styles.noPosts}>No more feeds to load !!</Text>
//         )}
//       </View>
//     );
//   }
// }

// // Create a PureComponent for the Empty List Component
// class EmptyListComponentPure extends React.PureComponent {
//   render() {
//     const { loading } = this.props;
    
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={styles.noPosts}>
//           {loading ? <MLoading /> : "No feeds found!!"}
//         </Text>
//       </View>
//     );
//   }
// }

// const Home = () => {
//     const {user, setAuth, navigationGuard} = useAuth();
//     const router = useRouter();
//     const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
//     const [visibleItems, setVisibleItems] = useState([]);
  
//     const onViewableItemsChanged = useRef(({ viewableItems }) => {
//       setVisibleItems(viewableItems.map(item => item.item.id));
//     }).current;

//     // Protect route on mount and user state change
//     useFocusEffect(
//         React.useCallback(() => {
//           if (!user) {
//             router.replace('/welcome');
//           }
//         }, [user])
//       );
    
//     // State management
//     const [posts, setPosts] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);
//     const [notificatuionCount, setNotificationCount] = useState(0);
//     const ITEMS_PER_PAGE = 12;

//     // Handle real-time post updates
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
//           // Handle post deletion on real-time
//             if(payload.eventType === 'DELETE' && payload.old.id){
//                 setPosts(prevPosts=>{
//                     let updatedPosts = prevPosts.filter(post => post.id != payload.old.id);
//                     return updatedPosts;
//                 })
//             }
//             // Handle post update on real-time
//             if(payload.eventType === 'UPDATE' && payload.new.id){
//                 setPosts(prevPosts=>{
//                     let updatedPosts = prevPosts.map(post=>{
//                         if(post.id == payload.new.id){
//                             post.body = payload.new.body; 
//                             post.file = payload.new.file;
//                         }
//                         return post;
//                     })
//                     return updatedPosts;
//                 })
//             }
//     }

//     const handleNewNotification = async (payload) => {
//        console.log('payload', payload);
//             if(payload.eventType === 'INSERT' && payload.new.id){
//                 setNotificationCount(prev=>prev+1);
//             }
//     }

//     // Set up Supabase real-time subscription
//     useEffect(() => {
//         const postChannel = supabase
//             .channel('posts')
//             .on('postgres_changes', 
//                 { event: '*', schema: 'public', table: 'posts' }, 
//                 handlePostEvent
//             )
//             .subscribe();

//             let notificationChannel = supabase
//             .channel('notifications')
//             .on('postgres_changes', 
//                 { event: 'INSERT', schema: 'public', table: 'notifications' , filter: `receiverId=eq.${user.id}`}, 
//                 handleNewNotification
//             )
//             .subscribe();

//         // Initial posts fetch
//         getPosts();

//         return () => {
//             supabase.removeChannel(postChannel);
//             supabase.removeChannel(notificationChannel);
//         }
//     }, [])

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

//     // Use memoized rendering functions to prevent unnecessary re-renders
//     const renderItem = React.useCallback(({ item }) => (
//       <PostCardPure
//         item={item}
//         currentUser={user}
//         router={router}
//         isVisible={visibleItems.includes(item.id)}
//       />
//     ), [user, router, visibleItems]);

//     const keyExtractor = React.useCallback((item) => item.id.toString(), []);
    
//     const handleEndReached = React.useCallback(() => {
//       if (hasMore && !loading) {
//         getPosts();
//       }
//     }, [hasMore, loading]);

//     return (
       
//         <ScreenWrapper bg={"#121212"}>   
//             <View style={styles.container}>
//                 {/* Header */}
//                 <View style={styles.header}>
//                     <Text style={styles.title}>PloTwist</Text>
                    
//                     <View style={styles.icons}>
//                         <Pressable onPress={() => {
//                             setNotificationCount(0);
//                             router.push('notifications')
//                         }}>
//                             {/* <Icon name="heart" size={hp(3.2)} color={theme.colors.text} /> */}
//                             <Icon name="heart" size={hp(3.2)} color='white' />
//                             {
//                                 notificatuionCount > 0 && (
//                                 <View style={styles.pill}>
//                                     <Text style={styles.pillText}>{notificatuionCount}</Text>
//                                  </View>
//                                 )
//                             }
//                         </Pressable>
//                         <Pressable onPress={() => router.push('createFeed')}>
//                             <Icon name="plus" size={hp(3.2)} color="white" />
//                         </Pressable>
//                         <Pressable onPress={() => router.push('newRelease')}>
//                             <Icon name="plus" size={hp(3.2)} color="green" />
//                         </Pressable>
//                         <Pressable onPress={() => router.push('newOtt')}>
//                             <Icon name="plus" size={hp(3.2)} color="red" />
//                         </Pressable>
//                     </View>
//                 </View>

//                 {/* Posts List */}
//                 <FlatList
//                   data={posts}
//                   showsVerticalScrollIndicator={false}
//                   contentContainerStyle={styles.listStyle}
//                   keyExtractor={keyExtractor}
//                   renderItem={renderItem}
//                   onViewableItemsChanged={onViewableItemsChanged}
//                   viewabilityConfig={viewabilityConfig}
//                   onEndReached={handleEndReached}
//                   onEndReachedThreshold={0.5}
//                   initialNumToRender={5}
//                   maxToRenderPerBatch={10}
//                   windowSize={10}
//                   updateCellsBatchingPeriod={50}
//                   removeClippedSubviews={true}
//                   ListFooterComponent={
//                     <FooterComponentPure 
//                       loading={loading} 
//                       hasMore={hasMore} 
//                       postsLength={posts.length} 
//                     />
//                   }
//                   ListEmptyComponent={
//                     <EmptyListComponentPure loading={loading} />
//                   }
//                 />
//             </View>
//         </ScreenWrapper>
      
//     );
// }

// export default Home

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingBottom: "5px"
//   }, 
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center', 
//     marginBottom: 10,
//     // marginHorizontal: wp(3.4),
//     backgroundColor: '#121212',
//     padding: wp(3.2),
//     // borderRadius: theme.radius.sm
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
//   }
// })






// import { Text,  Alert, View, StyleSheet, Pressable, FlatList } from 'react-native'
// import React, { useEffect, useRef, useState } from 'react'
// import { useRouter } from 'expo-router'
// import theme from '../../constants/theme'
// import {useAuth} from '../../contexts/AuthContext'
// import ScreenWrapper from '@/components/ScreenWrapper'
// import { supabase } from '../../lib/supabase'
// import { wp, hp } from '@/helpers/common'
// import Icon from '@/assets/icons'
// import Avatar from '../../components/Avatar'
// import { fetchPosts } from '../../services/postService'
// import PostCard from '../../components/PostCard'
// import { getUserData } from '../../services/userServices'
// import MLoading from '../../components/MaterialLoader'
// import FeedLoader from '../../components/FeedLoader'
// import { useFocusEffect } from '@react-navigation/native';

// const Home = () => {
//     const {user, setAuth, navigationGuard} = useAuth();
//     const router = useRouter();
//     const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
//     const [visibleItems, setVisibleItems] = useState([]);
  
//     const onViewableItemsChanged = useRef(({ viewableItems }) => {
//       setVisibleItems(viewableItems.map(item => item.item.id));
//     }).current;

//     // Protect route on mount and user state change
//     useFocusEffect(
//         React.useCallback(() => {
//           if (!user) {
//             router.replace('/welcome');
//           }
//         }, [user])
//       );
    
//     // State management
//     const [posts, setPosts] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);
//     const [notificatuionCount, setNotificationCount] = useState(0);
//     const ITEMS_PER_PAGE = 12;

//     // Handle real-time post updates
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
//           // Handle post deletion on real-time
//             if(payload.eventType === 'DELETE' && payload.old.id){
//                 setPosts(prevPosts=>{
//                     let updatedPosts = prevPosts.filter(post => post.id != payload.old.id);
//                     return updatedPosts;
//                 })
//             }
//             // Handle post update on real-time
//             if(payload.eventType === 'UPDATE' && payload.new.id){
//                 setPosts(prevPosts=>{
//                     let updatedPosts = prevPosts.map(post=>{
//                         if(post.id == payload.new.id){
//                             post.body = payload.new.body; 
//                             post.file = payload.new.file;
//                         }
//                         return post;
//                     })
//                     return updatedPosts;
//                 })
//             }
//     }

//     const handleNewNotification = async (payload) => {
//        console.log('payload', payload);
//             if(payload.eventType === 'INSERT' && payload.new.id){
//                 setNotificationCount(prev=>prev+1);
//             }
//     }

//     // Set up Supabase real-time subscription
//     useEffect(() => {
//         const postChannel = supabase
//             .channel('posts')
//             .on('postgres_changes', 
//                 { event: '*', schema: 'public', table: 'posts' }, 
//                 handlePostEvent
//             )
//             .subscribe();

//             let notificationChannel = supabase
//             .channel('notifications')
//             .on('postgres_changes', 
//                 { event: 'INSERT', schema: 'public', table: 'notifications' , filter: `receiverId=eq.${user.id}`}, 
//                 handleNewNotification
//             )
//             .subscribe();

//         // Initial posts fetch
//         getPosts();

//         return () => {
//             supabase.removeChannel(postChannel);
//             supabase.removeChannel(notificationChannel);
//         }
//     }, [])

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

//     // bg={"#121212"}

//     return (
       
//         <ScreenWrapper bg={"#121212"}>   
//             <View style={styles.container}>
//                 {/* Header */}
//                 <View style={styles.header}>
//                     <Text style={styles.title}>PloTwist</Text>
                    
//                     <View style={styles.icons}>
//                         <Pressable onPress={() => {
//                             setNotificationCount(0);
//                             router.push('notifications')
//                         }}>
//                             {/* <Icon name="heart" size={hp(3.2)} color={theme.colors.text} /> */}
//                             <Icon name="heart" size={hp(3.2)} color='white' />
//                             {
//                                 notificatuionCount > 0 && (
//                                 <View style={styles.pill}>
//                                     <Text style={styles.pillText}>{notificatuionCount}</Text>
//                                  </View>
//                                 )
//                             }
//                         </Pressable>
//                         <Pressable onPress={() => router.push('createFeed')}>
//                             <Icon name="plus" size={hp(3.2)} color="white" />
//                         </Pressable>
//                         <Pressable onPress={() => router.push('newRelease')}>
//                             <Icon name="plus" size={hp(3.2)} color="green" />
//                         </Pressable>
//                         <Pressable onPress={() => router.push('newOtt')}>
//                             <Icon name="plus" size={hp(3.2)} color="red" />
//                         </Pressable>
//                     </View>
//                 </View>

//                 {/* Posts List */}
//                 <FlatList
//                 data={posts}
//                 showsVerticalScrollIndicator={false}
//                 contentContainerStyle={styles.listStyle}
//                 keyExtractor={item => item.id.toString()}
//                 renderItem={({ item }) => (
//                     <PostCard
//                         item={item}
//                         currentUser={user}
//                         router={router}
//                         isVisible={visibleItems.includes(item.id)}
//                     />
//                 )}
//                 onViewableItemsChanged={onViewableItemsChanged}
//                 viewabilityConfig={viewabilityConfig}
//                 onEndReached={() => {
//                     if (hasMore && !loading) {
//                         getPosts();
//                     }
//                 }}
//                 onEndReachedThreshold={0.5}
//                 ListFooterComponent={FooterComponent}
//                 ListEmptyComponent={() => (
//                     <View style={styles.loadingContainer}>
//                         <Text style={styles.noPosts}>
//                             {loading ? <MLoading /> : "No feeds found!!"}
//                         </Text>
//                     </View>
//                 )}
//             />
//             </View>
//         </ScreenWrapper>
      
//     );
// }

// export default Home

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingBottom: "5px"
//   }, 
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center', 
//     marginBottom: 10,
//     // marginHorizontal: wp(3.4),
//     backgroundColor: '#121212',
//     padding: wp(3.2),
//     // borderRadius: theme.radius.sm
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
//     loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: hp(78)
//   }
// })