import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { fetchPeopleReviewReplies, removeReplyPeopleReview, createPeopleReviewReply } from "../../services/releaseService";
import { createNotifications } from '../../services/notificationService';
import Icon from '../../assets/icons';
import { hp, wp } from '../../helpers/common';
import theme from '../../constants/theme';
import Input from "../../components/Input";
import FeedLoader from "../../components/FeedLoader";
import PeoplesReviewItem from "../../components/PeopleReviewItem";
//import { BannerAd, BannerAdSize, MobileAds, TestIds } from 'react-native-google-mobile-ads';
import moment from "moment";
import { useToast } from "../../contexts/ToastContext";

const PeoplesReviewList = ({ 
  reviews = [], 
  releaseId, 
  releaseUserId, 
  currentUser,       
  onDeleteReview,
  onhandleEdit,
  openProfilePopup,
  reviewId,
  date
}) => {
  const [openReplyBox, setOpenReplyBox] = useState(null);
  const [reviewReplies, setReviewReplies] = useState({});
  const [replyInputValues, setReplyInputValues] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const replyRef = React.useRef('');
  const { showToast } = useToast();
  const releaseAt = date ? moment(date).format('MMM D') : '';
  const show = releaseAt && moment(date).isSameOrBefore(moment(), 'day'); 

   // const [adLoaded, setAdLoaded] = useState(false);
    // const [adsInitialized, setAdsInitialized] = useState(false);
    // const [adFailedToLoad, setAdFailedToLoad] = useState(false);

    // Use test ad unit ID for development
    // const adUnitId = __DEV__ 
    //     ? TestIds.BANNER 
    //     : 'ca-app-pub-7806969239829181/8002029935';
    
    // Ad size - using anchored adaptive banner for better compatibility
    // const adSize = BannerAdSize.ANCHORED_ADAPTIVE_BANNER;


    // Initialize Mobile Ads SDK
    // useEffect(() => {
    //     let isMounted = true;
        
    //     async function initializeMobileAds() {
    //         try {
    //             await MobileAds().initialize();
    //             if (isMounted) {
    //                 setAdsInitialized(true);
    //                 console.log("Mobile Ads SDK initialized successfully");
                    
    //                 // Log whether we're using test ads
    //                 console.log(`Using ${__DEV__ ? 'TEST' : 'PRODUCTION'} ads: ${adUnitId}`);
    //             }
    //         } catch (error) {
    //             console.error("Failed to initialize Mobile Ads SDK:", error);
    //             if (isMounted) {
    //                 setAdsInitialized(true); // Still mark as initialized to avoid blocking UI
    //             }
    //         }
    //     }
        
    //     initializeMobileAds();
        
    //     return () => {
    //         isMounted = false;
    //     };
    // }, [adUnitId]);

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
      console.error('Error fetching replies', error);
    }
  };

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
      releaseId: releaseId
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
        showToast('success', 'Reply deleted. Thanks! You can still view it to respond again.');
        
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

      show? ( <View style={styles.noReviews}>
        <Text style={styles.noReviewsText}>
          Be the first to write a review!!
        </Text>
      </View>): ( 
        <View style={styles.notReleasedBanner}>
              <View style={styles.noReviews}>
             <Text style={styles.noReviewsText}>
                Not released yet!
            </Text>
            </View>
            {/* Banner Ad Component */}
            {/* <View style={styles.bannerContainer}>
                {adsInitialized && (
                    <BannerAd
                        unitId={adUnitId}
                        size={adSize}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true,
                            keywords: ['film'],
                        }}
                        onAdLoaded={() => {
                            setAdLoaded(true);
                            setAdFailedToLoad(false);
                            console.log("Ad loaded successfully");
                        }}
                        onAdFailedToLoad={(error) => {
                            console.error("Ad failed to load:", error);
                            setAdFailedToLoad(true);
                        }}
                    />
                )}
                {(!adLoaded || adFailedToLoad) && adsInitialized && (
                    <View style={[styles.adPlaceholder, styles.bannerSize]}>
                        <Text style={styles.placeholderText}>
                            {adFailedToLoad 
                                ? "No ads available at this time." 
                                : "Loading advertisement..."}
                        </Text>
                        <Text style={styles.smallText}>
                            {adFailedToLoad && __DEV__ 
                                ? "Using test ads in development mode." 
                                : adFailedToLoad 
                                    ? "New ad units may take 20+ minutes to serve ads." 
                                    : ""}
                        </Text>
                    </View>
                )}
            </View> */}
        </View>
        
      )
    );
  }

  
  return (
    <View style={styles.reviewsContainer}>
      {reviews
        .filter(peoplesReview => !peoplesReview?.parentReviewId)
        .map(peoplesReview => (
          <View key={peoplesReview?.id?.toString()}>
            <PeoplesReviewItem
              item={peoplesReview}
              releaseId={releaseId}
              onDelete={onDeleteReview}
              canDelete={currentUser?.id === peoplesReview?.userId || currentUser?.id === releaseUserId}
              // onReplyReviewPress={() => toggleReplyBox(peoplesReview.id)}
              onReplyReviewPress={(id, username) => toggleReplyBox(id, username)}
              replyCount={reviewReplies[peoplesReview?.id]?.length || 0}
              isReply={false}
              onShowProfile={openProfilePopup}
              highlight={reviewId == peoplesReview?.id} 
              handleEdit={onhandleEdit}
            />
            
            {/* Render replies when reply box is open */}
            {openReplyBox === peoplesReview?.id && reviewReplies[peoplesReview?.id]?.map(reply => (
              <View key={reply.id} style={styles.replyContainer}>
                <PeoplesReviewItem
                  item={reply}
                  releaseId={releaseId}
                  onDelete={onDeleteReviewReply}
                  canDelete={currentUser.id === reply.userId || currentUser.id === releaseUserId}
                  onReplyReviewPress={(id, username) => toggleReplyBox(peoplesReview?.id, username)} 
                  replyCount={reviewReplies[peoplesReview?.id]?.length || 0}
                  isReply={true}
                  onShowProfile={openProfilePopup}
                />
              </View>
            ))}
            
            {/* Reply input box */}
            {openReplyBox === peoplesReview?.id && (
              <View style={styles.replyInputContainer}>
                <Input
                  placeholder={`Reply to @${peoplesReview?.user?.name}...`}
                  onChangeText={value => handleReplyInputChange(peoplesReview?.id, value)}
                  value={replyInputValues[peoplesReview?.id] || ''}
                  placeholderTextColor={theme.colors.textLight}
                  containerStyle={{
                    flex: 1,
                    height: hp(5),
                    borderRadius: theme.radius.sm
                  }}
                />

                {replyLoading[peoplesReview?.id] ? (
                  <View style={styles.loading}>
                    <FeedLoader size="small" color={theme.colors.primaryDark} />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.replySendIcon}
                    onPress={() => onSubmitReply(peoplesReview?.id)}
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

export default PeoplesReviewList;

const styles = StyleSheet.create({
  reviewsContainer: {
    marginVertical: hp(1),
    marginHorizontal: hp(2),
    gap: hp(1)
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
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingBottom: 5,
},
adPlaceholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
    borderRadius: 4,
    padding: 10,
},
bannerSize: {
    height: 140, 
    maxWidth: 728, 
},
placeholderText: {
    color: theme.colors.text || '#FFFFFF',
    fontSize: hp(1.8),
},
smallText: {
    fontSize: hp(1.2),
    marginTop: 4,
    opacity: 0.7,
    color: theme.colors.text || '#FFFFFF',
},
notReleasedBanner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
}
});

