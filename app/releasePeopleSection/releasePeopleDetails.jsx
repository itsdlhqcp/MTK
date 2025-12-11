import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, Alert, Animated, RefreshControl, Easing } from "react-native";
import Input from '../../components/Input';
import { createReleaseReview, createPeopleReleaseReview, fetchPeoplesReleaseDetails, removePeopleReview , removeReplyPeopleReview, fetchReleaseDetailsx, fetchReviewReplies, createReviewReply, hasUserPostedAnyReview} from "../../services/releaseService";
import { View } from "react-native";
import { createNotifications } from '../../services/notificationService'
import ReviewItem from "../../components/PreviewItem";
import { hp, wp } from '../../helpers/common';
import theme from '../../constants/theme';
import { ScrollView } from "react-native";
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ReleaeCard from '../../components/RelesaeCard';
import FeedLoader from "../../components/FeedLoader";
import Icon from '../../assets/icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PeoplesReviewList from "./releasePeopleReview";
import PeoplesPreviewList from "../streamPeopleSection/streamPeopleReview";
import ProfilePopup from '../../components/profilePopup';
import RatingBottomSheet from "../../components/RatingBottomSheet";
import { useReview } from '../../contexts/ReviewContext';
import { useRoute } from "@react-navigation/native";
import { fetchPeoplesStreamDetailsx } from "../../services/ottService";
import TheatreReviewTabs from "../../components/TheatreReviewTabs";
import ScreenWrapper from "../../components/ScreenWrapper";
import moment from "moment";
import { useToast } from "../../contexts/ToastContext";

const MIN_CHARS = 0;

const ReleasePeopleDetails = () => {
    const params = useLocalSearchParams();
    const releaseId = params.releaseId;
    const reviewId = params.reviewId;
    const lib = params.lib === 'true' || params.lib === true;
    const openReview = params.openReview;
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
    const [refreshing, setRefreshing] = useState(false);
    const { updateReviewData} = useReview();
    const [thReview, setThReview] = useState(null);
    const { showToast } = useToast();
    const [hasUserPostedReview, setHasUserPostedReview] = useState(false);
    const route = useRoute();

    const buttonSlideAnim = useRef(new Animated.Value(100)).current;

    // Animate button sliding in from the side based on hasUserPostedReview flag (no delay)
    useEffect(() => {
        // If user hasn't posted a review, slide the button in from the side immediately
        if (!hasUserPostedReview && release) {
          Animated.timing(buttonSlideAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }).start();
        } else {
          // If user has posted a review, hide the button by sliding it out
          Animated.timing(buttonSlideAnim, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }, [hasUserPostedReview, release]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        getReleaseDetails().then(() => {
          setRefreshing(false);
        });
      }, []);

useEffect(() => {
    if (route.params?.updatedReview) {
      try {
        console.log('Processing updated review');
        const updatedReview = JSON.parse(route.params.updatedReview);
        console.log('Parsed review:', updatedReview);
        
        setRelease(prevRelease => {
          if (!prevRelease) {
            console.log('No release data to update');
            return prevRelease;
          }
          
          // Create a new array with the updated review
          const updatedPeoplesReview = prevRelease.peoplesReview.map(review => {
            if (review.id === updatedReview.id) {
              console.log('Found review to update:', review.id);
              // Return a new object that combines the original review with updated fields
              return {
                ...review,
                text: updatedReview.text,
                favour: updatedReview.favour
              };
            }
            return review;
          });
          
          console.log('Updated reviews array');
          // Return a new release object
          return {
            ...prevRelease,
            peoplesReview: updatedPeoplesReview
          };
        });
        
        // Important: Use the router to reset params instead of modifying route.params directly
        router.setParams({
          releaseId: route.params.releaseId,
          // Remove the updatedReview param by not including it
        });
        console.log('Params reset');
      } catch (error) {
        console.error('Error processing updated review:', error);
      }
    }
  }, [route.params?.updatedReview]);

        useEffect(() => {
                if (release && release?.sconnectedId) {
                    getThPeoplesReleaseDetails();
                }
            }, [release]);

             // Removed separate useEffect for checking user review - now handled in getReleaseDetails

            useEffect(() => {
                getAreleaseDetails();
                getReleaseDetails();
                
                // Subscribe to changes and store the channels
                const channels = subscribeToChanges();
                
                return () => {
                    // Cleanup function - remove channels on unmount
                    supabase.removeChannel(channels.reviewChannel);
                    supabase.removeChannel(channels.replyChannel);
                    supabase.removeChannel(channels.areviewChannel);
                    supabase.removeChannel(channels.areplyChannel);
                };
            }, []);

         // Removed checkUserReview function - now handled in getReleaseDetails with hasUserReviewed flag

          const getThPeoplesReleaseDetails = async () => {
                if (!release || !release.sconnectedId) {
                    return;
                }
                
                try {
                    let res = await fetchPeoplesStreamDetailsx(release?.sconnectedId, user?.id);
                    if (res.success) setThReview(res.data);
                } catch (error) {
                    console.error("Error fetching people's release details:", error);
                } finally {
                    setStartLoading(false);
                }
            };
    
          const getAreleaseDetails = async () => {
                setStartLoading(true);
                let res = await fetchReleaseDetailsx(releaseId);
                if (res.success) setArelease(res.data);
                setStartLoading(false);
            };

    // function to open profile popup
    const openProfilePopup = (userData) => {
        setSelectedUser(userData);
        setIsProfilePopupVisible(true);
    };

    const getReleaseDetails = async () => {
        setStartLoading(true);
        let res = await fetchPeoplesReleaseDetails(releaseId, user?.id);
        if (res.success) {
            setRelease(res.data);
            // Set hasUserPostedReview flag from the response
            if (res.data?.hasUserReviewed !== undefined) {
                setHasUserPostedReview(res.data.hasUserReviewed);
            }
        }
        setStartLoading(false);
        
        // Open rating modal if openReview param is present
        if (openReview === 'true' && user?.id) {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                setRatingModalVisible(true);
            }, 500);
        }
    };

    // below is the code to handle review replies 

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
                    userId: user?.id,
                    text: replyRef.current,
                    parentReviewId: parentReviewId,
                    releaseId: release?.id // Add releaseId for the filter in subscription
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
                        if (user?.id !== arelease?.userId) {
                            let notify = {
                                senderId: user?.id,
                                receiverId: arelease?.userId,
                                title: 'replied to your review',
                                data: JSON.stringify({ releaseId: arelease?.id, releaseId: parentReviewId })
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

    // below is the real time subscrption for reples 

    const ahandleNewReview = async (payload) => {
        if (payload.new && payload.new.parentReviewId) {
            const newReply = { ...payload.new };
            const parentReviewId = newReply.parentReviewId;
            
            // Get user data for the reply
            let userRes = await getUserData(newReply.userId);
            newReply.user = userRes.success ? userRes.data : {};

            // Update reviewReplies state setAreviewReplies
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
                {event: 'INSERT', schema: 'public', table: 'peoplesReview', filter: `releaseId=eq.${releaseId}`}, 
                handleNewReview)
            .subscribe();
    
        // Subscribe to new replies
        let replyChannel = supabase
            .channel('replyPeopleReviews')
            .on('postgres_changes', 
                {event: 'INSERT', schema: 'public', table: 'peoplesReview', filter: `releaseId=eq.${releaseId}`}, 
                handleNewReply)
            .subscribe();
    
        let areviewChannel = supabase
            .channel('reviews')
            .on('postgres_changes', 
            {event: 'INSERT', schema: 'public', table: 'reviews', filter: `releaseId=eq.${releaseId}`}, 
            ahandleNewReview)
            .subscribe();
            
        // Subscribe to new replies
        let areplyChannel = supabase
            .channel('replies')
            .on('postgres_changes', 
            {event: 'INSERT', schema: 'public', table: 'reviews', filter: `releaseId=eq.${releaseId}`}, 
            ahandleNewReply)
            .subscribe();
    
        return { reviewChannel, replyChannel, areviewChannel, areplyChannel};
    };

        const onNewReview = () => {
            if( !user?.id || !release?.id) return null;
            setRatingModalVisible(true);
        };

        // below is the function to handle edit review
        const handleEditReview = (item) => {

            // Prepare the movie data object from the release
            const movieData = {
              title: release?.body ? release?.body : 'Movie Title',
              year: release?.rDate ? release?.rDate : '',
              id: release?.id || '',
              image: release?.filel,
              isFavorite: item?.favour || false
            };
            
            // Prepare the review state object
            const reviewState = {
              rating: item?.userRating || 0,
              cupOfTea: item?.cupOfTea || null,
              prefer: item?.prefer || null,
              predict: item?.predict || null,
              repeat: item?.repeat || null
            };
            
            // Update the review context with the review text  
            updateReviewData({
              reviewText: item?.text || '',
              reviewDate: item?.createdAt ? item?.createdAt : '',
              isFavorite: item?.favour || false
            });
            
            // Navigate to the CreateReview page with the review data
            router.push({
              pathname: 'createReview',
              params: { 
                movie: JSON.stringify(movieData),
                movieId: release?.id || '',
                reviewState: JSON.stringify(reviewState),
                review: JSON.stringify({
                  body: item?.text || '',
                  date: item?.createdAt ? item?.createdAt : '',
                  id: item?.id
                }),
                source: 'release'
              }
            });
          };

        const handleFinalReviewSubmit = async (rating, cupOfTea, prefer, predict, repeat, reviewTextFromSheet, favour) => {

            const finalReviewText = reviewTextFromSheet || reviewRef.current;
            let data = {
                userId: user?.id,
                releaseId: release?.id,
                text:finalReviewText,
                userRating: rating,
                cupOfTea: cupOfTea, 
                prefer: prefer,
                predict: predict,
                repeat: repeat,
                favour: favour
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
                        peoplesReview: [newReview, ...prevRelease.peoplesReview],
                        hasUserReviewed: true  // Update flag when review is created
                    }));
                    // Update hasUserPostedReview flag
                    setHasUserPostedReview(true);
        
                    if(user.id !== release.userId){
                        let notify = {
                            senderId: user.id,
                            receiverId: release.userId,
                            title: 'reviewed on your release',
                            data: JSON.stringify({releaseId: release.id, reviewId: res?.data?.id})
                        }
                        createNotifications(notify);
                    }
        
                    inputRef?.current?.clear();
                    reviewRef.current = "";
                    setReviewText('');
                    setCharCount(0);
                    setReviewRating(0);
                } else {
                    Alert.alert('Review', res.msg || 'Something went wrong');
                }
            } catch (err) {
                Alert.alert('Review', 'Something went wrong');
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
                        peoplesReview: prevRelease.peoplesReview.filter(r => r.id !== review.id),
                        hasUserReviewed: false  // Update flag when review is deleted
                    }));
                    // Update hasUserPostedReview flag
                    setHasUserPostedReview(false);
                } else {
                    Alert.alert('Review', res.msg || 'Something went wrong');
                }
            } catch (err) {
                Alert.alert('Review', 'Something went wrong');
            }
        }

        const onDeleteReviewReply = async (review) => {
            // Remove the reply from the state
            try{
                let res = await removeReplyPeopleReview(review?.id);
                if(res.success){
                    showToast('success', 'Reply deleted. Thanks! You can still view it to respond again.');

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
                return "Write your review (at least 85 characters)";
            }
            const remaining = getRemainingChars();
            if (remaining > 0) {
                return `${remaining} more characters needed`;
            }
            return "Share your thoughts...";
        };

        if (!release) return (
            <View style={[styles.center, { backgroundColor: "black" }]}>
               <View style={styles.loading}>
                  <FeedLoader size="medium" color={theme.colors.assent} />
               </View>
            </View>
          );

          if (startLoading) return (
            <View style={[styles.center, { backgroundColor: "black" }]}>
               <View style={styles.loading}>
                  <FeedLoader size="medium" color={theme.colors.assent} />
               </View>
            </View>
          );    
            // const isadmin =  user?.id === "a4424502-53de-4814-8882-7a4b5c09a76c"
            const isadmin = false;

            // on submit admin review 

                 const onAdminReviewSubmit = async () => {
                        if(!adminReviewRef?.current || !user?.id || !arelease?.id) return null;
                        
                        let data = {
                            userId: user?.id,
                            releaseId: arelease?.id,
                            text: adminReviewRef?.current
                        }
                        
                        setLoading(true);
                        try {
                            let res = await createReleaseReview(data);
                            if(res.success){
                                // Create the new review object with user data
                                const newReview = {
                                    ...res.data,
                                    user: {
                                        id: user?.id,
                                        // Add any other user fields that are displayed in ReviewItem
                                        ...user
                                    }
                                };
                
                                // Update the state directly
                                setArelease(prevRelease => ({
                                    ...prevRelease,
                                    reviews: [newReview, ...prevRelease.reviews]
                                }));
                
                                if(user.id !== arelease?.userId){
                                    let notify = {
                                        senderId: user.id,
                                        receiverId: arelease?.userId,
                                        title: 'reviewed on your release',
                                        data: JSON.stringify({releaseId: arelease?.id, reviewId: res?.data?.id})
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

                    const releaseAt = release?.rDate ? moment(release?.rDate).format('MMM D') : '';
                    const show = releaseAt && moment(release?.rDate).isSameOrBefore(moment(), 'day');  

    
        return (
<ScreenWrapper bg="#121212">
    <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <ScrollView 
                showsVerticalScrollIndicator={false}
                 contentContainerStyle={styles.list}
                 refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                    />
                  }
                 >
                    <ReleaeCard
                        item={{ ...release ,reviews: [{ count: release?.peoplesReview?.length || 0 }] }}
                        currentUser={user}
                        router={router}
                        hasShadow={false}
                        showReviewButton={false}
                        onClick={false}
                    />
                    {isadmin && (
                            <Animated.View style={[
                                styles.inputContainer,
                                { transform: [{ translateX: shakeAnimation }] }
                            ]}>
                                <View style={styles.inputWrapper}>
                                    <Input
                                        inputRef={adminInputRef}
                                        placeholder={getInputPlaceholder()}
                                        placeholderTextColor={theme.colors.textLight}
                                        containerStyle={styles.input} 
                                        value={adminReviewText}
                                       // onChangeText={ahandleTextChange}
                                        multiline={true}
                                        textAlignVertical="top"
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
                                        <Icon 
                                            name="send" 
                                            size={hp(2)} 
                                            color={theme.colors.primaryDark} 
                                        />
                                    </TouchableOpacity>
                                )}
                        </Animated.View> 
                    )}

                   {/* Reviews rendering here ADMINS*/}

                   {arelease?.reviews && (
                             <View style={styles.reviewsContainer}>
                             {arelease?.reviews?.length > 0 ? (
                                 arelease?.reviews
                                     .filter(review => !review.parentReviewId)
                                     .map(review => (
                                         <View key={review?.id?.toString()}>
                                             <ReviewItem
                                                 item={review}
                                                 onDelete={onDeleteReview}
                                                 canDelete={user?.id === review?.userId || user?.id === arelease?.userId}
                                                 onReplyReviewPress={() => toggleReplyBox(review?.id)}
                                                 replyCount={areviewReplies[review?.id]?.length || 0}
                                                 isReply={false}
                                                 // openProfilePopup={() => openProfilePopup(review.user)}
                                                 onShowProfile={() => openProfilePopup(review.user)}
                                             />
                                             
                                             {/* Render replies when reply box is open */}
                                             {openReplyBox === review?.id && areviewReplies[review?.id]?.map(reply => (
                                                 <View key={reply.id} style={styles.replyContainer}>
                                                     <ReviewItem
                                                         item={reply}
                                                         onDelete={onDeleteReview}
                                                         canDelete={user.id === reply.userId || user.id === arelease.userId}
                                                         replyCount={areviewReplies[review?.id]?.length || 0}
                                                         isReply={true}
                                                     />
                                                 </View>
                                             ))}
                                             
                                             {/* Reply input box */}
                                             {openReplyBox === review?.id && (
                                                 <View style={styles.replyInputContainer}>
                                                     <Input
                                                         placeholder={`Reply to @${review?.user.name}...`}
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
                                                             onPress={() => onSubmitReply(review?.id)}
                                                         >
                                                             <Icon name="send" size={hp(2)} color={theme.colors.primaryDark} />
                                                         </TouchableOpacity>
                                                     )}
                                                 </View>
                                             )}
                                         </View>
                                     ))
                             ) : ""}
                         </View>

                   )}

                    {/* IN CASE OF THEATRE */}
                              {!release?.sconnectedId && (
                                     <PeoplesReviewList
                                     reviews={release?.peoplesReview || []}
                                     releaseId={release?.id}
                                     releaseUserId={release?.userId}
                                     currentUser={user}
                                     onDeleteReview={onDeleteReview}
                                     openProfilePopup={openProfilePopup}
                                     reviewId={reviewId}
                                     onhandleEdit={handleEditReview} 
                                     date={release?.rDate}
                                     />
                              )}    

                                {/* IN CASE OF LIBRARY */}

                              {release?.sconnectedId && (
                                    <TheatreReviewTabs>
                                   {/* Tab 1: Digital Reviews */}
                                   <View>
                                   <PeoplesReviewList
                                        reviews={release?.peoplesReview || []}
                                        releaseId={release?.id}
                                        releaseUserId={release?.userId}
                                        currentUser={user}
                                        onDeleteReview={onDeleteReview}
                                        openProfilePopup={openProfilePopup}
                                        reviewId={reviewId}
                                        onhandleEdit={handleEditReview}
                                        date={release?.rDate}
                                    />
                                   </View>
                                   
                                   {/* Tab 2: Theatre Reviews */}
                                   <View>
                                   {thReview?.dpeopreviews && (
                                 
                                    <PeoplesPreviewList
                                    reviews={thReview?.dpeopreviews || []}  
                                    releaseId={thReview?.id}
                                    releaseUserId={thReview?.userId}
                                    currentUser={user}
                                    onDeleteReview={onDeleteReview} // upgrade
                                    openProfilePopup={openProfilePopup}
                                    reviewId={reviewId} // need a change
                                    onhandleEdit={handleEditReview}  // upgrade
                                    release={release}
                             />
                                    )}
                                   </View>
                                 </TheatreReviewTabs>

                              )}
                       

                    <ProfilePopup
                        user={selectedUser}
                        visible={isProfilePopupVisible}
                        onClose={() => setIsProfilePopupVisible(false)}
                        router={router}
                    />

                   </ScrollView>
                 {/* Adding the floating button */}

                 {!hasUserPostedReview && show &&(
                        <Animated.View
                            style={{
                            position: 'absolute',
                            bottom: hp(2.5),
                            right: wp(3),
                            transform: [{ translateX: buttonSlideAnim }]
                            }}
                        >
                            <TouchableOpacity 
                            style={styles.floatingButton}
                            onPress={onNewReview}
                            >
                            <Icon 
                                name="pencil" 
                                size={hp(3.2)} 
                                color={theme.colors.primary}
                            />
                            </TouchableOpacity>
                        </Animated.View>
                        )}

                    {/* place outside of scrollview to work properly */}
                       <RatingBottomSheet 
                             item={release}
                             visible={ratingModalVisible}
                             onClose={() => setRatingModalVisible(false)}
                             onSubmit={handleFinalReviewSubmit}
                             router={router}
                        />              
                </View>
            </GestureHandlerRootView>
            </ScreenWrapper>
        );
    };
    
export default ReleasePeopleDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
       // paddingVertical: Math.round(wp(7))
    },
    list: {
      //  paddingHorizontal: Math.round(wp(4))
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
        paddingTop: hp(1.5),
        paddingBottom: hp(1.5),
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
        borderWidth: 0,
        marginHorizontal: hp(1)
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
    floatingButton: {
        position: 'absolute',
        bottom: hp(3),
        right: wp(4),
        width: hp(6),
        height: hp(6),
        borderRadius: hp(3),
        backgroundColor: "black",
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
    }
});