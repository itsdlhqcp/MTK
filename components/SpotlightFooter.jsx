import { View, StyleSheet, TouchableOpacity, Text, Animated, Alert, Share } from 'react-native';
import React, { useState, useRef } from 'react';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp, wp, stripHtmlTags } from '../helpers/common';
import LikeButton from './AnimatedHeartButton';
import { usePost } from '../contexts/PostContext';
import { useFocusEffect } from 'expo-router';
import { Image } from 'react-native';
import { getSupabaseFileUrl } from '../services/imageService';
import { adminIds } from '../constants/admin';
import { removePost } from '../services/postService';

// Component for generating the poster view
const PosterView = React.forwardRef(({ item }, ref) => {
  // Parse tags from the item
  let parsedTags = item?.tags || [];
  if (typeof item?.tags === 'string') {
    try {
      parsedTags = JSON.parse(item.tags);
    } catch (e) {
      parsedTags = [];
    }
  }

  return (
    <View ref={ref} style={posterStyles.container}>
      {/* Header with app branding */}
      <View style={posterStyles.header}>
        <Text style={posterStyles.appName}>PlotTwist</Text>
        <Text style={posterStyles.username}>@{item?.name || 'user'}</Text>
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

          {/* Tags section */}
             {Array.isArray(parsedTags) && parsedTags.length > 0 && (
        <View style={posterStyles.tagsContainer}>
          {parsedTags.map((tag, index) => {
            // Determine tag styling based on tag name #6d3a94
            let tagStyle = {};
            let tagTextStyle = {};
            
            if (tag.toLowerCase() === 'rumour') {
              tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
              tagTextStyle = { color: '#f83a15' };
            } else if (tag.toLowerCase() === 'official') {
              tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
              tagTextStyle = { color: '#1581f8' };
            } else if (tag.toLowerCase() === 'kdrama') {
              tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
              tagTextStyle = { color: '#993ede' };
            } else if (tag.toLowerCase() === 'anime') {
              tagStyle = { backgroundColor: '#262626', borderColor: '#333333' };
              tagTextStyle = { color: '#FFC300' };
            } else {
              tagStyle = { 
                backgroundColor: theme.colors.secondary || '#262626',
                borderColor: theme.colors.border || '#333333' 
              };
              tagTextStyle = { color: theme.colors.primary || '#0095F6' };
            }
            
            return (
              <View 
                key={index} 
                style={[posterStyles.tagPill, tagStyle]}
              >
                <Text style={[posterStyles.tagPillText, tagTextStyle]}>#{tag}</Text>
              </View>
            );
          })}
        </View>
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
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
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
});

const SpotlightFooter = ({
  item = {},
  currentUser,
  router,
  showMoreIcon = true,
}) => {
  // Add default values to protect against undefined context
  const { updatePost = () => {} } = usePost() || {};
  const [isNavigating, setIsNavigating] = useState(false);
  
  // For share functionality
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const posterRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showPosterView, setShowPosterView] = useState(false);

  // which reset on coming the page 
  useFocusEffect(
    React.useCallback(() => {
      setIsNavigating(false);
    }, [])
  );
  
  const openPostDetails = () => {
    if (isNavigating) return;
    if (!showMoreIcon || !item?.id) return null;
    setIsNavigating(true);
    router.push({
      pathname: 'postDetails',
      params: { postId: item.id },
    });
  }

 const onEditPost = () => {
    if (router) {
      router.push({
        pathname: 'createFeed', 
        params: {...item}
      });
    } else {
      console.error("Router is undefined in TwistCard");
    }
  };


  const onDeletePost = async (item) => {
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
                    let res = await removePost(item?.id);
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

  // Share function that creates and shares an embedded poster
  // const onShare = async () => {
  //   if (isSharing) return; // Prevent multiple share requests
    
  //   try {
  //     setIsSharing(true);
      
  //     // Animate the share button
  //     Animated.sequence([
  //       Animated.timing(scaleAnim, {
  //         toValue: 1.2,
  //         duration: 150,
  //         useNativeDriver: true
  //       }),
  //       Animated.timing(scaleAnim, {
  //         toValue: 1,
  //         duration: 150,
  //         useNativeDriver: true
  //       })
  //     ]).start();
      
  //     // Show the poster view and wait a bit for it to render
  //     setShowPosterView(true);
      
  //     // Add a small delay to ensure the view is rendered
  //     await new Promise(resolve => setTimeout(resolve, 100));
      
  //     if (!posterRef.current) {
  //       Alert.alert('Error', 'Unable to generate poster');
  //       setIsSharing(false);
  //       setShowPosterView(false);
  //       return;
  //     }
      
  //     // Generate a high-quality image of our poster component
  //     const uri = await captureRef(posterRef, {
  //       format: 'jpg',
  //       quality: 1,
  //       result: 'file',
  //     });

      
      
  //     // Hide the poster view after capture
  //     setShowPosterView(false);
      
  //     // Check if sharing is available
  //     if (await Sharing.isAvailableAsync()) {
  //       await Sharing.shareAsync(uri, {
  //         mimeType: 'image/jpeg',
  //         dialogTitle: 'Share your PlotTwist',
  //         UTI: 'public.jpeg'
  //       });
  //     } else {
  //       Alert.alert('Error', 'Sharing is not available on this device');
  //     }
  //   } catch (error) {
  //     console.error('Sharing error:', error);
  //     Alert.alert('Error', 'Failed to share poster');
  //     setShowPosterView(false);
  //   } finally {
  //     setIsSharing(false);
  //   }
  // };

  
    const onShare = async () => {
      if (isSharing) return;
    
      try {
        setIsSharing(true);
        const shareUrl = `https://plotwist-site.vercel.app/posts/${item?.id}`;
    
        const result = await Share.share({
          message: `Check out this PlotTwist: ${shareUrl}`,
        });
    
        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            console.log('Shared with activity type:', result.activityType);
          } else {
            console.log('Shared successfully');
          }
        } else if (result.action === Share.dismissedAction) {
          console.log('Share dismissed');
        }
      } catch (error) {
        console.error('Sharing error:', error);
        Alert.alert('Error', 'Failed to share link');
      } finally {
        setIsSharing(false);
      }
    };

  const isadmin = adminIds.includes(currentUser?.id);


  return (
    <>
      {/* Poster view that will be captured for sharing - hidden by default but properly sized */}
      {showPosterView && (
        <View style={sharingStyles.hiddenContainer}>
          <PosterView ref={posterRef} item={item} />
        </View>
      )}
      
      <View style={styles.container}>
        {/* Action buttons */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <LikeButton 
              item={item} 
              currentUser={currentUser} 
              updatePost={updatePost} 
            />
            
            <TouchableOpacity style={styles.actionButton} onPress={openPostDetails}>
              <Icon name='comment' size={hp(2.8)} strokeWidth={2} color={theme.colors.silver} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Animated.View
                style={{
                  transform: [{ scale: isSharing ? 1.1 : 1 }]
                }}
              >
                <Icon 
                  name='share' 
                  size={hp(2.6)} 
                  strokeWidth={2} 
                  color={isSharing ? theme.colors.bmw : theme.colors.silver} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <View style={styles.leftActions}>
          {isadmin && (
                  <TouchableOpacity style={styles.actionButton} onPress={onEditPost}>
                  <Icon name='edit' size={hp(2.6)} strokeWidth={2} color={theme.colors.silver} />
                </TouchableOpacity>
            )}
             {isadmin && (
                  <TouchableOpacity style={styles.actionButton}  onPress={() => onDeletePost(item)}>
                  <Icon name='delete' size={hp(2.6)} strokeWidth={2} color={theme.colors.silver} />
                </TouchableOpacity>
            )}
          </View>
            
        </View>
        
        {/* Likes count */}
        <View style={styles.countsSection}>
          <Text style={styles.comments} onPress={openPostDetails}>
            {item?.comments === 0 
                ? "Be the first to comment" 
                : item?.comments === 1 
                ? "View the first comment" 
                : `View all ${item?.comments} comments`}
          </Text>
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
  container: {
    paddingHorizontal: wp(4),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
  },
  leftActions: {
    flexDirection: 'row',
    gap: wp(3),
  },
  actionButton: {
    padding: hp(0.5),
  },
  countsSection: {
    paddingBottom: hp(1),
  },
  likes: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: theme.colors.light,
    marginBottom: hp(0.5),
  },
  comments: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  }
});

export default SpotlightFooter;