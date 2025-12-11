import React, { useState, useEffect, useRef } from 'react';
import { Share,Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp, stripHtmlTags } from '../helpers/common';
import { createTwistLikes, removeTwistLikes, removeTwistUnlikes } from '../services/homeService';
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

const TwistFooter = ({
  item,
  currentUser,
  router,
  showMoreIcon = true,
}) => {
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
    
    // Check if this is an episode (has cover_image and episode_type is pdf/section_based)
    const isEpisode = item?.cover_image && 
                     (item?.episode_type === 'pdf' || item?.episode_type === 'section_based');
    
    if (isEpisode) {
      // Route to episode details page
      router.push({
        pathname: '/episodeDetails',
        params: { episodeId: item.id }
      });
    } else {
      // Route to regular twist details page
      router.push({pathname: 'twistDetails', params: {postId: item.id}});
    }
  };

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
  const twistunliked = twistunlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

  // New share function that creates and shares an embedded poster
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
      const shareUrl = `https://plotwist-site.vercel.app/feeds/${item?.id}`;
  
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
          {/* Like button */}
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
              <Icon 
                name='thumbsup'
                size={24} 
                fill={twistliked ? theme.colors.blue || '#0066B1' : 'transparent'} 
                strokeWidth={1.4} 
                color={twistliked ? theme.colors.blue || '#0066B1' : theme.colors.light || '#E0E0E0'}
              />  
            </TouchableOpacity>
            <Text style={styles.count}>
              {twistlikes?.length || 0}
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
              <Icon 
                name='share' 
                size={24} 
                strokeWidth={1.4} 
                color={isSharing ? theme.colors.bmw : theme.colors.light || '#E0E0E0'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

export default TwistFooter;

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

const sharingStyles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000, 
    left: 0,
    width: 600, 
    height: 'auto',
    zIndex: -1,
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

