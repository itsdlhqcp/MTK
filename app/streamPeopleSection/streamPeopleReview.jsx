import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { createPeopleReviewReply, fetchPeopleReviewReplies ,removeReplyPeopleReview } from "../../services/ottService";
import { createNotifications } from '../../services/notificationService';
import Icon from '../../assets/icons';
import { hp, wp } from '../../helpers/common';
import theme from '../../constants/theme';
import Input from "../../components/Input";
import FeedLoader from "../../components/FeedLoader";
import PeoplesPreviewItem from "../../components/PeoplePreviewItem";

const PeoplesPreviewList = ({ 
  reviews = [], 
  releaseId, 
  releaseUserId, 
  currentUser, 
  onhandleEdit,
  onDeleteReview,
  openProfilePopup,
  reviewId
}) => {
  const [openReplyBox, setOpenReplyBox] = useState(null);
  const [reviewReplies, setReviewReplies] = useState({});
  const [replyInputValues, setReplyInputValues] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const replyRef = React.useRef('');

  // console.log('below are pep reviews #########', reviews);

  const fetchRepliesForReview = async (reviewId) => {
    try {
      const res = await fetchPeopleReviewReplies(reviewId);
      if (res.success) {
        setReviewReplies(prev => ({
          ...prev,
          [reviewId]: res.data
        }));
      }
    } catch (error) {
      console.error('Error fetching peoples replies', error);
    }
  };

  // const toggleReplyBox = (reviewId, username = null) => {
  //   setOpenReplyBox(prev => prev === reviewId ? null : reviewId);

  //    // Initialize with mention if username is provided
  //     if (username) {
  //       const mentionText = `@${username} `;
  //       handleReplyInputChange(reviewId, mentionText);
  //     } else if (!reviewReplies[reviewId]) {
  //       fetchRepliesForReview(reviewId);
  //     }

  //   if (!reviewReplies[reviewId]) {
  //     fetchRepliesForReview(reviewId);
  //   }
  // };

  // In PeoplesReviewList.js - modify the toggleReplyBox function
const toggleReplyBox = (reviewId, username = null) => {
  // Always open the reply box if a username is provided (don't toggle closed)
  if (username) {
    setOpenReplyBox(reviewId);
    const mentionText = `@${username} `;
    handleReplyInputChange(reviewId, mentionText);
  } else {
    // Only toggle (open/close) when no username is provided
    setOpenReplyBox(prev => prev === reviewId ? null : reviewId);
    if (!reviewReplies[reviewId]) {
      fetchRepliesForReview(reviewId);
    }
  }
};

  const handleReplyInputChange = (reviewId, value) => {
    setReplyInputValues(prev => ({
      ...prev,
      [reviewId]: value
    }));
    replyRef.current = value;
  };

  const onSubmitReply = async (parentReviewId) => {
    if (!replyRef.current || !currentUser?.id) return null;

    let data = {
      userId: currentUser.id,
      text: replyRef.current,
      parentReviewId: parentReviewId,
      streamId: releaseId  
    };

    // Use review-specific loading state
    setReplyLoading(prev => ({
      ...prev,
      [parentReviewId]: true
    }));
    
    try {
      let res = await createPeopleReviewReply(data);
      if (res.success) {
        // Create new reply object with user data
        const newReply = {
          ...res.data,
          user: {
            id: currentUser.id,
            ...currentUser
          }
        };

        // Update state immediately
        setReviewReplies(prev => ({
          ...prev,
          [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
        }));

        // Clear input
        replyRef.current = '';
        setReplyInputValues(prev => ({
          ...prev,
          [parentReviewId]: ''
        }));

        // Handle notification
        if (currentUser.id !== releaseUserId) {
          let notify = {
            senderId: currentUser.id,
            receiverId: releaseUserId,
            title: 'replied to your review',
            data: JSON.stringify({ releaseId: releaseId, reviewId: parentReviewId })
          };
          createNotifications(notify);
        }
      } else {
        Alert.alert('Reply', res.msg || 'Something went wrong');
      }
    } catch (err) {
      Alert.alert('Reply', 'Something went wrong');
    } finally {
      // Clear loading state for this specific review
      setReplyLoading(prev => ({
        ...prev,
        [parentReviewId]: false
      }));
    }
  };

  const onDeleteReviewReply = async (review) => {
    try {
      let res = await removeReplyPeopleReview(review?.id);
      if (res.success) {
        Alert.alert('Review Reply :', 'Reply deleted. Thanks! You can still view it to respond again.');
        
        // Update state to remove the reply
        setReviewReplies(prev => {
          const parentId = review.parentReviewId;
          if (prev[parentId]) {
            return {
              ...prev,
              [parentId]: prev[parentId].filter(reply => reply.id !== review.id)
            };
          }
          return prev;
        });
      }
    } catch (err) {
      Alert.alert('Review Reply', 'Something went wrong');
    }
  };

  if (reviews.length === 0) {
    return (
      <View style={styles.noReviews}>
        <Text style={styles.noReviewsText}>
          Be the first to write a review!
        </Text>
      </View>
    );
  }
// console.log("reviewId", reviewId);
// console.log("dpeoples reviews id", reviews.id);
  return (
    <View style={styles.reviewsContainer}>
      {reviews
        .filter(dpeoplesReview => !dpeoplesReview.parentReviewId)
        .map(dpeoplesReview => (
          <View key={dpeoplesReview?.id?.toString()}>
            <PeoplesPreviewItem
              item={dpeoplesReview}
              onDelete={onDeleteReview}
              canDelete={currentUser.id === dpeoplesReview.userId || currentUser.id === releaseUserId}
              // onReplyReviewPress={() => toggleReplyBox(peoplesReview.id)}
              onReplyReviewPress={(id, username) => toggleReplyBox(id, username)}
              replyCount={reviewReplies[dpeoplesReview.id]?.length || 0}
              isReply={false}
              onShowProfile={openProfilePopup}
              highlight={reviewId == dpeoplesReview.id}  
              handleEdit={onhandleEdit}
              // highlight="true"
            />
            
            {/* Render replies when reply box is open */}
            {openReplyBox === dpeoplesReview.id && reviewReplies[dpeoplesReview.id]?.map(reply => (
              <View key={reply.id} style={styles.replyContainer}>
                <PeoplesPreviewItem
                  item={reply}
                  onDelete={onDeleteReviewReply}
                  canDelete={currentUser.id === reply.userId || currentUser.id === releaseUserId}
                  onReplyReviewPress={(id, username) => toggleReplyBox(dpeoplesReview.id, username)} 
                  replyCount={reviewReplies[dpeoplesReview.id]?.length || 0}
                  isReply={true}
                  onShowProfile={openProfilePopup}
                  // highlight={reviewId === dpeoplesReview.id}  
                  // highlight="true"
                />
              </View>
            ))}
            
            {/* Reply input box */}
            {openReplyBox === dpeoplesReview.id && (
              <View style={styles.replyInputContainer}>
                <Input
                  placeholder={`Reply to @${dpeoplesReview.user.name}...`}
                  onChangeText={value => handleReplyInputChange(dpeoplesReview.id, value)}
                  value={replyInputValues[dpeoplesReview.id] || ''}
                  placeholderTextColor={theme.colors.textLight}
                  containerStyle={{
                    flex: 1,
                    height: hp(5),
                    borderRadius: theme.radius.sm
                  }}
                />

                {replyLoading[dpeoplesReview.id] ? (
                  <View style={styles.loading}>
                    <FeedLoader size="small" color={theme.colors.primaryDark} />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.replySendIcon}
                    onPress={() => onSubmitReply(dpeoplesReview.id)}
                  >
                    <Icon name="send" size={hp(2)} color={theme.colors.primaryDark} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
    </View>
  );
};

export default PeoplesPreviewList;

const styles = StyleSheet.create({
  reviewsContainer: {
    marginVertical: hp(2),
    gap: hp(2)
  },
  noReviews: {
    padding: hp(2),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginVertical: hp(2)
  },
  noReviewsText: {
    color: theme.colors.textLight,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginHorizontal: 10,
    marginLeft: 50
  },
  replyContainer: {
    marginLeft: 50,
    marginTop: 5
  },
  replySendIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    height: Math.round(hp(4.8)),
    width: Math.round(hp(4.8))
  },
  loading: {
    height: Math.round(hp(4.8)),
    width: Math.round(hp(4.8)),
    justifyContent: 'center',
    alignItems: 'center'
  }
});

