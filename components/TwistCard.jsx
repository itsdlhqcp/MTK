// import { Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native'
// import React, { useEffect } from 'react'
// import theme from '../constants/theme'
// import { wp, hp } from '../helpers/common'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TwistFooter from './TwistFooter'
// import { usePost } from '../contexts/PostContext';

// const textStyle = {
//   color: theme.colors.dark, 
//   fontSize: hp(1.75)
// }

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: { color: theme.colors.dark },
//   h4: { color: theme.colors.dark }
// }

// const TwistCard = ({
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

//   useEffect(() => {
//     if (item?.id) {
//       registerPost(item.id, item);
//     }
//   }, [item]);

//   const shadowStyle = {
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 6,
//     elevation: 1
//   }
  
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

//   let parsedTags = item?.tags || [];
//   if (typeof item?.tags === 'string') {
//     try {
//       parsedTags = JSON.parse(item.tags);
//     } catch (e) {
//       parsedTags = [];
//     }
//   }

//   const handlePostDelete = () => {
//     if (typeof showDelete === 'function') {
//       showDelete(item);
//     }
//   }

//   if (!item) return null;

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       {/* Header: User Info + Menu */}
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           {/* User avatar + username */}
//           <Text style={styles.username}>{item?.username || 'Username'}</Text>
//         </View>

//         {/* Right side items (date + menu) */}
//         <View style={styles.headerRight}>
//           <Text style={styles.created}>{createdat}</Text>
//           {showMoreIcon && (
//             <TouchableOpacity>
//               <Icon name="more" size={hp(2.2)} color={theme.colors.textDark} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Media Content */}
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

//       {/* Tags below media */}
//       <View style={styles.tagsContainer}>
//         {Array.isArray(parsedTags) && parsedTags.length > 0 ? (
//           parsedTags.slice(0, 3).map((tag, index) => (
//             <View key={index} style={styles.tagPill}>
//               <Text style={styles.tagPillText}>#{tag}</Text>
//             </View>
//           ))
//         ) : (
//           <Text style={styles.noTagsText}>PloTwist</Text>
//         )}
//         {parsedTags.length > 3 && (
//           <Text style={styles.moreTagsText}>+{parsedTags.length - 3}</Text>
//         )}
//       </View>

//       {/* Post content/body */}
//       {item?.body && (
//         <View style={styles.content}>
//           <RenderHtml
//             contentWidth={wp(100)}
//             source={{html: item.body}}
//             tagsStyles={tagsStyles}
//           />
//         </View>
//       )}

//       {/* Instagram-like footer */}
//       <TwistFooter 
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         showMoreIcon={showMoreIcon}
//       />
//     </View>
//   )
// }

// export default TwistCard

// const styles = StyleSheet.create({
//   container: {
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl * 1.1,
//     borderCurve: 'continuous', 
//     padding: 14,
//     paddingVertical: 12,
//     backgroundColor: 'white',
//     borderWidth: 0.5,
//     borderColor: theme.colors.gray,
//     shadowColor: '#000',
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(1),
//     marginBottom: hp(1),
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.textDark,
//     fontWeight: theme.fonts.medium
//   },
//   created: {
//     color: theme.colors.textDark,  
//     fontSize: hp(1.5),
//     fontWeight: theme.fonts.small,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 6,
//     paddingHorizontal: wp(1.4),
//     marginTop: 8,
//   },
//   tagPill: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     backgroundColor: theme.colors.secondary || '#F0F0F0',
//     borderWidth: 1,
//     borderColor: theme.colors.border || '#E0E0E0',
//   },
//   tagPillText: {
//     fontSize: hp(1.3),
//     fontWeight: '600',
//     color: theme.colors.primary || '#0095F6',
//   },
//   noTagsText: {
//     fontSize: hp(1.3),
//     color: theme.colors.textLight || '#A8A8A8',
//     fontStyle: 'italic',
//   },
//   moreTagsText: {
//     fontSize: hp(1.3),
//     color: theme.colors.textLight || '#A8A8A8',
//     marginLeft: 4,
//   },
//   content: {
//     paddingHorizontal: wp(1.4),
//     marginTop: 4,
//   },
// });








// import { Text, View, StyleSheet, TouchableOpacity, Image ,Linking } from 'react-native'
// import React, { useEffect } from 'react'
// import theme from '../constants/theme'
// import { wp, hp } from '../helpers/common'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TwistFooter from './TwistFooter'
// import { usePost } from '../contexts/PostContext';
// import { extractYouTubeID, getYouTubeThumbnail } from '../helpers/youtubeHelper';

// const textStyle = {
//   color: theme.colors.light || '#E0E0E0', 
//   fontSize: hp(1.75)
// }

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: { color: theme.colors.light || '#E0E0E0' },
//   h4: { color: theme.colors.light || '#E0E0E0' }
// }

// const TwistCard = ({
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

//   useEffect(() => {
//     if (item?.id) {
//       registerPost(item.id, item);
//     }
//   }, [item]);

//   const shadowStyle = {
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.4,
//     shadowRadius: 5,
//     shadowColor: '#000',
//     elevation: 4
//   }
  
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

//   let parsedTags = item?.tags || [];
//   if (typeof item?.tags === 'string') {
//     try {
//       parsedTags = JSON.parse(item.tags);
//     } catch (e) {
//       parsedTags = [];
//     }
//   }

//   const handlePostDelete = () => {
//     if (typeof showDelete === 'function') {
//       showDelete(item);
//     }
//   }

//   if (!item) return null;

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       {/* Header: User Info + Menu */}
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           {/* User avatar + username */}
//           <Text style={styles.username}>{item?.username || 'Username'}</Text>
//         </View>

//         {/* Right side items (date + menu) */}
//         <View style={styles.headerRight}>
//           <Text style={styles.created}>{createdat}</Text>
//           {showMoreIcon && (
//             <TouchableOpacity>
//               <Icon name="more" size={hp(2.2)} color={theme.colors.light || '#E0E0E0'} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Media Content */}
//       {/* {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
//           transition={100}
//           style={styles.postMedia}
//           contentFit='cover'
//         />
//       )} */}
   
//       {/* {item?.file?.includes('postVideo') && (
//         <Video
//           style={styles.postMedia}
//           source={getSupabaseFileUrl(item.file)}
//           useNativeControls 
//           resizeMode='cover'
//           isLooping
//         />
//       )} */}

//       {/* Media Content */}
//         {item?.file?.includes('postImage') && (
//           <Image
//             source={getSupabaseFileUrl(item.file)} 
//             transition={100}
//             style={styles.postMedia}
//             contentFit='cover'
//           />
//         )}

//         {item?.file?.includes('postVideo') && (
//           <Video
//             style={styles.postMedia}
//             source={getSupabaseFileUrl(item.file)}
//             useNativeControls 
//             resizeMode='cover'
//             isLooping
//           />
//         )}

//         {/* YouTube Content */}
//         {item?.youtubeLink && (() => {
//           const videoId = extractYouTubeID(item.youtubeLink);
//           if (!videoId) return null;
          
//           return (
//             <TouchableOpacity 
//               style={styles.postMedia}
//               onPress={() => Linking.openURL(item.youtubeLink)}
//             >
//               <Image
//                 source={{ uri: getYouTubeThumbnail(videoId) }}
//                 style={{ width: '100%', height: '100%' }}
//                 resizeMode="cover"
//               />
//               <View style={styles.youtubePlayButton}>
//                 <Icon name="video" size={30} color="#fff" />
//               </View>
//               <View style={styles.youtubeOverlay}>
//                 <Text style={styles.youtubeText}>YouTube</Text>
//               </View>
//             </TouchableOpacity>
//           );
//         })()}

//       {/* Tags below media */}
//       {/* <View style={styles.tagsContainer}>
//         {Array.isArray(parsedTags) && parsedTags.length > 0 ? (
//           parsedTags.slice(0, 3).map((tag, index) => (
//             <View key={index} style={styles.tagPill}>
//               <Text style={styles.tagPillText}>#{tag}</Text>
//             </View>
//           ))
//         ) : (
//           <Text style={styles.noTagsText}>PloTwist</Text>
//         )}
//         {parsedTags.length > 3 && (
//           <Text style={styles.moreTagsText}>+{parsedTags.length - 3}</Text>
//         )}
//       </View> */}

//       {/* Post content/body */}
//       {item?.body && (
//         <View style={styles.content}>
//           <RenderHtml
//             contentWidth={wp(100)}
//             source={{html: item.body}}
//             tagsStyles={tagsStyles}
//           />
//         </View>
//       )}

//       {/* Instagram-like footer */}
//       <TwistFooter 
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         showMoreIcon={showMoreIcon}
//       />
//     </View>
//   )
// }

// export default TwistCard

// const styles = StyleSheet.create({
//   container: {
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl * 1.1,
//     borderCurve: 'continuous', 
//     padding: 14,
//     paddingVertical: 12,
//     backgroundColor: '#1A1A1A', // Dark background
//     borderWidth: 1,
//     borderColor: '#333333', // Darker border
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(1),
//     marginBottom: hp(1),
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.light || '#E0E0E0',
//     fontWeight: theme.fonts.medium
//   },
//   created: {
//     color: theme.colors.gray || '#AAAAAA',  
//     fontSize: hp(1.5),
//     fontWeight: theme.fonts.small,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 6,
//     paddingHorizontal: wp(1.4),
//     marginTop: 8,
//   },
//   tagPill: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     backgroundColor: '#2D2D2D', // Darker tag background
//     borderWidth: 1,
//     borderColor: '#3A3A3A', // Subtle border
//   },
//   tagPillText: {
//     fontSize: hp(1.3),
//     fontWeight: '600',
//     color: theme.colors.primary || '#0095F6',
//   },
//   noTagsText: {
//     fontSize: hp(1.3),
//     color: theme.colors.gray || '#AAAAAA',
//     fontStyle: 'italic',
//   },
//   moreTagsText: {
//     fontSize: hp(1.3),
//     color: theme.colors.gray || '#AAAAAA',
//     marginLeft: 4,
//   },
//   content: {
//     paddingHorizontal: wp(1.4),
//     marginTop: 4,
//   },
//   youtubePlayButton: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     width: 60,
//     height: 60,
//     marginLeft: -30,
//     marginTop: -30,
//     backgroundColor: 'rgba(255, 0, 0, 0.8)',
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   youtubeOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//   },
//   youtubeText: {
//     color: '#fff',
//     fontSize: hp(1.8),
//     fontWeight: 'bold',
//   }
// });



// import { Text, View, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native'
// import React, { useEffect, useState, useCallback } from 'react'
// import theme from '../constants/theme'
// import { wp, hp } from '../helpers/common'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TwistFooter from './TwistFooter'
// import { usePost } from '../contexts/PostContext';
// import { extractYouTubeID, getYouTubeThumbnail, fetchYouTubeMetadata } from '../helpers/youtubeHelper';

// const textStyle = {
//   color: theme.colors.light || '#E0E0E0', 
//   fontSize: hp(1.75)
// }

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: { color: theme.colors.light || '#E0E0E0' },
//   h4: { color: theme.colors.light || '#E0E0E0' }
// }

// const TwistCard = ({
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
//   const [youtubeMetadata, setYoutubeMetadata] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   useEffect(() => {
//     if (item?.id) {
//       registerPost(item.id, item);
//     }
//   }, [item?.id]);

//   // Improved YouTube metadata fetching with retry logic
//   const fetchYouTubeData = useCallback(async () => {
//     if (!item?.youtubeLink) return;
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       const videoId = extractYouTubeID(item.youtubeLink);
      
//       if (!videoId) {
//         throw new Error('Invalid YouTube URL');
//       }
      
//       const metadata = await fetchYouTubeMetadata(videoId);
      
//       if (!metadata) {
//         throw new Error('Could not fetch video metadata');
//       }
      
//       setYoutubeMetadata(metadata);
//     } catch (err) {
//       console.error('Error in TwistCard YouTube handling:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [item?.youtubeLink]);

//   // Fetch YouTube metadata when component mounts or youtubeLink changes
//   useEffect(() => {
//     fetchYouTubeData();
//   }, [fetchYouTubeData]);

//   const shadowStyle = {
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.4,
//     shadowRadius: 5,
//     shadowColor: '#000',
//     elevation: 4
//   }
  
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

//   let parsedTags = item?.tags || [];
//   if (typeof item?.tags === 'string') {
//     try {
//       parsedTags = JSON.parse(item.tags);
//     } catch (e) {
//       parsedTags = [];
//     }
//   }

//   if (!item) return null;

//   // Render YouTube component
//   const renderYouTubeContent = () => {
//     const videoId = extractYouTubeID(item?.youtubeLink);
//     if (!videoId) return null;
    
//     return (
//       <TouchableOpacity 
//         style={styles.postMedia}
//         onPress={() => Linking.openURL(item.youtubeLink)}
//         activeOpacity={0.9}
//       >
//         <Image
//           source={{ uri: getYouTubeThumbnail(videoId, 'max') }}
//           style={styles.youtubeImage}
//           resizeMode="cover"
//           defaultSource={require('../assets/images/iconsSvg/200.webp')} // Add a placeholder image
//         />
        
//         <View style={styles.youtubePlayButton}>
//           <Icon name="video" size={hp(3)} color="#fff" />
//         </View>
        
//         <View style={styles.youtubeOverlay}>
//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#fff" />
//               <Text style={styles.youtubeText}>Loading metadata...</Text>
//             </View>
//           ) : error ? (
//             <View>
//               <Text style={styles.youtubeTitle} numberOfLines={1}>
//                 YouTube Video
//               </Text>
//               <TouchableOpacity onPress={fetchYouTubeData}>
//                 <Text style={styles.retryText}>Tap to retry</Text>
//               </TouchableOpacity>
//             </View>
//           ) : youtubeMetadata ? (
//             <View>
//               <Text style={styles.youtubeTitle} numberOfLines={2} ellipsizeMode="tail">
//                 {youtubeMetadata.title}
//               </Text>
//               <Text style={styles.youtubeChannel} numberOfLines={1}>
//                 {youtubeMetadata.channelTitle || 'YouTube Channel'}
//               </Text>
//             </View>
//           ) : (
//             <Text style={styles.youtubeText}>YouTube</Text>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       {/* Header: User Info + Menu */}
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           {/* User avatar + username */}
//           <Text style={styles.username}>{item?.username || 'Username'}</Text>
//         </View>

//         {/* Right side items (date + menu) */}
//         <View style={styles.headerRight}>
//           <Text style={styles.created}>{createdat}</Text>
//           {showMoreIcon && (
//             <TouchableOpacity>
//               <Icon name="more" size={hp(2.2)} color={theme.colors.light || '#E0E0E0'} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Media Content */}
//       {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
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

//       {/* YouTube Content */}
//       {item?.youtubeLink && renderYouTubeContent()}

//       {/* Text Content */}
//       {item?.body && (
//         <View style={styles.content}>
//           <RenderHtml
//             contentWidth={wp(100)}
//             source={{html: item.body}}
//             tagsStyles={tagsStyles}
//           />
//         </View>
//       )}

//       {/* Footer */}
//       <TwistFooter 
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         showMoreIcon={showMoreIcon}
//       />
//     </View>
//   )
// }

// export default TwistCard

// const styles = StyleSheet.create({
//   container: {
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl * 1.1,
//     borderCurve: 'continuous', 
//     padding: 14,
//     paddingVertical: 12,
//     backgroundColor: '#1A1A1A', // Dark background
//     borderWidth: 1,
//     borderColor: '#333333', // Darker border
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(1),
//     marginBottom: hp(1),
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.light || '#E0E0E0',
//     fontWeight: theme.fonts.medium
//   },
//   created: {
//     color: theme.colors.gray || '#AAAAAA',  
//     fontSize: hp(1.5),
//     fontWeight: theme.fonts.small,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//     overflow: 'hidden',
//     backgroundColor: '#121212',
//   },
//   youtubeImage: {
//     width: '100%',
//     height: '100%',
//   },
//   content: {
//     paddingHorizontal: wp(1.4),
//     marginTop: 4,
//   },
//   youtubePlayButton: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     width: 60,
//     height: 60,
//     marginLeft: -30,
//     marginTop: -30,
//     backgroundColor: 'rgba(255, 0, 0, 0.8)',
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   youtubeOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     zIndex: 1,
//   },
//   youtubeText: {
//     color: '#fff',
//     fontSize: hp(1.8),
//     fontWeight: 'bold',
//   },
//   youtubeTitle: {
//     color: '#fff',
//     fontSize: hp(1.8),
//     fontWeight: 'bold',
//   },
//   youtubeChannel: {
//     color: '#ccc',
//     fontSize: hp(1.5),
//     marginTop: 2,
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   retryText: {
//     color: '#3ea6ff',
//     fontSize: hp(1.5),
//     marginTop: 2,
//   }
// });








// import { Text, View, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native'
// import React, { useEffect, useState, useCallback } from 'react'
// import theme from '../constants/theme'
// import { wp, hp } from '../helpers/common'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TwistFooter from './TwistFooter'
// import { usePost } from '../contexts/PostContext';
// import { extractYouTubeID, getYouTubeThumbnail, fetchYouTubeMetadata } from '../helpers/youtubeHelper';
// import YouTubePlayer from  "./YoutubePlayer"

// const textStyle = {
//   color: theme.colors.light || '#E0E0E0', 
//   fontSize: hp(1.75)
// }

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: { color: theme.colors.light || '#E0E0E0' },
//   h4: { color: theme.colors.light || '#E0E0E0' }
// }

// const TwistCard = ({
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
//   const [youtubeMetadata, setYoutubeMetadata] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
  
//   useEffect(() => {
//     if (item?.id) {
//       registerPost(item.id, item);
//     }
//   }, [item?.id]);

//   // Improved YouTube metadata fetching with retry logic
//   const fetchYouTubeData = useCallback(async () => {
//     if (!item?.youtubeLink) return;
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       const videoId = extractYouTubeID(item.youtubeLink);
      
//       if (!videoId) {
//         throw new Error('Invalid YouTube URL');
//       }
      
//       const metadata = await fetchYouTubeMetadata(videoId);
      
//       if (!metadata) {
//         throw new Error('Could not fetch video metadata');
//       }
      
//       setYoutubeMetadata(metadata);
//     } catch (err) {
//       console.error('Error in TwistCard YouTube handling:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [item?.youtubeLink]);

//   // Fetch YouTube metadata when component mounts or youtubeLink changes
//   useEffect(() => {
//     fetchYouTubeData();
//   }, [fetchYouTubeData]);

//   const shadowStyle = {
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.4,
//     shadowRadius: 5,
//     shadowColor: '#000',
//     elevation: 4
//   }
  
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

//   let parsedTags = item?.tags || [];
//   if (typeof item?.tags === 'string') {
//     try {
//       parsedTags = JSON.parse(item.tags);
//     } catch (e) {
//       parsedTags = [];
//     }
//   }

//   if (!item) return null;

//   // Toggle YouTube player visibility
//   const toggleYouTubePlayer = () => {
//     setShowYouTubePlayer(!showYouTubePlayer);
//   };

//   // Render YouTube component
//   const renderYouTubeContent = () => {
//     const videoId = extractYouTubeID(item?.youtubeLink);
//     if (!videoId) return null;
    
//     // If player is active, render the YouTube iframe player
//     if (showYouTubePlayer) {
//       return <YouTubePlayer videoId={videoId} onClose={toggleYouTubePlayer} />;
//     }
    
//     // Otherwise render the thumbnail with play button
//     return (
//       <TouchableOpacity 
//         style={styles.postMedia}
//         onPress={toggleYouTubePlayer} // Changed from Linking.openURL to toggle player
//         activeOpacity={0.9}
//       >
//         <Image
//           source={{ uri: getYouTubeThumbnail(videoId, 'max') }}
//           style={styles.youtubeImage}
//           resizeMode="cover"
//           defaultSource={require('../assets/images/iconsSvg/200.webp')}
//         />
        
//         <View style={styles.youtubePlayButton}>
//           <Icon name="video" size={hp(3)} color="#fff" />
//         </View>
        
//         <View style={styles.youtubeOverlay}>
//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#fff" />
//               <Text style={styles.youtubeText}>Loading metadata...</Text>
//             </View>
//           ) : error ? (
//             <View>
//               <Text style={styles.youtubeTitle} numberOfLines={1}>
//                 YouTube Video
//               </Text>
//               <TouchableOpacity onPress={fetchYouTubeData}>
//                 <Text style={styles.retryText}>Tap to retry</Text>
//               </TouchableOpacity>
//             </View>
//           ) : youtubeMetadata ? (
//             <View>
//               <Text style={styles.youtubeTitle} numberOfLines={2} ellipsizeMode="tail">
//                 {youtubeMetadata.title}
//               </Text>
//               <Text style={styles.youtubeChannel} numberOfLines={1}>
//                 {youtubeMetadata.channelTitle || 'YouTube Channel'}
//               </Text>
//             </View>
//           ) : (
//             <Text style={styles.youtubeText}>YouTube</Text>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       {/* Header: User Info + Menu */}
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           {/* User avatar + username */}
//           <Text style={styles.username}>{item?.username || 'Username'}</Text>
//         </View>

//         {/* Right side items (date + menu) */}
//         <View style={styles.headerRight}>
//           <Text style={styles.created}>{createdat}</Text>
//           {showMoreIcon && (
//             <TouchableOpacity>
//               <Icon name="more" size={hp(2.2)} color={theme.colors.light || '#E0E0E0'} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Media Content */}
//       {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
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

//       {/* YouTube Content */}
//       {item?.youtubeLink && renderYouTubeContent()}

//       {/* Text Content */}
//       {item?.body && (
//         <View style={styles.content}>
//           <RenderHtml
//             contentWidth={wp(100)}
//             source={{html: item.body}}
//             tagsStyles={tagsStyles}
//           />
//         </View>
//       )}

//       {/* Footer */}
//       <TwistFooter 
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         showMoreIcon={showMoreIcon}
//       />
//     </View>
//   )
// }

// export default TwistCard

// const styles = StyleSheet.create({
//   container: {
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl * 1.1,
//     borderCurve: 'continuous', 
//     padding: 14,
//     paddingVertical: 12,
//     backgroundColor: '#1A1A1A', // Dark background
//     borderWidth: 1,
//     borderColor: '#333333', // Darker border
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(1),
//     marginBottom: hp(1),
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.light || '#E0E0E0',
//     fontWeight: theme.fonts.medium
//   },
//   created: {
//     color: theme.colors.gray || '#AAAAAA',  
//     fontSize: hp(1.5),
//     fontWeight: theme.fonts.small,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//     overflow: 'hidden',
//     backgroundColor: '#121212',
//   },
//   youtubeImage: {
//     width: '100%',
//     height: '100%',
//   },
//   content: {
//     paddingHorizontal: wp(1.4),
//     marginTop: 4,
//   },
//   youtubePlayButton: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     width: 60,
//     height: 60,
//     marginLeft: -30,
//     marginTop: -30,
//     backgroundColor: 'rgba(255, 0, 0, 0.8)',
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   youtubeOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     zIndex: 1,
//   },
//   youtubeText: {
//     color: '#fff',
//     fontSize: hp(1.8),
//     fontWeight: 'bold',
//   },
//   youtubeTitle: {
//     color: '#fff',
//     fontSize: hp(1.8),
//     fontWeight: 'bold',
//   },
//   youtubeChannel: {
//     color: '#ccc',
//     fontSize: hp(1.5),
//     marginTop: 2,
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   retryText: {
//     color: '#3ea6ff',
//     fontSize: hp(1.5),
//     marginTop: 2,
//   }
// });


import { Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import theme from '../constants/theme';
import { wp, hp } from '../helpers/common';
import Icon from '../assets/icons';
import moment from 'moment/moment';
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { getSupabaseFileUrl } from '../services/userProfileImage';
import TwistFooter from './TwistFooter';
import { usePost } from '../contexts/PostContext';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Button } from 'react-native';
import Avatar from './Avatar';

const textStyle = {
  color: theme.colors.light || '#E0E0E0', 
  fontSize: hp(1.75)
};

const tagsStyles = {
  div: textStyle,
  p: textStyle,
  ol: textStyle,
  h1: { color: theme.colors.light || '#E0E0E0' },
  h4: { color: theme.colors.light || '#E0E0E0' }
};

// Function to extract YouTube ID from a URL
const extractYouTubeID = (url) => {
  if (!url) return null;
  
  // Check for youtu.be format
  let match = url.match(/youtu\.be\/([^?]+)/);
  if (match) return match[1];
  
  // Check for youtube.com format with v parameter
  match = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (match) return match[1];
  
  // Check for youtube.com/embed format
  match = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (match) return match[1];
  
  // Check for URL with ?si= parameter
  match = url.match(/\?si=([^&]+)/);
  const siParam = match ? match[1] : null;
  
  return siParam;
};

const TwistCard = ({
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
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [playing, setPlaying] = useState(false);

   const onStateChange = useCallback((state)=>{
      if (state === 'ended'){
        setPlaying(false);
        Alert.alert('Video Ended', 'Video has finished playing!');
      }
    }, []);
  
    const tooglePlaying = useCallback(()=>{
      setPlaying((prev) => !prev);
    }, []);
  
  useEffect(() => {
    if (item?.id) {
      registerPost(item.id, item);
    }
    
    // Extract YouTube ID from file if it's a YouTube link
    if (item?.file?.includes('youtube.com') || item?.file?.includes('youtu.be')) {
      const videoId = extractYouTubeID(item.file);
      setYoutubeVideoId(videoId);
    } 
    // Also check youtubeLink property
    else if (item?.youtubeLink) {
      const videoId = extractYouTubeID(item.youtubeLink);
      setYoutubeVideoId(videoId);
    }
  }, [item?.id, item?.file, item?.youtubeLink]);

  const shadowStyle = {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowColor: '#000',
    elevation: 4
  };
  
  const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

  let parsedTags = item?.tags || [];
  if (typeof item?.tags === 'string') {
    try {
      parsedTags = JSON.parse(item.tags);
    } catch (e) {
      parsedTags = [];
    }
  }

  if (!item) return null;

  // Render YouTube iframe
  const renderYouTubeContent = () => {
    if (!youtubeVideoId) return null;
    
    return (
      <View style={styles.youtubeContainer}>
        <YoutubeIframe
          height={200}
          play={playing}
          videoId={youtubeVideoId}
          onStateChange={onStateChange}
        />
         {/* <Button title={playing ? 'Pause' : 'Play'} onPress={tooglePlaying} /> */}
      </View>
    );
  };

  return (
    <View style={[styles.container, hasShadow && shadowStyle]}>
      {/* Header: User Info + Menu */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
           <Avatar
              uri={item?.user?.image}
              size={hp(3.5)}
              rounded={theme.radius.xl}
            />
          <Text style={styles.username}>{item?.user?.name || 'Username'}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.created}>{createdat}</Text>
          {showMoreIcon && (
            <TouchableOpacity>
              <Icon name="more" size={hp(2.2)} color={theme.colors.light || '#E0E0E0'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Media Content */}
      {item?.file?.includes('postImage') && (
        <Image
          source={getSupabaseFileUrl(item.file)} 
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

      {/* YouTube Content */}
      {youtubeVideoId && renderYouTubeContent()}

      {/* Text Content */}
      {item?.body && (
        <View style={styles.content}>
          <RenderHtml
            contentWidth={wp(100)}
            source={{html: item.body}}
            tagsStyles={tagsStyles}
          />
        </View>
      )}

      {/* Footer */}
      <TwistFooter 
        item={item}
        currentUser={currentUser}
        router={router}
        showMoreIcon={showMoreIcon}
      />
    </View>
  );
};

export default TwistCard;

const styles = StyleSheet.create({
  container: {
    gap: 10, 
    marginBottom: 15, 
    borderRadius: theme.radius.xxl * 1.1,
    borderCurve: 'continuous', 
    padding: 14,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(1),
    marginBottom: hp(1),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.light || '#E0E0E0',
    fontWeight: theme.fonts.medium
  },
  created: {
    color: theme.colors.gray || '#AAAAAA',  
    fontSize: hp(1.5),
    fontWeight: theme.fonts.small,
  },
  postMedia: {
    height: hp(40),
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  youtubeContainer: {
    height: 200,
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  content: {
    paddingHorizontal: wp(1.4),
    marginTop: 4,
  }
});

// import { Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
// import React, { useState, useEffect } from 'react';
// import theme from '../constants/theme';
// import { wp, hp } from '../helpers/common';
// import Icon from '../assets/icons';
// import moment from 'moment/moment';
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { getSupabaseFileUrl } from '../services/userProfileImage';
// import TwistFooter from './TwistFooter';
// import { usePost } from '../contexts/PostContext';
// import { extractYouTubeID, getYouTubeThumbnail } from '../helpers/youtubeHelper';
// import YouTubePlayer from './YoutubePlayer'; // Import the simplified component
// import YoutubeIframe from 'react-native-youtube-iframe';

// const textStyle = {
//   color: theme.colors.light || '#E0E0E0', 
//   fontSize: hp(1.75)
// };

// const tagsStyles = {
//   div: textStyle,
//   p: textStyle,
//   ol: textStyle,
//   h1: { color: theme.colors.light || '#E0E0E0' },
//   h4: { color: theme.colors.light || '#E0E0E0' }
// };

// const TwistCard = ({
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
//   const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);
//   const [youtubeVideoId, setYoutubeVideoId] = useState(null);
//   const [playing, setPlaying] = useState(false);
  
//   useEffect(() => {
//     if (item?.id) {
//       registerPost(item.id, item);
//     }
    
//     // Extract YouTube ID if there's a YouTube link
//     if (item?.youtubeLink) {
//       const videoId = extractYouTubeID(item.youtubeLink);
//       setYoutubeVideoId(videoId);
//     }
//   }, [item?.id, item?.youtubeLink]);

//   const shadowStyle = {
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.4,
//     shadowRadius: 5,
//     shadowColor: '#000',
//     elevation: 4
//   };
  
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

//   let parsedTags = item?.tags || [];
//   if (typeof item?.tags === 'string') {
//     try {
//       parsedTags = JSON.parse(item.tags);
//     } catch (e) {
//       parsedTags = [];
//     }
//   }

//   if (!item) return null;

//   // Toggle YouTube player visibility
//   const toggleYouTubePlayer = () => {
//     setShowYouTubePlayer(!showYouTubePlayer);
//   };

//   // Render YouTube content based on state #################
//   // #######################################################
//   // #######################################################
//   const renderYouTubeContent = () => {
//     if (!youtubeVideoId) return null;
    
//     if (showYouTubePlayer) {
//       return <YouTubePlayer videoId={youtubeVideoId} />;
     
//     }

//     console.log('renderYouTubeContent', youtubeVideoId);
    
//     return (
//       <TouchableOpacity 
//         style={styles.postMedia}
//         onPress={toggleYouTubePlayer}
//         activeOpacity={0.9}
//       >
//         <Image
//           source={{ uri: getYouTubeThumbnail(youtubeVideoId, 'max') }}
//           style={styles.youtubeImage}
//           resizeMode="cover"
//           defaultSource={require('../assets/images/iconsSvg/200.webp')}
//         />
        
//         <View style={styles.youtubePlayButton}>
//           <Icon name="video" size={hp(3)} color="#fff" />
//         </View>
        
//         <View style={styles.youtubeOverlay}>
//           <Text style={styles.youtubeText}>YouTube Video</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={[styles.container, hasShadow && shadowStyle]}>
//       {/* Header: User Info + Menu */}
//       <View style={styles.header}>
//         <View style={styles.userInfo}>
//           <Text style={styles.username}>{item?.username || 'Username'}</Text>
//         </View>

//         <View style={styles.headerRight}>
//           <Text style={styles.created}>{createdat}</Text>
//           {showMoreIcon && (
//             <TouchableOpacity>
//               <Icon name="more" size={hp(2.2)} color={theme.colors.light || '#E0E0E0'} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Media Content */}
//       {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
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

//       {/* YouTube Content */}
//       {item?.youtubeLink && renderYouTubeContent()}

//       {/* Text Content */}
//       {item?.body && (
//         <View style={styles.content}>
//           <RenderHtml
//             contentWidth={wp(100)}
//             source={{html: item.body}}
//             tagsStyles={tagsStyles}
//           />
//         </View>
//       )}



//       <View style={styles.content}>
//           <YoutubeIframe
//             height={200}
//             play={playing}
//             videoId={'1kVK0MZlbI4'}
//           />
//         </View>

//       {/* Footer */}
//       <TwistFooter 
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         showMoreIcon={showMoreIcon}
//       />
//     </View>
//   );
// };

// export default TwistCard;

// const styles = StyleSheet.create({
//   container: {
//     gap: 10, 
//     marginBottom: 15, 
//     borderRadius: theme.radius.xxl * 1.1,
//     borderCurve: 'continuous', 
//     padding: 14,
//     paddingVertical: 12,
//     backgroundColor: '#1A1A1A',
//     borderWidth: 1,
//     borderColor: '#333333',
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(1),
//     marginBottom: hp(1),
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.light || '#E0E0E0',
//     fontWeight: theme.fonts.medium
//   },
//   created: {
//     color: theme.colors.gray || '#AAAAAA',  
//     fontSize: hp(1.5),
//     fontWeight: theme.fonts.small,
//   },
//   postMedia: {
//     height: hp(40),
//     width: '100%',
//     borderRadius: theme.radius.xl,
//     borderCurve: 'continuous',
//     overflow: 'hidden',
//     backgroundColor: '#121212',
//   },
//   youtubeImage: {
//     width: '100%',
//     height: '100%',
//   },
//   content: {
//     paddingHorizontal: wp(1.4),
//     marginTop: 4,
//   },
//   youtubePlayButton: {
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     width: 60,
//     height: 60,
//     marginLeft: -30,
//     marginTop: -30,
//     backgroundColor: 'rgba(255, 0, 0, 0.8)',
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   youtubeOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     zIndex: 1,
//   },
//   youtubeText: {
//     color: '#fff',
//     fontSize: hp(1.8),
//     fontWeight: 'bold',
//   }
// });