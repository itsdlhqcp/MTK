import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { createComment, fetchPostDetails, removeComment, removePost } from '../services/postService'
import { hp, wp } from '../helpers/common'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import Icon from '../assets/icons'
import theme from '../constants/theme'
import FeedLoader from '../components/FeedLoader'
import Input from '../components/Input'
import CommentItem from '../components/CommentItem'
import { supabase } from '../lib/supabase'


const PostDetails = () => {
    const { postId } = useLocalSearchParams()
    const { user } = useAuth()
    const router = useRouter()
    const [startLoading, setStartLoading] = useState(true)
    const [post, setPost] = useState(null)
    const [error, setError] = useState(null)
    const inputRef = useRef(null);
    const commentRef = useRef('');
    const [loading , setLoading] = useState(false);

    useEffect(() => {
        getPostDetails()
    }, [])


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

    useEffect(()=>{
        let commentChannel = supabase
        .channel('comments')
        .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}`}, handleNewComment )
        .subscribe();
        return () =>{
            supabase.removeChannel(commentChannel);
         }
       }, [])

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
            userId: user.id,  // Changed from currentUser to user
            postId: post.id,
            text: commentRef.current
        }
        
        setLoading(true);
        try {
            let res = await createComment(data);
            if(res.success){
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
            setPost(prevPost=>{
                let updatedPost = {...prevPost};
                updatedPost.comments = updatedPost.comments.filter(c=>c.id != comment.id);
                return updatedPost;
            })  
        }else{
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
        console.log('item edited' , item);
        router.push({pathname: 'createFeed', params: {...item}})

    }

    const handleClose = () => {
       
    }

    const renderContent = () => {
        if (startLoading) {
            return (
                <View style={styles.center}>
                    <FeedLoader />
                </View>
            )
        }

        if (!post) {
            return (
                <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
                    <Text style={styles.notFound}>Post not found</Text>
                </View>
            );
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
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.list}
            >
                <PostCard
                    item={{...post, comments: [{count: post?.comments?.length}]}}
                    currentUser={user}
                    router={router}
                    hasShadow={true}
                    showMoreIcon={false}
                    showDelete={onDeletePost}
                    onEdit={onEditPost}
                />

                {/* comment input details */}
                <View style={styles.inputContainer}>
                    <Input
                     inputRef={inputRef}
                     placeholder="Type comment..."
                     onChangeText={value=> commentRef.current = value}
                     placeholderTextColor={theme.colors.textLight}
                     containerStyle={{flex:1, height: hp(6.2), borderRadius: theme.radius.xl}}
                    />

                    {
                        loading?  (
                         <View style={styles.loading}>
                             <FeedLoader size="small" color={theme.colors.primaryDark} />
                         </View>
                        ):(
                       <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
                                <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
                       </TouchableOpacity>
                        )
                    }

                </View>

                {/* comment list */}
                <View style={{marginVertical: 15, gap: 17}}>
                    {
                        post?.comments?.map(comment=>
                            <CommentItem
                              key={comment?.id?.toString()}
                              item={comment}
                              onDelete={onDeleteComment}
                              canDelete={user.id == comment.userId || user.id == post.userId} 
                            />
                        )
                    }

                    {
                        post?.comments?.length==0 && (
                            <Text style={{ textAlign: 'center',paddingStart: wp(5) }}>
                            Be first to comment
                        </Text>
                        
                        )
                    }
                   </View>
            </ScrollView>
        )
    }

    return (
        <>
            <Stack.Screen 
                options={{
                    headerShown: true,
                    headerTitle: "Post Details",
                    headerTitleStyle: styles.headerTitle,
                    headerRight: () => (
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            
                        </Pressable>
                    ),
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    animationDuration: 200
                }}
            />
            <View style={styles.container}>
                {renderContent()}
            </View>
        </>
    )
}

export default PostDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: Math.round(wp(7))
    },
    list: {
        paddingHorizontal: Math.round(wp(4))
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
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
    loading: {
        height: Math.round(hp(5.8)),
        width: Math.round(hp(5.8)),
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: 1.3 }]
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        height: Math.round(hp(5.8)),
        width: Math.round(hp(5.8))
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
    noComments: {
        alignHorizontal: 'center',
        justifyContent: 'center',
        marginLeft: "22px"
        
    }
})

