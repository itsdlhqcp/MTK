import { Text, View, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
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

const Feeds = () => {
    const { user, navigationGuard } = useAuth();
    const router = useRouter();
    const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
    const [visibleItems, setVisibleItems] = useState([]);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        setVisibleItems(viewableItems.map(item => item.item.id));
      }).current;

    // Protect route on mount and user state change
    useFocusEffect(
        React.useCallback(() => {
            if (!user) {
                router.replace('/welcome');
            }
        }, [user])
    );
    
    // State management
    const [posts, setPosts] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [notificatuionCount, setNotificationCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const ITEMS_PER_PAGE = 4;

    // console.log('posts', posts);

    // Handle real-time post updates (same as Home component)
    const handlePostEvent = async (payload) => {
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
        if(payload.eventType === 'INSERT' && payload.new.id){
            setNotificationCount(prev=>prev+1);
        }
    }

    // Set up Supabase real-time subscription
    useEffect(() => {
        const postChannel = supabase
            .channel('twists')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'twists' }, 
                handlePostEvent
            )
            .subscribe();

        let notificationChannel = supabase
            .channel('notifications')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` }, 
                handleNewNotification
            )
            .subscribe();

        // Initial posts fetch
        getPosts();
        getTrendingPosts();

        return () => {
            supabase.removeChannel(postChannel);
            supabase.removeChannel(notificationChannel);
        }
    }, [])

    // Fetch trending posts (for swipeable section)
    // const getTrendingPosts = async () => {
    //     try {
    //         setLoading(true);
    //         // You might need to create a new service function for trending posts
    //         // This is a placeholder assuming you'll implement that function
    //         const res = await fetchPosts(3, 'trending'); // Fetch top 3 trending posts
            
    //         if (res.success) {
    //             setTrendingPosts(res.data);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching trending posts:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    // Replace the getTrendingPosts function with this:
const getTrendingPosts = async () => {
    try {
        setLoading(true);
        // Use the first 4 posts from the main posts array
        const res = await fetchPosts(4);
        
        if (res.success) {
            setTrendingPosts(res.data);
        }
    } catch (error) {
        console.error('Error fetching trending posts:', error);
    } finally {
        setLoading(false);
    }
}

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

    // Render trending posts as horizontal ScrollView
    // const renderTrendingPosts = () => {
    //     if (trendingPosts.length === 0 && loading) {
    //         return <MLoading />;
    //     }

    //     // below component holds the trending cards
    //     return (
    //         <View style={styles.trendingSection}>
    //             <Text style={styles.sectionTitle}>Trending Twists</Text>
    //             <GestureHandlerRootView>
    //                 <ScrollView 
    //                     horizontal 
    //                     showsHorizontalScrollIndicator={false}
    //                     contentContainerStyle={styles.trendingList}
    //                 >
    //                     {trendingPosts.map((post, index) => (
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
    //                         </Pressable>
    //                     ))}
    //                 </ScrollView>
    //             </GestureHandlerRootView>
    //             <View style={styles.indicator}>
    //                 {trendingPosts.map((_, index) => (
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


    // Update the renderTrendingPosts function to display more information about each post
const renderTrendingPosts = () => {
    if (trendingPosts.length === 0 && loading) {
        return <MLoading />;
    }

    // If no posts are loading and no trending posts exist, just return null
    if (trendingPosts.length === 0 && !loading) {
        return null;
    }

    // Show the first 4 posts in the trending section
    const displayPosts = trendingPosts.slice(0, 4);

    return (
        <View style={styles.trendingSection}>
            <Text style={styles.sectionTitle}>Trending Plots</Text>
            <GestureHandlerRootView>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingList}
                >
                    {displayPosts.map((post, index) => (
                        <Pressable 
                            key={post.id.toString()}
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
                    ))}
                </ScrollView>
            </GestureHandlerRootView>
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

    // Filter posts based on search query
    const filteredPosts = searchQuery 
        ? posts.filter(post => 
            post.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : posts;

    return (
        <ScreenWrapper bg={"#121212"}>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* Header - Fixed at top */}
                <View style={styles.header}>
                    <View style={styles.welcomeContainer}>
                        {/* <Text style={styles.welcomeText}>Welcome Back</Text> */}
                        {/* <Text style={styles.username}>{user?.userName || "PloTwist"}</Text> */}
                        <Text style={styles.username}>{ "PlotTwist"}</Text>
                    </View>

                    <View style={styles.icons}>
                        <Pressable onPress={() => router.push('addTwist')}>
                                <Icon name="plus" size={hp(3.5)} color="white" />
                            </Pressable>
                        <Pressable onPress={() => router.push('/messenger')}>
                                <Icon name="dm" size={hp(3.5)} color="white" />
                            </Pressable>
                        
                        {/* <Pressable onPress={() => router.push('profile')}>
                            <Avatar 
                                uri={user?.image}
                                size={hp(4)}
                                rounded={theme.radius.xs}
                                style={{borderWidth: 1.3, borderColor: '#FFD700'}}
                            />
                        </Pressable> */}
                    </View>
                   
                </View>
                
                {/* Main Content */}
                <FlatList
                    data={filteredPosts}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listStyle}
                    keyExtractor={item => item.id.toString()}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    ListHeaderComponent={() => (
                        <>
                            {/* Search Bar - Now part of scrollable content */}
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for a video topic"
                                    placeholderTextColor="#888"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                <Pressable style={styles.searchButton}>
                                    <Icon name="search" size={hp(2.5)} color="white" />
                                </Pressable>
                            </View>
                            
                            {/* Trending posts section */}
                            {/* {renderTrendingPosts()} */}
                        </>
                    )}
                    renderItem={({ item }) => (
                        <TwistCard
                            item={item}
                            currentUser={user}
                            router={router}
                            isVisible={visibleItems.includes(item.id)}
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
        </GestureHandlerRootView>
    </ScreenWrapper>
    );
}

export default Feeds

const additionalStyles = {
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
    // Update the trendingItem style to ensure proper layout
    trendingItem: {
        marginRight: wp(3),
        position: 'relative',
        borderRadius: theme.radius.xs,
        overflow: 'hidden',
    },
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: '#121212',
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
        // marginBottom: hp(44)
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
        gap: 18
      },
})