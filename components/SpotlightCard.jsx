import { Text, View, StyleSheet, TouchableOpacity, Image, AppState } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import theme from '../constants/theme'
import { wp, hp } from '../helpers/common'
import Icon from '../assets/icons'
import moment from 'moment/moment'
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { getSupabaseFileUrl } from '../services/userProfileImage'
import SpotlightFooter from './SpotlightFooter'
import { usePost } from '../contexts/PostContext';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from './Avatar'

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

const SpotlightCard = ({
  item = {},
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = false, 
  onDelete = () => {}, 
  onEdit = () => {},
  isVisible
}) => {
  const { registerPost } = usePost();
  const videoRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [showReplayButton, setShowReplayButton] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isVisible]);

  // Register this post with the context when it's mounted
  useEffect(() => {
    if (item?.id) {
      registerPost(item.id, item);
    }
  }, [item]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        console.log('App has come to the foreground!');
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        console.log('App has gone to the background!');
        if (videoRef.current) {
          videoRef.current.pauseAsync();
        }
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle screen focus changes
  useFocusEffect(
    React.useCallback(() => {
      // Component is focused
      return () => {
        // Component is unfocused
        if (videoRef.current) {
          videoRef.current.pauseAsync();
        }
      };
    }, [])
  );
  
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
            <View style={styles.container}>


{/* <View style={styles.tagsContainer}>
  {Array.isArray(parsedTags) && parsedTags.map((tag, index) => {
    // Determine tag styling based on tag name
    let tagStyle = {};
    let tagTextStyle = {};
    
    if (tag.toLowerCase() === 'rumour') {
      // Red styling for rumor tags
      tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
      tagTextStyle = { color: '#f83a15' };
    } else if (tag.toLowerCase() === 'official') {
      // Blue styling for official tags
      tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
      tagTextStyle = { color: '#1581f8' };
    }else if (tag.toLowerCase() === 'anime') {
        // Blue styling for official tags
        tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
        tagTextStyle = { color: '#FFC300' };
      } else {
      // Default styling for other tags
      tagStyle = { 
        backgroundColor: theme.colors.secondary || '#262626',
        borderColor: theme.colors.border || '#333333' 
      };
      tagTextStyle = { color: theme.colors.primary || '#0095F6' };
    }
    
    return (
      <View 
        key={index} 
        style={[styles.tagPill, tagStyle]}
      >
        <Text style={[styles.tagPillText, tagTextStyle]}>#{tag}</Text>
      </View>
    );
  })}
</View> */}

         {/* Content section */}
         {/* <View style={styles.content}>
        {item?.body && (
          <RenderHtml
            contentWidth={wp(100)}
            source={{html: item.body}}
            tagsStyles={tagsStyles}
          />
        )}
      </View> */}

      {/* Media section */}
      {item?.file?.includes('postImage') && (
        <Image
          source={getSupabaseFileUrl(item.file)} 
          transition={100}
          style={styles.postMedia}
          contentFit='cover'
        />
      )}

      {item?.file?.includes('postVideo') && (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            style={styles.postMedia}
            source={getSupabaseFileUrl(item.file)}
            useNativeControls 
            resizeMode='cover'
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                setShowReplayButton(true);
              }
            }}
            onFullscreenUpdate={({ fullscreenUpdate }) => {
              if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS) {
                if (appStateVisible !== 'active') {
                  videoRef.current?.pauseAsync();
                }
              }
            }}
          />
          {showReplayButton && (
            <TouchableOpacity 
              style={styles.replayButton}
              onPress={() => {
                if (videoRef.current) {
                  videoRef.current.replayAsync({
                    shouldPlay: true,
                    positionMillis: 0
                  });
                  setShowReplayButton(false);
                }
              }}
            >
              <Icon 
                name='reload'
                size={hp(1.7)}
                color="white"
              />
            </TouchableOpacity>
          )}
        </View>
      )}

{/* <View style={styles.tagsContainer} >
        {Array.isArray(parsedTags) && parsedTags.map((tag, index) => {
            // Determine tag styling based on tag name
            let tagStyle = {};
            let tagTextStyle = {};
            
            if (tag.toLowerCase() === 'rumour') {
            // Red styling for rumor tags
            tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
            tagTextStyle = { color: '#f83a15' };
            } else if (tag.toLowerCase() === 'official') {
            // Blue styling for official tags
            tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
            tagTextStyle = { color: '#1581f8' };
            }else if (tag.toLowerCase() === 'anime') {
                // Blue styling for official tags
                tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
                tagTextStyle = { color: '#FFC300' };
            } else {
            // Default styling for other tags
            tagStyle = { 
                backgroundColor: theme.colors.secondary || '#262626',
                borderColor: theme.colors.border || '#333333' 
            };
            tagTextStyle = { color: theme.colors.primary || '#0095F6' };
            }
            
            return (
            <View 
                key={index} 
                style={[styles.tagPill, tagStyle]}
            >
                <Text style={[styles.tagPillText, tagTextStyle]}>#{tag}</Text>
            </View>
            );
        })}
        </View> */}

        {/* User header section - Instagram style */}
        <View style={styles.userHeader}>
                <View style={styles.userInfo}>

                <View style={styles.tagsContainer}>
        {Array.isArray(parsedTags) && parsedTags.map((tag, index) => {
            // Determine tag styling based on tag name
            let tagStyle = {};
            let tagTextStyle = {};
            
            if (tag.toLowerCase() === 'rumour') {
            // Red styling for rumor tags
            tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
            tagTextStyle = { color: '#f83a15' };
            } else if (tag.toLowerCase() === 'official') {
            // Blue styling for official tags
            tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
            tagTextStyle = { color: '#1581f8' };
            }else if (tag.toLowerCase() === 'anime') {
                // Blue styling for official tags
                tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
                tagTextStyle = { color: '#FFC300' };
            } else {
            // Default styling for other tags
            tagStyle = { 
                backgroundColor: theme.colors.secondary || '#262626',
                borderColor: theme.colors.border || '#333333' 
            };
            tagTextStyle = { color: theme.colors.primary || '#0095F6' };
            }
            
            return (
            <View 
                key={index} 
                style={[styles.tagPill, tagStyle]}
            >
                <Text style={[styles.tagPillText, tagTextStyle]}>#{tag}</Text>
            </View>
            );
        })}
        </View>

           {/* <Avatar
             uri={item?.profile}
            size={hp(3.5)}
            rounded={theme.radius.xl}
                      />
          
          <View>
            <Text style={styles.username}>
              {item.name || 'user'}
            </Text>
        
          </View> */}
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.created}>{createdat}</Text>
          {showDelete && currentUser?.id === item?.userId && (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => {}}
            >
              <Icon 
                name='more-vertical'
                size={hp(2.2)}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

    <View style={styles.content}>
        {item?.body && (
          <RenderHtml
            contentWidth={wp(100)}
            source={{html: item.body}}
            tagsStyles={tagsStyles}
          />
        )}
      </View>

      <SpotlightFooter
        item={item}
        currentUser={currentUser}
        router={router}
        showMoreIcon={showMoreIcon}
      />


      {/* Edit/Delete Modal Buttons (hidden by default) */}
      {showDelete && currentUser?.id === item?.userId && (
        <View style={styles.editOptions}>
          <TouchableOpacity 
            style={styles.editOption}
            onPress={() => onEdit(item)}
          >
            <Icon 
              name='edit'
              size={hp(2.2)}
              color={theme.colors.text}
            />
            <Text style={styles.editOptionText}>Edit Post</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.editOption, styles.deleteOption]}
            onPress={handlePostDelete}
          >
            <Icon 
              name='delete'
              size={hp(2.2)}
              color={theme.colors.rose}
            />
            <Text style={[styles.editOptionText, {color: theme.colors.rose}]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

       <View style={styles.greenBorderTop} />
    </View>
  )
}

export default SpotlightCard

const styles = StyleSheet.create({
  container: {
   marginVertical: 4,
    backgroundColor: '#121212',
    width: '100%',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileImage: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.light || '#FFFFFF',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moreButton: {
    padding: 4,
  },
  inlineTagsContainer: {
    flexDirection: 'row',
  },
  inlineTags: {
    fontSize: hp(1.3),
    color: theme.colors.textLight || '#A8A8A8',
  },
  created: {
    color: theme.colors.textLight || '#A8A8A8',
    fontSize: hp(1.4),
  },
  postMedia: {
    height: hp(50), 
    width: '100%',
    backgroundColor: '#2c2c2c',
  },
  content: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginBottom: hp(1),
  },
  videoContainer: {
    position: 'relative',
  },
  replayButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOptions: {
    position: 'absolute',
    right: wp(5),
    top: hp(8),
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: wp(30),
  },
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 10,
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginTop: 4,
    paddingTop: 8,
  },
  editOptionText: {
    fontSize: hp(1.6),
    color: theme.colors.light,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: hp(1),
    paddingTop: hp(1),
   // paddingHorizontal: wp(4),
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: hp(1.4),
    fontWeight: '600',
  },
  greenBorderTop: {
    width: '100%',
    height: hp(0.45), // Adjust thickness as needed
    backgroundColor: theme.colors.textLight,
    opacity: 0.2,
     // Green color
    // If you want a specific green from your theme:
    // backgroundColor: theme.colors.green || '#4CAF50',
  },
})




// import { Text, View, StyleSheet, TouchableOpacity, Image, AppState } from 'react-native'
// import React, { useEffect, useState, useRef } from 'react'
// import theme from '../constants/theme'
// import { wp, hp } from '../helpers/common'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { Video } from 'expo-av';
// import RenderHtml from 'react-native-render-html';
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import SpotlightFooter from './SpotlightFooter'
// import { usePost } from '../contexts/PostContext';
// import { useFocusEffect } from '@react-navigation/native';
// import Avatar from './Avatar'

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

// const SpotlightCard = ({
//   item = {},
//   currentUser,
//   router,
//   hasShadow = true,
//   showMoreIcon = true,
//   showDelete = false, 
//   onDelete = () => {}, 
//   onEdit = () => {},
//   isVisible
// }) => {
//   const { registerPost } = usePost();
//   const videoRef = useRef(null);
//   const appState = useRef(AppState.currentState);
//   const [appStateVisible, setAppStateVisible] = useState(appState.current);
//   const [showReplayButton, setShowReplayButton] = useState(false);

//   useEffect(() => {
//     if (videoRef.current) {
//       if (isVisible) {
//         videoRef.current.playAsync();
//       } else {
//         videoRef.current.pauseAsync();
//       }
//     }
//   }, [isVisible]);

//   // Register this post with the context when it's mounted
//   useEffect(() => {
//     if (item?.id) {
//       registerPost(item.id, item);
//     }
//   }, [item]);

//   // Handle app state changes (background/foreground)
//   useEffect(() => {
//     const subscription = AppState.addEventListener('change', nextAppState => {
//       if (
//         appState.current.match(/inactive|background/) && 
//         nextAppState === 'active'
//       ) {
//         // App has come to the foreground
//         console.log('App has come to the foreground!');
//       } else if (
//         appState.current === 'active' &&
//         nextAppState.match(/inactive|background/)
//       ) {
//         // App has gone to the background
//         console.log('App has gone to the background!');
//         if (videoRef.current) {
//           videoRef.current.pauseAsync();
//         }
//       }

//       appState.current = nextAppState;
//       setAppStateVisible(appState.current);
//     });

//     return () => {
//       subscription.remove();
//     };
//   }, []);

//   // Handle screen focus changes
//   useFocusEffect(
//     React.useCallback(() => {
//       // Component is focused
//       return () => {
//         // Component is unfocused
//         if (videoRef.current) {
//           videoRef.current.pauseAsync();
//         }
//       };
//     }, [])
//   );
  
//   // Add null checks for item
//   const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';

//   // Parse tags from the item
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
//     <View style={styles.container}>
//       {/* User header section - Instagram style */}
//       <View style={styles.userHeader}>
//         <View style={styles.userInfo}>
//           {/* Profile image placeholder - add actual user image if available */}
//           {/* <View style={styles.profileImage}>
//             <Icon 
//               name='user'
//               size={hp(2.2)}
//               color={theme.colors.light}
//             />
//           </View> */}

//            <Avatar
//              uri={item?.profile}
//             size={hp(3.5)}
//             rounded={theme.radius.xl}
//                       />
          
//           <View>
//             <Text style={styles.username}>
//               {item.name || 'user'}
//             </Text>
            
//             {/* Tags as small text below username */}
//             {/* <View style={styles.inlineTagsContainer}>
//               {Array.isArray(parsedTags) && parsedTags.length > 0 ? (
//                 <Text style={styles.inlineTags}>
//                   {parsedTags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
//                   {parsedTags.length > 3 ? ` +${parsedTags.length - 3}` : ''}
//                 </Text>
//               ) : (
//                 <Text style={styles.inlineTags}>PloTwist</Text>
//               )}
//             </View> */}
//           </View>
//         </View>
        
//         <View style={styles.headerRight}>
//           <Text style={styles.created}>{createdat}</Text>
//           {showDelete && currentUser?.id === item?.userId && (
//             <TouchableOpacity 
//               style={styles.moreButton}
//               onPress={() => {}}
//             >
//               <Icon 
//                 name='more-vertical'
//                 size={hp(2.2)}
//                 color={theme.colors.primary}
//               />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* <View style={styles.inlineTagsContainer}>
//               {Array.isArray(parsedTags) && parsedTags.length > 0 ? (
//                 <Text style={styles.inlineTags}>
//                   {parsedTags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
//                   {parsedTags.length > 3 ? ` +${parsedTags.length - 3}` : ''}
//                 </Text>
//               ) : (
//                 <Text style={styles.inlineTags}>PloTwist</Text>
//               )}
//             </View> */}

// {/* <View style={styles.tagsContainer}>
//         {Array.isArray(parsedTags) && parsedTags.map((tag, index) => (
//           <View 
//             key={index} 
//             style={[styles.tagPill, { 
//               backgroundColor: theme.colors.secondary || '#262626',
//               borderColor: theme.colors.border || '#333333' 
//             }]}
//           >
//             <Text style={[styles.tagPillText, { color: theme.colors.primary || '#0095F6' }]}>#{tag}</Text>
//           </View>
//         ))}
//       </View> */}

// <View style={styles.tagsContainer}>
//   {Array.isArray(parsedTags) && parsedTags.map((tag, index) => {
//     // Determine tag styling based on tag name
//     let tagStyle = {};
//     let tagTextStyle = {};
    
//     if (tag.toLowerCase() === 'rumour') {
//       // Red styling for rumor tags
//       tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
//       tagTextStyle = { color: '#f83a15' };
//     } else if (tag.toLowerCase() === 'official') {
//       // Blue styling for official tags
//       tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
//       tagTextStyle = { color: '#1581f8' };
//     }else if (tag.toLowerCase() === 'anime') {
//         // Blue styling for official tags
//         tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
//         tagTextStyle = { color: '#FFC300' };
//       } else {
//       // Default styling for other tags
//       tagStyle = { 
//         backgroundColor: theme.colors.secondary || '#262626',
//         borderColor: theme.colors.border || '#333333' 
//       };
//       tagTextStyle = { color: theme.colors.primary || '#0095F6' };
//     }
    
//     return (
//       <View 
//         key={index} 
//         style={[styles.tagPill, tagStyle]}
//       >
//         <Text style={[styles.tagPillText, tagTextStyle]}>#{tag}</Text>
//       </View>
//     );
//   })}
// </View>

//          {/* Content section */}
//          <View style={styles.content}>
//         {item?.body && (
//           <RenderHtml
//             contentWidth={wp(100)}
//             source={{html: item.body}}
//             tagsStyles={tagsStyles}
//           />
//         )}
//       </View>

//       {/* Media section */}
//       {item?.file?.includes('postImage') && (
//         <Image
//           source={getSupabaseFileUrl(item.file)} 
//           transition={100}
//           style={styles.postMedia}
//           contentFit='cover'
//         />
//       )}

//       {item?.file?.includes('postVideo') && (
//         <View style={styles.videoContainer}>
//           <Video
//             ref={videoRef}
//             style={styles.postMedia}
//             source={getSupabaseFileUrl(item.file)}
//             useNativeControls 
//             resizeMode='cover'
//             isLooping={false}
//             onPlaybackStatusUpdate={(status) => {
//               if (status.isLoaded && status.didJustFinish) {
//                 setShowReplayButton(true);
//               }
//             }}
//             onFullscreenUpdate={({ fullscreenUpdate }) => {
//               if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_DISMISS) {
//                 if (appStateVisible !== 'active') {
//                   videoRef.current?.pauseAsync();
//                 }
//               }
//             }}
//           />
//           {showReplayButton && (
//             <TouchableOpacity 
//               style={styles.replayButton}
//               onPress={() => {
//                 if (videoRef.current) {
//                   videoRef.current.replayAsync({
//                     shouldPlay: true,
//                     positionMillis: 0
//                   });
//                   setShowReplayButton(false);
//                 }
//               }}
//             >
//               <Icon 
//                 name='reload'
//                 size={hp(1.7)}
//                 color="white"
//               />
//             </TouchableOpacity>
//           )}
//         </View>
//       )}

//       {/* Actions section - likes, comments */}
//       <SpotlightFooter
//         item={item}
//         currentUser={currentUser}
//         router={router}
//         showMoreIcon={showMoreIcon}
//       />

   
//       {/* Edit/Delete Modal Buttons (hidden by default) */}
//       {showDelete && currentUser?.id === item?.userId && (
//         <View style={styles.editOptions}>
//           <TouchableOpacity 
//             style={styles.editOption}
//             onPress={() => onEdit(item)}
//           >
//             <Icon 
//               name='edit'
//               size={hp(2.2)}
//               color={theme.colors.text}
//             />
//             <Text style={styles.editOptionText}>Edit Post</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[styles.editOption, styles.deleteOption]}
//             onPress={handlePostDelete}
//           >
//             <Icon 
//               name='delete'
//               size={hp(2.2)}
//               color={theme.colors.rose}
//             />
//             <Text style={[styles.editOptionText, {color: theme.colors.rose}]}>Delete</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   )
// }

// export default SpotlightCard

// const styles = StyleSheet.create({
//   container: {
//     marginBottom: 16,
//     backgroundColor: '#121212', // Instagram's dark theme background
//     width: '100%',
//   },
//   userHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(4),
//     paddingVertical: hp(1.5),
//   },
//   userInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   profileImage: {
//     width: hp(4.5),
//     height: hp(4.5),
//     borderRadius: hp(2.25),
//     backgroundColor: '#333333',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   username: {
//     fontSize: hp(1.7),
//     color: theme.colors.light || '#FFFFFF',
//     fontWeight: '600',
//   },
//   headerRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   moreButton: {
//     padding: 4,
//   },
//   inlineTagsContainer: {
//     flexDirection: 'row',
//   },
//   inlineTags: {
//     fontSize: hp(1.3),
//     color: theme.colors.textLight || '#A8A8A8',
//   },
//   created: {
//     color: theme.colors.textLight || '#A8A8A8',
//     fontSize: hp(1.4),
//   },
//   postMedia: {
//     height: hp(50), // Taller images like Instagram
//     width: '100%',
//     backgroundColor: '#2c2c2c',
//   },
//   content: {
//     paddingHorizontal: wp(4),
//     paddingVertical: hp(1),
//     marginBottom: hp(1),
//   },
//   videoContainer: {
//     position: 'relative',
//   },
//   replayButton: {
//     position: 'absolute',
//     top: 15,
//     right: 15,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     width: hp(4),
//     height: hp(4),
//     borderRadius: hp(2),
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   editOptions: {
//     position: 'absolute',
//     right: wp(5),
//     top: hp(8),
//     backgroundColor: '#2A2A2A',
//     borderRadius: 8,
//     padding: 8,
//     zIndex: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//     width: wp(30),
//   },
//   editOption: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 8,
//     gap: 10,
//   },
//   deleteOption: {
//     borderTopWidth: 1,
//     borderTopColor: '#333333',
//     marginTop: 4,
//     paddingTop: 8,
//   },
//   editOptionText: {
//     fontSize: hp(1.6),
//     color: theme.colors.light,
//   },
//   tagsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: hp(1),
//     paddingHorizontal: wp(4),
//   },
//   tagPill: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     borderWidth: 1,
//   },
//   tagPillText: {
//     fontSize: hp(1.4),
//     fontWeight: '600',
//   },
// })
