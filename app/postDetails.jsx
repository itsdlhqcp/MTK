import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { createComment, createReply, fetchCommentReplies, fetchPostDetails, removeComment, removePost } from '../services/postService'
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header';
import PostCard from '../components/PostCard'
import Icon from '../assets/icons'
import FeedLoader from '../components/FeedLoader'
import Input from '../components/Input'
import CommentsSection from '../components/postComponents/commentsSection' 
import { supabase } from '../lib/supabase'
import { createNotifications } from '../services/notificationService'
import ProfilePopup from '../components/profilePopup'

const PostDetails = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);
    const { postId, commentId } = useLocalSearchParams()
    const { user } = useAuth()
    const router = useRouter()
    const [startLoading, setStartLoading] = useState(true)
    const [post, setPost] = useState(null)
    const [error, setError] = useState(null)
    const inputRef = useRef(null);
    const commentRef = useRef('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getPostDetails()
    }, [])

    const openProfilePopup = (userData) => {
        setSelectedUser(userData);
        setIsProfilePopupVisible(true);
    };

    const handleNewComment = async (payload) => {
        if(payload.new){
            let newComment = {...payload.new}; 
            let res = await getUserData(newComment.userId);
            newComment.user = res.success? res.data: {};
            setPost(prevPost=>{
                return {
                    ...prevPost,
                    comments: [newComment, ...prevPost.comments]
                }
            })
        }
    }

    useEffect(() => {
        let commentChannel = supabase
            .channel('comments')
            .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}`}, handleNewComment)
            .subscribe();

        // New likes subscription
        let likesChannel = supabase
            .channel('likes')
            .on('postgres_changes', {event: '*', schema: 'public', table: 'postLikes', filter: `postId=eq.${postId}`}, handleLikeChange)
            .subscribe();

        return () => {
            supabase.removeChannel(commentChannel);
            supabase.removeChannel(likesChannel);
        }
    }, [])

    // function to handle post likes and updation
    const handleLikeChange = async (payload) => {
        // Handle INSERT event
        if (payload.eventType === 'INSERT') {
            const newLike = {...payload.new};
            setPost(prevPost => ({
                ...prevPost,
                postLikes: [...prevPost.postLikes, newLike]
            }));
        }
        // Handle DELETE event
        else if (payload.eventType === 'DELETE') {
            const removedLike = {...payload.old};
            setPost(prevPost => ({
                ...prevPost,
                postLikes: prevPost.postLikes.filter(like => 
                    !(like.userId === removedLike.userId && like.postId === removedLike.postId)
                )
            }));
        }
    };

    const getPostDetails = async () => {
        try {
            let res = await fetchPostDetails(postId)
            if (res.success) {
                setPost(res.data)
            } else {
                setError('Failed to load post')
            }
        } catch (err) {
            setError('Error loading post')
            console.error('Error fetching post:', err)
        } finally {
            setStartLoading(false)
        }
    }

    const onNewComment = async () => {
        if(!commentRef.current || !user?.id || !post?.id) return null;
        
        let data = {
            userId: user.id,
            postId: post.id,
            text: commentRef.current
        }
        
        setLoading(true);
        try {
            let res = await createComment(data);
            if(res.success){
                if(user.id !== post.userId){
                    // send notifications for each comment send
                    let notify = {
                        senderId: user.id,
                        receiverId: post.userId,
                        title: 'commented on your post', 
                        data: JSON.stringify({postId: post.id, commentId: res?.data?.id})
                    }
                    createNotifications(notify);
                }
                inputRef?.current?.clear();
                commentRef.current = "";
                // Optionally refresh the post details to show new comment
                await getPostDetails();
            } else {
                Alert.alert('Comment', res.msg || 'Something went wrong');
            }
        } catch (err) {
            Alert.alert('Comment', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    const onDeleteComment = async (comment) => {
        console.log('comment', comment);
        let res = await removeComment(comment?.id);
        if(res.success){
            setPost(prevPost => {
                let updatedPost = {...prevPost};
                updatedPost.comments = updatedPost.comments.filter(c => c.id !== comment.id);
                return updatedPost;
            })  
        } else {
            Alert.alert('Error', res.msg || 'Something went wrong');
        }
    }

    const onDeletePost = async (post) => {
        try {
            Alert.alert('Confirm', 'Are you sure you want to delete this Post?', [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        let res = await removePost(post.id);
                        if (res.success) {
                            router.back();
                        } else {
                            Alert.alert('Error', res.msg || 'Something went wrong while deleting the post');
                        }
                    }
                }
            ]);
        } catch (error) {
            console.error('Delete post error:', error);
            Alert.alert('Error', 'An unexpected error occurred while deleting the post.');
        }
    };

    const onEditPost = async (item) => {
        console.log('item edited', item);
        router.push({pathname: 'createFeed', params: {...item}})
    }

    const handleClose = () => {
        // Handle close logic here
    }

    const renderContent = () => {
        if (startLoading) {
            return (
                <View style={styles.center}>
                    <FeedLoader />
                </View>
            )
        }

        if (error) {
            return (
                <View style={styles.center}>
                    <Text style={styles.notFound}>{error}</Text>
                </View>
            )
        }

        if (!post) {
            return (
                <View style={styles.center}>
                    <Text style={styles.notFound}>Post not found</Text>
                </View>
            )
        }

        return (
            <>
            <Header
            title={"Spotlight Details"}
            showBackButton={true}
            style={styles.header}
        />
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.list}
            >
              
                <PostCard
                    item={{...post, comments: [{count: post?.comments?.length}]}}
                    currentUser={user}
                    router={router}
                    hasShadow={true}
                    showMoreIcon={true}
                    showDelete={onDeletePost}
                    onEdit={onEditPost}
                />

                {/* Using our new CommentSection component */}
                <CommentsSection 
                    comments={post?.comments || []}
                    user={user}
                    post={post}
                    onDeleteComment={onDeleteComment}
                    highlightedCommentId={commentId}
                    fetchCommentReplies={fetchCommentReplies}
                    createReply={createReply}
                    onNewComment={onNewComment}
                    commentRef={commentRef}
                    inputRef={inputRef}
                    loading={loading}
                    openProfilePopup={openProfilePopup}
                    router={router}
                />
            </ScrollView>
            </>
        )
    }

    return (
        <>
            <Stack.Screen 
                options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    gestureEnabled: true,
                    gestureDirection: 'vertical',
                    fullScreenGestureEnabled: true,
                    animationDuration: 200,
                    animationTypeForReplace: 'push',
                    customAnimationOnGesture: true,
                    gestureResponseDistance: {
                        vertical: 800
                    },
                    transitionSpec: {
                        open: {
                            animation: 'timing',
                            config: { duration: 200 },
                        },
                        close: {
                            animation: 'timing',
                            config: { duration: 200 },
                        },
                    },
                    cardStyleInterpolator: ({ current, layouts }) => ({
                        cardStyle: {
                            transform: [{
                                translateY: current.progress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [layouts.screen.height, 0],
                                    extrapolate: 'clamp'
                                }),
                            }],
                        },
                        overlayStyle: {
                            opacity: current.progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                                extrapolate: 'clamp'
                            }),
                        },
                    }),
                    detachPreviousScreen: false,
                    onClose: () => {
                        if (handleClose && typeof handleClose === 'function') {
                            handleClose();
                        }
                    }
                }}
            />

            <View style={styles.container}>
                {renderContent()}

                <ProfilePopup
                    user={selectedUser}
                    visible={isProfilePopupVisible}
                    onClose={() => setIsProfilePopupVisible(false)}
                    router={router}
                />
            </View>
        </>
    )
}

export default PostDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',  
    },
    list: {
        paddingHorizontal: Math.round(wp(4))
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notFound: {
        fontSize: Math.round(hp(2.5)),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium
    },
    headerTitle: {
        fontSize: Math.round(hp(2.2)),
        color: theme.colors.text,
        fontWeight: theme.fonts.semiBold
    },
    closeButton: {
        padding: Math.round(wp(2)),
        marginRight: Math.round(wp(2))
    },
    // header: {
    //     backgroundColor: 'green', 
    //   }
});

