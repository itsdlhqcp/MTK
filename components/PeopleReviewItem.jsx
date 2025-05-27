import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import theme from '../constants/theme'
import { hp } from '../helpers/common'
import * as Sharing from 'expo-sharing'
import Avatar from './Avatar'
import Icon from '@/assets/icons'
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
  
  const canEdit = moment().diff(moment(item?.created_at), 'hours') <= 12;
  const createdAt = moment(item?.created_at).format('MMM D')

  const {user} = useAuth();
  
  // States for votes and likes
  const [upvotes, setUpvotes] = useState([]);
  const [downvotes, setDownvotes] = useState([]);
  const [likes, setLikes] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
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
      
      if (item.text.length > maxChars) {
        setShowReadMore(true);
        // Find a good break point (preferably at word boundary)
        let truncateAt = maxChars;
        const lastSpaceIndex = item.text.lastIndexOf(' ', maxChars);
        const lastNewlineIndex = item.text.lastIndexOf('\n', maxChars);
        
        // Use the last space or newline before the 720 char limit for cleaner truncation
        if (lastSpaceIndex > maxChars - 50) {
          truncateAt = lastSpaceIndex;
        } else if (lastNewlineIndex > maxChars - 50) {
          truncateAt = lastNewlineIndex;
        }
        
        setTruncatedText(item.text.substring(0, truncateAt));
        setFullText(item.text);
      } else {
        setShowReadMore(false);
        setFullText(item.text);
        setTruncatedText(item.text);
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
    if (!item.id) return
    
    setIsLoading(true)
    try {
      const res = await fetchPeopleReviewReplies(item.id)
      if (res.success) {
        setReplyCount(res.data.length)
      }
    } catch (error) {
      console.error('Error fetching reply count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (isSharing) return; // Prevent multiple share requests
    
    try {
      setIsSharing(true);
      
      // Show the poster view and wait a bit for it to render
      setShowPosterView(true);
      
      // Add a small delay to ensure the view is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!posterRef.current) {
        setErrorMessage('Unable to generate poster');
        setErrorAlertVisible(true);
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
        setErrorMessage('Sharing is not available on this device');
        setErrorAlertVisible(true);
      }
    } catch (error) {
      console.error('Sharing error:', error);
      setErrorMessage('Failed to share poster');
      setErrorAlertVisible(true);
      setShowPosterView(false);
    } finally {
      setIsSharing(false);
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
    onReplyReviewPress && onReplyReviewPress(item.id, item?.user?.name);
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
                  onPress={() => onReplyReviewPress(item.id)}  
                  style={styles.replyIcon}
                >
                  <Icon name="bubbleChatReply" size={hp(2.5)} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.replyCount}>{item?.replyPeopleReviews?.length || 0}</Text>
                {canDelete && (
                  <TouchableOpacity 
                  onPress={handleShare} 
                  style={styles.replyIcon}
                >
                  <Icon name="insta" size={hp(2.5)} color={theme.colors.primary} />
                </TouchableOpacity>
                )}
                
              </>
            )}
          </View>

          <View style={styles.replySection}>
            {canDelete && canEdit && (
              <TouchableOpacity onPress={handleDelete}>
                <Icon name="delete" size={15} color={theme.colors.rose} />
              </TouchableOpacity>
            )}
            {!isReply && canDelete && canEdit && (
              <TouchableOpacity onPress={handleEditButtonPress}>
                <Icon name="edit" size={15} color={theme.colors.gray} />
              </TouchableOpacity>
            )}

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
});