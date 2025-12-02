// import React, { useState, useRef, useEffect } from 'react';
// import { StyleSheet, TouchableOpacity, Text, Animated, Alert, View, AppState } from 'react-native';
// import Icon from '../assets/icons';
// import theme from '../constants/theme';
// import { hp } from '../helpers/common';
// import { createPostUpvote, removePostUpvote, getPostLikes } from '../services/releaseService';

// const LikeButton = ({ 
//   item, 
//   currentUser
// }) => {
//   const [likes, setLikes] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const rotateAnim = useRef(new Animated.Value(0)).current;
//   const appState = useRef(AppState.currentState);
  
//   // Function to fetch fresh like data
//   const refreshLikeData = async () => {
//     if (!item?.id) return;
    
//     try {
//       setIsLoading(true);
//       const response = await getPostLikes(item.id);
//       if (response.success) {
//         setLikes(response.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching likes:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   useEffect(() => {
//     // Initial setup from props
//     setLikes(item?.postLikes || []);
    
//     // Add AppState listener to detect when app comes to foreground
//     const subscription = AppState.addEventListener('change', nextAppState => {
//       if (
//         appState.current.match(/inactive|background/) && 
//         nextAppState === 'active'
//       ) {
//         // App has come to the foreground
//         refreshLikeData();
//       }
//       appState.current = nextAppState;
//     });
    
//     return () => {
//       subscription.remove();
//     };
//   }, [item?.id]);
  
//   // This useEffect ensures likes state is updated when item.postLikes changes
//   useEffect(() => {
//     if (item?.postLikes) {
//       setLikes(item.postLikes);
//     }
//   }, [item?.postLikes]);
  
//   const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;
  
//   const animateHeart = (isLiking) => {
//     if (isLiking) {
//       // When liking: scale up, rotate slightly, then return to normal
//       Animated.sequence([
//         Animated.timing(scaleAnim, {
//           toValue: 1.5,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.timing(rotateAnim, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//         Animated.parallel([
//           Animated.timing(scaleAnim, {
//             toValue: 1,
//             duration: 100,
//             useNativeDriver: true,
//           }),
//           Animated.timing(rotateAnim, {
//             toValue: 0,
//             duration: 100,
//             useNativeDriver: true,
//           }),
//         ]),
//       ]).start();
//     } else {
//       // When unliking: small bounce animation
//       Animated.sequence([
//         Animated.timing(scaleAnim, {
//           toValue: 0.8,
//           duration: 150,
//           useNativeDriver: true,
//         }),
//         Animated.timing(scaleAnim, {
//           toValue: 1,
//           duration: 150,
//           useNativeDriver: true,
//         }),
//       ]).start();
//     }
//   };
  
//   const onLike = async () => {
//     if (!currentUser?.id || !item?.id) {
//       Alert.alert('Error', 'Unable to like post');
//       return;
//     }

//     try {
//       if (liked) {
//         // First animate, then update state
//         animateHeart(false);
        
//         const updatedLikes = likes.filter(like => like.userId !== currentUser.id);
//         setLikes(updatedLikes);
        
//         const res = await removePostUpvote(item.id, currentUser.id);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//         }
//       } else {
//         // First animate, then update state
//         animateHeart(true);
        
//         const newLike = {
//           userId: currentUser.id,
//           peoplesReviewId: item.id
//         };
//         const updatedLikes = [...likes, newLike];
//         setLikes(updatedLikes);
        
//         const res = await createPostUpvote(newLike);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//         }
//       }
//     } catch (error) {
//       console.error('Like error:', error);
//       Alert.alert('Error', 'Something went wrong');
//     }
//   };
  
//   // Convert rotation value to rotation string
//   const rotate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '15deg'],
//   });
  
//   return (
//     <View style={styles.container}>
//       <TouchableOpacity onPress={onLike} activeOpacity={0.7} disabled={isLoading}>
//         <Animated.View
//           style={{
//             transform: [
//               { scale: scaleAnim },
//               { rotate: rotate }
//             ]
//           }}
//         >
//           <Icon 
//             name='heart' 
//             size={24} 
//             fill={liked ? theme.colors.rose : 'transparent'} 
//             strokeWidth={1.4} 
//             color={liked ? theme.colors.blue : theme.colors.textDark}
//           />
//         </Animated.View>
//       </TouchableOpacity>
//       <Text style={styles.count}>
//         {likes?.length || 0}
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//   },
//   count: {
//     color: theme.colors.text,
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium
//   }
// });

// export default LikeButton;