// import React, { useState } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
// import { fetchPeopleReviewReplies, removeReplyPeopleReview, createPeopleReviewReply } from "../../services/releaseService";
// import { createNotifications } from '../../services/notificationService';
// import Icon from '../../assets/icons';
// import { hp, wp } from '../../helpers/common';
// import theme from '../../constants/theme';
// import Input from "../../components/Input";
// import FeedLoader from "../../components/FeedLoader";

// const ReleasePeopleReply = ({ 
//   reviewId, 
//   releaseId, 
//   releaseUserId, 
//   currentUser,
//   onReplyAdded,
//   onReplyDeleted
// }) => {
//   const [replies, setReplies] = useState([]);
//   const [replyInput, setReplyInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isFetching, setIsFetching] = useState(false);
//   const replyRef = React.useRef('');

//   const fetchReplies = async () => {
//     if (isFetching) return;
    
//     setIsFetching(true);
//     try {
//       const res = await fetchPeopleReviewReplies(reviewId);
//       if (res.success) {
//         setReplies(res.data);
//       }
//     } catch (error) {
//       console.error('Error fetching replies', error);
//     } finally {
//       setIsFetching(false);
//     }
//   };

//   const handleReplyInputChange = (value) => {
//     setReplyInput(value);
//     replyRef.current = value;
//   };

//   const submitReply = async () => {
//     if (!replyRef.current || !currentUser?.id) return null;

//     let data = {
//       userId: currentUser.id,
//       text: replyRef.current,
//       parentReviewId: reviewId,
//       releaseId: releaseId
//     };

//     setIsLoading(true);
    
//     try {
//       let res = await createPeopleReviewReply(data);
//       if (res.success) {
//         // Create new reply object with user data
//         const newReply = {
//           ...res.data,
//           user: {
//             id: currentUser.id,
//             ...currentUser
//           }
//         };

//         // Update state immediately
//         setReplies(prev => [...prev, newReply]);

//         // Clear input
//         replyRef.current = '';
//         setReplyInput('');

//         // Notify parent component that reply was added
//         if (onReplyAdded) {
//           onReplyAdded(newReply);
//         }

//         // Handle notification
//         if (currentUser.id !== releaseUserId) {
//           let notify = {
//             senderId: currentUser.id,
//             receiverId: releaseUserId,
//             title: 'replied to your review',
//             data: JSON.stringify({ releaseId: releaseId, reviewId: reviewId })
//           };
//           createNotifications(notify);
//         }
//       } else {
//         Alert.alert('Reply', res.msg || 'Something went wrong');
//       }
//     } catch (err) {
//       Alert.alert('Reply', 'Something went wrong');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const deleteReply = async (replyId) => {
//     try {
//       let res = await removeReplyPeopleReview(replyId);
//       if (res.success) {
//         Alert.alert('Review Reply :', 'Reply deleted. Thanks! You can still view it to respond again.');
        
//         // Update state to remove the reply
//         setReplies(prev => prev.filter(reply => reply.id !== replyId));
        
//         // Notify parent component that reply was deleted
//         if (onReplyDeleted) {
//           onReplyDeleted(replyId);
//         }
//       }
//     } catch (err) {
//       Alert.alert('Review Reply', 'Something went wrong');
//     }
//   };

//   // Fetch replies when component mounts
//   React.useEffect(() => {
//     fetchReplies();
//   }, [reviewId]);

//   return (
//     <View style={styles.container}>
//       {/* Reply Input */}
//       <View style={styles.replyInputContainer}>
//         <Input
//           placeholder="Write a reply..."
//           onChangeText={handleReplyInputChange}
//           value={replyInput}
//           placeholderTextColor={theme.colors.textLight}
//           containerStyle={{
//             flex: 1,
//             height: hp(5),
//             borderRadius: theme.radius.sm
//           }}
//         />

//         {isLoading ? (
//           <View style={styles.loading}>
//             <FeedLoader size="small" color={theme.colors.primaryDark} />
//           </View>
//         ) : (
//           <TouchableOpacity
//             style={styles.replySendIcon}
//             onPress={submitReply}
//             disabled={!replyInput.trim()}
//           >
//             <Icon name="send" size={hp(2)} color={theme.colors.primaryDark} />
//           </TouchableOpacity>
//         )}
//       </View>
      
//       {/* Loading indicator when fetching replies */}
//       {isFetching && (
//         <View style={styles.fetchingContainer}>
//           <FeedLoader size="small" color={theme.colors.primaryDark} />
//         </View>
//       )}
      
//       {/* Replies List */}
//       {replies.length > 0 ? (
//         <View style={styles.repliesContainer}>
//           {replies.map(reply => (
//             <View key={reply.id} style={styles.replyItem}>
//               <View style={styles.replyHeader}>
//                 <Text style={styles.replyAuthor}>{reply.user.name}</Text>
//                 {(currentUser.id === reply.userId || currentUser.id === releaseUserId) && (
//                   <TouchableOpacity onPress={() => deleteReply(reply.id)}>
//                     <Icon name="delete" size={hp(1.8)} color={theme.colors.error} />
//                   </TouchableOpacity>
//                 )}
//               </View>
//               <Text style={styles.replyText}>{reply.text}</Text>
//               <Text style={styles.replyTime}>
//                 {new Date(reply.createdAt).toLocaleDateString()}
//               </Text>
//             </View>
//           ))}
//         </View>
//       ) : (
//         <Text style={styles.noRepliesText}>No replies yet. Be the first to reply!</Text>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginTop: hp(1),
//     paddingHorizontal: wp(2)
//   },
//   replyInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     marginBottom: hp(1.5)
//   },
//   replySendIcon: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: theme.colors.primaryDark,
//     borderRadius: theme.radius.sm,
//     borderCurve: 'continuous',
//     height: Math.round(hp(4.8)),
//     width: Math.round(hp(4.8))
//   },
//   loading: {
//     height: Math.round(hp(4.8)),
//     width: Math.round(hp(4.8)),
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   fetchingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: hp(2)
//   },
//   repliesContainer: {
//     gap: hp(1.5)
//   },
//   replyItem: {
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.radius.md,
//     padding: hp(1.5),
//     borderWidth: 1,
//     borderColor: theme.colors.border
//   },
//   replyHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: hp(0.5)
//   },
//   replyAuthor: {
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.semibold,
//     color: theme.colors.text
//   },
//   replyText: {
//     fontSize: hp(1.6),
//     color: theme.colors.text,
//     marginBottom: hp(0.5)
//   },
//   replyTime: {
//     fontSize: hp(1.2),
//     color: theme.colors.textLight
//   },
//   noRepliesText: {
//     textAlign: 'center',
//     color: theme.colors.textLight,
//     fontSize: hp(1.4),
//     marginVertical: hp(2)
//   }
// });

// export default ReleasePeopleReply;