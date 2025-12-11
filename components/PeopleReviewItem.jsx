import { StyleSheet, Text, TouchableOpacity, View, Animated, Share, ActivityIndicator } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import theme from '../constants/theme'
import { hp } from '../helpers/common'
import * as Sharing from 'expo-sharing'
import Avatar from './Avatar'
import Icon from '@/assets/icons'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { captureRef } from 'react-native-view-shot'
import moment from 'moment'
import { 
  createPeopleReviewDownvote, 
  createPeopleReviewUpvote, 
  removePeopleReviewDownvote, 
  removePeopleReviewUpvote,  
  fetchPeopleReviewReplies,  
  removePeopleReviewReplyLike, 
  createPeopleReviewReplyLike, 
  fetchPeoplesReleaseDetails
} from '../services/releaseService'
import { useAuth } from '../contexts/AuthContext'
import PratingStars from './pRatingStars'
import { userService } from '../services/helperService'
import ReviewIndicators from './ReviewIndicator'
import StoryShare from './StoryShare'
import CustomAlert from './CustomAlert'
import { supabase } from '../lib/supabase'

const PeoplesReviewItem = ({
  item, 
  canDelete = false,
  onDelete = () => {},
  handleEdit = () => {},
  highlight = false,
  onReplyReviewPress,
  onShowProfile,
  router,
  isReply = false,
  releaseId
}) => {
  const posterRef = useRef(null);
  const [replyCount, setReplyCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const rocketScale = useRef(new Animated.Value(1)).current
  const rocketOpacity = useRef(new Animated.Value(1)).current
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [fullText, setFullText] = useState('');
  const [truncatedText, setTruncatedText] = useState('');
  
  // States for custom alerts
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [editAlertVisible, setEditAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Removed 12-hour time limit - reviews can now be edited anytime by the owner
  const canEdit = true;
  const createdAt = moment(item?.created_at).format('MMM D')

  const {user} = useAuth();
  
  // States for votes and likes
  const [upvotes, setUpvotes] = useState([]);
  const [downvotes, setDownvotes] = useState([]);
  const [likes, setLikes] = useState([]);
  const [isSndSharing, setIsSndSharing] = useState(false);
  const [isInstaSharing, setIsInstaSharing] = useState(false);
  const [showPosterView, setShowPosterView] = useState(false);
  const [release, setRelease] = useState(null);
  
  // Check if current user has upvoted, downvoted or liked
  const hasUpvoted = upvotes?.some(vote => vote?.userId === user?.id);
  const hasDownvoted = downvotes?.some(vote => vote?.userId === user?.id);
  const hasLiked = likes?.some(like => like?.userId === user?.id);

  // Function to process text and determine if read more is needed
  useEffect(() => {
    if (item?.text) {
      const maxChars = 720;
      
      if (item?.text.length > maxChars) {
        setShowReadMore(true);
        // Find a good break point (preferably at word boundary)
        let truncateAt = maxChars;
        const lastSpaceIndex = item?.text.lastIndexOf(' ', maxChars);
        const lastNewlineIndex = item?.text.lastIndexOf('\n', maxChars);
        
        // Use the last space or newline before the 720 char limit for cleaner truncation
        if (lastSpaceIndex > maxChars - 50) {
          truncateAt = lastSpaceIndex;
        } else if (lastNewlineIndex > maxChars - 50) {
          truncateAt = lastNewlineIndex;
        }
        
        setTruncatedText(item?.text.substring(0, truncateAt));
        setFullText(item?.text);
      } else {
        setShowReadMore(false);
        setFullText(item?.text);
        setTruncatedText(item?.text);
      }
    }
  }, [item?.text]);
  
  // Function to toggle read more/less
  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  const getReleaseDetails = async () => {
    let res = await fetchPeoplesReleaseDetails(releaseId);
    if (res.success) setRelease(res.data);
  };
  
  useEffect(() => {
    if (releaseId) {
      getReleaseDetails();
    }
  }, [releaseId]);

  useEffect(() => {
    if (!isReply) {
      fetchReplyCount()
    }
  }, [item.id])

  useEffect(() => {
    setUpvotes(item?.threviewupvote || []);
    setDownvotes(item?.threviewdownvote || []);
    setLikes(item?.pepreplylikes || []);
  }, [item])

  const fetchReplyCount = async () => {
    if (!item?.id) return
    
    setIsLoading(true)
    try {
      const res = await fetchPeopleReviewReplies(item?.id)
      if (res.success) {
        setReplyCount(res.data.length)
      }
    } catch (error) {
      console.error('Error fetching reply count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // import { Share } from 'react-native';
  // import * as FileSystem from 'expo-file-system';
  // import * as Sharing from 'expo-sharing';
  // import { decode } from 'base64-arraybuffer';

  const handleShare = async () => {
    if (isSndSharing) return;
  
    try {
      setIsSndSharing(true);
      console.log('Starting share process...');
  
      // Step 1: Check if review already exists in shared_content
      console.log('Checking for existing shared content...');
      console.log('Looking for review_id:', item.id);
      const { data: existingContentArray, error: checkError } = await supabase
        .from('shared_content')
        .select('id')
        .eq('review_id', item.id)
        .limit(1);
  
      if (checkError) {
        console.error('Error checking existing content:', checkError);
        throw new Error(`Check failed: ${checkError.message}`);
      }
  
      console.log('Query result:', existingContentArray);
      let sharedData;
  
      if (existingContentArray && existingContentArray.length > 0) {
        // Review already shared - use existing record
        console.log('Existing shared content found:', existingContentArray[0]);
        sharedData = existingContentArray[0];
      } else {
        // Review not shared before - create new entry
        console.log('No existing content found, creating new share...');
  
        // Step 2: Generate the image
        setShowPosterView(true);
        await new Promise(resolve => setTimeout(resolve, 500));
  
        if (!posterRef.current) {
          throw new Error('Poster reference not available');
        }
  
        console.log('Capturing image...');
        let uri;
        let retries = 3;
  
        while (retries > 0) {
          try {
            uri = await captureRef(posterRef, {
              format: 'jpg',
              quality: 0.8,
              result: 'file',
            });
            console.log('Image captured successfully:', uri);
            break;
          } catch (captureError) {
            console.log(`Capture attempt failed, retries left: ${retries - 1}`, captureError);
            retries--;
            if (retries === 0) {
              throw new Error('Failed to capture image after multiple attempts');
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
  
        setShowPosterView(false);
  
        // Step 3: Upload to Supabase
        console.log('Starting upload to Supabase...');
        const fileName = `reviews/${user.id}/${Date.now()}.jpg`;
  
        const uploadPromise = (async () => {
          const fileBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          const imageData = decode(fileBase64);
  
          console.log('File converted to base64, size:', imageData.byteLength);
  
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('shared-images')
            .upload(fileName, imageData, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false,
            });
  
          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
          }
  
          console.log('Upload successful:', uploadData);
          return uploadData;
        })();
  
        const uploadData = await Promise.race([
          uploadPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)),
        ]);
  
        // Step 4: Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('shared-images')
          .getPublicUrl(fileName);
  
        console.log('Public URL generated:', publicUrl);
  
        // Step 5: Create database record
        console.log('Creating database record...');
        const dbPromise = supabase
          .from('shared_content')
          .insert({
            user_id: user.id,
            review_id: item.id,
            image_url: publicUrl,
            title: `${item?.user?.name}'s Review`,
            description: item?.text ? item.text.substring(0, 200) + '...' : 'Check out this review!',
            metadata: {
              rating: item?.userRating,
              release_id: releaseId,
              created_by: item?.user?.name,
              app_version: '1.0',
            },
          })
          .select('id')
          .single();
  
        const { data: newSharedData, error: dbError } = await Promise.race([
          dbPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout after 10 seconds')), 10000)),
        ]);
  
        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }
  
        console.log('Database record created:', newSharedData);
        sharedData = newSharedData;
      }
  
      // Step 6: Create and share URL (using existing or new record ID)
      const shareUrl = `https://plotwist-site.vercel.app/theatre/${sharedData.id}`;
      console.log('Share URL created:', shareUrl);
  
      // Step 7: Share using React Native's Share API
      try {
        const result = await Share.share({
          message: `Check out this review: ${shareUrl}`,
          title: 'Share your PlotTwist Review',
          url: shareUrl, // Optional for iOS
        });
  
        if (result.action === Share.sharedAction) {
          console.log('Share dialog opened successfully');
        } else if (result.action === Share.dismissedAction) {
          console.log('Share dialog dismissed');
        }
      } catch (shareError) {
        console.warn('Native share failed, falling back', shareError);
  
        // Fallback: Clipboard
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          setErrorMessage('Link copied to clipboard!');
          setErrorAlertVisible(true);
        } else {
          setErrorMessage(`Share this link: ${shareUrl}`);
          setErrorAlertVisible(true);
        }
      }
  
    } catch (error) {
      console.error('Share process failed:', error);
      setShowPosterView(false);
  
      let errorMessage = 'Failed to create shareable link';
  
      if (error.message.includes('Check failed')) {
        errorMessage = 'Failed to check existing content. Please try again.';
      } else if (error.message.includes('capture')) {
        errorMessage = 'Failed to generate image. Please try again.';
      } else if (error.message.includes('Upload')) {
        errorMessage = 'Failed to upload image. Check your internet connection.';
      } else if (error.message.includes('Database')) {
        errorMessage = 'Failed to save sharing data. Please try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Operation timed out. Please check your connection and try again.';
      }
  
      setErrorMessage(errorMessage);
      setErrorAlertVisible(true);
    } finally {
      setIsSndSharing(false);
    }
  };

  const handleInstaShare = async () => {
    if (isInstaSharing) return; // Changed from isSharing
    
    try {
      setIsInstaSharing(true);  // Changed from setIsSharing(true)
      
      // Show the poster view and wait a bit for it to render
      setShowPosterView(true);
      
      // Add a small delay to ensure the view is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!posterRef.current) {
        setErrorMessage('Unable to generate poster');
        setErrorAlertVisible(true);
        setIsInstaSharing(false);  // Changed from setIsSharing(false)
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
        setErrorMessage('Sharing is not available on this device');
        setErrorAlertVisible(true);
      }
    } catch (error) {
      console.error('Sharing error:', error);
      setErrorMessage('Failed to share poster');
      setErrorAlertVisible(true);
      setShowPosterView(false);
    } finally {
      setIsInstaSharing(false);  // Changed from setIsSharing(false)
    }
  };
  
  // 4. UPDATE handleShareSimple function (if you're using it)
  const handleShareSimple = async () => {
    if (isSndSharing) return;  // You can use either isSndSharing or isInstaSharing depending on which button calls this
    
    try {
      setIsSndSharing(true);  // Changed from setIsSharing(true)
      
      // Just generate and share the image directly (fallback)
      setShowPosterView(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const uri = await captureRef(posterRef, {
        format: 'jpg',
        quality: 0.2,
        result: 'file',
      });
      
      setShowPosterView(false);
      
      // Share the image directly for now
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share your PlotTwist',
          UTI: 'public.jpeg'
        });
      }
      
    } catch (error) {
      console.error('Simple share failed:', error);
      setErrorMessage('Failed to share image');
      setErrorAlertVisible(true);
      setShowPosterView(false);
    } finally {
      setIsSndSharing(false);  // Changed from setIsSharing(false)
    }
  };
  
  const handleDelete = () => {
    setDeleteAlertVisible(true);
  }

  const performDelete = () => {
    onDelete(item);
  }

  const handleEditButtonPress = () => {
    setEditAlertVisible(true);
  }

  const performEdit = () => {
    handleEdit(item);
  }

  const handleUsernamePress = () => {
    if (onShowProfile) {
      onShowProfile(item?.user)
    } else if (router) {
      router.push({ 
        pathname: '/profile', 
        params: { userId: item?.user?.id } 
      })
    }
  }

  const handleUpvote = async () => {
    if (hasUpvoted) {
      // Remove upvote if already upvoted
      const updatedUpvotes = upvotes.filter(vote => vote.userId !== user?.id);
      setUpvotes(updatedUpvotes);
  
      const res = await removePeopleReviewUpvote(item?.id, user?.id);
      if (!res.success) {
        setErrorMessage(res.msg || 'Something went wrong');
        setErrorAlertVisible(true);
      }
    } else {
      // Remove downvote if exists
      if (hasDownvoted) {
        const updatedDownvotes = downvotes.filter(vote => vote.userId !== user?.id);
        setDownvotes(updatedDownvotes);
        await removePeopleReviewDownvote(item?.id, user?.id);
      }
  
      // Add upvote
      const data = {
        userId: user?.id,
        peoplesReviewId: item?.id
      };
      setUpvotes([...upvotes, data]);
  
      const res = await createPeopleReviewUpvote(data);
      if (!res.success) {
        setErrorMessage(res.msg || 'Something went wrong');
        setErrorAlertVisible(true);
      }
    }
  };
  
  const handleDownvote = async () => {
    if (hasDownvoted) {
      // Remove downvote if already downvoted
      const updatedDownvotes = downvotes.filter(vote => vote.userId !== user?.id);
      setDownvotes(updatedDownvotes);
  
      const res = await removePeopleReviewDownvote(item?.id, user?.id);
      if (!res.success) {
        setErrorMessage(res.msg || 'Something went wrong');
        setErrorAlertVisible(true);
      }
    } else {
      // Remove upvote if exists
      if (hasUpvoted) {
        const updatedUpvotes = upvotes.filter(vote => vote.userId !== user?.id);
        setUpvotes(updatedUpvotes);
        await removePeopleReviewUpvote(item?.id, user?.id);
      }
  
      // Add downvote
      const data = {
        userId: user?.id,
        peoplesReviewId: item?.id
      };
      setDownvotes([...downvotes, data]);
  
      const res = await createPeopleReviewDownvote(data);
      if (!res.success) {
        setErrorMessage(res.msg || 'Something went wrong');
        setErrorAlertVisible(true);
      }
    }
  };
  
  const handleLike = async () => {
    if (hasLiked) {
      const updatedLikes = likes.filter(like => like.userId !== user?.id);
      setLikes(updatedLikes);
      
      const res = await removePeopleReviewReplyLike(item?.id, user?.id);
      if (!res.success) {
        setErrorMessage(res.msg || 'Something went wrong');
        setErrorAlertVisible(true);
      }
    } else {
      const data = {
        userId: user?.id,
        peoplesReviewReplyId: item?.id
      }
      
      setLikes([...likes, data]);
      const res = await createPeopleReviewReplyLike(data);
      
      if (!res.success) {
        setErrorMessage(res.msg || 'Something went wrong');
        setErrorAlertVisible(true);
      }
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(rocketScale, {
          toValue: 1.5,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(rocketOpacity, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(rocketScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(rocketOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ])
    ]).start();
  }

  const handleReplyPress = () => {
    onReplyReviewPress && onReplyReviewPress(item?.id, item?.user?.name);
  }

  const renderTextWithTags = (text) => {
    if (!text) return null
  
    const tagRegex = /(@\w+)/g
    const parts = text.split(tagRegex)
    
    return (
      <Text style={[styles.text, {fontWeight: 'normal'}]}>
        {parts.map((part, index) => {
          if (tagRegex.test(part)) {
            const username = part.slice(1)
            return (
              <Text 
                key={index} 
                style={styles.usernameTag}
                onPress={async () => {
                  // Try to get the full user data for the tagged username
                  const userData = await userService.getUserByName(username);
                  
                  // Open profile popup for the tagged username with complete data if found
                  if (userData) {
                    onShowProfile && onShowProfile(userData);
                  } else {
                    setErrorMessage('User under this username not exists');
                    setErrorAlertVisible(true);
                  }
                }}
              >
                {part}
              </Text>
            )
          }
          return <Text key={index}>{part}</Text>
        })}
      </Text>
    )
  }

  const renderTextContent = () => {
    if (!item?.text) return null;

    const textToShow = isExpanded ? fullText : truncatedText;
    
    return (
      <View>
        {renderTextWithTags(textToShow)}
        {showReadMore && (
          <TouchableOpacity 
            onPress={toggleReadMore}
            style={styles.readMoreButton}
            activeOpacity={0.7}
          >
            <Text style={styles.readMoreText}>
              {isExpanded ? 'Read Less' : 'Read Full Review'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hidden poster view for sharing - Only create when needed */}
      {showPosterView && (
        <View style={styles.hiddenContainer}>
          <StoryShare 
            ref={posterRef} 
            item={item} 
            release={release} 
          />
        </View>
      )}

      {/* Custom Alerts */}
      <CustomAlert
        visible={deleteAlertVisible}
        title="Confirm"
        message="Are you sure you want to do this?"
        onCancel={() => setDeleteAlertVisible(false)}
        onConfirm={() => {
          setDeleteAlertVisible(false);
          performDelete();
        }}
        cancelText="Cancel"
        confirmText="Delete"
      />

      <CustomAlert
        visible={editAlertVisible}
        title="Confirm"
        message="Are you sure you've changed your mind and want to rewrite your review?"
        onCancel={() => setEditAlertVisible(false)}
        onConfirm={() => {
          setEditAlertVisible(false);
          performEdit();
        }}
        cancelText="Cancel"
        confirmText="Edit"
      />

      <CustomAlert
        visible={errorAlertVisible}
        title="Error"
        message={errorMessage}
        onCancel={() => setErrorAlertVisible(false)}
        onConfirm={() => setErrorAlertVisible(false)}
        cancelText="OK"
        confirmText="OK"
      />

      <Avatar
        uri={item?.user?.image}
        onPress={handleUsernamePress}
        addings={item?.addings} // Pass the emoji here
      />
      <View style={[styles.content, highlight && styles.highlight]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={styles.nameContainer}>
            <TouchableOpacity onPress={handleUsernamePress}>
              <Text style={styles.text}>
                {item?.user?.name}
              </Text>
            </TouchableOpacity>
            <Text style={styles.text}>•</Text>
            <Text style={[styles.text, {color: theme.colors.textLight}]}>
              {createdAt}
            </Text>
          </View>
    
          <View style={styles.replySection}>
            {!isReply && (
              <>
                <TouchableOpacity onPress={handleUpvote}>
                  <Icon 
                    name="upvo" 
                    size={hp(2.4)} 
                    fill={hasUpvoted ? "" : 'transparent'} 
                    color={hasUpvoted ? "#4CAF50" : theme.colors.textLight} 
                  />
                </TouchableOpacity>
                <Text style={styles.count}>{upvotes?.length || 0}</Text>

                <TouchableOpacity onPress={handleDownvote}>
                  <Icon 
                    name="downvo" 
                    size={hp(2.4)} 
                    fill={hasDownvoted ? "" : 'transparent'} 
                    color={hasDownvoted ? "#F44336" : theme.colors.textLight} 
                  />
                </TouchableOpacity>
                <Text style={styles.count}>{downvotes?.length || 0}</Text>

                <TouchableOpacity 
                  onPress={() => onReplyReviewPress(item?.id)}  
                  style={styles.replyIcon}
                >
                  <Icon name="bubbleChatReply" size={hp(2.5)} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.replyCount}>{item?.replyPeopleReviews?.length || 0}</Text>
                {canDelete && (
                <TouchableOpacity 
                  onPress={handleShare} 
                  style={[styles.replyIcon, isSndSharing && styles.disabledButton]}  // Changed from isSharing
                  disabled={isSndSharing}  // Changed from isSharing
                >
                  {isSndSharing ? (  // Changed from isSharing
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Icon name="snd" size={hp(2.5)} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}


              {canDelete && (
                <TouchableOpacity 
                  onPress={handleInstaShare} 
                  style={[styles.replyIcon, isInstaSharing && styles.disabledButton]}  // Changed from isSharing
                  disabled={isInstaSharing}  // Changed from isSharing
                >
                  {isInstaSharing ? (  // Changed from isSharing
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Icon name="insta" size={hp(2.5)} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              </>
            )}
          </View>

          {/* edit and dlt buttons */}
          <View style={styles.replySection}>

            {isReply && (
              <TouchableOpacity 
                onPress={handleLike}
                style={styles.rocketButtonContainer}
                activeOpacity={0.7}
              >
                <View style={styles.rocketWrapper}>
                  <Animated.View
                    style={[
                      styles.rocketIconContainer,
                      { 
                        transform: [{ scale: rocketScale }],
                        opacity: rocketOpacity,
                      }
                    ]}
                  >
                    <Icon 
                      name="thumbsup" 
                      size={hp(1.7)} 
                      color={hasLiked ? "#0066ff" : "#CCCCCC"} 
                    />
                  </Animated.View>
                  <Text style={[
                    styles.rocketCount, 
                    hasLiked && styles.activeRocketCount
                  ]}>
                    {likes?.length}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
             
            {/* Reply button for comments */}
            {isReply && (
              <TouchableOpacity 
                onPress={handleReplyPress}
                activeOpacity={0.7}
              >
                <View style={styles.rocketWrapper}>
                  <Icon 
                    name="replycmt" 
                    size={hp(2.4)} 
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
            
        {/* Rating and Popcorn section */}
        {!isReply && item?.userRating > 0 && (
          <View style={styles.ratingContainer}>
            <PratingStars 
              rating={item.userRating} 
              showRatingText={true} 
              starSize={hp(1.8)}
              textStyle={{color: "#BDBDBD"}}
            />
            {item?.popCorn && (
              <View style={styles.popcornContainer}>
                <Icon name="popcorn" size={hp(2)} color="#FFD700" />
              </View>
            )}
          </View>
        )}
        
        {/* Text content with read more functionality */}
        {renderTextContent()}
        
        {!isReply && <ReviewIndicators item={item} />}

        {(canDelete && canEdit) && (
          <View style={styles.bottomActionButtons}>
            <TouchableOpacity 
              onPress={handleDelete}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Icon name="delete" size={16} color={theme.colors.rose} />
            </TouchableOpacity>
            
            {!isReply && (
              <TouchableOpacity 
                onPress={handleEditButtonPress}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Icon name="edit" size={16} color={theme.colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

export default PeoplesReviewItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  content: {
    backgroundColor: '#161B21', 
    flex: 1,
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderWidth: 0.5,
    borderColor: '#333',
    shadowColor: '#000'
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  text: {
    fontSize: hp(1.5),
    color: '#ffffff',
    fontWeight: theme.fonts.textDark,
  },
  highlight: {
    borderWidth: 1,
    borderColor: theme.colors.bmw, 
    shadowColor: '#4A00E0',
    shadowOffset: {
      width: 0.7,
      height: 4
    },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 34
  },
  usernameTag: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  replySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  replyCount: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  replyIcon: {
    padding: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    gap: 8,
  },
  popcornContainer: {
    marginLeft: 5,
  },
  cupOfTeaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 5,
  },
  cupOfTeaText: {
    fontSize: hp(1.3),
    color: '#aaa',
    fontStyle: 'italic'
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  },
  rocketButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  rocketWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rocketIconContainer: {
    padding: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rocketCount: {
    color: '#CCCCCC',
    fontSize: hp(1.5),
    fontWeight: '600',
    marginLeft: 2,
  },
  activeRocketCount: {
    color: '#0066ff',
  },
  hiddenContainer: {
    position: 'absolute',
    top: -1000, 
    left: 0,
    width: 600,
    height: 800,
    zIndex: -1,
  },
  readMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  readMoreText: {
    color: theme.colors.primary,
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  bottomActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    alignSelf: 'flex-start', // This ensures the buttons stay on the left
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
});