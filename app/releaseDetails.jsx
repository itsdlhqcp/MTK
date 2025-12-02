import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, Alert, Animated } from "react-native";
import Input from '../components/Input';
import { createReleaseReview, fetchReleaseDetails, removeReview ,createReviewReply, fetchReviewReplies } from "../services/releaseService";
import { View } from "react-native";
import { createNotifications } from '../services/notificationService'
import ReviewItem from "../components/ReviewItem";
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import { ScrollView } from "react-native";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ReleaeCard from '../components/RelesaeCard';
import FeedLoader from "../components/FeedLoader";
import Icon from '../assets/icons';
import { Text } from "react-native";
import moment from "moment";
import CustomDotIndicator from "../components/CutomDotIndicator";

const MIN_CHARS = 85;

const ReleaseDetails = () => {
    const { releaseId } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [startLoading, setStartLoading] = useState(false);
    const inputRef = useRef(null);
    const reviewRef = useRef('');
    const replyRef = useRef('');
    const [reviewText, setReviewText] = useState('');
    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const [openReplyBox, setOpenReplyBox] = useState(null);
    const [reviewReplies, setReviewReplies] = useState({});
    
    // Store channel references for proper cleanup
    const channelsRef = useRef(null);

    useEffect(() => {
        getReleaseDetails();
        subscribeToChanges();
        return () => {
           cleanup();
        };
    }, []);

    const getReleaseDetails = async () => {
        setStartLoading(true);
        let res = await fetchReleaseDetails(releaseId);
        if (res.success) setRelease(res.data);
        setStartLoading(false);
    };

    // below is the code to handle review replies 

    const fetchRepliesForReview = async (reviewId) => {
        try {
            const res = await fetchReviewReplies(reviewId);
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
        if (!reviewReplies[reviewId]) {
            fetchRepliesForReview(reviewId);
        }
    };

    const onSubmitReply = async (parentReviewId) => {
        if (!replyRef.current || !user?.id) return null;

        let data = {
            userId: user.id,
            text: replyRef.current,
            parentReviewId: parentReviewId,
            releaseId: release.id
        };

        setLoading(true);
        try {
            let res = await createReviewReply(data);
            if (res.success) {
                const newReply = {
                    ...res.data,
                    user: {
                        id: user.id,
                        ...user
                    }
                };

                setReviewReplies(prev => ({
                    ...prev,
                    [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
                }));

                replyRef.current = '';

                if (user.id !== release.userId) {
                    let notify = {
                        senderId: user.id,
                        receiverId: release.userId,
                        title: 'replied to your review',
                        data: JSON.stringify({ releaseId: release.id, reviewId: parentReviewId })
                    };
                    createNotifications(notify);
                }
            } else {
                Alert.alert('Reply', res.msg || 'Something went wrong');
            }
        } catch (err) {
            Alert.alert('Reply', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleNewReview = async (payload) => {
        if (payload.new && payload.new.parentReviewId) {
            const newReply = { ...payload.new };
            const parentReviewId = newReply.parentReviewId;
            
            let userRes = await getUserData(newReply.userId);
            newReply.user = userRes.success ? userRes.data : {};

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
            
            let userRes = await getUserData(newReply.userId);
            newReply.user = userRes.success ? userRes.data : {};

            setReviewReplies(prev => ({
                ...prev,
                [parentReviewId]: [...(prev[parentReviewId] || []), newReply]
            }));
        }
    };

    const subscribeToChanges = () => {
        // Clean up existing subscriptions first
        if (channelsRef.current) {
            supabase.removeChannel(channelsRef.current.reviewChannel);
            supabase.removeChannel(channelsRef.current.replyChannel);
        }

        // Create new subscriptions
        let reviewChannel = supabase
            .channel('reviews')
            .on('postgres_changes', 
                {event: 'INSERT', schema: 'public', table: 'reviews', filter: `releaseId=eq.${releaseId}`}, 
                handleNewReview)
            .subscribe();

        let replyChannel = supabase
            .channel('replies')
            .on('postgres_changes', 
                {event: 'INSERT', schema: 'public', table: 'reviews', filter: `releaseId=eq.${releaseId}`}, 
                handleNewReply)
            .subscribe();

        // Store references for cleanup
        channelsRef.current = { reviewChannel, replyChannel };
    };

    const cleanup = () => {
        if (channelsRef.current) {
            supabase.removeChannel(channelsRef.current.reviewChannel);
            supabase.removeChannel(channelsRef.current.replyChannel);
            channelsRef.current = null;
        }
    };

    const onNewReview = async () => {
        if(!reviewRef.current || !user?.id || !release?.id) return null;
        
        let data = {
            userId: user.id,
            releaseId: release.id,
            text: reviewRef.current
        }
        
        setLoading(true);
        try {
            let res = await createReleaseReview(data);
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
                    reviews: [newReview, ...prevRelease.reviews]
                }));

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
            } else {
                Alert.alert('Review', res.msg || 'Something went wrong');
            }
        } catch (err) {
            Alert.alert('Review', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    const onDeleteReview = async (review) => {
        try {
            let res = await removeReview(review?.id);
            if(res.success){
                setRelease(prevRelease => ({
                    ...prevRelease,
                    reviews: prevRelease.reviews.filter(r => r.id !== review.id)
                }));
            } else {
                Alert.alert('Review', res.msg || 'Something went wrong');
            }
        } catch (err) {
            Alert.alert('Review', 'Something went wrong');
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

    if (startLoading) return <View style={styles.center}> <CustomDotIndicator count={55} size={18}/></View>;

    if (!release) {
        return (
            <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
                <CustomDotIndicator count={55} size={18}/>
            </View>
        );
    }

    const releaseAt = release?.rDate ? moment(release?.rDate).format('MMM D') : '';
    const show = releaseAt && moment(release?.rDate).isSameOrBefore(moment(), 'day'); 

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                <ReleaeCard
                    item={{ ...release, reviews: [{ count: release?.reviews?.length }] }}
                    currentUser={user}
                    router={router}
                    hasShadow={false}
                    showReviewButton={false}
                />

                <Animated.View style={[
                    styles.inputContainer,
                    { transform: [{ translateX: shakeAnimation }] }
                ]}>
                    <View style={styles.inputWrapper}>
                        <Input
                            inputRef={inputRef}
                            placeholder={getInputPlaceholder()}
                            placeholderTextColor={theme.colors.textLight}
                            containerStyle={[
                                styles.input,
                                charCount > 0 && charCount < MIN_CHARS && styles.inputError,
                                charCount >= MIN_CHARS && styles.inputValid
                            ]}
                            value={reviewText}
                            onChangeText={handleTextChange}
                            multiline={true}
                            textAlignVertical="top"
                        />
                        {charCount < MIN_CHARS && (
                            <View style={styles.charCountContainer}>
                                <Text style={[
                                    styles.charCount,
                                    { color: getStatusColor() }
                                ]}>
                                    {`${charCount}/${MIN_CHARS}`}
                                </Text>
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
                                charCount < MIN_CHARS && styles.sendIconDisabled
                            ]}
                            onPress={onNewReview}
                            disabled={charCount < MIN_CHARS}
                        >
                            <Icon 
                                name="add" 
                                size={hp(2)} 
                                color={charCount < MIN_CHARS ? theme.colors.textLight : theme.colors.primaryDark} 
                            />
                        </TouchableOpacity>
                    )}
                </Animated.View>

                <View style={styles.reviewsContainer}>
                {release?.reviews?.length > 0 ? (
                    release.reviews
                        .filter(review => !review.parentReviewId)
                        .map(review => (
                            <View key={review?.id?.toString()}>
                                <ReviewItem
                                    item={review}
                                    onDelete={onDeleteReview}
                                    canDelete={user.id === review.userId || user.id === release.userId}
                                    onReplyReviewPress={() => toggleReplyBox(review.id)}
                                    replyCount={reviewReplies[review.id]?.length || 0}
                                    isReply={false}
                                    onShowProfile={() => openProfilePopup(review.user)}
                                />
                                
                                {openReplyBox === review.id && reviewReplies[review.id]?.map(reply => (
                                    <View key={reply.id} style={styles.replyContainer}>
                                        <ReviewItem
                                            item={reply}
                                            onDelete={onDeleteReview}
                                            canDelete={user.id === reply.userId || user.id === release.userId}
                                            replyCount={reviewReplies[review.id]?.length || 0}
                                            isReply={true}
                                        />
                                    </View>
                                ))}
                                
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
                        show ? (
                            <View style={styles.noReviews}>
                                <Text style={styles.noReviewsText}>
                                    Not released yet!
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.noReviews}>
                                <Text style={styles.noReviewsText}>
                                    Be the first to write a review! xx
                                </Text>
                            </View>
                        )
                )}
            </View>
            </ScrollView>
        </View>
    );
};

export default ReleaseDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
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
        paddingTop: hp(1.5),
        paddingBottom: hp(1.5)
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
    }
});