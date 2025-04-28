import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp, stripHtmlTags } from '../helpers/common';
import { getSupabaseFileUrl } from '../services/imageService';
import { useFocusEffect } from 'expo-router';
import { Image } from 'react-native';

// Component for generating the poster view
const PosterView = React.forwardRef(({ item }, ref) => {
  return (
    <View ref={ref} style={posterStyles.container}>
      {/* Header with app branding */}
      <View style={posterStyles.header}>
        <Text style={posterStyles.appName}>PlotTwist</Text>
        <Text style={posterStyles.username}>@{item?.user?.name || 'user'}</Text>
      </View>

      {/* Content area */}
      <View style={posterStyles.content}>
        {/* Image if available */}
        {item?.file && (
          <Image 
            source={{ uri: getSupabaseFileUrl(item?.file).uri }} 
            style={posterStyles.image} 
            resizeMode="cover"
          />
        )}
        
        {/* Text content */}
        <Text style={posterStyles.bodyText}>
          {stripHtmlTags(item?.body || "")}
        </Text>
      </View>

      {/* Footer with branding */}
      <View style={posterStyles.footer}>
        <Text style={posterStyles.footerText}>
          Shared via PlotTwist App
        </Text>
      </View>
    </View>
  );
});

const posterStyles = StyleSheet.create({
  container: {
    width: 600, // Fixed width for the poster
    backgroundColor: theme.colors.card || '#121212',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: hp(2.4),
    fontWeight: 'bold',
    color: theme.colors.bmw || '#4287f5',
  },
  username: {
    fontSize: hp(1.8),
    color: theme.colors.light || '#E0E0E0',
  },
  content: {
    marginVertical: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: hp(2),
    color: theme.colors.light || '#E0E0E0',
    lineHeight: hp(2.8),
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: hp(1.6),
    color: theme.colors.light || '#E0E0E0',
    opacity: 0.8,
  }
});

const TwistFooter = ({
  item,
  currentUser,
  router,
  showMoreIcon = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isNavigating, setIsNavigating] = useState(false);
  const posterRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showPosterView, setShowPosterView] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsNavigating(false);
    }, [])
  );
  
  const openPostDetails = () => {
    if (!showMoreIcon || !item?.id) return null;
    router.push({pathname: 'twistDetails', params: {postId: item.id}});
  };
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  }); 

  const [twistlikes, setTwistlikes] = useState([]);
  const [twistunlikes, setTwistunlikes] = useState([]);

  useEffect(() => {
    setTwistlikes(item?.twistLikes || []);
    setTwistunlikes(item?.twistUnlikes || []);
  }, [item]);

  const onLike = async () => {
    // If already liked, remove the like
    if(twistliked) {
      let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
      setTwistlikes([...updatedUpvotes]);
      const res = await removeTwistLikes(item?.id, currentUser?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      // If not liked yet, add the like
      let data = {
        userId: currentUser?.id,
        twistId: item?.id
      }
      setTwistlikes([...twistlikes, data]);
      const res = await createTwistLikes(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
      
      // If the post is currently disliked, remove the dislike
      if(twistunliked) {
        let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
        setTwistunlikes([...updatedDownvotes]);
        const removeRes = await removeTwistUnlikes(item?.id, currentUser?.id);
        if(!removeRes.success){
          Alert.alert('Error', removeRes.msg || 'Something went wrong');
        }
      }
    }
  }

  const twistliked = twistlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

  const onunLike = async () => {
    // If already disliked, remove the dislike
    if(twistunliked) {
      let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
      setTwistunlikes([...updatedDownvotes]);
      const res = await removeTwistUnlikes(item?.id, currentUser?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      // If not disliked yet, add the dislike
      let data = {
        userId: currentUser?.id,
        twistId: item?.id
      }
      setTwistunlikes([...twistunlikes, data]);
      const res = await createTwistUnlikes(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
      
      // If the post is currently liked, remove the like
      if(twistliked) {
        let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
        setTwistlikes([...updatedUpvotes]);
        const removeRes = await removeTwistLikes(item?.id, currentUser?.id);
        if(!removeRes.success){
          Alert.alert('Error', removeRes.msg || 'Something went wrong');
        }
      }
    }
  }

  const twistunliked = twistunlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

  // New share function that creates and shares an embedded poster
  const onShare = async () => {
    if (isSharing) return; // Prevent multiple share requests
    
    try {
      setIsSharing(true);
      
      // Animate the share button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
      
      // Show the poster view and wait a bit for it to render
      setShowPosterView(true);
      
      // Add a small delay to ensure the view is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!posterRef.current) {
        Alert.alert('Error', 'Unable to generate poster');
        setIsSharing(false);
        setShowPosterView(false);
        return;
      }
      
      // Generate a high-quality image of our poster component
      const uri = await captureRef(posterRef, {
        format: 'jpg',
        quality: 1,
        result: 'file',
      });
      
      // Hide the poster view after capture
      setShowPosterView(false);
      
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your PlotTwist',
          UTI: 'public.jpeg'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Sharing error:', error);
      Alert.alert('Error', 'Failed to share poster');
      setShowPosterView(false);
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <>
      {/* Poster view that will be captured for sharing - hidden by default but properly sized */}
      {showPosterView && (
        <View style={sharingStyles.hiddenContainer}>
          <PosterView ref={posterRef} item={item} currentUser={currentUser} />
        </View>
      )}
      
      <View style={styles.footer}>
        {/* Left side interaction buttons */}
        <View style={styles.leftButtons}>
          {/* thumbsup button here */}
          <View style={styles.footerButton}>
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
                  name='thumbsup'
                  size={24} 
                  fill={twistliked ? "" : 'transparent'} 
                  strokeWidth={1.4} 
                  color={twistliked ? theme.colors.bmw : theme.colors.light || '#E0E0E0'}
                />  
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.count}>
              {twistlikes?.length || 0}
            </Text>
          </View>

          {/* thumbs down button here */}
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={onunLike} activeOpacity={0.7}>
              <Animated.View
                style={{
                  transform: [
                    { scale: scaleAnim },
                    { rotate: rotate }
                  ]
                }}
              >
                <Icon 
                  name='thumbsdown'
                  size={24} 
                  fill={twistunliked ? '' : 'transparent'} 
                  strokeWidth={1.4} 
                  color={twistunliked ? theme.colors.red : theme.colors.light || '#E0E0E0'}
                />
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.count}>
              {twistunlikes?.length || 0}
            </Text>
          </View>
          
          {/* Comment button */}
          <View style={styles.footerButton}>
            <TouchableOpacity 
              disabled={isNavigating}
              onPress={() => {
                if (!isNavigating) {
                  setIsNavigating(true);
                  openPostDetails();
                }
              }}
            >
              <Icon 
                name="comment" 
                size={24} 
                strokeWidth={1.4} 
                color={theme.colors.light || '#E0E0E0'} 
              />
            </TouchableOpacity>
            <Text style={styles.count}>
              {item?.tcomments?.[0]?.count || 0}
            </Text>
          </View>
          
          {/* Share button */}
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={onShare} disabled={isSharing}>
              <Animated.View
                style={{
                  transform: [{ scale: isSharing ? 1.1 : 1 }]
                }}
              >
                <Icon 
                  name='share' 
                  size={24} 
                  strokeWidth={1.4} 
                  color={isSharing ? theme.colors.bmw : theme.colors.light || '#E0E0E0'} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const sharingStyles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000, // Position off-screen instead of setting opacity to 0
    left: 0,
    width: 600, // Match the width in posterStyles
    height: 'auto', // Allow height to adjust based on content
    zIndex: -1, // Make sure it's behind everything else
  }
});

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 16,
  },
  count: {
    color: theme.colors.light || '#E0E0E0',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  }
});

export default TwistFooter;

// import React, { useState, useEffect, useRef } from 'react';
// import { Text, View, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
// import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system';
// import ViewShot from 'react-native-view-shot'; // You'll need to install this package
// import { captureRef } from 'react-native-view-shot';
// import Icon from '../assets/icons';
// import theme from '../constants/theme';
// import { hp, stripHtmlTags } from '../helpers/common';
// import { getSupabaseFileUrl } from '../services/imageService';
// import { useFocusEffect } from 'expo-router';
// import { Image } from 'react-native';

// // Component for generating the poster view
// const PosterView = React.forwardRef(({ item }, ref) => {
//   return (
//     <View ref={ref} style={posterStyles.container}>
//       {/* Header with app branding */}
//       <View style={posterStyles.header}>
//         <Text style={posterStyles.appName}>PlotTwist</Text>
//         <Text style={posterStyles.username}>@{item?.user?.name || 'user'}</Text>
//       </View>

//       {/* Content area */}
//       <View style={posterStyles.content}>
//         {/* Image if available */}
//         {item?.file && (
//           <Image 
//             source={{ uri: getSupabaseFileUrl(item?.file).uri }} 
//             style={posterStyles.image} 
//             resizeMode="cover"
//           />
//         )}
        
//         {/* Text content */}
//         <Text style={posterStyles.bodyText}>
//           {stripHtmlTags(item?.body || "")}
//         </Text>
//       </View>

//       {/* Footer with branding */}
//       <View style={posterStyles.footer}>
//         <Text style={posterStyles.footerText}>
//           Shared via PlotTwist App
//         </Text>
//       </View>
//     </View>
//   );
// });

// const posterStyles = StyleSheet.create({
//   container: {
//     width: 600, // Fixed width for the poster
//     backgroundColor: theme.colors.card || '#121212',
//     borderRadius: 12,
//     padding: 16,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//     alignSelf: 'flex-start',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   appName: {
//     fontSize: hp(2.4),
//     fontWeight: 'bold',
//     color: theme.colors.bmw || '#4287f5',
//   },
//   username: {
//     fontSize: hp(1.8),
//     color: theme.colors.light || '#E0E0E0',
//   },
//   content: {
//     marginVertical: 16,
//   },
//   image: {
//     width: '100%',
//     height: 300,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   bodyText: {
//     fontSize: hp(2),
//     color: theme.colors.light || '#E0E0E0',
//     lineHeight: hp(2.8),
//   },
//   footer: {
//     marginTop: 16,
//     alignItems: 'center',
//   },
//   footerText: {
//     fontSize: hp(1.6),
//     color: theme.colors.light || '#E0E0E0',
//     opacity: 0.8,
//   }
// });

// const TwistFooter = ({
//   item,
//   currentUser,
//   router,
//   showMoreIcon = true,
// }) => {
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const rotateAnim = useRef(new Animated.Value(0)).current;
//   const [isNavigating, setIsNavigating] = useState(false);
//   const posterRef = useRef(null);
//   const [isSharing, setIsSharing] = useState(false);

//   useFocusEffect(
//     React.useCallback(() => {
//       setIsNavigating(false);
//     }, [])
//   );
  
//   const openPostDetails = () => {
//     if (!showMoreIcon || !item?.id) return null;
//     router.push({pathname: 'twistDetails', params: {postId: item.id}});
//   };
  
//   const rotate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '15deg'],
//   }); 

//   const [twistlikes, setTwistlikes] = useState([]);
//   const [twistunlikes, setTwistunlikes] = useState([]);

//   useEffect(() => {
//     setTwistlikes(item?.twistLikes || []);
//     setTwistunlikes(item?.twistUnlikes || []);
//   }, [item]);

//   const onLike = async () => {
//     // If already liked, remove the like
//     if(twistliked) {
//       let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
//       setTwistlikes([...updatedUpvotes]);
//       const res = await removeTwistLikes(item?.id, currentUser?.id);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
//     } else {
//       // If not liked yet, add the like
//       let data = {
//         userId: currentUser?.id,
//         twistId: item?.id
//       }
//       setTwistlikes([...twistlikes, data]);
//       const res = await createTwistLikes(data);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
      
//       // If the post is currently disliked, remove the dislike
//       if(twistunliked) {
//         let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
//         setTwistunlikes([...updatedDownvotes]);
//         const removeRes = await removeTwistUnlikes(item?.id, currentUser?.id);
//         if(!removeRes.success){
//           Alert.alert('Error', removeRes.msg || 'Something went wrong');
//         }
//       }
//     }
//   }

//   const twistliked = twistlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

//   const onunLike = async () => {
//     // If already disliked, remove the dislike
//     if(twistunliked) {
//       let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
//       setTwistunlikes([...updatedDownvotes]);
//       const res = await removeTwistUnlikes(item?.id, currentUser?.id);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
//     } else {
//       // If not disliked yet, add the dislike
//       let data = {
//         userId: currentUser?.id,
//         twistId: item?.id
//       }
//       setTwistunlikes([...twistunlikes, data]);
//       const res = await createTwistUnlikes(data);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
      
//       // If the post is currently liked, remove the like
//       if(twistliked) {
//         let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
//         setTwistlikes([...updatedUpvotes]);
//         const removeRes = await removeTwistLikes(item?.id, currentUser?.id);
//         if(!removeRes.success){
//           Alert.alert('Error', removeRes.msg || 'Something went wrong');
//         }
//       }
//     }
//   }

//   const twistunliked = twistunlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

//   // New share function that creates and shares an embedded poster
//   const onShare = async () => {
//     if (isSharing) return; // Prevent multiple share requests
    
//     try {
//       setIsSharing(true);
      
//       // Animate the share button
//       Animated.sequence([
//         Animated.timing(scaleAnim, {
//           toValue: 1.2,
//           duration: 150,
//           useNativeDriver: true
//         }),
//         Animated.timing(scaleAnim, {
//           toValue: 1,
//           duration: 150,
//           useNativeDriver: true
//         })
//       ]).start();
      
//       if (!posterRef.current) {
//         Alert.alert('Error', 'Unable to generate poster');
//         setIsSharing(false);
//         return;
//       }
      
//       // Generate a high-quality image of our poster component
//       const uri = await captureRef(posterRef, {
//         format: 'jpg',
//         quality: 0.9,
//         result: 'file',
//       });
      
//       // Check if sharing is available
//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri, {
//           mimeType: 'image/jpeg',
//           dialogTitle: 'Share your PlotTwist',
//           UTI: 'public.jpeg'
//         });
//       } else {
//         Alert.alert('Error', 'Sharing is not available on this device');
//       }
//     } catch (error) {
//       console.error('Sharing error:', error);
//       Alert.alert('Error', 'Failed to share poster');
//     } finally {
//       setIsSharing(false);
//     }
//   };
  
//   return (
//     <>
//       {/* Invisible poster view that will be captured for sharing */}
//       {/* <View style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' }}>
//         <PosterView ref={posterRef} item={item} currentUser={currentUser} />
//       </View> */}

// <View style={{ position: 'absolute', opacity: 0, width: 1, height: 1, overflow: 'hidden' }}>
//   <PosterView ref={posterRef} item={item} currentUser={currentUser} />
// </View>

      
//       <View style={styles.footer}>
//         {/* Left side interaction buttons */}
//         <View style={styles.leftButtons}>
//           {/* thumbsup button here */}
//           <View style={styles.footerButton}>
//             <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
//               <Animated.View
//                 style={{
//                   transform: [
//                     { scale: scaleAnim },
//                     { rotate: rotate }
//                   ]
//                 }}
//               >
//                 <Icon 
//                   name='thumbsup'
//                   size={24} 
//                   fill={twistliked ? "" : 'transparent'} 
//                   strokeWidth={1.4} 
//                   color={twistliked ? theme.colors.bmw : theme.colors.light || '#E0E0E0'}
//                 />  
//               </Animated.View>
//             </TouchableOpacity>
//             <Text style={styles.count}>
//               {twistlikes?.length || 0}
//             </Text>
//           </View>

//           {/* thumbs down button here */}
//           <View style={styles.footerButton}>
//             <TouchableOpacity onPress={onunLike} activeOpacity={0.7}>
//               <Animated.View
//                 style={{
//                   transform: [
//                     { scale: scaleAnim },
//                     { rotate: rotate }
//                   ]
//                 }}
//               >
//                 <Icon 
//                   name='thumbsdown'
//                   size={24} 
//                   fill={twistunliked ? '' : 'transparent'} 
//                   strokeWidth={1.4} 
//                   color={twistunliked ? theme.colors.red : theme.colors.light || '#E0E0E0'}
//                 />
//               </Animated.View>
//             </TouchableOpacity>
//             <Text style={styles.count}>
//               {twistunlikes?.length || 0}
//             </Text>
//           </View>
          
//           {/* Comment button */}
//           <View style={styles.footerButton}>
//             <TouchableOpacity 
//               disabled={isNavigating}
//               onPress={() => {
//                 if (!isNavigating) {
//                   setIsNavigating(true);
//                   openPostDetails();
//                 }
//               }}
//             >
//               <Icon 
//                 name="comment" 
//                 size={24} 
//                 strokeWidth={1.4} 
//                 color={theme.colors.light || '#E0E0E0'} 
//               />
//             </TouchableOpacity>
//             <Text style={styles.count}>
//               {item?.tcomments?.[0]?.count || 0}
//             </Text>
//           </View>
          
//           {/* Share button */}
//           <View style={styles.footerButton}>
//             <TouchableOpacity onPress={onShare} disabled={isSharing}>
//               <Animated.View
//                 style={{
//                   transform: [{ scale: isSharing ? 1.1 : 1 }]
//                 }}
//               >
//                 <Icon 
//                   name='share' 
//                   size={24} 
//                   strokeWidth={1.4} 
//                   color={isSharing ? theme.colors.bmw : theme.colors.light || '#E0E0E0'} 
//                 />
//               </Animated.View>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 8,
//     marginTop: 8,
//   },
//   leftButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   footerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     marginRight: 16,
//   },
//   count: {
//     color: theme.colors.light || '#E0E0E0',
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium
//   }
// });

// export default TwistFooter;

// import { Text, View, StyleSheet, TouchableOpacity, Animated } from 'react-native'
// // import Share from 'react-native-share';
// import * as Sharing from 'expo-sharing';
// import * as FileSystem from 'expo-file-system';
// import React, { useState, useEffect, useRef } from 'react'
// import Icon from '../assets/icons'
// import theme from '../constants/theme'
// import { hp, stripHtmlTags } from '../helpers/common'
// import { usePost } from '../contexts/PostContext';
// import { createTwistLikes, createTwistUnlikes, removeTwistLikes, removeTwistUnlikes } from '../services/homeService'
// import { getSupabaseFileUrl, homeContentDownload } from '../services/imageService'
// import { useFocusEffect } from 'expo-router'

// const TwistFooter = ({
//   item,
//   currentUser,
//   router,
//   showMoreIcon = true,
// }) => {
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const rotateAnim = useRef(new Animated.Value(0)).current;
//  const [isNavigating, setIsNavigating] = useState(false);

//    useFocusEffect(
//      React.useCallback(() => {
//        setIsNavigating(false);
//      }, [])
//    );
  
//   const openPostDetails = () => {
//     if (!showMoreIcon || !item?.id) return null;
//     router.push({pathname: 'twistDetails', params: {postId: item.id}});
//   };
  
//   const rotate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '15deg'],
//   }); 

//   const [twistlikes, setTwistlikes] = useState([]);

//   useEffect(() => {
//     setTwistlikes(item?.twistLikes || []);
//   }, [])

//   const onLike = async () => {
//     // If already liked, remove the like
//     if(twistliked) {
//       let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
//       setTwistlikes([...updatedUpvotes]);
//       const res = await removeTwistLikes(item?.id, currentUser?.id);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
//     } else {
//       // If not liked yet, add the like
//       let data = {
//         userId: currentUser?.id,
//         twistId: item?.id
//       }
//       setTwistlikes([...twistlikes, data]);
//       const res = await createTwistLikes(data);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
      
//       // If the post is currently disliked, remove the dislike
//       if(twistunliked) {
//         let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
//         setTwistunlikes([...updatedDownvotes]);
//         const removeRes = await removeTwistUnlikes(item?.id, currentUser?.id);
//         if(!removeRes.success){
//           Alert.alert('Error', removeRes.msg || 'Something went wrong');
//         }
//       }
//     }
//   }

//   const twistliked = twistlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

//     // below is the code to handle twist unlikes  

//     const [twistunlikes, setTwistunlikes] = useState([]);

//     useEffect(() => {
//       setTwistunlikes(item?.twistUnlikes || []);
//     }, [])

//     const onunLike = async () => {
//       // If already disliked, remove the dislike
//       if(twistunliked) {
//         let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
//         setTwistunlikes([...updatedDownvotes]);
//         const res = await removeTwistUnlikes(item?.id, currentUser?.id);
//         if(!res.success){
//           Alert.alert('Error', res.msg || 'Something went wrong');
//         }
//       } else {
//         // If not disliked yet, add the dislike
//         let data = {
//           userId: currentUser?.id,
//           twistId: item?.id
//         }
//         setTwistunlikes([...twistunlikes, data]);
//         const res = await createTwistUnlikes(data);
//         if(!res.success){
//           Alert.alert('Error', res.msg || 'Something went wrong');
//         }
        
//         // If the post is currently liked, remove the like
//         if(twistliked) {
//           let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
//           setTwistlikes([...updatedUpvotes]);
//           const removeRes = await removeTwistLikes(item?.id, currentUser?.id);
//           if(!removeRes.success){
//             Alert.alert('Error', removeRes.msg || 'Something went wrong');
//           }
//         }
//       }
//     }
  
//     const twistunliked = twistunlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

//     /// below is the code to share items 

//       // const onShare = async () => {
//       //    let content = {message: stripHtmlTags(item?.body)};
//       //    if(item?.file){
//       //     let url = await homeContentDownload(getSupabaseFileUrl(item?.file).uri);
//       //     content.url = url;
//       //    }
//       //    Share.share(content);
//       // };

//       // const onShare = async () => {
//       //   try {
//       //     let message = stripHtmlTags(item?.body);
//       //     let url = null;
      
//       //     if (item?.file) {
//       //       url = await homeContentDownload(getSupabaseFileUrl(item?.file).uri);
//       //     }
      
//       //     const content = {
//       //       title: "Check out this post!",
//       //       message: message,
//       //     };
      
//       //     if (url) {
//       //       content.url = url;  // For Android: It tries to share the URL/text together
//       //       content.message = `${message}\n\n${url}`; // Combine text + url manually for iOS compatibility
//       //     }
      
//       //     await Share.share(content);
//       //   } catch (error) {
//       //     console.error('Error sharing:', error);
//       //   }
//       // };

//       // const onShare = async () => {
//       //   try {
//       //     let message = stripHtmlTags(item?.body);
//       //     let url = null;
      
//       //     if (item?.file) {
//       //       url = await homeContentDownload(getSupabaseFileUrl(item?.file).uri);
//       //     }
      
//       //     const shareOptions = {
//       //       title: 'Share Post',
//       //       message: message,
//       //       url: url ? `file://${url}` : undefined, // Important: Must be file://
//       //       type: 'image/jpeg', // or 'image/png' depending on your file type
//       //       failOnCancel: false,
//       //     };
      
//       //     await Share.open(shareOptions);
//       //   } catch (error) {
//       //     console.error('Error sharing:', error);
//       //   }
//       // };

// // const onShare = async () => {
// //   try {
// //     const shareOptions = {
// //       title: 'Check out this post!',
// //       message: stripHtmlTags(item?.body),
// //     };

// //     if (item?.file) {
// //       let url = await homeContentDownload(getSupabaseFileUrl(item?.file).uri);
// //       if (url) {
// //         shareOptions.url = url;
// //       }
// //     }

// //     await Share.open(shareOptions);
// //   } catch (error) {
// //     console.error('Error sharing:', error);
// //   }
// // };

// const onShare = async () => {
//   try {
//     let message = stripHtmlTags(item?.body);

//     if (item?.file) {
//       let remoteUrl = getSupabaseFileUrl(item?.file).uri;
//       let localUri = (await FileSystem.downloadAsync(remoteUrl, FileSystem.documentDirectory + 'shared-image.jpg')).uri;

//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(localUri, {
//           dialogTitle: message,
//           mimeType: 'image/jpeg', // optional
//         });
//       } else {
//         alert('Sharing is not available on this device');
//       }
//     } else {
//       alert('No image to share');
//     }
//   } catch (error) {
//     console.error('Sharing error:', error);
//   }
// };

      
  
//   return (
//     <View style={styles.footer}>
//       {/* Left side interaction buttons */}
//       <View style={styles.leftButtons}>
//   {/* thumbsup button here */}
//         <View style={styles.footerButton}>
//           <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
//             <Animated.View
//               style={{
//                 transform: [
//                   { scale: scaleAnim },
//                   { rotate: rotate }
//                 ]
//               }}
//             >

//              <Icon 
//                 name='thumbsup'
//                 size={24} 
//                 fill={twistliked ? "" : 'transparent'} 
//                 strokeWidth={1.4} 
//                 color={twistliked ? theme.colors.bmw : theme.colors.light || '#E0E0E0'}
//               />  

//             </Animated.View>
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {twistlikes?.length || 0}
//           </Text>
//         </View>

//         {/* thums down button here */}

//         <View style={styles.footerButton}>
//           <TouchableOpacity onPress={onunLike} activeOpacity={0.7}>
//             <Animated.View
//               style={{
//                 transform: [
//                   { scale: scaleAnim },
//                   { rotate: rotate }
//                 ]
//               }}
//             >

//               <Icon 
//                 name='thumbsdown'
//                 size={24} 
//                 fill={twistunliked ? '' : 'transparent'} 
//                 strokeWidth={1.4} 
//                 color={twistunliked ? theme.colors.red : theme.colors.light || '#E0E0E0'}
//               />
//             </Animated.View>
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {twistunlikes?.length || 0}
//           </Text>
//         </View>
//         {/* Comment button */}
//         <View style={styles.footerButton}>
//           <TouchableOpacity 
//             disabled={isNavigating}
//             onPress={() => {
//               if (!isNavigating) {
//                 setIsNavigating(true);
//                 openPostDetails();
//               }
//             }}
//           >
//             <Icon 
//               name="comment" 
//               size={24} 
//               strokeWidth={1.4} 
//               color={theme.colors.light || '#E0E0E0'} 
//             />
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {item?.tcomments?.[0]?.count || 0}
//           </Text>
//         </View>
//           {/* Share button */}
//           <View style={styles.footerButton}>
//             <TouchableOpacity onPress={onShare}>
//               <Icon name='share' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
//             </TouchableOpacity>
//           </View>
//       </View>
      
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 8,
//     marginTop: 8,
//   },
//   leftButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   footerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     marginRight: 16,
//   },
//   count: {
//     color: theme.colors.light || '#E0E0E0',
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium
//   }
// });

// export default TwistFooter;


// import { Text, View, StyleSheet, TouchableOpacity, Animated, Share } from 'react-native'
// import React, { useState, useEffect, useRef } from 'react'
// import Icon from '../assets/icons'
// import theme from '../constants/theme'
// import { hp, stripHtmlTags } from '../helpers/common'
// import { usePost } from '../contexts/PostContext';
// import { createTwistLikes, createTwistUnlikes, removeTwistLikes, removeTwistUnlikes } from '../services/homeService'
// import { getSupabaseFileUrl, homeContentDownload } from '../services/imageService'
// import { useFocusEffect } from 'expo-router'

// const TwistFooter = ({
//   item,
//   currentUser,
//   router,
//   showMoreIcon = true,
// }) => {
//   const { activePosts = {}, updatePost = () => {} } = usePost() || {};
//  // console.log('item', item);
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const rotateAnim = useRef(new Animated.Value(0)).current;
//  const [isNavigating, setIsNavigating] = useState(false);

//    useFocusEffect(
//      React.useCallback(() => {
//        setIsNavigating(false);
//      }, [])
//    );

//   // const [likes, setLikes] = useState([]);
  
//   // useEffect(() => {
//   //   setLikes(item?.postLikes || []);
//   // }, [item?.postLikes]);
  
//   // useEffect(() => {
//   //   if (activePosts && item?.id && activePosts[item.id]?.postLikes) {
//   //     setLikes(activePosts[item.id].postLikes);
//   //   }
//   // }, [activePosts, item?.id]);
  
//   // const liked = true;
  
//   const openPostDetails = () => {
//     if (!showMoreIcon || !item?.id) return null;
//     router.push({pathname: 'twistDetails', params: {postId: item.id}});
//   };
  
//   const animateHeart = (isLiking) => {
//     if (isLiking) {
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
  
//   // const onLike = async () => {
//   //   // Original like functionality kept intact
//   //   // Code omitted for brevity
//   // };
  
//   const rotate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '15deg'],
//   });

//   // below is the code to handle twist likes  

//   const [twistlikes, setTwistlikes] = useState([]);

//   useEffect(() => {
//     setTwistlikes(item?.twistLikes || []);
//   }, [])

//   // const onLike = async () => {
//   //   if(twistliked) {
//   //     let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
//   //     setTwistlikes([...updatedUpvotes]);
//   //     const res = await removeTwistLikes(item?.id, currentUser?.id);
//   //     if(!res.success){
//   //       Alert.alert('Error', res.msg || 'Something went wrong');
//   //     }
//   //   } else {
//   //     let data = {
//   //       userId: currentUser?.id,
//   //       twistId: item?.id
//   //     }
//   //     setTwistlikes([...twistlikes, data]);
//   //     const res = await createTwistLikes(data);
//   //     if(!res.success){
//   //       Alert.alert('Error', res.msg || 'Something went wrong');
//   //     }
//   //   }
//   // }

//   const onLike = async () => {
//     // If already liked, remove the like
//     if(twistliked) {
//       let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
//       setTwistlikes([...updatedUpvotes]);
//       const res = await removeTwistLikes(item?.id, currentUser?.id);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
//     } else {
//       // If not liked yet, add the like
//       let data = {
//         userId: currentUser?.id,
//         twistId: item?.id
//       }
//       setTwistlikes([...twistlikes, data]);
//       const res = await createTwistLikes(data);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
      
//       // If the post is currently disliked, remove the dislike
//       if(twistunliked) {
//         let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
//         setTwistunlikes([...updatedDownvotes]);
//         const removeRes = await removeTwistUnlikes(item?.id, currentUser?.id);
//         if(!removeRes.success){
//           Alert.alert('Error', removeRes.msg || 'Something went wrong');
//         }
//       }
//     }
//   }

//   const twistliked = twistlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

//     // below is the code to handle twist unlikes  

//     const [twistunlikes, setTwistunlikes] = useState([]);

//     useEffect(() => {
//       setTwistunlikes(item?.twistUnlikes || []);
//     }, [])
  
//     // const onunLike = async () => {
//     //   if(twistunliked) {
//     //     let updatedUpvotes = twistunlikes.filter(upvote => upvote.userId !== currentUser?.id);
//     //     setTwistunlikes([...updatedUpvotes]);
//     //     const res = await removeTwistUnlikes(item?.id, currentUser?.id);
//     //     if(!res.success){
//     //       Alert.alert('Error', res.msg || 'Something went wrong');
//     //     }
//     //   } else {
//     //     let data = {
//     //       userId: currentUser?.id,
//     //       twistId: item?.id
//     //     }
//     //     setTwistunlikes([...twistunlikes, data]);
//     //     const res = await createTwistUnlikes(data);
//     //     if(!res.success){
//     //       Alert.alert('Error', res.msg || 'Something went wrong');
//     //     }
//     //   }
//     // }

//     const onunLike = async () => {
//       // If already disliked, remove the dislike
//       if(twistunliked) {
//         let updatedDownvotes = twistunlikes.filter(downvote => downvote.userId !== currentUser?.id);
//         setTwistunlikes([...updatedDownvotes]);
//         const res = await removeTwistUnlikes(item?.id, currentUser?.id);
//         if(!res.success){
//           Alert.alert('Error', res.msg || 'Something went wrong');
//         }
//       } else {
//         // If not disliked yet, add the dislike
//         let data = {
//           userId: currentUser?.id,
//           twistId: item?.id
//         }
//         setTwistunlikes([...twistunlikes, data]);
//         const res = await createTwistUnlikes(data);
//         if(!res.success){
//           Alert.alert('Error', res.msg || 'Something went wrong');
//         }
        
//         // If the post is currently liked, remove the like
//         if(twistliked) {
//           let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
//           setTwistlikes([...updatedUpvotes]);
//           const removeRes = await removeTwistLikes(item?.id, currentUser?.id);
//           if(!removeRes.success){
//             Alert.alert('Error', removeRes.msg || 'Something went wrong');
//           }
//         }
//       }
//     }
  
//     const twistunliked = twistunlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

//     /// below is the code to share items 

//       const onShare = async () => {
//          let content = {message: stripHtmlTags(item?.body)};
//          if(item?.file){
//           let url = await homeContentDownload(getSupabaseFileUrl(item?.file).uri);
//           content.url = url;
//          }
//          Share.share(content);
//       };
  
//   return (
//     <View style={styles.footer}>
//       {/* Left side interaction buttons */}
//       <View style={styles.leftButtons}>
//         {/* Like button */}
//         {/* <View style={styles.footerButton}>
//           <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
//             <Animated.View
//               style={{
//                 transform: [
//                   { scale: scaleAnim },
//                   { rotate: rotate }
//                 ]
//               }}
//             >
//               <Icon 
//                 name='heart' 
//                 size={24} 
//                 fill={liked ? theme.colors.rose : 'transparent'} 
//                 strokeWidth={1.4} 
//                 color={liked ? theme.colors.rose : theme.colors.light || '#E0E0E0'}
//               />
//             </Animated.View>
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {likes?.length || 0}
//           </Text>
//         </View> */}
//   {/* thumbsup button here */}
//         <View style={styles.footerButton}>
//           <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
//             <Animated.View
//               style={{
//                 transform: [
//                   { scale: scaleAnim },
//                   { rotate: rotate }
//                 ]
//               }}
//             >

//              <Icon 
//                 name='thumbsup'
//                 size={24} 
//                 fill={twistliked ? "" : 'transparent'} 
//                 strokeWidth={1.4} 
//                 color={twistliked ? theme.colors.bmw : theme.colors.light || '#E0E0E0'}
//               />  

//             </Animated.View>
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {twistlikes?.length || 0}
//           </Text>
//         </View>

//         {/* thums down button here */}

//         <View style={styles.footerButton}>
//           <TouchableOpacity onPress={onunLike} activeOpacity={0.7}>
//             <Animated.View
//               style={{
//                 transform: [
//                   { scale: scaleAnim },
//                   { rotate: rotate }
//                 ]
//               }}
//             >

//               <Icon 
//                 name='thumbsdown'
//                 size={24} 
//                 fill={twistunliked ? '' : 'transparent'} 
//                 strokeWidth={1.4} 
//                 color={twistunliked ? theme.colors.red : theme.colors.light || '#E0E0E0'}
//               />
//             </Animated.View>
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {twistunlikes?.length || 0}
//           </Text>
//         </View>
        
//         {/* Comment button */}
//         <View style={styles.footerButton}>
//           <TouchableOpacity 
//             disabled={isNavigating}
//             onPress={() => {
//               if (!isNavigating) {
//                 setIsNavigating(true);
//                 openPostDetails();
//               }
//             }}
//           >
//             <Icon 
//               name="comment" 
//               size={24} 
//               strokeWidth={1.4} 
//               color={theme.colors.light || '#E0E0E0'} 
//             />
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {item?.tcomments?.[0]?.count || 0}
//           </Text>
//         </View>


//           {/* Share button */}
//           <View style={styles.footerButton}>
//             <TouchableOpacity onPress={onShare}>
//               <Icon name='share' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
//             </TouchableOpacity>
//           </View>
        
//         {/* Share button */}
//         {/* <TouchableOpacity style={styles.footerButton}>
//           <Icon name='send' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
//         </TouchableOpacity> */}
//       </View>
      
//       {/* Right side save button */}
//           {/* <TouchableOpacity>
//             <Icon name='bookmark' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
//           </TouchableOpacity> */}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 8,
//     marginTop: 8,
//   },
//   leftButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   footerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     marginRight: 16,
//   },
//   count: {
//     color: theme.colors.light || '#E0E0E0',
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium
//   }
// });

// export default TwistFooter;