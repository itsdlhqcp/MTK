import { Text, View, StyleSheet, TouchableOpacity, Image, AppState, Dimensions } from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import Avatar from './Avatar';
import { useFocusEffect } from '@react-navigation/native';
import AspectRatioImage from './AspectRatioImage';

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

// Modified AspectRatioImage component to ensure full width
// const AspectRatioImage = ({ source, maxHeight = hp(64), style = {} }) => {
//   const [imageHeight, setImageHeight] = useState(hp(35)); // Default height
  
//   const onImageLoad = (event) => {
//     const { width, height } = event.nativeEvent.source;
//     if (width && height) {
//       // Calculate the height needed to maintain aspect ratio at full screen width
//       const screenWidth = wp(100);
//       const scaledHeight = (height / width) * screenWidth;
      
//       // Limit the height to maxHeight if needed
//       setImageHeight(Math.min(scaledHeight, maxHeight));
//     }
//   };

//   return (
//     <View style={[styles.imageContainer, style]}>
//       <Image
//         source={source} 
//         transition={100}
//         style={[
//           styles.image,
//           {
//             width: '100%',
//             height: imageHeight
//           }
//         ]}
//         onLoad={onImageLoad}
//         resizeMode="cover"
//       />
//     </View>
//   );
// };

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
  onEdit = () => {},
  isVisible
}) => {
  const { registerPost } = usePost();
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [showReplayButton, setShowReplayButton] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const { width } = Dimensions.get("window");

  useFocusEffect(
    useCallback(() => {
      return () => {
        setPlaying(false); // Pause the YouTube video when navigating away
      };
    }, [])
  );
  

   useEffect(() => {
      if (videoRef.current) {
        if (isVisible && playing) {   // remove && playing to amke it on visble auto playing
          videoRef.current.playAsync();
        } else {
          videoRef.current.pauseAsync();
        }
      }
    }, [isVisible]);

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

      {!isVideoReady && (
          <Image
            source={require('../assets/images/loader/homeldr.jpeg')}
            alt="loading ##########"
           // style={styles.youtubePlaceholder}
          //  style={{ width: 400, height: 200 }} 
           style={{ width: '100%', height: 200 }} 
          />
        )}
           
        <YoutubeIframe
          height={200}
          play={playing}
          videoId={youtubeVideoId}
          onStateChange={onStateChange}
          onReady={() => setIsVideoReady(true)} // Hide image when video is ready
          webViewProps={{
            onLoadStart: () => setIsVideoReady(false),
          }}
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
          <AspectRatioImage
              source={getSupabaseFileUrl(item.file)}
              priority={isVisible}
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
                      // When exiting fullscreen, ensure video is paused if app is in background
                      if (appStateVisible !== 'active') {
                        videoRef.current?.pauseAsync();
                      }
                    }
                  }}
                />
                {/* Replay button overlay - only shown when video is near the end */}
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
                          name='reload'  // Adjust based on your icon library
                          size={hp(1.7)}
                          color="white"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
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
    marginBottom: 5.2, 
    borderRadius: theme.radius.xxl * 0.2,
    borderCurve: 'continuous', 
    padding: 8,
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
  },
  videoContainer: {
  position: 'relative',
  },
  replayButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: hp(3),
    height: hp(5),
    borderRadius: hp(3.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
});