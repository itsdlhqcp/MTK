import { Text, View, StyleSheet, TouchableOpacity, Image, AppState } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import theme from '../constants/theme'
import { wp, hp } from '../helpers/common'
import Icon from '../assets/icons'
import moment from 'moment/moment'
import { VideoView, useVideoPlayer } from 'expo-video';
import RenderHtml from 'react-native-render-html';
import { getSupabaseFileUrl } from '../services/userProfileImage'
import SpotlightFooter from './SpotlightFooter'
import { usePost } from '../contexts/PostContext';
import { useFocusEffect } from '@react-navigation/native';
import AspectRatioImage from './AspectRatioImage'

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
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [showReplayButton, setShowReplayButton] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Create video player for video posts
  const videoSource = item?.file?.includes('postVideo') ? getSupabaseFileUrl(item.file) : null;
  const player = useVideoPlayer(videoSource, player => {
    player.loop = false;
    player.muted = false;
  });

   useFocusEffect(
     React.useCallback(() => {
       setIsNavigating(false);
     }, [])
   );

  // Handle video playback based on visibility
  useEffect(() => {
    if (player && item?.file?.includes('postVideo')) {
      if (isVisible) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isVisible, player]);

  // Handle video end event
  useEffect(() => {
    if (player) {
      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded && status.didJustFinish) {
          setShowReplayButton(true);
        }
      });

      return () => {
        subscription?.remove();
      };
    }
  }, [player]);

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
        if (player && item?.file?.includes('postVideo')) {
          player.pause();
        }
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Handle screen focus changes
  useFocusEffect(
    React.useCallback(() => {
      // Component is focused
      return () => {
        // Component is unfocused
        if (player && item?.file?.includes('postVideo')) {
          player.pause();
        }
      };
    }, [player])
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

  // Function to capitalize first letter of each tag
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handlePostDelete = () => {
    if (typeof showDelete === 'function') {
      showDelete(item);
    }
  }

  if (!item) return null;

  const openPostDetails = () => {
    if (isNavigating) return; 
  
    if (!item?.id) return null;
  
    setIsNavigating(true); 
  
    router.push({
      pathname: 'postDetails',
      params: { postId: item.id },
    });
  };

  // Function to handle touches on the main content only
  const handleContentPress = (e) => {
    // Prevent default behavior
    e.stopPropagation();
    openPostDetails();
  };

  // Handle replay button press
  const handleReplay = (e) => {
    e.stopPropagation(); // Prevent parent touchable from firing
    if (player) {
      player.replay();
      setShowReplayButton(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Touchable section for images/videos */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleContentPress}>
        {/* Use AspectRatioImage for images */}
        {item?.file?.includes('postImage') && (
          <AspectRatioImage
            source={getSupabaseFileUrl(item.file)}
            priority={isVisible}
          />
        )}

        {/* Updated Video component using expo-video */}
        {item?.file?.includes('postVideo') && (
          <View style={styles.videoContainer}>
            <VideoView
              style={styles.postMedia}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
              showsTimecodes
            />
            {showReplayButton && (
              <TouchableOpacity 
                style={styles.replayButton}
                onPress={handleReplay}
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
      </TouchableOpacity>

      {/* User header section - Instagram style */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleContentPress}
        style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={styles.tagsContainer}>
            {Array.isArray(parsedTags) && parsedTags.map((tag, index) => {
              // Determine tag styling based on tag name #6d3a94
              let tagStyle = {};
              let tagTextStyle = {};
              
              // Convert tag to lowercase for comparison but capitalize for display
              const tagLowerCase = tag.toLowerCase();
              
              // Determine the display text for the tag
              let displayTag = capitalizeFirstLetter(tag);
              
              // Special case: change "kdrama" to "Korean"
              if (tagLowerCase === 'kdrama') {
                displayTag = 'Korean';
              }
              
              if (tagLowerCase === 'rumour') {
                // Red styling for rumor tags
                tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
                tagTextStyle = { color: '#f83a15' };
              } else if (tagLowerCase === 'official') {
                // Blue styling for official tags
                tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
                tagTextStyle = { color: '#1581f8' };
              } else if (tagLowerCase === 'kdrama') {
                // Purple styling for Korean drama tags
                tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
                tagTextStyle = { color: '#993ede' };
              } else if (tagLowerCase === 'anime') {
                // Yellow styling for anime tags
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
                  <Text style={[styles.tagPillText, tagTextStyle]}>#{displayTag}</Text>
                </View>
              );
            })}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.created}>{createdat}</Text>
          {showDelete && currentUser?.id === item?.userId && (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent parent touchable from firing
              }}
            >
              <Icon 
                name='more-vertical'
                size={hp(2.2)}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Content section */}
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={handleContentPress}
        style={styles.content}>
        {item?.body && (
          <>
            <RenderHtml
              contentWidth={wp(100)}
              source={{ html: isExpanded ? item.body : item.body.slice(0, 700) + "..." }}
              tagsStyles={tagsStyles}
            />
            {!isExpanded && item.body.length > 700 && (
              <Text style={{ color: theme.colors.primary, marginTop: 5 }}>Read More</Text>
            )}
          </>
        )}
      </TouchableOpacity>

      {/* Footer is now a separate non-touchable component */}
      <View pointerEvents="box-none">
        <SpotlightFooter
          item={item}
          currentUser={currentUser}
          router={router}
          showMoreIcon={showMoreIcon}
        />
      </View>

      {/* Edit/Delete Modal Buttons (hidden by default) */}
      {showDelete && currentUser?.id === item?.userId && (
        <View style={styles.editOptions}>
          <TouchableOpacity 
            style={styles.editOption}
            onPress={(e) => {
              e.stopPropagation(); // Prevent parent touchable from firing
              onEdit(item);
            }}
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
            onPress={(e) => {
              e.stopPropagation(); // Prevent parent touchable from firing
              handlePostDelete();
            }}
          >
            <Icon 
              name='delete'
              size={hp(2.2)}
              color={theme.colors.rose}
              strokeWidth={1.4}
            />
            <Text style={[styles.editOptionText, {color: theme.colors.rose}]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.greenBorderTop} />
    </View>
  );
};

export default SpotlightCard;

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
    height: hp(35), 
    width: '100%',
    backgroundColor: '#121212',
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#2c2c2c',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
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
    height: hp(0.45),
    backgroundColor: theme.colors.textLight,
    opacity: 0.2,
  },
});