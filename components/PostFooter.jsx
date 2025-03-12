// import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native'
// import React, { useState, useEffect } from 'react'
// import Icon from '../assets/icons'
// import theme from '../constants/theme'
// import { hp } from '../helpers/common'
// import { createPostLike, removePostLike } from '../services/postService'
// import { usePost } from '../contexts/PostContext';

// const PostFooter = ({
//   item = {},
//   currentUser,
//   router,
//   showMoreIcon = true,
// }) => {
//   const { activePosts, updatePost } = usePost();
//   const [likes, setLikes] = useState([]);
  
//   useEffect(() => {
//     setLikes(item?.postLikes || []);
//   }, [item?.postLikes]);
  
//   useEffect(() => {
//     // If this post is in the context and has updated data, use it
//     const activePost = activePosts[item.id];
//     if (activePost && activePost.postLikes) {
//       setLikes(activePost.postLikes);
//     }
//   }, [activePosts, item.id]);
  
//   const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;
  
//   const onLike = async () => {
//     if (!currentUser?.id || !item?.id) {
//       Alert.alert('Error', 'Unable to like post');
//       return;
//     }

//     try {
//       if (liked) {
//         const updatedLikes = likes.filter(like => like.userId !== currentUser.id);
//         setLikes(updatedLikes);
        
//         // Update context
//         updatePost(item.id, { postLikes: updatedLikes });
        
//         const res = await removePostLike(item.id, currentUser.id);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//           updatePost(item.id, { postLikes: likes });
//         }
//       } else {
//         const newLike = {
//           userId: currentUser.id,
//           postId: item.id
//         };
//         const updatedLikes = [...likes, newLike];
//         setLikes(updatedLikes);
        
//         // Update context
//         updatePost(item.id, { postLikes: updatedLikes });
        
//         const res = await createPostLike(newLike);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//           updatePost(item.id, { postLikes: likes });
//         }
//       }
//     } catch (error) {
//       console.error('Like error:', error);
//       Alert.alert('Error', 'Something went wrong');
//     }
//   };
  
//   // Get comment count from context if available
//   const commentCount = activePosts[item.id]?.comments?.length || item?.comments?.[0]?.count || 0;
  
//   return (
//     <View style={styles.footer}>
//       <View style={[styles.footerButton, { width: 60 }]}>
//         <TouchableOpacity onPress={onLike}>
//           <Icon 
//             name='heart' 
//             size={24} 
//             fill={liked ? theme.colors.rose : 'transparent'} 
//             strokeWidth={1.4} 
//             color={liked ? theme.colors.blue : theme.colors.textDark}
//           />
//         </TouchableOpacity>
//         <Text style={styles.count}>
//           {likes?.length || 0}
//         </Text>
//       </View>
//       <View style={[styles.footerButton, { width: 60 }]}>
//         <TouchableOpacity onPress={openPostDetails}>
//           <Icon name='comment' size={24} strokeWidth={2} />
//         </TouchableOpacity>
//         <Text style={styles.count}>
//           {commentCount}
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingLeft: 14,
//   },
//   footerButton: {
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

// export default PostFooter










// working code 


// import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native'
// import React, { useState, useEffect } from 'react'
// import Icon from '../assets/icons'
// import theme from '../constants/theme'
// import { hp } from '../helpers/common'
// import { createPostLike, removePostLike } from '../services/postService'
// import { usePost } from '../contexts/PostContext';

// const PostFooter = ({
//   item = {},
//   currentUser,
//   router,
//   showMoreIcon = true,
// }) => {
//   // Add default values to protect against undefined context
//   const { activePosts = {}, updatePost = () => {} } = usePost() || {};
//   const [likes, setLikes] = useState([]);
  
//   useEffect(() => {
//     setLikes(item?.postLikes || []);
//   }, [item?.postLikes]);
  
//   useEffect(() => {
//     // Safely check for activePosts and item.id
//     if (activePosts && item?.id && activePosts[item.id]?.postLikes) {
//       setLikes(activePosts[item.id].postLikes);
//     }
//   }, [activePosts, item?.id]);
  
//   const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;
  
//   const openPostDetails = () => {
//     if (!showMoreIcon || !item?.id) return null;
//     router.push({pathname: 'postDetails', params: {postId: item.id}});
//   }
  
//   const onLike = async () => {
//     if (!currentUser?.id || !item?.id) {
//       Alert.alert('Error', 'Unable to like post');
//       return;
//     }

//     try {
//       if (liked) {
//         const updatedLikes = likes.filter(like => like.userId !== currentUser.id);
//         setLikes(updatedLikes);
        
//         // Safely update context
//         if (typeof updatePost === 'function') {
//           updatePost(item.id, { postLikes: updatedLikes });
//         }
        
//         const res = await removePostLike(item.id, currentUser.id);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//           if (typeof updatePost === 'function') {
//             updatePost(item.id, { postLikes: likes });
//           }
//         }
//       } else {
//         const newLike = {
//           userId: currentUser.id,
//           postId: item.id
//         };
//         const updatedLikes = [...likes, newLike];
//         setLikes(updatedLikes);
        
//         // Safely update context
//         if (typeof updatePost === 'function') {
//           updatePost(item.id, { postLikes: updatedLikes });
//         }
        
//         const res = await createPostLike(newLike);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//           if (typeof updatePost === 'function') {
//             updatePost(item.id, { postLikes: likes });
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Like error:', error);
//       Alert.alert('Error', 'Something went wrong');
//     }
//   };                       0;
  
//   return (
//     <View style={styles.footer}>
//       <View style={[styles.footerButton, { width: 60 }]}>
//         <TouchableOpacity onPress={onLike}>
//           <Icon 
//             name='heart' 
//             size={24} 
//             fill={liked ? theme.colors.rose : 'transparent'} 
//             strokeWidth={1.4} 
//             color={liked ? theme.colors.blue : theme.colors.textDark}
//           />
//         </TouchableOpacity>
//         <Text style={styles.count}>
//           {likes?.length || 0}
//         </Text>
//       </View>
//       <View style={[styles.footerButton, { width: 60 }]}>
//         <TouchableOpacity onPress={openPostDetails}>
//           <Icon name='comment' size={24} strokeWidth={2} />
//         </TouchableOpacity>
//         <Text style={styles.count}>
//         {item?.comments?.[0]?.count || 0}
//         </Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingLeft: 14,
//   },
//   footerButton: {
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

// export default PostFooter







import { Text, View, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import Icon from '../assets/icons'
import theme from '../constants/theme'
import { hp } from '../helpers/common'
import { createPostLike, removePostLike } from '../services/postService'
import { usePost } from '../contexts/PostContext';

const PostFooter = ({
  item = {},
  currentUser,
  router,
  showMoreIcon = true,
}) => {
  // Add default values to protect against undefined context
  const { activePosts = {}, updatePost = () => {} } = usePost() || {};
  const [likes, setLikes] = useState([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    setLikes(item?.postLikes || []);
  }, [item?.postLikes]);
  
  useEffect(() => {
    // Safely check for activePosts and item.id
    if (activePosts && item?.id && activePosts[item.id]?.postLikes) {
      setLikes(activePosts[item.id].postLikes);
    }
  }, [activePosts, item?.id]);
  
  const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;
  
  const openPostDetails = () => {
    if (!showMoreIcon || !item?.id) return null;
    router.push({pathname: 'postDetails', params: {postId: item.id}});
  }
  
  const animateHeart = (isLiking) => {
    if (isLiking) {
      // When liking: scale up, rotate slightly, then return to normal
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // When unliking: small bounce animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };
  
  const onLike = async () => {
    if (!currentUser?.id || !item?.id) {
      Alert.alert('Error', 'Unable to like post');
      return;
    }

    try {
      if (liked) {
        // First animate, then update state
        animateHeart(false);
        
        const updatedLikes = likes.filter(like => like.userId !== currentUser.id);
        setLikes(updatedLikes);
        
        // Safely update context
        if (typeof updatePost === 'function') {
          updatePost(item.id, { postLikes: updatedLikes });
        }
        
        const res = await removePostLike(item.id, currentUser.id);
        if (!res.success) {
          Alert.alert('Post', 'Something went wrong');
          setLikes(likes); // Revert on error
          if (typeof updatePost === 'function') {
            updatePost(item.id, { postLikes: likes });
          }
        }
      } else {
        // First animate, then update state
        animateHeart(true);
        
        const newLike = {
          userId: currentUser.id,
          postId: item.id
        };
        const updatedLikes = [...likes, newLike];
        setLikes(updatedLikes);
        
        // Safely update context
        if (typeof updatePost === 'function') {
          updatePost(item.id, { postLikes: updatedLikes });
        }
        
        const res = await createPostLike(newLike);
        if (!res.success) {
          Alert.alert('Post', 'Something went wrong');
          setLikes(likes); // Revert on error
          if (typeof updatePost === 'function') {
            updatePost(item.id, { postLikes: likes });
          }
        }
      }
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };
  
  // Convert rotation value to rotation string
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });
  
  return (
    <View style={styles.footer}>
      <View style={[styles.footerButton, { width: 60 }]}>
        <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
          <Animated.View
            style={{
              transform: [
                { scale: scaleAnim },
                { rotate: rotate }
              ]
            }}
          >
            <Icon 
              name='heart' 
              size={24} 
              fill={liked ? theme.colors.rose : 'transparent'} 
              strokeWidth={1.4} 
              color={liked ? theme.colors.blue : theme.colors.textDark}
            />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.count}>
          {likes?.length || 0}
        </Text>
      </View>
      <View style={[styles.footerButton, { width: 60 }]}>
        <TouchableOpacity onPress={openPostDetails}>
          <Icon name='comment' size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.count}>
        {item?.comments?.[0]?.count || 0}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  }
});

export default PostFooter;