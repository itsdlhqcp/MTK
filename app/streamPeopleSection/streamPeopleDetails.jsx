import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, Alert, Animated } from "react-native";
import Input from '../../components/Input';
import { fetchPeopleReviewReplies, removeReplyPeopleReview } from "../../services/releaseService";
import { createReviewReply, removeReview, fetchReviewReplies, fetchReleaseDetails, createReleaseReview, fetchPeoplesReleaseDetails, createPeopleReleaseReview, removePeopleReview, createPeopleReviewReply } from "../../services/ottService"
// import { fetchReviewReplies  } from '../services/ottService'
import { View } from "react-native";
import { createNotifications } from '../../services/notificationService'
import ReviewItem from "../../components/ReviewItem";
import { hp, wp } from '../../helpers/common';
import theme from '../../constants/theme';
import { ScrollView } from "react-native";
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ReleaeCard from '../../components/RelesaeCard';
import Loading from "../../components/Loading";
import FeedLoader from "../../components/FeedLoader";
import Icon from '../../assets/icons';
import { Text } from "react-native";
import RatingModal from "../../components/RatingModel";
import PeoplesReviewItem from "../../components/PeopleReviewItem";
// import PeoplesReviewList from "./releasePeopleReview";
import ProfilePopup from '../../components/profilePopup';
import PeoplesPreviewList from "./streamPeopleReview";

const MIN_CHARS = 85;

const StreamPeopleDetails = () => {
    const { streamId } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [startLoading, setStartLoading] = useState(false);
    const inputRef = useRef(null);
    const adminInputRef = useRef(null); // admin input ref
    const adminReviewRef = useRef('');  // admin review ref
    const [arelease, setArelease] = useState(null); // for setting admin release user data
    const [areviewReplies, setAreviewReplies] = useState({}); // variable for the review replies
    const [adminReviewText, setAdminReviewText] = useState(''); // admin review text
    const reviewRef = useRef('');
    const replyRef = useRef('');
    const [reviewText, setReviewText] = useState('');
    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const [openReplyBox, setOpenReplyBox] = useState(null);
    const [reviewReplies, setReviewReplies] = useState({});
    const [replyInputValues, setReplyInputValues] = useState({});
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [cupOfTea, setCupOfTea] = useState(false);
    const [replyLoading, setReplyLoading] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);


    useEffect(() => {
        getAreleaseDetails();
        subscribeToChanges();
        return () => {
            cleanup();
        };
    }, []);


      const getAreleaseDetails = async () => {
            setStartLoading(true);
            let res = await fetchReleaseDetails(streamId);
            if (res.success) setArelease(res.data);
            setStartLoading(false);
        };

         const fetchRepliesForAreview = async (reviewId) => {
                try {
                    const res = await fetchReviewReplies(reviewId);
                    if (res.success) {
                        setAreviewReplies(prev => ({
                            ...prev,
                            [reviewId]: res.data
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching replies', error);
                }
            };

    // function to open profile popup
    // console.log("admin$$ releaseId details here rendered",arelease)

    const openProfilePopup = (userData) => {
        setSelectedUser(userData);
        setIsProfilePopupVisible(true);
    };

    useEffect(() => {
        getReleaseDetails();
        subscribeToChanges();
        return () => {
            cleanup();
        };
    }, []);

    const getReleaseDetails = async () => {
        setStartLoading(true);
        let res = await fetchPeoplesReleaseDetails(streamId);
        if (res.success) setRelease(res.data);
        setStartLoading(false);
    };

    // below is the code to handle review replies 

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

    const toggleReplyBox = (reviewId) => {
        setOpenReplyBox(prev => prev === reviewId ? null : reviewId);
        if (!areviewReplies[reviewId]) {
            fetchRepliesForAreview(reviewId);
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
            if (!replyRef.current || !user?.id) return null;
    
            let data = {
                userId: user.id,
                text: replyRef.current,
                parentReviewId: parentReviewId,
                releaseId: release.id // Add releaseId for the filter in subscription
            };
    
            setLoading(true);
            try {
                let res = await createReviewReply(data);
                if (res.success) {
                    // Create new reply object with user data
                    const newReply = {
                        ...res.data,
                        user: {
                            id: user.id,
                            ...user
                        }
                    };
    
                    // Update state immediately setAreviewReplies
                    setAreviewReplies(prev => ({
                        ...prev,
                        [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
                    }));
    
                    // Clear input
                    replyRef.current = '';
                    // setOpenReplyBox(null);
    
                    // Handle notification
                    if (user.id !== arelease.userId) {
                        let notify = {
                            senderId: user.id,
                            receiverId: arelease.userId,
                            title: 'replied to your review',
                            data: JSON.stringify({ releaseId: arelease.id, streamId: parentReviewId })
                        };
                        createNotifications(notify);
                    }
                } else {
                    Alert.alert('Preview Reply', res.msg || 'Something went wrong');
                }
            } catch (err) {
                Alert.alert('Preview Reply', 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

    // const onSubmitReply = async (parentReviewId) => {
    //     if (!replyRef.current || !user?.id) return null;
    
    //     let data = {
    //         userId: user.id,
    //         text: replyRef.current,
    //         parentReviewId: parentReviewId,
    //         releaseId: release.id
           
    //     };
    
    //     // Use review-specific loading state
    //     setReplyLoading(prev => ({
    //         ...prev,
    //         [parentReviewId]: true
    //     }));
        
    //     try {
    //         let res = await createPeopleReviewReply(data);
    //         if (res.success) {
    //             // Create new reply object with user data
    //             const newReply = {
    //                 ...res.data,
    //                 user: {
    //                     id: user.id,
    //                     ...user
    //                 }
    //             };
    
    //             // Update state immediately
    //             setReviewReplies(prev => ({
    //                 ...prev,
    //                 [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
    //             }));
    
    //             // Clear input
    //             replyRef.current = '';
    //             setReplyInputValues(prev => ({
    //                 ...prev,
    //                 [parentReviewId]: ''
    //             }));
    //             // setOpenReplyBox(null);
    
    //             // Handle notification
    //             if (user.id !== release.userId) {
    //                 let notify = {
    //                     senderId: user.id,
    //                     receiverId: release.userId,
    //                     title: 'replied to your review',
    //                     data: JSON.stringify({ releaseId: release.id, streamId: parentReviewId })
    //                 };
    //                 createNotifications(notify);
    //             }
    //         } else {
    //             Alert.alert('Peoples Reply', res.msg || 'Something went wrong');
    //         }
    //     } catch (err) {
    //         Alert.alert('Peoples Reply', 'Something went wrong');
    //     } finally {
    //         // Clear loading state for this specific review
    //         setReplyLoading(prev => ({
    //             ...prev,
    //             [parentReviewId]: false
    //         }));
    //     }
    // };

    // end of review replies code - below is the handle review code 

    const handleNewReview = async (payload) => {
        if (payload.new && payload.new.parentReviewId) {
            const newReply = { ...payload.new };
            const parentReviewId = newReply.parentReviewId;
            
            // Get user data for the reply
            let userRes = await getUserData(newReply.userId);
            newReply.user = userRes.success ? userRes.data : {};

            // Update reviewReplies state
            setReviewReplies(prev => ({
                ...prev,
                [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
            }));
        }
    };

    const handleNewReply = async (payload) => {
        if (payload.new && payload.new.parentReviewId) {
            const newReply = { ...payload.new };
            const parentReviewId = newReply.parentReviewId;
            
            // Get user data for the reply
            let userRes = await getUserData(newReply.userId);
            newReply.user = userRes.success ? userRes.data : {};

            // Update reviewReplies state
            setReviewReplies(prev => ({
                ...prev,
                [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
            }));
        }
    };

    // below are the two AA handles 
      
    const ahandleNewReview = async (payload) => {
        if (payload.new && payload.new.parentReviewId) {
            const newReply = { ...payload.new };
            const parentReviewId = newReply.parentReviewId;
            
            // Get user data for the reply
            let userRes = await getUserData(newReply.userId);
            newReply.user = userRes.success ? userRes.data : {};

            // Update reviewReplies state
            setAreviewReplies(prev => ({
                ...prev,
                [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
            }));
        }
    };

    const ahandleNewReply = async (payload) => {
        if (payload.new && payload.new.parentReviewId) {
            const newReply = { ...payload.new };
            const parentReviewId = newReply.parentReviewId;
            
            // Get user data for the reply
            let userRes = await getUserData(newReply.userId);
            newReply.user = userRes.success ? userRes.data : {};

            // Update reviewReplies state
            setAreviewReplies(prev => ({
                ...prev,
                [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
            }));
        }
    };

                const subscribeToChanges = () => {
                    // Subscribe to new reviews
                    let reviewChannel = supabase
                        .channel('peoplesReview')
                        .on('postgres_changes', 
                            {event: 'INSERT', schema: 'public', table: 'peoplesReview', filter: `releaseId=eq.${streamId}`}, 
                            handleNewReview)
                        .subscribe();

                    // Subscribe to new replies
                    let replyChannel = supabase
                        .channel('replyPeopleReviews')
                        .on('postgres_changes', 
                            {event: 'INSERT', schema: 'public', table: 'peoplesReview', filter: `releaseId=eq.${streamId}`}, 
                            handleNewReply)
                        .subscribe();

                    // subscribe to AA reviews and replies 

                     // Subscribe to new reviews
                     let areviewChannel = supabase
                         .channel('preview')
                         .on('postgres_changes', 
                             {event: 'INSERT', schema: 'public', table: 'preview', filter: `releaseId=eq.${streamId}`}, 
                             ahandleNewReview)
                          .subscribe();
                    
                      // Subscribe to new replies
                     let areplyChannel = supabase
                          .channel('previewsreply')
                          .on('postgres_changes', 
                              {event: 'INSERT', schema: 'public', table: 'preview', filter: `releaseId=eq.${streamId}`}, 
                              ahandleNewReply)
                          .subscribe();

                    return { reviewChannel, replyChannel, areviewChannel, areplyChannel };
                };

                const cleanup = () => {
                    const channels = subscribeToChanges();
                    supabase.removeChannel(channels.reviewChannel);
                    supabase.removeChannel(channels.replyChannel);
                    supabase.removeChannel(channels.areviewChannel);
                    supabase.removeChannel(channels.areplyChannel);
                };

        const onNewReview = () => {
            if(!reviewRef.current || !user?.id || !release?.id) return null;
            if(charCount < MIN_CHARS) return null;
            
            setRatingModalVisible(true);
        };

        // below is a cup of tea variable which is a boolean value

        const handleFinalReviewSubmit = async (rating, cupOfTea, emoji, mustWatch) => {
            let data = {
                userId: user.id,
                releaseId: release.id,
                text: reviewRef.current,
                userRating: rating,
                cupOfTea: cupOfTea, 
                addings: emoji
                // popCorn: mustWatch
            }
            
            setLoading(true);
            try {
                let res = await createPeopleReleaseReview(data);
                if(res.success){
                    const newReview = {
                        ...res.data,
                        user: {
                            id: user.id,
                            ...user
                        }
                    };
        
                    setRelease(prevRelease => ({
                        ...prevRelease,
                        dpeopreviews: [newReview, ...prevRelease.dpeopreviews]
                    }));
        
                    if(user.id !== release.userId){
                        let notify = {
                            senderId: user.id,
                            receiverId: release.userId,
                            title: 'reviewed on your release',
                            data: JSON.stringify({releaseId: release.id, streamId: res?.data?.id})
                        }
                        createNotifications(notify);
                    }
        
                    inputRef?.current?.clear();
                    reviewRef.current = "";
                    setReviewText('');
                    setCharCount(0);
                    setReviewRating(0);
                } else {
                    Alert.alert('Ott Review', res.msg || 'Something went wrong');
                }
            } catch (err) {
                Alert.alert('Ott Review', 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };
    
        const onDeleteReview = async (review) => {
            try {
                let res = await removePeopleReview(review?.id);
                if(res.success){
                    // Update state directly instead of reloading
                    setRelease(prevRelease => ({
                        ...prevRelease,
                        dpeopreviews: prevRelease.dpeopreviews.filter(r => r.id !== review.id)   
                    }));
                } else {
                    Alert.alert('Preview', res.msg || 'Something went wrong');
                }
            } catch (err) {
                Alert.alert('Preview', 'Something went wrong');
            }
        }


        const onDeleteReviewReply = async (review) => {
            // Remove the reply from the state
            try{
                let res = await removeReplyPeopleReview(review?.id);
                if(res.success){
                    Alert.alert('Review Reply :', 'Reply deleted. Thanks! You can still view it to respond again.');

                    // here is the upadtion to be done to make instant reply release functions
                }
            }catch(err){
                Alert.alert('Review Reply', 'Something went wrong');
            }
        }
    
        const handleTextChange = (text) => {
            setReviewText(text);
            setCharCount(text.length);
            reviewRef.current = text;
        };
    
        const getInputStatus = () => {
            if (charCount === 0) return 'empty';
            if (charCount < MIN_CHARS) return 'tooShort';
            return 'valid';
        };
    
        const getStatusColor = () => {
            const status = getInputStatus();
            switch (status) {
                case 'empty':
                    return theme.colors.textLight;
                case 'tooShort':
                    return theme.colors.error;
                case 'valid':
                    return theme.colors.success;
                default:
                    return theme.colors.textLight;
            }
        };
    
        const getRemainingChars = () => {
            return MIN_CHARS - charCount;
        };
    
        const getInputPlaceholder = () => {
            if (charCount === 0) {
                return "Write your review";
            }
            const remaining = getRemainingChars();
            if (remaining > 0) {
                return `${remaining} more characters needed`;
            }
            return "Share your thoughts...";
        };
    
        if (startLoading) return <View style={styles.center}><Loading /></View>;
    
        if (!release) {
            return (
                <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
                    <Text style={styles.notFound}>Release not found</Text>
                </View>
            );
        }
        
      // ######################################################################################################################################
      // ######################################################################################################################################
        // console.log('Below are the set of peoples reviews', release?.peoplesReview);
        //  const isCurrentUserReview = release?.peoplesReview?.user?.id === user?.id;  // this code not working
        const isCurrentUserReview = release?.peoplesReview?.some(review => review?.user?.id === user?.id);

                const onDeleteAreview = async (areview) => {
                    try {
                        let res = await removeReview(areview?.id);
                        if(res.success){
                            // Update state directly instead of reloading
                            setAreviewReplies(prevRelease => ({
                                ...prevRelease,
                                preview: prevRelease.preview?.filter(r => r.id !== areview.id)
                            }));
                        } else {
                            Alert.alert('Preview', res.msg || 'Something went wrong');
                        }
                    } catch (err) {
                        Alert.alert('Preview', 'Something went wrong');
                    }
                }
        

        const ahandleTextChange = (text) => {
            setAdminReviewText(text);
            adminReviewRef.current = text;
        };

        const hasUserPostedReview = release?.peoplesReview?.some(
            (review) => review.user?.id === user?.id);

            // trigger to get data 

                  const  onAdminReviewSubmit = async () => {
                              if(!adminReviewRef.current || !user?.id || !arelease?.id) return null;
                              
                              let data = {
                                  userId: user.id,
                                  streamId: arelease.id,
                                  text: adminReviewRef.current
                              }
                              
                              setLoading(true);
                              try {
                                  let res = await createReleaseReview(data);
                                  if(res.success){
                                      // Create the new review object with user data
                                      const newReview = {
                                          ...res.data,
                                          user: {
                                              id: user.id,
                                              // Add any other user fields that are displayed in ReviewItem
                                              ...user
                                          }
                                      };
                      
                                      // Update the state directly as OBJECT on user data
                                      setArelease(prevRelease => ({
                                          ...prevRelease,
                                          preview: [newReview, ...prevRelease.preview]
                                      }));
                      
                                      if(user.id !== arelease.userId){
                                          let notify = {
                                              senderId: user.id,
                                              receiverId: arelease.userId,
                                              title: 'reviewed on your release',
                                              data: JSON.stringify({releaseId: arelease.id, streamId: res?.data?.id})
                                          }
                                          createNotifications(notify);
                                      }
                      
                                      // Reset the input
                                       adminInputRef?.current?.clear();
                                      adminReviewRef.current = "";
                                      setAdminReviewText('');
                                  } else {
                                      Alert.alert('Review', res.msg || 'Something went wrong');
                                  }
                              } catch (err) {
                                  Alert.alert('Review', 'Something went wrong');
                              } finally {
                                  setLoading(false);
                              }
                          }

           const isadmin =  user?.id === "a4424502-53de-4814-8882-7a4b5c09a76c"
    
        return (
            <View style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                    <ReleaeCard
                        item={{ ...release ,reviews: [{ count: release?.peoplesReview?.length || 0 }] }}
                        currentUser={user}
                        router={router}
                        hasShadow={false}
                        showReviewButton={false}
                    />
         {/* below is input peoples reviews component for ADMIN */}
        {isadmin && (
            <Animated.View style={[
                styles.inputContainer,
                { transform: [{ translateX: shakeAnimation }] }
            ]}>
                <View style={styles.inputWrapper}>
                    <Input 
                        inputRef={adminInputRef}  
                        placeholder="Write your review (admin review)"
                        placeholderTextColor={theme.colors.textLight}
                        containerStyle={styles.input} 
                        value={adminReviewText} 
                        onChangeText={ahandleTextChange} 
                        multiline={true}
                        textAlignVertical="top"
                       // style={styles.ainputText} // style added bug in text inputting
                    />
                </View>
                {loading ? (
                    <View style={styles.loading}>
                        <FeedLoader size="small" color={theme.colors.primaryDark} />
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.sendIcon}
                        onPress={onAdminReviewSubmit}
                    >
                        <Icon name="send" size={hp(2)} color={theme.colors.primaryDark} />
                    </TouchableOpacity>
                )}
            </Animated.View>
        )}

        {/* Input Component - always visible but disabled when user has already posted */}
        {/* below is input peoples reviews component */}
        <Animated.View
        style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}
        pointerEvents={hasUserPostedReview ? "none" : "auto"}
        >
        <View style={styles.inputWrapper}>
            <Input
            inputRef={inputRef}
            placeholder={hasUserPostedReview ? "You've already submitted a review" : getInputPlaceholder()}
            placeholderTextColor={theme.colors.textLight}
            containerStyle={[
                styles.input,
                charCount > 0 && charCount < MIN_CHARS && styles.inputError,
                charCount >= MIN_CHARS && styles.inputValid,
                hasUserPostedReview && { opacity: 0.6 }
            
            ]}
            value={reviewText}
            onChangeText={handleTextChange}
            multiline={true}
            textAlignVertical="top"
            editable={!hasUserPostedReview}
            style={styles.inputText}
            />
            {charCount < MIN_CHARS && !hasUserPostedReview && (
            <View style={styles.charCountContainer}>
                <Text
                style={[styles.charCount, { color: getStatusColor() }]}
                >{`${charCount}/${MIN_CHARS}`}</Text>
            </View>
            )}
        </View>
        {loading ? (
            <View style={styles.loading}>
            <FeedLoader size="small" color={theme.colors.primaryDark} />
            </View>
        ) : (
            <TouchableOpacity
            style={[
                styles.sendIcon,
                (charCount < MIN_CHARS || hasUserPostedReview) && styles.sendIconDisabled,
                hasUserPostedReview && { opacity: 0.6 }
            ]}
            onPress={onNewReview}
            disabled={charCount < MIN_CHARS || hasUserPostedReview}
            >
            <Icon
                name="send"
                size={hp(2)}
                color={
                charCount < MIN_CHARS || hasUserPostedReview
                    ? theme.colors.textLight
                    : theme.colors.primaryDark
                }
            />
            </TouchableOpacity>
        )}
            </Animated.View>


                        {/* Reviews rendering here */}
                                      <View style={styles.reviewsContainer}>
                                      {arelease?.preview?.length > 0 ? (
                                          arelease.preview
                                              .filter(review => !review.parentReviewId)
                                              .map(review => (
                                                  <View key={review?.id?.toString()}>
                                                      <ReviewItem
                                                          item={review}
                                                          onDelete={onDeleteAreview}
                                                          canDelete={user.id === review.userId || user.id === arelease.userId}
                                                          onReplyReviewPress={() => toggleReplyBox(review.id)}
                                                          replyCount={areviewReplies[review.id]?.length || 0}
                                                          isReply={false}
                                                          // openProfilePopup={() => openProfilePopup(review.user)}
                                                          onShowProfile={() => openProfilePopup(review.user)}
                                                      />
                                                      
                                                      {/* Render replies when reply box is open */}
                                                      {openReplyBox === review.id && areviewReplies[review.id]?.map(reply => (
                                                          <View key={reply.id} style={styles.replyContainer}>
                                                              <ReviewItem
                                                                  item={reply}
                                                                  onDelete={onDeleteAreview}
                                                                  canDelete={user.id === reply.userId || user.id === arelease.userId}
                                                                  replyCount={areviewReplies[review.id]?.length || 0}
                                                                  isReply={true}
                                                              />
                                                          </View>
                                                      ))}
                                                      
                                                      {/* Reply input box */}
                                                      {openReplyBox === review.id && (
                                                          <View style={styles.replyInputContainer}>
                                                              <Input
                                                                  placeholder={`Reply to @${review.user.name}...`}
                                                                  onChangeText={value => replyRef.current = value}
                                                                  placeholderTextColor={theme.colors.textLight}
                                                                  containerStyle={{
                                                                      flex: 1,
                                                                      height: hp(5),
                                                                      borderRadius: theme.radius.sm
                                                                  }}
                                                              />
                                                              {loading ? (
                                                                  <View style={styles.loading}>
                                                                      <FeedLoader size="small" color={theme.colors.primaryDark} />
                                                                  </View>
                                                              ) : (
                                                                  <TouchableOpacity
                                                                      style={styles.replySendIcon}
                                                                      onPress={() => onSubmitReply(review.id)}
                                                                  >
                                                                      <Icon name="send" size={hp(2)} color={theme.colors.primaryDark} />
                                                                  </TouchableOpacity>
                                                              )}
                                                          </View>
                                                      )}
                                                  </View>
                                              ))
                                      ) : (
                                          <View style={styles.noReviews}>
                                              <Text style={styles.noReviewsText}>
                                                  Be the first to write a review!
                                              </Text>
                                          </View>
                                      )}
                                  </View>
              
                       
                    <PeoplesPreviewList
                            reviews={release?.dpeopreviews || []}  
                            releaseId={release.id}
                            releaseUserId={release.userId}
                            currentUser={user}
                            onDeleteReview={onDeleteReview}
                            openProfilePopup={openProfilePopup}
                            sty
                            />

                    <ProfilePopup
                        user={selectedUser}
                        visible={isProfilePopupVisible}
                        onClose={() => setIsProfilePopupVisible(false)}
                        router={router}
                    />

                <RatingModal 
                    visible={ratingModalVisible}
                    onClose={() => setRatingModalVisible(false)}
                    onSubmit={handleFinalReviewSubmit}
                />
                </ScrollView>
            </View>
        );
    };
    
export default StreamPeopleDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        paddingVertical: Math.round(wp(7))
    },
    list: {
        paddingHorizontal: Math.round(wp(4))
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginVertical: hp(2)
    },
    inputWrapper: {
        flex: 1,
        position: 'relative'
    },
    input: {
        flex: 1,
        minHeight: hp(10),
        maxHeight: hp(20),
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.background,
        paddingRight: wp(8),
         color: 'green'
    },
    inputError: {
        borderWidth: 1,
        borderColor: theme.colors.error
    },
    inputValid: {
        borderWidth: 1,
        borderColor: theme.colors.success
    },
    charCount: {
        position: 'absolute',
        right: wp(3),
        top: hp(1.5),
        fontSize: hp(1.6)
    },
    helperText: {
        fontSize: hp(1.6),
        color: theme.colors.error,
        marginTop: -hp(1),
        marginBottom: hp(1),
        marginLeft: wp(2)
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    notFound: {
        fontSize: Math.round(hp(2.5)),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium
    },
    loading: {
        height: Math.round(hp(5.8)),
        width: Math.round(hp(5.8)),
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: 1.3 }]
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        height: Math.round(hp(5.8)),
        width: Math.round(hp(5.8)),
        marginTop: hp(2)
    },
    sendIconDisabled: {
        borderColor: theme.colors.textLight,
        opacity: 0.7
    },
    reviewsContainer: {
        marginVertical: hp(2),
        gap: hp(2)
    },
    noReviews: {
        padding: hp(2),
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        alignItems: 'center'
    },
    noReviewsText: {
        color: theme.colors.textLight,
        fontSize: hp(1.8),
        fontWeight: theme.fonts.medium
    },
    charCountContainer: {
        position: 'absolute',
        right: wp(3),
        top: hp(1.5),
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: wp(2),
        borderRadius: theme.radius.sm
    },
    charCount: {
        fontSize: hp(1.6),
        fontWeight: '500'
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
    inputText: {
       color: 'white'
    },
    // ainputText: {
    //    color: 'green'
    // }
});
































































































































































































































































































// import React, { useEffect, useRef, useState } from "react";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { StyleSheet, TouchableOpacity, Alert, Animated } from "react-native";
// import Input from '../../components/Input';
// import { fetchPeopleReviewReplies, removeReplyPeopleReview } from "../../services/releaseService";
// import { fetchPeoplesReleaseDetails, createPeopleReleaseReview, removePeopleReview, createPeopleReviewReply } from "../../services/ottService"
// import { View } from "react-native";
// import { createNotifications } from '../../services/notificationService'
// import ReviewItem from "../../components/ReviewItem";
// import { hp, wp } from '../../helpers/common';
// import theme from '../../constants/theme';
// import { ScrollView } from "react-native";
// import { supabase } from '../../lib/supabase';
// import { useAuth } from '../../contexts/AuthContext';
// import ReleaeCard from '../../components/RelesaeCard';
// import Loading from "../../components/Loading";
// import FeedLoader from "../../components/FeedLoader";
// import Icon from '../../assets/icons';
// import { Text } from "react-native";
// import RatingModal from "../../components/RatingModel";
// import PeoplesReviewItem from "../../components/PeopleReviewItem";
// // import PeoplesReviewList from "./releasePeopleReview";
// import ProfilePopup from '../../components/profilePopup';
// import PeoplesPreviewList from "./streamPeopleReview";

// const MIN_CHARS = 85;

// const StreamPeopleDetails = () => {
//     const { streamId } = useLocalSearchParams();
//     const { user } = useAuth();
//     const router = useRouter();
//     const [startLoading, setStartLoading] = useState(false);
//     const inputRef = useRef(null);
//     const adminInputRef = useRef(null);
//     const reviewRef = useRef('');
//     const replyRef = useRef('');
//     const [adminReviewText, setAdminReviewText] = useState('');
//     const [reviewText, setReviewText] = useState('');
//     const [release, setRelease] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [charCount, setCharCount] = useState(0);
//     const shakeAnimation = useRef(new Animated.Value(0)).current;
//     const [openReplyBox, setOpenReplyBox] = useState(null);
//     const [reviewReplies, setReviewReplies] = useState({});
//     const [replyInputValues, setReplyInputValues] = useState({});
//     const [ratingModalVisible, setRatingModalVisible] = useState(false);
//     const [reviewRating, setReviewRating] = useState(0);
//     const [cupOfTea, setCupOfTea] = useState(false);
//     const [replyLoading, setReplyLoading] = useState({});
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [isProfilePopupVisible, setIsProfilePopupVisible] = useState(false);

//     // function to open profile popup
//     // console.log("releaseId details here rendered",release)

//     const openProfilePopup = (userData) => {
//         setSelectedUser(userData);
//         setIsProfilePopupVisible(true);
//     };

//     useEffect(() => {
//         getReleaseDetails();
//         subscribeToChanges();
//         return () => {
//             cleanup();
//         };
//     }, []);

//     const getReleaseDetails = async () => {
//         setStartLoading(true);
//         let res = await fetchPeoplesReleaseDetails(streamId);
//         if (res.success) setRelease(res.data);
//         setStartLoading(false);
//     };

//     // below is the code to handle review replies 

//     const fetchRepliesForReview = async (reviewId) => {
//         try {
//             const res = await fetchPeopleReviewReplies(reviewId);
//             if (res.success) {
//                 setReviewReplies(prev => ({
//                     ...prev,
//                     [reviewId]: res.data
//                 }));
//             }
//         } catch (error) {
//             console.error('Error fetching replies', error);
//         }
//     };

//     const toggleReplyBox = (reviewId) => {
//         setOpenReplyBox(prev => prev === reviewId ? null : reviewId);
//         if (!reviewReplies[reviewId]) {
//             fetchRepliesForReview(reviewId);
//         }
//     };

//     const handleReplyInputChange = (reviewId, value) => {
//         setReplyInputValues(prev => ({
//             ...prev,
//             [reviewId]: value
//         }));
//         replyRef.current = value;
//     };

//     const onSubmitReply = async (parentReviewId) => {
//         if (!replyRef.current || !user?.id) return null;
    
//         let data = {
//             userId: user.id,
//             text: replyRef.current,
//             parentReviewId: parentReviewId,
//             releaseId: release.id
           
//         };
    
//         // Use review-specific loading state
//         setReplyLoading(prev => ({
//             ...prev,
//             [parentReviewId]: true
//         }));
        
//         try {
//             let res = await createPeopleReviewReply(data);
//             if (res.success) {
//                 // Create new reply object with user data
//                 const newReply = {
//                     ...res.data,
//                     user: {
//                         id: user.id,
//                         ...user
//                     }
//                 };
    
//                 // Update state immediately
//                 setReviewReplies(prev => ({
//                     ...prev,
//                     [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
//                 }));
    
//                 // Clear input
//                 replyRef.current = '';
//                 setReplyInputValues(prev => ({
//                     ...prev,
//                     [parentReviewId]: ''
//                 }));
//                 // setOpenReplyBox(null);
    
//                 // Handle notification
//                 if (user.id !== release.userId) {
//                     let notify = {
//                         senderId: user.id,
//                         receiverId: release.userId,
//                         title: 'replied to your review',
//                         data: JSON.stringify({ releaseId: release.id, streamId: parentReviewId })
//                     };
//                     createNotifications(notify);
//                 }
//             } else {
//                 Alert.alert('Peoples Reply', res.msg || 'Something went wrong');
//             }
//         } catch (err) {
//             Alert.alert('Peoples Reply', 'Something went wrong');
//         } finally {
//             // Clear loading state for this specific review
//             setReplyLoading(prev => ({
//                 ...prev,
//                 [parentReviewId]: false
//             }));
//         }
//     };

//     // end of review replies code - below is the handle review code 

//     const handleNewReview = async (payload) => {
//         if (payload.new && payload.new.parentReviewId) {
//             const newReply = { ...payload.new };
//             const parentReviewId = newReply.parentReviewId;
            
//             // Get user data for the reply
//             let userRes = await getUserData(newReply.userId);
//             newReply.user = userRes.success ? userRes.data : {};

//             // Update reviewReplies state
//             setReviewReplies(prev => ({
//                 ...prev,
//                 [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
//             }));
//         }
//     };

//     const handleNewReply = async (payload) => {
//         if (payload.new && payload.new.parentReviewId) {
//             const newReply = { ...payload.new };
//             const parentReviewId = newReply.parentReviewId;
            
//             // Get user data for the reply
//             let userRes = await getUserData(newReply.userId);
//             newReply.user = userRes.success ? userRes.data : {};

//             // Update reviewReplies state
//             setReviewReplies(prev => ({
//                 ...prev,
//                 [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
//             }));
//         }
//     };

//                 const subscribeToChanges = () => {
//                     // Subscribe to new reviews
//                     let reviewChannel = supabase
//                         .channel('peoplesReview')
//                         .on('postgres_changes', 
//                             {event: 'INSERT', schema: 'public', table: 'peoplesReview', filter: `releaseId=eq.${streamId}`}, 
//                             handleNewReview)
//                         .subscribe();

//                     // Subscribe to new replies
//                     let replyChannel = supabase
//                         .channel('replyPeopleReviews')
//                         .on('postgres_changes', 
//                             {event: 'INSERT', schema: 'public', table: 'peoplesReview', filter: `releaseId=eq.${streamId}`}, 
//                             handleNewReply)
//                         .subscribe();

//                     return { reviewChannel, replyChannel };
//                 };

//                 const cleanup = () => {
//                     const channels = subscribeToChanges();
//                     supabase.removeChannel(channels.reviewChannel);
//                     supabase.removeChannel(channels.replyChannel);
//                 };

//         const onNewReview = () => {
//             if(!reviewRef.current || !user?.id || !release?.id) return null;
//             if(charCount < MIN_CHARS) return null;
            
//             setRatingModalVisible(true);
//         };

//         // below is a cup of tea variable which is a boolean value

//         const handleFinalReviewSubmit = async (rating, cupOfTea, emoji, mustWatch) => {
//             let data = {
//                 userId: user.id,
//                 releaseId: release.id,
//                 text: reviewRef.current,
//                 userRating: rating,
//                 cupOfTea: cupOfTea, 
//                 addings: emoji
//                 // popCorn: mustWatch
//             }
            
//             setLoading(true);
//             try {
//                 let res = await createPeopleReleaseReview(data);
//                 if(res.success){
//                     const newReview = {
//                         ...res.data,
//                         user: {
//                             id: user.id,
//                             ...user
//                         }
//                     };
        
//                     setRelease(prevRelease => ({
//                         ...prevRelease,
//                         dpeopreviews: [newReview, ...prevRelease.dpeopreviews]
//                     }));
        
//                     if(user.id !== release.userId){
//                         let notify = {
//                             senderId: user.id,
//                             receiverId: release.userId,
//                             title: 'reviewed on your release',
//                             data: JSON.stringify({releaseId: release.id, streamId: res?.data?.id})
//                         }
//                         createNotifications(notify);
//                     }
        
//                     inputRef?.current?.clear();
//                     reviewRef.current = "";
//                     setReviewText('');
//                     setCharCount(0);
//                     setReviewRating(0);
//                 } else {
//                     Alert.alert('Ott Review', res.msg || 'Something went wrong');
//                 }
//             } catch (err) {
//                 Alert.alert('Ott Review', 'Something went wrong');
//             } finally {
//                 setLoading(false);
//             }
//         };
    
//         const onDeleteReview = async (review) => {
//             try {
//                 let res = await removePeopleReview(review?.id);
//                 if(res.success){
//                     // Update state directly instead of reloading
//                     setRelease(prevRelease => ({
//                         ...prevRelease,
//                         dpeopreviews: prevRelease.dpeopreviews.filter(r => r.id !== review.id)   
//                     }));
//                 } else {
//                     Alert.alert('Preview', res.msg || 'Something went wrong');
//                 }
//             } catch (err) {
//                 Alert.alert('Preview', 'Something went wrong');
//             }
//         }


//         const onDeleteReviewReply = async (review) => {
//             // Remove the reply from the state
//             try{
//                 let res = await removeReplyPeopleReview(review?.id);
//                 if(res.success){
//                     Alert.alert('Review Reply :', 'Reply deleted. Thanks! You can still view it to respond again.');

//                     // here is the upadtion to be done to make instant reply release functions
//                 }
//             }catch(err){
//                 Alert.alert('Review Reply', 'Something went wrong');
//             }
//         }
    
//         const handleTextChange = (text) => {
//             setReviewText(text);
//             setCharCount(text.length);
//             reviewRef.current = text;
//         };
    
//         const getInputStatus = () => {
//             if (charCount === 0) return 'empty';
//             if (charCount < MIN_CHARS) return 'tooShort';
//             return 'valid';
//         };
    
//         const getStatusColor = () => {
//             const status = getInputStatus();
//             switch (status) {
//                 case 'empty':
//                     return theme.colors.textLight;
//                 case 'tooShort':
//                     return theme.colors.error;
//                 case 'valid':
//                     return theme.colors.success;
//                 default:
//                     return theme.colors.textLight;
//             }
//         };
    
//         const getRemainingChars = () => {
//             return MIN_CHARS - charCount;
//         };
    
//         const getInputPlaceholder = () => {
//             if (charCount === 0) {
//                 return "Write your review";
//             }
//             const remaining = getRemainingChars();
//             if (remaining > 0) {
//                 return `${remaining} more characters needed`;
//             }
//             return "Share your thoughts...";
//         };
    
//         if (startLoading) return <View style={styles.center}><Loading /></View>;
    
//         if (!release) {
//             return (
//                 <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
//                     <Text style={styles.notFound}>Release not found</Text>
//                 </View>
//             );
//         }

//         // console.log('Below are the set of peoples reviews', release?.peoplesReview);
//         //  const isCurrentUserReview = release?.peoplesReview?.user?.id === user?.id;  // this code not working
//         const isCurrentUserReview = release?.peoplesReview?.some(review => review?.user?.id === user?.id);
        

//         const hasUserPostedReview = release?.peoplesReview?.some(
//             (review) => review.user?.id === user?.id);


//             // below are all logic admin review component part

//             const onAdminReviewSubmit = async () => {
//                 if (!adminReviewText || !user?.id || !release?.id) return;
            
//                 let data = {
//                     userId: user.id,
//                     releaseId: release.id,
//                     text: adminReviewText,
//                     userRating: 5, // Default rating for admin
//                 };
            
//                 setLoading(true);
//                 try {
//                     let res = await createPeopleReleaseReview(data);
//                     if (res.success) {
//                         setRelease(prevRelease => ({
//                             ...prevRelease,
//                             dpeopreviews: [{ ...res.data, user }, ...prevRelease.dpeopreviews],
//                         }));
//                         setAdminReviewText(''); // Clear input after submission
//                     } else {
//                         Alert.alert('Admin Review', res.msg || 'Something went wrong');
//                     }
//                 } catch (err) {
//                     Alert.alert('Admin Review', 'Something went wrong');
//                 } finally {
//                     setLoading(false);
//                 }
//             };
            


//            const isadmin =  user?.id === "a4424502-53de-4814-8882-7a4b5c09a76c"
    
//         return (
//             <View style={styles.container}>
//                 <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
//                     <ReleaeCard
//                         item={{ ...release ,reviews: [{ count: release?.peoplesReview?.length || 0 }] }}
//                         currentUser={user}
//                         router={router}
//                         hasShadow={false}
//                         showReviewButton={false}
//                     />
//          {/* below is input peoples reviews component for ADMIN */}
//         {isadmin && (
//             <Animated.View style={[
//                 styles.inputContainer,
//                 { transform: [{ translateX: shakeAnimation }] }
//             ]}>
//                 <View style={styles.inputWrapper}>
//                     <Input 
//                         inputRef={adminInputRef}  
//                         placeholder="Write your review (admin review)"
//                         placeholderTextColor={theme.colors.textLight}
//                         containerStyle={styles.input} 
//                         value={adminReviewText} 
//                         onChangeText={setAdminReviewText} 
//                         multiline={true}
//                         textAlignVertical="top"
//                         style={styles.ainputText}
//                     />
//                 </View>
//                 {loading ? (
//                     <View style={styles.loading}>
//                         <FeedLoader size="small" color={theme.colors.primaryDark} />
//                     </View>
//                 ) : (
//                     <TouchableOpacity
//                         style={styles.sendIcon}
//                         onPress={onAdminReviewSubmit}
//                     >
//                         <Icon name="send" size={hp(2)} color={theme.colors.primaryDark} />
//                     </TouchableOpacity>
//                 )}
//             </Animated.View>
//         )}

//         {/* Input Component - always visible but disabled when user has already posted */}
//         {/* below is input peoples reviews component */}
//         <Animated.View
//         style={[styles.inputContainer, { transform: [{ translateX: shakeAnimation }] }]}
//         pointerEvents={hasUserPostedReview ? "none" : "auto"}
//         >
//         <View style={styles.inputWrapper}>
//             <Input
//             inputRef={inputRef}
//             placeholder={hasUserPostedReview ? "You've already submitted a review" : getInputPlaceholder()}
//             placeholderTextColor={theme.colors.textLight}
//             containerStyle={[
//                 styles.input,
//                 charCount > 0 && charCount < MIN_CHARS && styles.inputError,
//                 charCount >= MIN_CHARS && styles.inputValid,
//                 hasUserPostedReview && { opacity: 0.6 }
            
//             ]}
//             value={reviewText}
//             onChangeText={handleTextChange}
//             multiline={true}
//             textAlignVertical="top"
//             editable={!hasUserPostedReview}
//             style={styles.inputText}
//             />
//             {charCount < MIN_CHARS && !hasUserPostedReview && (
//             <View style={styles.charCountContainer}>
//                 <Text
//                 style={[styles.charCount, { color: getStatusColor() }]}
//                 >{`${charCount}/${MIN_CHARS}`}</Text>
//             </View>
//             )}
//         </View>
//         {loading ? (
//             <View style={styles.loading}>
//             <FeedLoader size="small" color={theme.colors.primaryDark} />
//             </View>
//         ) : (
//             <TouchableOpacity
//             style={[
//                 styles.sendIcon,
//                 (charCount < MIN_CHARS || hasUserPostedReview) && styles.sendIconDisabled,
//                 hasUserPostedReview && { opacity: 0.6 }
//             ]}
//             onPress={onNewReview}
//             disabled={charCount < MIN_CHARS || hasUserPostedReview}
//             >
//             <Icon
//                 name="send"
//                 size={hp(2)}
//                 color={
//                 charCount < MIN_CHARS || hasUserPostedReview
//                     ? theme.colors.textLight
//                     : theme.colors.primaryDark
//                 }
//             />
//             </TouchableOpacity>
//         )}
//             </Animated.View>
                       
//                     <PeoplesPreviewList
//                             reviews={release?.dpeopreviews || []}  
//                             releaseId={release.id}
//                             releaseUserId={release.userId}
//                             currentUser={user}
//                             onDeleteReview={onDeleteReview}
//                             openProfilePopup={openProfilePopup}
//                             sty
//                             />

//                     <ProfilePopup
//                         user={selectedUser}
//                         visible={isProfilePopupVisible}
//                         onClose={() => setIsProfilePopupVisible(false)}
//                         router={router}
//                     />

//                 <RatingModal 
//                     visible={ratingModalVisible}
//                     onClose={() => setRatingModalVisible(false)}
//                     onSubmit={handleFinalReviewSubmit}
//                 />
//                 </ScrollView>
//             </View>
//         );
//     };
    
// export default StreamPeopleDetails;

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#121212',
//         paddingVertical: Math.round(wp(7))
//     },
//     list: {
//         paddingHorizontal: Math.round(wp(4))
//     },
//     inputContainer: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//         gap: 10,
//         marginVertical: hp(2)
//     },
//     inputWrapper: {
//         flex: 1,
//         position: 'relative'
//     },
//     input: {
//         flex: 1,
//         minHeight: hp(10),
//         maxHeight: hp(20),
//         borderRadius: theme.radius.xl,
//         backgroundColor: theme.colors.background,
//         paddingRight: wp(8),
        
//     },
//     inputError: {
//         borderWidth: 1,
//         borderColor: theme.colors.error
//     },
//     inputValid: {
//         borderWidth: 1,
//         borderColor: theme.colors.success
//     },
//     charCount: {
//         position: 'absolute',
//         right: wp(3),
//         top: hp(1.5),
//         fontSize: hp(1.6)
//     },
//     helperText: {
//         fontSize: hp(1.6),
//         color: theme.colors.error,
//         marginTop: -hp(1),
//         marginBottom: hp(1),
//         marginLeft: wp(2)
//     },
//     center: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     notFound: {
//         fontSize: Math.round(hp(2.5)),
//         color: theme.colors.text,
//         fontWeight: theme.fonts.medium
//     },
//     loading: {
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8)),
//         justifyContent: 'center',
//         alignItems: 'center',
//         transform: [{ scale: 1.3 }]
//     },
//     sendIcon: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 0.8,
//         borderColor: theme.colors.primary,
//         borderRadius: theme.radius.lg,
//         borderCurve: 'continuous',
//         height: Math.round(hp(5.8)),
//         width: Math.round(hp(5.8)),
//         marginTop: hp(2)
//     },
//     sendIconDisabled: {
//         borderColor: theme.colors.textLight,
//         opacity: 0.7
//     },
//     reviewsContainer: {
//         marginVertical: hp(2),
//         gap: hp(2)
//     },
//     noReviews: {
//         padding: hp(2),
//         backgroundColor: theme.colors.background,
//         borderRadius: theme.radius.lg,
//         alignItems: 'center'
//     },
//     noReviewsText: {
//         color: theme.colors.textLight,
//         fontSize: hp(1.8),
//         fontWeight: theme.fonts.medium
//     },
//     charCountContainer: {
//         position: 'absolute',
//         right: wp(3),
//         top: hp(1.5),
//         backgroundColor: 'rgba(255, 255, 255, 0.9)',
//         paddingHorizontal: wp(2),
//         borderRadius: theme.radius.sm
//     },
//     charCount: {
//         fontSize: hp(1.6),
//         fontWeight: '500'
//     },
//     replyInputContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//         marginTop: 10,
//         marginHorizontal: 10,
//         marginLeft: 50
//     },
//     replyContainer: {
//         marginLeft: 50,
//         marginTop: 5
//     },
//     replySendIcon: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 1,
//         borderColor: theme.colors.primaryDark,
//         borderRadius: theme.radius.sm,
//         borderCurve: 'continuous',
//         height: Math.round(hp(4.8)),
//         width: Math.round(hp(4.8))
//     },
//     inputText: {
//        color: 'white'
//     },
//     ainputText: {
//        color: 'green'
//     }
// });