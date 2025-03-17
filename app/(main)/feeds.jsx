import { Text,  Alert, View, StyleSheet, Pressable, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import theme from '../../constants/theme'
import {useAuth} from '../../contexts/AuthContext'
import ScreenWrapper from '@/components/ScreenWrapper'
import { supabase } from '../../lib/supabase'
import { wp, hp } from '@/helpers/common'
import Icon from '@/assets/icons'
import Avatar from '../../components/Avatar'
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import { getUserData } from '../../services/userServices'
import MLoading from '../../components/MaterialLoader'
import FeedLoader from '../../components/FeedLoader'
import { useFocusEffect } from '@react-navigation/native';

const Home = () => {
    const {user, setAuth, navigationGuard} = useAuth();
    const router = useRouter();

    // Protect route on mount and user state change
    useFocusEffect(
        React.useCallback(() => {
          if (!user) {
            router.replace('/welcome');
          }
        }, [user])
      );

        // Protect route on mount and user state change
    //     useFocusEffect(
    // useEffect(() => {
    //     navigationGuard();
    // }, [navigationGuard]))

    // // Protect route on screen focus
    // useEffect(() => {
    //     const unsubscribe = router.addListener('focus', () => {
    //         if (!user) {
    //             router.replace('/welcome');
    //         }
    //     });

    //     return unsubscribe;
    // }, [user]);
    
    // State management
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [notificatuionCount, setNotificationCount] = useState(0);
    const ITEMS_PER_PAGE = 4;

    // Handle real-time post updates
    const handlePostEvent = async (payload) => {
        // handle inser new post on main stram
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
                setPosts(prevPosts=>{
                    let updatedPosts = prevPosts.filter(post => post.id != payload.old.id);
                    return updatedPosts;
                })
            }
            // Handle post update on real-time
            if(payload.eventType === 'UPDATE' && payload.new.id){
                setPosts(prevPosts=>{
                    let updatedPosts = prevPosts.map(post=>{
                        if(post.id == payload.new.id){
                            post.body = payload.new.body; 
                            post.file = payload.new.file;
                        }
                        return post;
                    })
                    return updatedPosts;
                })
            }
    }

    const handleNewNotification = async (payload) => {
       console.log('payload', payload);
            if(payload.eventType === 'INSERT' && payload.new.id){
                setNotificationCount(prev=>prev+1);
            }
    }

    // Set up Supabase real-time subscription
    useEffect(() => {
        const postChannel = supabase
            .channel('posts')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'posts' }, 
                handlePostEvent
            )
            .subscribe();

            let notificationChannel = supabase
            .channel('notifications')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'notifications' , filter: `receiverId=eq.${user.id}`}, 
                handleNewNotification
            )
            .subscribe();

        // Initial posts fetch
        getPosts();

        return () => {
            supabase.removeChannel(postChannel);
            supabase.removeChannel(notificationChannel);
        }
    }, [])

    // Fetch posts with pagination
    const getPosts = async () => {
        if (loading || !hasMore) return;
        
        try {
            setLoading(true);
            const res = await fetchPosts(page * ITEMS_PER_PAGE);
            
            if (res.success) {
                // Check if we've reached the end
                if (res.data.length == posts.length) {
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
    }

    const FooterComponent = () => {
        // Only render if there are posts
        if (posts.length === 0) return null;
    
        return (
            <View style={{marginVertical: 0}} paddingBottom={16}>
                {loading && <FeedLoader />}
                {!hasMore && posts.length > 0 && (
                    <Text style={styles.noPosts}>No more feeds to load !!</Text>
                )}
            </View>
        );
    };

    return (
       
        <ScreenWrapper bg={"#E0E0E0"}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>PloTwist</Text>
                    {/* <View style={styles.icons}> */}
                    {/* <View style={{marginLeft: hp(1.5), marginVertical: hp(-0.5)}}>
                      <Icon name="plotwist" size={hp(7)}/>
                    </View> */}
                    
                    <View style={styles.icons}>
                        <Pressable onPress={() => {
                            setNotificationCount(0);
                            router.push('notifications')
                        }}>
                            {/* <Icon name="heart" size={hp(3.2)} color={theme.colors.text} /> */}
                            <Icon name="heart" size={hp(3.2)} color='white' />
                            {
                                notificatuionCount > 0 && (
                                <View style={styles.pill}>
                                    <Text style={styles.pillText}>{notificatuionCount}</Text>
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
                        {/* <Pressable onPress={() => router.push('profile')}>
                            <Avatar 
                                uri={user?.image}
                                size={hp(4)}
                                rounded={theme.radius.xs}
                                style={{borderWidth: 1.3, borderColor: 'white'}}
                            />
                        </Pressable> */}
                    </View>
                </View>

                {/* Posts List */}
                <FlatList
                data={posts}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listStyle}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <PostCard
                        item={item}
                        currentUser={user}
                        router={router}
                    />
                )}
                onEndReached={() => {
                    if (hasMore && !loading) {
                        getPosts();
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={FooterComponent}
                ListEmptyComponent={() => (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.noPosts}>
                            {loading ? <MLoading /> : "No feeds found!!"}
                        </Text>
                    </View>
                )}
            />
            </View>
        </ScreenWrapper>
      
    );
}

export default Home

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
    // marginHorizontal: wp(3.4),
    backgroundColor: '#121212',
    padding: wp(3.2),
    // borderRadius: theme.radius.sm
  }, 
  title:{
    color: 'white',
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold
  }, 
  listStyle: {
    paddingHorizontal: wp(2)
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