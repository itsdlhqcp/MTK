// import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity, Alert } from 'react-native'
// import React, { useEffect, useRef, useState } from 'react'
// import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
// import { createComment, createReply, fetchCommentReplies, fetchPostDetails, removeComment, removePost } from '../services/postService'
// import { hp, wp } from '../helpers/common'
// import theme from '../constants/theme'
// import { useAuth } from '../contexts/AuthContext'
// import PostCard from '../components/PostCard'
// import Icon from '../assets/icons'
// import FeedLoader from '../components/FeedLoader'
// import Input from '../components/Input'
// import CommentItem from '../components/CommentItem'
// import { supabase } from '../lib/supabase'
// import { createNotifications } from '../services/notificationService'
// import ProfilePopup from '../components/profilePopup'

// const PostDetails = () => {
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);
//     const { postId, commentId } = useLocalSearchParams()
//     const { user } = useAuth()
//     const router = useRouter()
//     const [startLoading, setStartLoading] = useState(true)
//     const [post, setPost] = useState(null)
//     const [error, setError] = useState(null)
//     const inputRef = useRef(null);
//     const commentRef = useRef('');
//     const [loading , setLoading] = useState(false);
//     const [commentReplies, setCommentReplies] = useState({});
//    // console.log('post', post);

//     // new state for comment replt box 
//     const [openReplyBox, setOpenReplyBox] = useState(null);
//     const replyRef = useRef('');

//       // Function to toggle reply box for a specific comment
//       const toggleReplyBox = (commentId) => {
//         setOpenReplyBox(prev => prev === commentId ? null : commentId);
//     }

//     const fetchRepliesForComment = async (commentId) => {
//         try {
//           const res = await fetchCommentReplies(commentId);
//           if (res.success) {
//             setCommentReplies(prev => ({
//               ...prev,
//               [commentId]: res.data
//             }));
//           }
//         } catch (error) {
//           console.error('Error fetching replies', error);
//         }
//       };

//         // Function to submit a reply
//         // const onSubmitReply = async (parentCommentId) => {
//         //     if(!replyRef.current || !user?.id || !post?.id) return null;
//         //     // data to pass as like in supabase
//         //     let data = {
//         //         userId: user.id,
//         //         text: replyRef.current,
//         //         parentCommentId: parentCommentId
//         //     }
            
//         //     setLoading(true);
//         //     try {
//         //         let res = await createReply(data);
//         //         if(res.success){
//         //             // Close reply box
//         //             setOpenReplyBox(null);
                    
//         //             // Optionally refresh the post details to show new comment
//         //             await getPostDetails();
//         //         } else {
//         //             Alert.alert('Reply', res.msg || 'Something went wrong');
//         //         }
//         //     } catch (err) {
//         //         Alert.alert('Reply', 'Something went wrong');
//         //     } finally {
//         //         setLoading(false);
//         //         replyRef.current = ''; // Reset reply text
//         //     }
//         // }

//         const onSubmitReply = async (parentCommentId) => {
//             if(!replyRef.current || !user?.id || !post?.id) return null;
            
//             let data = {
//                 userId: user.id,
//                 text: replyRef.current,
//                 parentCommentId: parentCommentId
//             }
            
//             setLoading(true);
//             try {
//                 let res = await createReply(data);
//                 if(res.success){
//                     setOpenReplyBox(null);
//                     await getPostDetails();
//                 } else {
//                     Alert.alert('Reply', res.msg || 'Something went wrong');
//                 }
//             } catch (err) {
//                 Alert.alert('Reply', 'Something went wrong');
//             } finally {
//                 setLoading(false);
//                 replyRef.current = ''; // Reset reply text
//             }
//         }

//     /// end of new state for comment replt box !!!!!!

//     useEffect(() => {
//         getPostDetails()
//     }, [])

//     const openProfilePopup = (userData) => {
//         setSelectedUser(userData);
//         setIsProfilePopupVisible(true);
//       };


//    const handleNewComment = async (payload) => {
//       if(payload.new){
//         let newComment = {...payload.new}; 
//         let res = await getUserData(newComment.userId);
//         newComment.user = res.success? res.data: {};
//         setPost(prevPost=>{
//             return {
//                 ...prevPost,
//                 comments: [newComment, ...prevPost.comments]
//             }
//         })
//       }
//    }

//     useEffect(()=>{
//         let commentChannel = supabase
//         .channel('comments')
//         .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}`}, handleNewComment )
//         .subscribe();
//         return () =>{
//             supabase.removeChannel(commentChannel);
//          }
//        }, [])

//     const getPostDetails = async () => {
//         try {
//             let res = await fetchPostDetails(postId)
//             if (res.success) {
//                 setPost(res.data)
//             } else {
//                 setError('Failed to load post')
//             }
//         } catch (err) {
//             setError('Error loading post')
//             console.error('Error fetching post:', err)
//         } finally {
//             setStartLoading(false)
//         }
//     }

//     const onNewComment = async () => {
//         if(!commentRef.current || !user?.id || !post?.id) return null;
        
//         let data = {
//             userId: user.id,  // Changed from currentUser to user
//             postId: post.id,
//             text: commentRef.current
//         }
        
//         setLoading(true);
//         try {
//             let res = await createComment(data);
//             if(res.success){
//                 if(user.id!=post.userId){
//                     // send notifications for each comment send
//                     let notify = {
//                         senderId: user.id,
//                         receiverId: post.userId,
//                         title: 'commented on your post', 
//                         data: JSON.stringify({postId: post.id, commentId: res?.data?.id})
//                     }
//                     createNotifications(notify);
//                 }
//                 inputRef?.current?.clear();
//                 commentRef.current = "";
//                 // Optionally refresh the post details to show new comment
//                 await getPostDetails();
//             } else {
//                 Alert.alert('Comment', res.msg || 'Something went wrong');
//             }
//         } catch (err) {
//             Alert.alert('Comment', 'Something went wrong');
//         } finally {
//             setLoading(false);
//         }
//     }

//     const onDeleteComment = async (comment) => {
//         console.log('comment', comment);
//         let res = await removeComment(comment?.id);
//         if(res.success){
//             setPost(prevPost=>{
//                 let updatedPost = {...prevPost};
//                 updatedPost.comments = updatedPost.comments.filter(c=>c.id != comment.id);
//                 return updatedPost;
//             })  
//         }else{
//             Alert.alert('Error', res.msg || 'Something went wrong');
//         }
//     }

//     const onDeletePost = async (post) => {
//         try {
//             Alert.alert('Confirm', 'Are you sure you want to delete this Post?', [
//                 {
//                     text: 'Cancel',
//                     style: 'cancel'
//                 },
//                 {
//                     text: 'Delete',
//                     style: 'destructive',
//                     onPress: async () => {
//                         let res = await removePost(post.id);
//                         if (res.success) {
//                             router.back();
//                         } else {
//                             Alert.alert('Error', res.msg || 'Something went wrong while deleting the post');
//                         }
//                     }
//                 }
//             ]);
//         } catch (error) {
//             console.error('Delete post error:', error);
//             Alert.alert('Error', 'An unexpected error occurred while deleting the post.');
//         }
//     };
    

//     const onEditPost = async (item) => {
//         console.log('item edited' , item);
//         router.push({pathname: 'createFeed', params: {...item}})

//     }

//     const handleClose = () => {
       
//     }

//     const renderContent = () => {
//         if (startLoading) {
//             return (
//                 <View style={styles.center}>
//                     <FeedLoader />
//                 </View>
//             )
//         }

//         if (!post) {
//             return (
//                 <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
//                     <Text style={styles.notFound}>Post not found</Text>
//                 </View>
//             );
//         }
        

//         if (error) {
//             return (
//                 <View style={styles.center}>
//                     <Text style={styles.notFound}>{error}</Text>
//                 </View>
//             )
//         }

//         if (!post) {
//             return (
//                 <View style={styles.center}>
//                     <Text style={styles.notFound}>Post not found</Text>
//                 </View>
//             )
//         }

//         return (
//             <ScrollView 
//                 showsVerticalScrollIndicator={false} 
//                 contentContainerStyle={styles.list}
//             >
//                 <PostCard
//                     item={{...post, comments: [{count: post?.comments?.length}]}}
//                     currentUser={user}
//                     router={router}
//                     hasShadow={true}
//                     showMoreIcon={false}
//                     showDelete={onDeletePost}
//                     onEdit={onEditPost}
//                 />

//                 {/* comment input details */}
//                 <View style={styles.inputContainer}>
//                     <Input
//                      inputRef={inputRef}
//                      placeholder="Type comment..."
//                      onChangeText={value=> commentRef.current = value}
//                      placeholderTextColor={theme.colors.textLight}
//                      containerStyle={{flex:1, height: hp(6.2), borderRadius: theme.radius.xl}}
//                     />

//                     {
//                         loading?  (
//                          <View style={styles.loading}>
//                              <FeedLoader size="small" color={theme.colors.primaryDark} />
//                          </View>
//                         ):(
//                        <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
//                                 <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
//                        </TouchableOpacity>
//                         )
//                     }

//                 </View>

//                 {/* comment list */}
//                 {/* <View style={{marginVertical: 15, gap: 17}}>
//                     {
//                         post?.comments?.map(comment=>
//                             <CommentItem
//                               key={comment?.id?.toString()}
//                               item={comment}
//                               onDelete={onDeleteComment}
//                               highlight={commentId == comment.id}
//                               canDelete={user.id == comment.userId || user.id == post.userId} 
//                             />
//                         )
//                     }

//                     {
//                         post?.comments?.length==0 && (
//                             <Text style={{ textAlign: 'center',paddingStart: wp(5) }}>
//                             Be first to comment
//                         </Text>
                        
//                         )
//                     }
//                    </View> */}

//             <View style={{marginVertical: 15, gap: 17}}>
//             {post?.comments
//                 ?.filter(comment => !comment.parentCommentId)
//                 .map(comment => (
//                 <View key={comment?.id?.toString()}>
//                     <CommentItem
//                     item={comment}
//                     onDelete={onDeleteComment}
//                     highlight={commentId == comment.id}
//                     canDelete={user.id == comment.userId || user.id == post.userId} 
//                     onReplyPress={() => {
//                         toggleReplyBox(comment.id);
//                         if (!commentReplies[comment.id]) {
//                         fetchRepliesForComment(comment.id);
//                         }
//                     }}
//                     onShowProfile={openProfilePopup}
//                     />
                    
//                     {/* Render replies when reply box is open */}
//                     {openReplyBox === comment.id && commentReplies[comment.id]?.map(reply => (
//                     <View key={reply.id} style={styles.replyContainer}>
//                         <CommentItem
//                         item={reply}
//                         onDelete={onDeleteComment}
//                         canDelete={user.id == reply.userId || user.id == post.userId}
//                         />
//                     </View>
//                     ))}
                                            
//                     {/* Reply input box */}
//                     {openReplyBox === comment.id && (
//                 <View style={styles.replyInputContainer}>
//                     <Input
//                     placeholder={`reply to @${comment.user.name}...`}
//                     onChangeText={value => replyRef.current = value}
//                     placeholderTextColor={theme.colors.textLight}
//                     containerStyle={{
//                         flex:1, 
//                         height: hp(6.2), 
//                         borderRadius: theme.radius.xl
//                     }}
//                     />
//                     {
//                     loading ? (
//                         <View style={styles.loading}>
//                         <FeedLoader size="small" color={theme.colors.primaryDark} />
//                         </View>
//                     ) : (
//                         <TouchableOpacity 
//                         style={styles.sendIcon} 
//                         onPress={() => onSubmitReply(comment.id)}
//                         >
//                         <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
//                         </TouchableOpacity>
//                     )
//                     }
//                 </View>
// )}
//                 </View>
//                 ))
//             }
//             {
//                 post?.comments?.length==0 && (
//                 <Text style={{ textAlign: 'center',paddingStart: wp(5) }}>
//                     Be first to comment
//                 </Text>
//                 )
//             }
//             </View>
//             </ScrollView>
//         )
//     }

//     return (
//         <>
//             <Stack.Screen 
//                 options={{
//                     headerShown: true,
//                     headerTitle: "Post Details",
//                     headerTitleStyle: styles.headerTitle,
//                     headerRight: () => (
//                         <Pressable onPress={handleClose} style={styles.closeButton}>
                            
//                         </Pressable>
//                     ),
//                     presentation: 'modal',
//                     animation: 'slide_from_bottom',
//                     animationDuration: 200
//                 }}
//             />
//             <View style={styles.container}>
//                 {renderContent()}

//                 <ProfilePopup
//                     user={selectedUser}
//                     visible={isProfilePopupVisible}
//                     onClose={() => setIsProfilePopupVisible(false)}
//                     router={router}
//                 />
//             </View>
//         </>
//     )
// }

// export default PostDetails

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: 'white',
//         paddingVertical: Math.round(wp(7))
//     },
//     list: {
//         paddingHorizontal: Math.round(wp(4))
//     },
//     inputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10
//     },
//     center: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     notFound: {
//         fontSize: Math.round(hp(2.5)),
//         color: theme.colors.text,
//         fontWeight: theme.fonts.medium
//     },
//     loading: {
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8)),
//         justifyContent: 'center',
//         alignItems: 'center',
//         transform: [{ scale: 1.3 }]
//     },
//     sendIcon: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 0.8,
//         borderColor: theme.colors.primary,
//         borderRadius: theme.radius.lg,
//         borderCurve: 'continuous',
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8))
//     },
//     headerTitle: {
//         fontSize: Math.round(hp(2.2)),
//         color: theme.colors.text,
//         fontWeight: theme.fonts.semiBold
//     },
//     closeButton: {
//         padding: Math.round(wp(2)),
//         marginRight: Math.round(wp(2))
//     },
//     noComments: {
//         alignHorizontal: 'center',
//         justifyContent: 'center',
//         marginLeft: "22px"
        
//     },
//     replyInputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//         marginTop: 10,
//         marginHorizontal: 10,
//         marginLeft: 50 // Indent reply input
//     },
//     replyContainer: {
//         marginLeft: 50, // Indent replies
//         marginTop: 5
//     }
// })









// import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity, Alert } from 'react-native'
// import React, { useEffect, useRef, useState } from 'react'
// import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
// import { createComment, createReply, fetchCommentReplies, fetchPostDetails, removeComment, removePost } from '../services/postService'
// import { hp, wp } from '../helpers/common'
// import theme from '../constants/theme'
// import { useAuth } from '../contexts/AuthContext'
// import PostCard from '../components/PostCard'
// import Icon from '../assets/icons'
// import FeedLoader from '../components/FeedLoader'
// import Input from '../components/Input'
// import CommentItem from '../components/CommentItem'
// import { supabase } from '../lib/supabase'
// import { createNotifications } from '../services/notificationService'
// import ProfilePopup from '../components/profilePopup'

// const PostDetails = () => {
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);
//     const { postId, commentId } = useLocalSearchParams()
//     const { user } = useAuth()
//     const router = useRouter()
//     const [startLoading, setStartLoading] = useState(true)
//     const [post, setPost] = useState(null)
//     const [error, setError] = useState(null)
//     const inputRef = useRef(null);
//     const commentRef = useRef('');
//     const [loading , setLoading] = useState(false);
//     const [commentReplies, setCommentReplies] = useState({});
//    // console.log('post', post);

//     // new state for comment replt box 
//     const [openReplyBox, setOpenReplyBox] = useState(null);
//     const replyRef = useRef('');

//       // Function to toggle reply box for a specific comment
//       const toggleReplyBox = (commentId) => {
//         setOpenReplyBox(prev => prev === commentId ? null : commentId);
//     }

//     const fetchRepliesForComment = async (commentId) => {
//         try {
//           const res = await fetchCommentReplies(commentId);
//           if (res.success) {
//             setCommentReplies(prev => ({
//               ...prev,
//               [commentId]: res.data
//             }));
//           }
//         } catch (error) {
//           console.error('Error fetching replies', error);
//         }
//       };

//         // Function to submit a reply

//         const onSubmitReply = async (parentCommentId) => {
//             if(!replyRef.current || !user?.id || !post?.id) return null;
            
//             let data = {
//                 userId: user.id,
//                 text: replyRef.current,
//                 parentCommentId: parentCommentId
//             }
            
//             setLoading(true);
//             try {
//                 let res = await createReply(data);
//                 if(res.success){
//                     setOpenReplyBox(null);
//                     await getPostDetails();
//                 } else {
//                     Alert.alert('Reply', res.msg || 'Something went wrong');
//                 }
//             } catch (err) {
//                 Alert.alert('Reply', 'Something went wrong');
//             } finally {
//                 setLoading(false);
//                 replyRef.current = ''; // Reset reply text
//             }
//         }

//     /// end of new state for comment replt box !!!!!!

//     useEffect(() => {
//         getPostDetails()
//     }, [])

//     const openProfilePopup = (userData) => {
//         setSelectedUser(userData);
//         setIsProfilePopupVisible(true);
//       };


//    const handleNewComment = async (payload) => {
//       if(payload.new){
//         let newComment = {...payload.new}; 
//         let res = await getUserData(newComment.userId);
//         newComment.user = res.success? res.data: {};
//         setPost(prevPost=>{
//             return {
//                 ...prevPost,
//                 comments: [newComment, ...prevPost.comments]
//             }
//         })
//       }
//    }

//     useEffect(()=>{
//         let commentChannel = supabase
//         .channel('comments')
//         .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}`}, handleNewComment )
//         .subscribe();
//         return () =>{
//             supabase.removeChannel(commentChannel);
//          }
//        }, [])

//     const getPostDetails = async () => {
//         try {
//             let res = await fetchPostDetails(postId)
//             if (res.success) {
//                 setPost(res.data)
//             } else {
//                 setError('Failed to load post')
//             }
//         } catch (err) {
//             setError('Error loading post')
//             console.error('Error fetching post:', err)
//         } finally {
//             setStartLoading(false)
//         }
//     }

//     const onNewComment = async () => {
//         if(!commentRef.current || !user?.id || !post?.id) return null;
        
//         let data = {
//             userId: user.id,  // Changed from currentUser to user
//             postId: post.id,
//             text: commentRef.current
//         }
        
//         setLoading(true);
//         try {
//             let res = await createComment(data);
//             if(res.success){
//                 if(user.id!=post.userId){
//                     // send notifications for each comment send
//                     let notify = {
//                         senderId: user.id,
//                         receiverId: post.userId,
//                         title: 'commented on your post', 
//                         data: JSON.stringify({postId: post.id, commentId: res?.data?.id})
//                     }
//                     createNotifications(notify);
//                 }
//                 inputRef?.current?.clear();
//                 commentRef.current = "";
//                 // Optionally refresh the post details to show new comment
//                 await getPostDetails();
//             } else {
//                 Alert.alert('Comment', res.msg || 'Something went wrong');
//             }
//         } catch (err) {
//             Alert.alert('Comment', 'Something went wrong');
//         } finally {
//             setLoading(false);
//         }
//     }

//     const onDeleteComment = async (comment) => {
//         console.log('comment', comment);
//         let res = await removeComment(comment?.id);
//         if(res.success){
//             setPost(prevPost=>{
//                 let updatedPost = {...prevPost};
//                 updatedPost.comments = updatedPost.comments.filter(c=>c.id != comment.id);
//                 return updatedPost;
//             })  
//         }else{
//             Alert.alert('Error', res.msg || 'Something went wrong');
//         }
//     }

//     const onDeletePost = async (post) => {
//         try {
//             Alert.alert('Confirm', 'Are you sure you want to delete this Post?', [
//                 {
//                     text: 'Cancel',
//                     style: 'cancel'
//                 },
//                 {
//                     text: 'Delete',
//                     style: 'destructive',
//                     onPress: async () => {
//                         let res = await removePost(post.id);
//                         if (res.success) {
//                             router.back();
//                         } else {
//                             Alert.alert('Error', res.msg || 'Something went wrong while deleting the post');
//                         }
//                     }
//                 }
//             ]);
//         } catch (error) {
//             console.error('Delete post error:', error);
//             Alert.alert('Error', 'An unexpected error occurred while deleting the post.');
//         }
//     };
    

//     const onEditPost = async (item) => {
//         console.log('item edited' , item);
//         router.push({pathname: 'createFeed', params: {...item}})

//     }

//     const handleClose = () => {
       
//     }

//     const renderContent = () => {
//         if (startLoading) {
//             return (
//                 <View style={styles.center}>
//                     <FeedLoader />
//                 </View>
//             )
//         }

//         if (!post) {
//             return (
//                 <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
//                     <Text style={styles.notFound}>Post not found</Text>
//                 </View>
//             );
//         }
        

//         if (error) {
//             return (
//                 <View style={styles.center}>
//                     <Text style={styles.notFound}>{error}</Text>
//                 </View>
//             )
//         }

//         if (!post) {
//             return (
//                 <View style={styles.center}>
//                     <Text style={styles.notFound}>Post not found</Text>
//                 </View>
//             )
//         }

//         return (
//             <ScrollView 
//                 showsVerticalScrollIndicator={false} 
//                 contentContainerStyle={styles.list}
//             >
//                 <PostCard
//                     item={{...post, comments: [{count: post?.comments?.length}]}}
//                     currentUser={user}
//                     router={router}
//                     hasShadow={true}
//                     showMoreIcon={false}
//                     showDelete={onDeletePost}
//                     onEdit={onEditPost}
//                 />

//                 {/* comment input details */}
//                 <View style={styles.inputContainer}>
//                     <Input
//                      inputRef={inputRef}
//                      placeholder="Type comment..."
//                      onChangeText={value=> commentRef.current = value}
//                      placeholderTextColor={theme.colors.textLight}
//                      containerStyle={{flex:1, height: hp(6.2), borderRadius: theme.radius.xl}}
//                     />

//                     {
//                         loading?  (
//                          <View style={styles.loading}>
//                              <FeedLoader size="small" color={theme.colors.primaryDark} />
//                          </View>
//                         ):(
//                        <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
//                                 <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
//                        </TouchableOpacity>
//                         )
//                     }

//                 </View>

//                 {/* comment list */}

//             <View style={{marginVertical: 15, gap: 17}}>
//             {post?.comments
//                 ?.filter(comment => !comment.parentCommentId)
//                 .map(comment => (
//                 <View key={comment?.id?.toString()}>
//                     <CommentItem
//                     item={comment}
//                     onDelete={onDeleteComment}
//                     highlight={commentId == comment.id}
//                     canDelete={user.id == comment.userId || user.id == post.userId} 
//                     onReplyPress={() => {
//                         toggleReplyBox(comment.id);
//                         if (!commentReplies[comment.id]) {
//                         fetchRepliesForComment(comment.id);
//                         }
//                     }}
//                     onShowProfile={openProfilePopup}
//                     router={router}
//                     />
                    
//                     {/* Render replies when reply box is open */}
//                     {openReplyBox === comment.id && commentReplies[comment.id]?.map(reply => (
//                     <View key={reply.id} style={styles.replyContainer}>
//                         <CommentItem
//                         item={reply}
//                         onDelete={onDeleteComment}
//                         canDelete={user.id == reply.userId || user.id == post.userId}
//                         />
//                     </View>
//                     ))}
                                            
//                     {/* Reply input box */}
//                     {openReplyBox === comment.id && (
//                 <View style={styles.replyInputContainer}>
//                     <Input
//                     placeholder={`reply to @${comment.user.name}...`}
//                     onChangeText={value => replyRef.current = value}
//                     placeholderTextColor={theme.colors.textLight}
//                     containerStyle={{
//                         flex:1, 
//                         height: hp(5), 
//                         borderRadius: theme.radius.sm
//                     }}
//                     />
//                     {
//                     loading ? (
//                         <View style={styles.loading}>
//                         <FeedLoader size="small" color={theme.colors.primaryDark} />
//                         </View>
//                     ) : (
//                         <TouchableOpacity 
//                         style={styles.replySendIcon} 
//                         onPress={() => onSubmitReply(comment.id)}
//                         >
//                         <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
//                         </TouchableOpacity>
//                     )
//                     }
//                    </View>
//             )}
//                 </View>
//                 ))
//             }
//             {
//                 post?.comments?.length==0 && (
//                 <Text style={{ textAlign: 'center',paddingStart: wp(5) }}>
//                     Be first to comment
//                 </Text>
//                 )
//             }
//             </View>
//             </ScrollView>
//         )
//     }

//     return (
//         <>
//             <Stack.Screen 
//                 options={{
//                     headerShown: true,
//                     headerTitle: "Post Details",
//                     headerTitleStyle: styles.headerTitle,
//                     headerRight: () => (
//                         <Pressable onPress={handleClose} style={styles.closeButton}>
                            
//                         </Pressable>
//                     ),
//                     presentation: 'modal',
//                     animation: 'slide_from_bottom',
//                     animationDuration: 200
//                 }}
//             />
//             <View style={styles.container}>
//                 {renderContent()}

//                 <ProfilePopup
//                     user={selectedUser}
//                     visible={isProfilePopupVisible}
//                     onClose={() => setIsProfilePopupVisible(false)}
//                     router={router}
//                 />
//             </View>
//         </>
//     )
// }

// export default PostDetails

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: 'white',
//         paddingVertical: Math.round(wp(7))
//     },
//     list: {
//         paddingHorizontal: Math.round(wp(4))
//     },
//     inputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10
//     },
//     center: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     notFound: {
//         fontSize: Math.round(hp(2.5)),
//         color: theme.colors.text,
//         fontWeight: theme.fonts.medium
//     },
//     loading: {
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8)),
//         justifyContent: 'center',
//         alignItems: 'center',
//         transform: [{ scale: 1.3 }]
//     },
//     sendIcon: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 0.8,
//         borderColor: theme.colors.primary,
//         borderRadius: theme.radius.lg,
//         borderCurve: 'continuous',
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8))
//     },
//     replySendIcon: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 1,
//         borderColor: theme.colors.primaryDark,
//         borderRadius: theme.radius.sm,
//         borderCurve: 'continuous',
//         height: Math.round(hp(4.8)),
//         width: Math.round(hp(4.8))
//     },
//     headerTitle: {
//         fontSize: Math.round(hp(2.2)),
//         color: theme.colors.text,
//         fontWeight: theme.fonts.semiBold
//     },
//     closeButton: {
//         padding: Math.round(wp(2)),
//         marginRight: Math.round(wp(2))
//     },
//     noComments: {
//         alignHorizontal: 'center',
//         justifyContent: 'center',
//         marginLeft: "22px"
        
//     },
//     replyInputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//         marginTop: 10,
//         marginHorizontal: 10,
//         marginLeft: 50 // Indent reply input
//     },
//     replyContainer: {
//         marginLeft: 50, // Indent replies
//         marginTop: 5
//     }
// })


















import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { createComment, createReply, fetchCommentReplies, fetchPostDetails, removeComment, removePost } from '../services/postService'
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import Icon from '../assets/icons'
import FeedLoader from '../components/FeedLoader'
import Input from '../components/Input'
import CommentItem from '../components/CommentItem'
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
    const [loading , setLoading] = useState(false);
    const [commentReplies, setCommentReplies] = useState({});
   // console.log('post', post);

    // new state for comment replt box 
    const [openReplyBox, setOpenReplyBox] = useState(null);
    const replyRef = useRef('');

      // Function to toggle reply box for a specific comment
      const toggleReplyBox = (commentId) => {
        setOpenReplyBox(prev => prev === commentId ? null : commentId);
    }

    const fetchRepliesForComment = async (commentId) => {
        try {
          const res = await fetchCommentReplies(commentId);
          if (res.success) {
            setCommentReplies(prev => ({
              ...prev,
              [commentId]: res.data
            }));
          }
        } catch (error) {
          console.error('Error fetching replies', error);
        }
      };

        // Function to submit a reply

        const onSubmitReply = async (parentCommentId) => {
            if(!replyRef.current || !user?.id || !post?.id) return null;
            
            let data = {
                userId: user.id,
                text: replyRef.current,
                parentCommentId: parentCommentId
            }
            
            setLoading(true);
            try {
                let res = await createReply(data);
                if(res.success){
                    setOpenReplyBox(null);
                    await getPostDetails();
                } else {
                    Alert.alert('Reply', res.msg || 'Something went wrong');
                }
            } catch (err) {
                Alert.alert('Reply', 'Something went wrong');
            } finally {
                setLoading(false);
                replyRef.current = ''; // Reset reply text
            }
        }

    /// end of new state for comment replt box !!!!!!

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
                if(user.id!=post.userId){
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
            {post?.comments
                ?.filter(comment => !comment.parentCommentId)
                .map(comment => (
                <View key={comment?.id?.toString()}>
                    <CommentItem
                    item={comment}
                    onDelete={onDeleteComment}
                    highlight={commentId == comment.id}
                    canDelete={user.id == comment.userId || user.id == post.userId} 
                    onReplyPress={() => {
                        toggleReplyBox(comment.id);
                        if (!commentReplies[comment.id]) {
                        fetchRepliesForComment(comment.id);
                        }
                    }}
                    onShowProfile={openProfilePopup}
                    router={router}
                    />
                    
                    {/* Render replies when reply box is open */}
                    {openReplyBox === comment.id && commentReplies[comment.id]?.map(reply => (
                    <View key={reply.id} style={styles.replyContainer}>
                        <CommentItem
                        item={reply}
                        onDelete={onDeleteComment}
                        canDelete={user.id == reply.userId || user.id == post.userId}
                         onShowProfile={openProfilePopup}  // Add this line
            router={router} 
                        />
                    </View>
                    ))}
                                            
                    {/* Reply input box */}
                    {openReplyBox === comment.id && (
                <View style={styles.replyInputContainer}>
                    <Input
                    placeholder={`reply to @${comment.user.name}...`}
                    onChangeText={value => replyRef.current = value}
                    placeholderTextColor={theme.colors.textLight}
                    containerStyle={{
                        flex:1, 
                        height: hp(5), 
                        borderRadius: theme.radius.sm
                    }}
                    />
                    {
                    loading ? (
                        <View style={styles.loading}>
                        <FeedLoader size="small" color={theme.colors.primaryDark} />
                        </View>
                    ) : (
                        <TouchableOpacity 
                        style={styles.replySendIcon} 
                        onPress={() => onSubmitReply(comment.id)}
                        >
                        <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
                        </TouchableOpacity>
                    )
                    }
                   </View>
            )}
                </View>
                ))
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
    replySendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primaryDark,
        borderRadius: theme.radius.sm,
        borderCurve: 'continuous',
        height: Math.round(hp(4.8)),
        width: Math.round(hp(4.8))
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
        
    },
    replyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        marginHorizontal: 10,
        marginLeft: 50 // Indent reply input
    },
    replyContainer: {
        marginLeft: 50, // Indent replies
        marginTop: 5
    }
})





























// swapping logic is working and implemented in below code
// the thing which do not work is reply on swap aff cutts off and reply username not passed


// import { ScrollView, StyleSheet, Text, View, Pressable, TouchableOpacity, Alert } from 'react-native'
// import React, { useEffect, useRef, useState } from 'react'
// import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
// import { createComment, createReply, fetchCommentReplies, fetchPostDetails, removeComment, removePost } from '../services/postService'
// import { hp, wp } from '../helpers/common'
// import theme from '../constants/theme'
// import { useAuth } from '../contexts/AuthContext'
// import PostCard from '../components/PostCard'
// import Icon from '../assets/icons'
// import FeedLoader from '../components/FeedLoader'
// import Input from '../components/InputRef'
// import CommentItem from '../components/CommentItem'
// import { supabase } from '../lib/supabase'
// import { createNotifications } from '../services/notificationService'
// import ProfilePopup from '../components/profilePopup'
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

// const PostDetails = () => {
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);
//     const { postId, commentId } = useLocalSearchParams()
//     const { user } = useAuth()
//     const router = useRouter()
//     const [startLoading, setStartLoading] = useState(true)
//     const [post, setPost] = useState(null)
//     const [error, setError] = useState(null)
//     const inputRef = useRef(null);
//     const commentRef = useRef('');
//     const [loading , setLoading] = useState(false);
//     const [commentReplies, setCommentReplies] = useState({});
//     const [replyPlaceholder, setReplyPlaceholder] = useState('');
//     const replyInputRef = useRef(null);
//    // console.log('post', post);

//     // new state for comment replt box 
//     const [openReplyBox, setOpenReplyBox] = useState(null);
//     const replyRef = useRef('');

//       // Function to toggle reply box for a specific comment
//       const toggleReplyBox = (commentId) => {
//         setOpenReplyBox(prev => prev === commentId ? null : commentId);
//     }

//     // const handleSwipeReply = (comment, username) => {
//     //     // Open the reply box for the specific comment
//     //     setOpenReplyBox(comment.id);
        
//     //     // Set the reply placeholder with the username
//     //     setReplyPlaceholder(`@${username}`);
        
//     //     // Optional: Focus on the reply input
//     //      replyInputRef.current?.focus();
//     //   };

//     const handleSwipeReply = (comment, username) => {
//         setOpenReplyBox(comment.id);
//         setReplyPlaceholder(`@${username}`);
//         replyInputRef.current?.focus();
//     };

//     const fetchRepliesForComment = async (commentId) => {
//         try {
//           const res = await fetchCommentReplies(commentId);
//           if (res.success) {
//             setCommentReplies(prev => ({
//               ...prev,
//               [commentId]: res.data
//             }));
//           }
//         } catch (error) {
//           console.error('Error fetching replies', error);
//         }
//       };

//         // Function to submit a reply

//         const onSubmitReply = async (parentCommentId) => {
//             if(!replyRef.current || !user?.id || !post?.id) return null;
            
//             let data = {
//                 userId: user.id,
//                 text: replyRef.current,
//                 parentCommentId: parentCommentId
//             }
            
//             setLoading(true);
//             try {
//                 let res = await createReply(data);
//                 if(res.success){
//                     setOpenReplyBox(null);
//                     await getPostDetails();
//                 } else {
//                     Alert.alert('Reply', res.msg || 'Something went wrong');
//                 }
//             } catch (err) {
//                 Alert.alert('Reply', 'Something went wrong');
//             } finally {
//                 setLoading(false);
//                 replyRef.current = ''; // Reset reply text
//             }
//         }

//     /// end of new state for comment replt box !!!!!!

//     useEffect(() => {
//         getPostDetails()
//     }, [])

//     const openProfilePopup = (userData) => {
//         setSelectedUser(userData);
//         setIsProfilePopupVisible(true);
//       };


//    const handleNewComment = async (payload) => {
//       if(payload.new){
//         let newComment = {...payload.new}; 
//         let res = await getUserData(newComment.userId);
//         newComment.user = res.success? res.data: {};
//         setPost(prevPost=>{
//             return {
//                 ...prevPost,
//                 comments: [newComment, ...prevPost.comments]
//             }
//         })
//       }
//    }

//     useEffect(()=>{
//         let commentChannel = supabase
//         .channel('comments')
//         .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}`}, handleNewComment )
//         .subscribe();
//         return () =>{
//             supabase.removeChannel(commentChannel);
//          }
//        }, [])

//     const getPostDetails = async () => {
//         try {
//             let res = await fetchPostDetails(postId)
//             if (res.success) {
//                 setPost(res.data)
//             } else {
//                 setError('Failed to load post')
//             }
//         } catch (err) {
//             setError('Error loading post')
//             console.error('Error fetching post:', err)
//         } finally {
//             setStartLoading(false)
//         }
//     }

//     const onNewComment = async () => {
//         if(!commentRef.current || !user?.id || !post?.id) return null;
        
//         let data = {
//             userId: user.id,  // Changed from currentUser to user
//             postId: post.id,
//             text: commentRef.current
//         }
        
//         setLoading(true);
//         try {
//             let res = await createComment(data);
//             if(res.success){
//                 if(user.id!=post.userId){
//                     // send notifications for each comment send
//                     let notify = {
//                         senderId: user.id,
//                         receiverId: post.userId,
//                         title: 'commented on your post', 
//                         data: JSON.stringify({postId: post.id, commentId: res?.data?.id})
//                     }
//                     createNotifications(notify);
//                 }
//                 inputRef?.current?.clear();
//                 commentRef.current = "";
//                 // Optionally refresh the post details to show new comment
//                 await getPostDetails();
//             } else {
//                 Alert.alert('Comment', res.msg || 'Something went wrong');
//             }
//         } catch (err) {
//             Alert.alert('Comment', 'Something went wrong');
//         } finally {
//             setLoading(false);
//         }
//     }

//     const onDeleteComment = async (comment) => {
//         console.log('comment', comment);
//         let res = await removeComment(comment?.id);
//         if(res.success){
//             setPost(prevPost=>{
//                 let updatedPost = {...prevPost};
//                 updatedPost.comments = updatedPost.comments.filter(c=>c.id != comment.id);
//                 return updatedPost;
//             })  
//         }else{
//             Alert.alert('Error', res.msg || 'Something went wrong');
//         }
//     }

//     const onDeletePost = async (post) => {
//         try {
//             Alert.alert('Confirm', 'Are you sure you want to delete this Post?', [
//                 {
//                     text: 'Cancel',
//                     style: 'cancel'
//                 },
//                 {
//                     text: 'Delete',
//                     style: 'destructive',
//                     onPress: async () => {
//                         let res = await removePost(post.id);
//                         if (res.success) {
//                             router.back();
//                         } else {
//                             Alert.alert('Error', res.msg || 'Something went wrong while deleting the post');
//                         }
//                     }
//                 }
//             ]);
//         } catch (error) {
//             console.error('Delete post error:', error);
//             Alert.alert('Error', 'An unexpected error occurred while deleting the post.');
//         }
//     };
    

//     const onEditPost = async (item) => {
//         console.log('item edited' , item);
//         router.push({pathname: 'createFeed', params: {...item}})

//     }

//     const handleClose = () => {
       
//     }

//     const renderContent = () => {
//         if (startLoading) {
//             return (
//                 <View style={styles.center}>
//                     <FeedLoader />
//                 </View>
//             )
//         }

//         if (!post) {
//             return (
//                 <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
//                     <Text style={styles.notFound}>Post not found</Text>
//                 </View>
//             );
//         }
        

//         if (error) {
//             return (
//                 <View style={styles.center}>
//                     <Text style={styles.notFound}>{error}</Text>
//                 </View>
//             )
//         }

//         if (!post) {
//             return (
//                 <View style={styles.center}>
//                     <Text style={styles.notFound}>Post not found</Text>
//                 </View>
//             )
//         }

//         return (
//             <GestureHandlerRootView>
//             <ScrollView 
//                 showsVerticalScrollIndicator={false} 
//                 contentContainerStyle={styles.list}
//             >
//                 <PostCard
//                     item={{...post, comments: [{count: post?.comments?.length}]}}
//                     currentUser={user}
//                     router={router}
//                     hasShadow={true}
//                     showMoreIcon={false}
//                     showDelete={onDeletePost}
//                     onEdit={onEditPost}
//                 />

//                 {/* comment input details */}
//                 <View style={styles.inputContainer}>
//                     <Input
//                      inputRef={inputRef}
//                      placeholder="Type comment..."
//                      onChangeText={value=> commentRef.current = value}
//                      placeholderTextColor={theme.colors.textLight}
//                      containerStyle={{flex:1, height: hp(6.2), borderRadius: theme.radius.xl}}
//                     />

//                     {
//                         loading?  (
//                          <View style={styles.loading}>
//                              <FeedLoader size="small" color={theme.colors.primaryDark} />
//                          </View>
//                         ):(
//                        <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
//                                 <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
//                        </TouchableOpacity>
//                         )
//                     }

//                 </View>

//                 {/* comment list */}

//             <View style={{marginVertical: 15, gap: 17}}>
//             {post?.comments
//                 ?.filter(comment => !comment.parentCommentId)
//                 .map(comment => (
//                 <View key={comment?.id?.toString()}>
//                     <CommentItem
//                     item={comment}
//                     onDelete={onDeleteComment}
//                     highlight={commentId == comment.id}
//                     canDelete={user.id == comment.userId || user.id == post.userId} 
//                     onReplyPress={() => {
//                         toggleReplyBox(comment.id);
//                         if (!commentReplies[comment.id]) {
//                         fetchRepliesForComment(comment.id);
//                         }
//                     }}
//                     onShowProfile={openProfilePopup}
//                     router={router}
//                     onSwipeReply={(username) => handleSwipeReply(comment, username)}
//                     isReply={false}
//                     />

//                     {/* For replies */}
//                     {openReplyBox === comment.id && commentReplies[comment.id]?.map(reply => (
//                     <View key={reply.id} style={styles.replyContainer}>
//                         <CommentItem
//                         item={reply}
//                         // ... other props
//                         isReply={true}
//                         onSwipeReply={(username) => handleSwipeReply(comment, username)}
//                         />
//                     </View>
//                     ))}
                                            
//                     {/* Reply input box */}
//                     {openReplyBox === comment.id && (
//                 <View style={styles.replyInputContainer}>
//                     <Input
//                         ref={replyInputRef}
//                         placeholder={replyPlaceholder || `reply to @${comment.user.name}...`}
//                         onChangeText={value => replyRef.current = value}
//                         placeholderTextColor={theme.colors.textLight}
//                         containerStyle={{
//                             flex:1, 
//                             height: hp(5), 
//                             borderRadius: theme.radius.sm
//                         }}
//                     />
//                     {
//                     loading ? (
//                         <View style={styles.loading}>
//                         <FeedLoader size="small" color={theme.colors.primaryDark} />
//                         </View>
//                     ) : (
//                         <TouchableOpacity 
//                         style={styles.replySendIcon} 
//                         onPress={() => onSubmitReply(comment.id)}
//                         >
//                         <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
//                         </TouchableOpacity>
//                     )
//                     }
//                    </View>
//             )}
//                 </View>
//                 ))
//             }
//             {
//                 post?.comments?.length==0 && (
//                 <Text style={{ textAlign: 'center',paddingStart: wp(5) }}>
//                     Be first to comment
//                 </Text>
//                 )
//             }
//             </View>
//             </ScrollView>
//             </GestureHandlerRootView>
//         )
//     }

//     return (
//         <>
//             <Stack.Screen 
//                 options={{
//                     headerShown: true,
//                     headerTitle: "Post Details",
//                     headerTitleStyle: styles.headerTitle,
//                     headerRight: () => (
//                         <Pressable onPress={handleClose} style={styles.closeButton}>
                            
//                         </Pressable>
//                     ),
//                     presentation: 'modal',
//                     animation: 'slide_from_bottom',
//                     animationDuration: 200
//                 }}
//             />
//             <View style={styles.container}>
//                 {renderContent()}

//                 <ProfilePopup
//                     user={selectedUser}
//                     visible={isProfilePopupVisible}
//                     onClose={() => setIsProfilePopupVisible(false)}
//                     router={router}
//                 />
//             </View>
//         </>
//     )
// }

// export default PostDetails

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: 'white',
//         paddingVertical: Math.round(wp(7))
//     },
//     list: {
//         paddingHorizontal: Math.round(wp(4))
//     },
//     inputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10
//     },
//     center: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     notFound: {
//         fontSize: Math.round(hp(2.5)),
//         color: theme.colors.text,
//         fontWeight: theme.fonts.medium
//     },
//     loading: {
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8)),
//         justifyContent: 'center',
//         alignItems: 'center',
//         transform: [{ scale: 1.3 }]
//     },
//     sendIcon: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 0.8,
//         borderColor: theme.colors.primary,
//         borderRadius: theme.radius.lg,
//         borderCurve: 'continuous',
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8))
//     },
//     replySendIcon: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 1,
//         borderColor: theme.colors.primaryDark,
//         borderRadius: theme.radius.sm,
//         borderCurve: 'continuous',
//         height: Math.round(hp(4.8)),
//         width: Math.round(hp(4.8))
//     },
//     headerTitle: {
//         fontSize: Math.round(hp(2.2)),
//         color: theme.colors.text,
//         fontWeight: theme.fonts.semiBold
//     },
//     closeButton: {
//         padding: Math.round(wp(2)),
//         marginRight: Math.round(wp(2))
//     },
//     noComments: {
//         alignHorizontal: 'center',
//         justifyContent: 'center',
//         marginLeft: "22px"
        
//     },
//     replyInputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//         marginTop: 10,
//         marginHorizontal: 10,
//         marginLeft: 50 // Indent reply input
//     },
//     replyContainer: {
//         marginLeft: 50, // Indent replies
//         marginTop: 5
//     }
// })

