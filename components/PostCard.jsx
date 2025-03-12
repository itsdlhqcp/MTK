// import {  Text,View, StyleSheet, TouchableOpacity, Image, Alert, Share } from 'react-native'
// import React, { useEffect, useState } from 'react'
// import theme from '../constants/theme'
// import { wp, hp, stripHtmlTags } from '../helpers/common'
// import Avatar from './Avatar'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { downloadFile, shareContent } from '../services/imageService'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import { createPostLike, removePostLike } from '../services/postService'
// import Loading from './Loading'

// const textStyle = {
//   color: theme.colors.dark, 
//   fontSize: hp(1.75)
// }

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: {
//     color: theme.colors.dark,
//   },
//   h4: {
//     color: theme.colors.dark
//   }
// }

// const PostCard = ({
//   item = {},  // Provide default empty object
//   currentUser,
//   router,
//   hasShadow = true,
//   showMoreIcon = true,
//   showDelete = false, 
//   onDelete = () => {}, 
//   onEdit = () => {}
// }) => {
//   const shadowStyle = {
//     shadowOffset: {
//       width: 0, height: 2
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 6,
//     elevation: 1
//   }
  
//   const [likes, setLikes] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // Add null checks for item
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';
//   const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;

//   useEffect(() => {
//     // Add null check for postLikes
//     setLikes(item?.postLikes || []);
//   }, [item?.postLikes]);

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
//         const res = await removePostLike(item.id, currentUser.id);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//         }
//       } else {
//         const newLike = {
//           userId: currentUser.id,
//           postId: item.id
//         };
//         setLikes([...likes, newLike]);
//         const res = await createPostLike(newLike);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//         }
//       }
//     } catch (error) {
//       console.error('Like error:', error);
//       Alert.alert('Error', 'Something went wrong');
//     }
//   }

//   // const onShare = async () => {
//   //   try {
//   //     setLoading(true);
//   //     const shareData = {
//   //       message: stripHtmlTags(item?.body || '')
//   //     };
      
//   //     if (item?.file) {
//   //       const fileUrl = getSupabaseFileUrl(item.file).uri;
//   //       shareData.fileUrl = fileUrl;
//   //     }
      
//   //     await shareContent(shareData);
//   //   } catch (error) {
//   //     console.error('Share error:', error);
//   //     Alert.alert('Error', 'Unable to share post');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }

//   const onShare = async () => {
//     try {
//       setLoading(true);
//       const postTitle = item?.title || "Check out this post!";
//       const postText = stripHtmlTags(item?.body || '');
      
//       // Create a more shareable message that works well across platforms
//       const shareMessage = `${postText}\n\nShared from AppName`;
      
//       const shareData = {
//         message: shareMessage,
//         title: postTitle
//       };
      
//       if (item?.file) {
//         const fileUrl = getSupabaseFileUrl(item.file).uri;
//         shareData.fileUrl = fileUrl;
//       }
      
//       await shareContent(shareData);
//     } catch (error) {
//       console.error('Share error:', error);
//       Alert.alert('Error', 'Unable to share post');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePostDelete = () => {
//     if (typeof showDelete === 'function') {
//               showDelete(item);
//           }
//       }

//   if (!item) return null;

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           {/* <Avatar
//             size={hp(4.5)}
//             uri={item?.user?.image}
//             rounded={theme.radius.lg}
//           /> */}
//           <View style={{gap: 2}}>
//             {/* <Text style={styles.username}>{item?.user?.name || 'Anonymous'}</Text> */}
//             <Text style={styles.username}>Created on {createdat}</Text>
//           </View>
//         </View>

//         {/* {showMoreIcon && (
//           <TouchableOpacity onPress={openPostDetails}>
//             <Icon 
//               name='threeDotsHorizontal'
//               size={hp(3.8)}
//               strokeWidth={3}
//               color={theme.colors.text}
//             />
//           </TouchableOpacity>
//         )} */}

//          {/* post edit components */}
//         {
//           showDelete && currentUser?.id === item?.userId && (
//             <View style={styles.actions}>
//                  <TouchableOpacity onPress={()=> onEdit(item)}>
//                      <Icon 
//                      name='edit'
//                      size={hp(2.5)}
//                      color={theme.colors.text}
//                      ></Icon>
//                  </TouchableOpacity>
//                  <TouchableOpacity onPress={handlePostDelete}>
//                      <Icon 
//                      name='delete'
//                      size={hp(2.5)}
//                      color={theme.colors.rose}
//                      ></Icon>
//                  </TouchableOpacity>
               
//             </View>
//           )
//         }
//       </View>

//       <View style={styles.content}>
//         <View style={styles.postBody}>
//           {item?.body && (
//             <RenderHtml
//               contentWidth={wp(100)}
//               source={{html: item.body}}
//               tagsStyles={tagsStyles}
//             />
//           )}
//         </View>
//       </View>

//       {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
//           transition={100}
//           style={styles.postMedia}
//           contentFit='cover'
//         />
//       )}
   
//       {item?.file?.includes('postVideo') && (
//         <Video
//           style={styles.postMedia}
//           source={getSupabaseFileUrl(item.file)}
//           useNativeControls 
//           resizeMode='cover'
//           isLooping
//         />
//       )}

//       <View style={styles.footer}>
//         <View style={[styles.footerButton, { width: 60 }]}>
//           <TouchableOpacity onPress={onLike}>
//             <Icon 
//               name='heart' 
//               size={24} 
//               fill={liked ? theme.colors.rose : 'transparent'} 
//               strokeWidth={1.4} 
//               color={liked ? theme.colors.blue : theme.colors.textDark}
//             />
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {likes?.length || 0}
//           </Text>
//         </View>
//         <View style={[styles.footerButton, { width: 60 }]}>
//           <TouchableOpacity onPress={openPostDetails}>
//             <Icon name='comment' size={24} strokeWidth={2} />
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {item?.comments?.[0]?.count || 0}
//           </Text>
//         </View>
//         {/* <View style={[styles.footerButton, { width: 60 }]}>
//           {loading ? (
//             <Loading size="small" />
//           ) : (
//             <TouchableOpacity onPress={onShare}>
//               <Icon name='share' size={24} strokeWidth={2}/>
//             </TouchableOpacity>
//           )}
//         </View> */}
//       </View>
//     </View>
//   )
// }

// export default PostCard

// const styles = StyleSheet.create({
//   container:{
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl*1.1,
//     borderCurve: 'continuous', 
//     padding: 10,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderWidth: 0.5,
//     borderColor: theme.colors.gray,
//     shadowColor: '#000'
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: wp(1.4),
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.textDark,
//     fontWeight: theme.fonts.medium
//   },
//   userInfo: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 8,
//   },
//   postTime: {
//     fontSize: hp(1.5), 
//     color: theme.colors.textLight,
//     fontWeight: theme.fonts.medium
//   },
//   content: {
//    gap: 10,
//    marginLeft: 12,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//   },
//   // postBody: {
//   //   marginLeft: 1
//   // },
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingLeft: 14,
//     // Remove gap as we're using fixed widths
//   },
//   footerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     // Remove marginLeft as we're using fixed widths
//   },
//   actions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 18,
//     marginRight: 7
//   },
//   count: {
//     color: theme.colors.text,
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium
//   }
 
// })
















// import {  Text,View, StyleSheet, TouchableOpacity, Image, Alert, Share } from 'react-native'
// import React, { useEffect, useState } from 'react'
// import theme from '../constants/theme'
// import { wp, hp, stripHtmlTags } from '../helpers/common'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { downloadFile, shareContent } from '../services/imageService'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import { createPostLike, removePostLike } from '../services/postService'
// import Loading from './Loading'

// const textStyle = {
//   color: theme.colors.dark, 
//   fontSize: hp(1.75)
// }

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: {
//     color: theme.colors.dark,
//   },
//   h4: {
//     color: theme.colors.dark
//   }
// }

// const PostCard = ({
//   item = {},  // Provide default empty object
//   currentUser,
//   router,
//   hasShadow = true,
//   showMoreIcon = true,
//   showDelete = false, 
//   onDelete = () => {}, 
//   onEdit = () => {}
// }) => {
//   const shadowStyle = {
//     shadowOffset: {
//       width: 0, height: 2
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 6,
//     elevation: 1
//   }
  
//   const [likes, setLikes] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // Add null checks for item
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';
//   const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;

//   useEffect(() => {
//     // Add null check for postLikes
//     setLikes(item?.postLikes || []);
//   }, [item?.postLikes]);

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
//         const res = await removePostLike(item.id, currentUser.id);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//         }
//       } else {
//         const newLike = {
//           userId: currentUser.id,
//           postId: item.id
//         };
//         setLikes([...likes, newLike]);
//         const res = await createPostLike(newLike);
//         if (!res.success) {
//           Alert.alert('Post', 'Something went wrong');
//           setLikes(likes); // Revert on error
//         }
//       }
//     } catch (error) {
//       console.error('Like error:', error);
//       Alert.alert('Error', 'Something went wrong');
//     }
//   }

//   const handlePostDelete = () => {
//     if (typeof showDelete === 'function') {
//               showDelete(item);
//           }
//       }

//   if (!item) return null;

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           <View style={{gap: 2}}>
//             {/* <Text style={styles.username}>{item?.user?.name || 'Anonymous'}</Text> */}
//             <Text style={styles.username}>Created on {createdat}</Text>
//           </View>
//         </View>


//          {/* post edit components */}
//         {
//           showDelete && currentUser?.id === item?.userId && (
//             <View style={styles.actions}>
//                  <TouchableOpacity onPress={()=> onEdit(item)}>
//                      <Icon 
//                      name='edit'
//                      size={hp(2.5)}
//                      color={theme.colors.text}
//                      ></Icon>
//                  </TouchableOpacity>
//                  <TouchableOpacity onPress={handlePostDelete}>
//                      <Icon 
//                      name='delete'
//                      size={hp(2.5)}
//                      color={theme.colors.rose}
//                      ></Icon>
//                  </TouchableOpacity>
               
//             </View>
//           )
//         }
//       </View>

//       <View style={styles.content}>
//         <View style={styles.postBody}>
//           {item?.body && (
//             <RenderHtml
//               contentWidth={wp(100)}
//               source={{html: item.body}}
//               tagsStyles={tagsStyles}
//             />
//           )}
//         </View>
//       </View>

//       {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
//           transition={100}
//           style={styles.postMedia}
//           contentFit='cover'
//         />
//       )}
   
//       {item?.file?.includes('postVideo') && (
//         <Video
//           style={styles.postMedia}
//           source={getSupabaseFileUrl(item.file)}
//           useNativeControls 
//           resizeMode='cover'
//           isLooping
//         />
//       )}


//       {/* below is the footer for the heart comment */}

//       <View style={styles.footer}>
//         <View style={[styles.footerButton, { width: 60 }]}>
//           <TouchableOpacity onPress={onLike}>
//             <Icon 
//               name='heart' 
//               size={24} 
//               fill={liked ? theme.colors.rose : 'transparent'} 
//               strokeWidth={1.4} 
//               color={liked ? theme.colors.blue : theme.colors.textDark}
//             />
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {likes?.length || 0}
//           </Text>
//         </View>
//         <View style={[styles.footerButton, { width: 60 }]}>
//           <TouchableOpacity onPress={openPostDetails}>
//             <Icon name='comment' size={24} strokeWidth={2} />
//           </TouchableOpacity>
//           <Text style={styles.count}>
//             {item?.comments?.[0]?.count || 0}
//           </Text>
//         </View>
       
//       </View>
//     </View>
//   )
// }

// export default PostCard

// const styles = StyleSheet.create({
//   container:{
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl*1.1,
//     borderCurve: 'continuous', 
//     padding: 10,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderWidth: 0.5,
//     borderColor: theme.colors.gray,
//     shadowColor: '#000'
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: wp(1.4),
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.textDark,
//     fontWeight: theme.fonts.medium
//   },
//   userInfo: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 8,
//   },
//   postTime: {
//     fontSize: hp(1.5), 
//     color: theme.colors.textLight,
//     fontWeight: theme.fonts.medium
//   },
//   content: {
//    gap: 10,
//    marginLeft: 12,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//   },
//   // postBody: {
//   //   marginLeft: 1
//   // },
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingLeft: 14,
//     // Remove gap as we're using fixed widths
//   },
//   footerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     // Remove marginLeft as we're using fixed widths
//   },
//   actions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 18,
//     marginRight: 7
//   },
//   count: {
//     color: theme.colors.text,
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium
//   }
 
// })







// import { Text, View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native'
// import React, { useEffect, useState } from 'react'
// import theme from '../constants/theme'
// import { wp, hp } from '../helpers/common'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import PostFooter from './PostFooter'
// import { usePost } from '../contexts/PostContext';

// const textStyle = {
//   color: theme.colors.dark, 
//   fontSize: hp(1.75)
// }

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: {
//     color: theme.colors.dark,
//   },
//   h4: {
//     color: theme.colors.dark
//   }
// }

// const PostCard = ({
//   item = {},
//   currentUser,
//   router,
//   hasShadow = true,
//   showMoreIcon = true,
//   showDelete = false, 
//   onDelete = () => {}, 
//   onEdit = () => {}
// }) => {
//   const { registerPost } = usePost();

//   // Register this post with the context when it's mounted
//   useEffect(() => {
//     if (item?.id) {
//       registerPost(item.id, item);
//     }
//   }, [item]);

//   const shadowStyle = {
//     shadowOffset: {
//       width: 0, height: 2
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 6,
//     elevation: 1
//   }
  
//   // Add null checks for item
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

//   const handlePostDelete = () => {
//     if (typeof showDelete === 'function') {
//       showDelete(item);
//     }
//   }

//   if (!item) return null;

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       <View style={styles.header}>

//         {/* here in below view need to place set of tags */}
//         <View style={styles.userInfo}>
//           <View style={{gap: 2}}>
//             <Text style={styles.created}>{createdat}</Text>
//           </View>
//         </View>

//         {/* post edit components */}
//         {
//           showDelete && currentUser?.id === item?.userId && (
//             <View style={styles.actions}>
//               <TouchableOpacity onPress={()=> onEdit(item)}>
//                 <Icon 
//                   name='edit'
//                   size={hp(2.5)}
//                   color={theme.colors.text}
//                 />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={handlePostDelete}>
//                 <Icon 
//                   name='delete'
//                   size={hp(2.5)}
//                   color={theme.colors.rose}
//                 />
//               </TouchableOpacity>
//             </View>
//           )
//         }
//       </View>

//       {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
//           transition={100}
//           style={styles.postMedia}
//           contentFit='cover'
//         />
//       )}
   
//       {item?.file?.includes('postVideo') && (
//         <Video
//           style={styles.postMedia}
//           source={getSupabaseFileUrl(item.file)}
//           useNativeControls 
//           resizeMode='cover'
//           isLooping
//         />
//       )}

//     <View style={styles.content}>
//             <View style={styles.postBody}>
//               {item?.body && (
//                 <RenderHtml
//                   contentWidth={wp(100)}
//                   source={{html: item.body}}
//                   tagsStyles={tagsStyles}
//                 />
//               )}
//             </View>
//           </View>

//       {/* Using the new PostFooter component */}
//       <PostFooter 
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         showMoreIcon={showMoreIcon}
//       />
//     </View>
//   )
// }

// export default PostCard

// const styles = StyleSheet.create({
//   container:{
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl*1.1,
//     borderCurve: 'continuous', 
//     padding: 10,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderWidth: 0.5,
//     borderColor: theme.colors.gray,
//     shadowColor: '#000'
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: wp(1.4),
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.textDark,
//     fontWeight: theme.fonts.medium
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   postTime: {
//     fontSize: hp(1.5), 
//     color: theme.colors.textLight,
//     fontWeight: theme.fonts.medium
//   },
//   content: {
//     gap: 10,
//     marginLeft: 12,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//   },
//   actions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 18,
//     marginRight: 7
//   },
//   created: {
//     color: 'black',  
//     fontSize: hp(1.5),
//     fontWeight: theme.fonts.small
//   },
// })


import { Text, View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import theme from '../constants/theme'
import { wp, hp } from '../helpers/common'
import Icon from '../assets/icons'
import moment from 'moment/moment'
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { getSupabaseFileUrl } from '../services/userProfileImage'
import PostFooter from './PostFooter'
import { usePost } from '../contexts/PostContext';

const textStyle = {
  color: theme.colors.dark, 
  fontSize: hp(1.75)
}

const tagsStyles = {
  div: textStyle,
  p: textStyle,
  ol: textStyle,
  h1: {
    color: theme.colors.dark,
  },
  h4: {
    color: theme.colors.dark
  }
}

const PostCard = ({
  item = {},
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = false, 
  onDelete = () => {}, 
  onEdit = () => {}
}) => {
  const { registerPost } = usePost();

  // Register this post with the context when it's mounted
  useEffect(() => {
    if (item?.id) {
      registerPost(item.id, item);
    }
  }, [item]);

  const shadowStyle = {
    shadowOffset: {
      width: 0, height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 1
  }
  
  // Add null checks for item
  const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

  // Parse tags from the item
  let parsedTags = item?.tags || [];
  if (typeof item?.tags === 'string') {
    try {
      parsedTags = JSON.parse(item.tags);
    } catch (e) {
      parsedTags = [];
    }
  }

  const handlePostDelete = () => {
    if (typeof showDelete === 'function') {
      showDelete(item);
    }
  }

  if (!item) return null;

  return (
    <View style={[styles.container, hasShadow && shadowStyle]}>
      <View style={styles.header}>
        {/* Tags section on the left */}
        <View style={styles.tagsContainer}>
          {Array.isArray(parsedTags) && parsedTags.length > 0 ? (
            parsedTags.slice(0, 3).map((tag, index) => (
              <View 
                key={index} 
                style={styles.tagPill}
              >
                <Text style={styles.tagPillText}>#{tag}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noTagsText}>PloTwist</Text>
          )}
          {parsedTags.length > 3 && (
            <Text style={styles.moreTagsText}>+{parsedTags.length - 3}</Text>
          )}
        </View>

        {/* Date on the right */}
        <View style={styles.dateContainer}>
          <Text style={styles.created}>{createdat}</Text>
        </View>

        {/* post edit components */}
        {
          showDelete && currentUser?.id === item?.userId && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={()=> onEdit(item)}>
                <Icon 
                  name='edit'
                  size={hp(2.5)}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePostDelete}>
                <Icon 
                  name='delete'
                  size={hp(2.5)}
                  color={theme.colors.rose}
                />
              </TouchableOpacity>
            </View>
          )
        }
      </View>

      {item?.file?.includes('postImage') && (
        <Image
          source={getSupabaseFileUrl(item.file)} 
          transition={100}
          style={styles.postMedia}
          contentFit='cover'
        />
      )}
   
      {item?.file?.includes('postVideo') && (
        <Video
          style={styles.postMedia}
          source={getSupabaseFileUrl(item.file)}
          useNativeControls 
          resizeMode='cover'
          isLooping
        />
      )}

      <View style={styles.content}>
        <View style={styles.postBody}>
          {item?.body && (
            <RenderHtml
              contentWidth={wp(100)}
              source={{html: item.body}}
              tagsStyles={tagsStyles}
            />
          )}
        </View>
      </View>

      {/* Using the new PostFooter component */}
      <PostFooter 
        item={item}
        currentUser={currentUser}
        router={router}
        showMoreIcon={showMoreIcon}
      />
    </View>
  )
}

export default PostCard

const styles = StyleSheet.create({
  container:{
    gap: 10, 
    marginBottom: 15, 
    borderRadius: theme.radius.xxl*1.1,
    borderCurve: 'continuous', 
    padding: 10,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    shadowColor: '#000'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(1.4),
    marginBottom: hp(1),
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginLeft: 6,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.secondary || '#F0F0F0',
    borderWidth: 1,
    borderColor: theme.colors.border || '#E0E0E0',
  },
  tagPillText: {
    fontSize: hp(1.3),
    fontWeight: '600',
    color: theme.colors.primary || '#0095F6',
  },
  noTagsText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight || '#A8A8A8',
    fontStyle: 'italic',
  },
  moreTagsText: {
    fontSize: hp(1.3),
    color: theme.colors.textLight || '#A8A8A8',
    marginLeft: 4,
  },
  dateContainer: {
    marginLeft: 8,
  },
  created: {
    color: theme.colors.textDark || 'black',  
    fontSize: hp(1.5),
    fontWeight: theme.fonts.small,
    marginRight: 8,
  },
  postTime: {
    fontSize: hp(1.5), 
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium
  },
  content: {
    gap: 10,
    marginLeft: 12,
  },
  postMedia: {
    height: hp(40),
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginLeft: 12
  },
})