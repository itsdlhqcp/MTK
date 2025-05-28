import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert, Animated } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import RenderHtml from 'react-native-render-html'
import Icon from '../assets/icons'
import moment from 'moment/moment'
import { LinearGradient } from 'expo-linear-gradient'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import PosterReview from '../components/PosterReview'
import ScreenWrapper from './ScreenWrapper'
import { fetchAverageRating } from '@/services/releaseService'

const ReleaseCardInfo = ({
    item,
    handlePeopleReadReviews,
    handleReadReviews,
    peoplesReviewCount,
    hasShadow = true,
    showReviewButton = true,
}) => {
    const posterRef = useRef(null);
    const [isSharing, setIsSharing] = useState(false);
    const [showPosterView, setShowPosterView] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const ratingBarAnim = useRef(new Animated.Value(0)).current;
    const [avgRating, setAvgRating] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const shadowStyle = {
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    }

    const createdAt = item?.rDate ? moment(item.rDate).format('MMM D YYYY') : '';
    const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';

    useEffect(() => {
        // Fetch the average rating when component mounts
        const getAverageRating = async () => {
            try {
                if (!item?.id) return;
                setIsLoading(true);
                const avgRes = await fetchAverageRating(item?.id, item?.sconnectedId);
                setAvgRating(avgRes || 0);
            } catch (error) {
                console.error("Error fetching average rating:", error);
            } finally {
                setIsLoading(false);
            }
        };

        getAverageRating();
    }, [item?.id, item?.sconnectedId]);

    // Animate the rating bar when average rating changes
    useEffect(() => {
        const percentage = (avgRating / 5) * 100;
        
        Animated.timing(ratingBarAnim, {
            toValue: percentage,
            duration: 1000,
            useNativeDriver: false
        }).start();
    }, [avgRating]);

    // Function to render user rating with visual meter and animation
    const renderUserRating = () => {
        const formattedRating = Number(avgRating.toFixed(1));
        
        // Determine color based on rating
        let ratingColor = '#FF3B30'; // Red for low ratings
        
        if (formattedRating >= 4.7) {
            ratingColor = theme.colors.blue; // Use theme.colors.blue for very high ratings (4.7+)
        } else if (formattedRating >= 3.5) {
            ratingColor = '#34C759'; // Green for high ratings
        } else if (formattedRating >= 2.5) {
            ratingColor = '#FF9500'; // Orange for medium ratings
        }
        
        return (
            <View style={styles.ratingoutxpanel}>
                <View style={styles.userRatingContainer}>
                    <View style={styles.userRatingHeader}>
                        <Icon name="user" size={hp(2)} color="white" />
                        <Text style={styles.userRatingTitle}>User Rating</Text>
                    </View>
                    
                    <View style={styles.ratingMeterContainer}>
                        <View style={styles.ratingMeterBackground}>
                            <Animated.View 
                                style={[
                                    styles.ratingMeterFill, 
                                    { 
                                        width: ratingBarAnim.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: ['0%', '100%']
                                        }),
                                        backgroundColor: ratingColor 
                                    }
                                ]} 
                            />
                        </View>
                        
                        <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
                            <Text style={styles.ratingBadgeText}>{formattedRating}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // Using the avgRating for the star display
    const renderRating = () => {
        const stars = Array(5).fill(0).map((_, index) => (
            <Text key={index} style={styles.star}>
                {index < avgRating?.average ? '★' : '☆'}
            </Text>
        ));
        return (
            <View style={styles.ratingContainer}>
                {stars}
                <Text style={styles.ratingText}>{avgRating?.average}/5</Text>
            </View>
        );
    }

    // Share functionality
    const handleShare = async () => {
        if (isSharing) return; // Prevent multiple share requests
        
        try {
            setIsSharing(true);
            
            // Animate the share button
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 150,
                    useNativeDriver: true
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start();
            
            // Show the poster view and wait a bit for it to render
            setShowPosterView(true);
            
            // Add a small delay to ensure the view is rendered
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!posterRef.current) {
                Alert.alert('Error', 'Unable to generate poster');
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
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Sharing error:', error);
            Alert.alert('Error', 'Failed to share poster');
            setShowPosterView(false);
        } finally {
            setIsSharing(false);
        }
    };

    const titleTagsStyles = {
        div: {
            color: 'white',
            fontSize: hp(2.5),
            textAlign: 'center',
            fontWeight: 'bold'
        },
        b: {
            color: 'white',
            fontWeight: 'bold'
        }
    }

    const filmDetails = [
        { label: 'Language', value: item?.lang || 'N/A' },
        { label: 'Genre', value: item?.genre || 'N/A' },
        { label: 'Duration', value: item?.duration || 'N/A' },
        { label: 'Director', value: item?.director || 'N/A' },
        { label: 'Writer', value: item?.writer || 'N/A' },
        { label: 'Music', value: item?.music || 'N/A' },
        { label: 'DOP', value: item?.dop || 'N/A' },
        { label: 'Editor', value: item?.edit || 'N/A' },
        { label: 'Cast', value: item?.cast || 'N/A' },
    ];

    const validFilmDetails = filmDetails.filter(detail => detail.value !== 'N/A');
    const hasValidFilmDetails = validFilmDetails.length > 0;

    const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
    const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');
    const isEnded = item?.endDate && moment(item.endDate).isBefore(moment(), 'day');
    const waitingForDigital = isEnded && !item?.sconnectedId;

    return (
        <ScreenWrapper bg="#121212">
        <View style={styles.mainContainer}>
            {/* Hidden poster view for sharing */}
            {showPosterView && (
                <View style={styles.hiddenContainer}>
                    <PosterReview ref={posterRef} item={item} avgRating={avgRating} />
                </View>
            )}
            
            {/* Main Card */}
            <View style={[styles.container, hasShadow && shadowStyle]}>
                {/* Poster Image */}
                {item?.file?.includes('postImage') ? (
                    <Image
                        source={getSupabaseFileUrl(item.filel)}
                        style={styles.postMedia}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.fallbackImage} />
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                />
                
                <View style={styles.overlay}>
                    {show && avgRating?.average ? (
                        renderRating()
                        ) : (
                            <Text style={styles.statusTextx}>
                        </Text>
                        )}
            
                    <View style={styles.bottomContent}>
                        {/* Title and Year */}
                        <View style={styles.titleContainer}>
                            {item?.body ? (
                                <RenderHtml
                                    contentWidth={wp(100)}
                                    source={{html: item.body}}
                                    tagsStyles={titleTagsStyles}
                                />
                            ) : null}
                        </View>
                        
                        <Text style={styles.releaseInfo}>
                            Release: {createdAt || 'N/A'}
                        </Text>

                    <Text style={styles.statusText}>
                    Status: {
                        waitingForDigital
                        ? 'Coming Soon - Digital'
                        : show
                            ? item?.sconnectedId
                            ? 'Now Streaming'
                            : 'In Cinemas'
                            : 'Coming Soon - Theatre'
                    }
                    </Text>
                        {showReviewButton && (
                            <View style={styles.actionButtons}>
                                {/* Read Reviews Button */}
                                <View style={styles.reviewButtonContainer}>
                                    <TouchableOpacity 
                                        style={styles.reviewButton}
                                        onPress={handlePeopleReadReviews}
                                    >
                                        <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
                                    </TouchableOpacity>
                                    <View style={styles.reviewCountBadge}>
                                        <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
                                    </View>
                                </View>
                                
                                {/* Share Button */}
                                <TouchableOpacity 
                                    style={styles.actionButton}
                                    onPress={handleShare}
                                    disabled={isSharing}
                                >
                                    <Animated.View style={{
                                        transform: [{ scale: scaleAnim }]
                                    }}>
                                        <Icon 
                                            name="share" 
                                            size={hp(2.5)} 
                                            color={isSharing ? theme.colors.red : theme.colors.blue} 
                                        />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Film Details Section - Only show if there are valid details */}
            {hasValidFilmDetails && (
                <View style={styles.detailsContainerOuter}>
                    <View style={[styles.detailsContainer, hasShadow && shadowStyle]}>
                        <Text style={styles.detailsTitle}>Film Details</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            style={styles.detailsScrollView}
                            contentContainerStyle={styles.detailsScrollContent}
                        >
                            {validFilmDetails.map((detail, index) => (
                                <View key={index} style={styles.detailCard}>
                                    <Text style={styles.detailLabel}>{detail.label}</Text>
                                    <Text style={styles.detailValue}>{detail.value}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
        </ScreenWrapper>
    )
}

 export default ReleaseCardInfo

// import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert, Animated, Share } from 'react-native'
// import React, { useRef, useState, useEffect } from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import RenderHtml from 'react-native-render-html'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { LinearGradient } from 'expo-linear-gradient'
// import * as Sharing from 'expo-sharing'
// import { captureRef } from 'react-native-view-shot'
// import PosterReview from '../components/PosterReview'
// import ScreenWrapper from './ScreenWrapper'
// import { fetchAverageRating } from '@/services/releaseService'
// import { Platform } from 'react-native'

// const ReleaseCardInfo = ({
//     item,
//     handlePeopleReadReviews,
//     handleReadReviews,
//     peoplesReviewCount,
//     hasShadow = true,
//     showReviewButton = true,
// }) => {
//     const posterRef = useRef(null);
//     const [isSharing, setIsSharing] = useState(false);
//     const [showPosterView, setShowPosterView] = useState(false);
//     const scaleAnim = useRef(new Animated.Value(1)).current;
//     const ratingBarAnim = useRef(new Animated.Value(0)).current;
//     const [avgRating, setAvgRating] = useState(0);
//     const [isLoading, setIsLoading] = useState(false);
    
//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 4
//         },
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//         elevation: 5
//     }

//     const createdAt = item?.rDate ? moment(item.rDate).format('MMM D YYYY') : '';
//     const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';

//     useEffect(() => {
//         // Fetch the average rating when component mounts
//         const getAverageRating = async () => {
//             try {
//                 if (!item?.id) return;
//                 setIsLoading(true);
//                 const avgRes = await fetchAverageRating(item?.id, item?.sconnectedId);
//                 setAvgRating(avgRes || 0);
//             } catch (error) {
//                 console.error("Error fetching average rating:", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         getAverageRating();
//     }, [item?.id, item?.sconnectedId]);

//     // Animate the rating bar when average rating changes
//     useEffect(() => {
//         const percentage = (avgRating / 5) * 100;
        
//         Animated.timing(ratingBarAnim, {
//             toValue: percentage,
//             duration: 1000,
//             useNativeDriver: false
//         }).start();
//     }, [avgRating]);

//     // Function to render user rating with visual meter and animation
//     const renderUserRating = () => {
//         const formattedRating = Number(avgRating.toFixed(1));
        
//         // Determine color based on rating
//         let ratingColor = '#FF3B30'; // Red for low ratings
        
//         if (formattedRating >= 4.7) {
//             ratingColor = theme.colors.blue; // Use theme.colors.blue for very high ratings (4.7+)
//         } else if (formattedRating >= 3.5) {
//             ratingColor = '#34C759'; // Green for high ratings
//         } else if (formattedRating >= 2.5) {
//             ratingColor = '#FF9500'; // Orange for medium ratings
//         }
        
//         return (
//             <View style={styles.ratingoutxpanel}>
//                 <View style={styles.userRatingContainer}>
//                     <View style={styles.userRatingHeader}>
//                         <Icon name="user" size={hp(2)} color="white" />
//                         <Text style={styles.userRatingTitle}>User Rating</Text>
//                     </View>
                    
//                     <View style={styles.ratingMeterContainer}>
//                         <View style={styles.ratingMeterBackground}>
//                             <Animated.View 
//                                 style={[
//                                     styles.ratingMeterFill, 
//                                     { 
//                                         width: ratingBarAnim.interpolate({
//                                             inputRange: [0, 100],
//                                             outputRange: ['0%', '100%']
//                                         }),
//                                         backgroundColor: ratingColor 
//                                     }
//                                 ]} 
//                             />
//                         </View>
                        
//                         <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
//                             <Text style={styles.ratingBadgeText}>{formattedRating}</Text>
//                         </View>
//                     </View>
//                 </View>
//             </View>
//         );
//     }

//     // Using the avgRating for the star display
//     const renderRating = () => {
//         const stars = Array(5).fill(0).map((_, index) => (
//             <Text key={index} style={styles.star}>
//                 {index < avgRating?.average ? '★' : '☆'}
//             </Text>
//         ));
//         return (
//             <View style={styles.ratingContainer}>
//                 {stars}
//                 <Text style={styles.ratingText}>{avgRating?.average}/5</Text>
//             </View>
//         );
//     }

//     // Share functionality with React Native Share API
//     const handleShare = async () => {
//         if (isSharing) return; // Prevent multiple share requests
        
//         try {
//             setIsSharing(true);
            
//             // Animate the share button
//             Animated.sequence([
//                 Animated.timing(scaleAnim, {
//                     toValue: 1.2,
//                     duration: 150,
//                     useNativeDriver: true
//                 }),
//                 Animated.timing(scaleAnim, {
//                     toValue: 1,
//                     duration: 150,
//                     useNativeDriver: true
//                 })
//             ]).start();
            
//             // Show the poster view and wait a bit for it to render
//             setShowPosterView(true);
            
//             // Add a small delay to ensure the view is rendered
//             await new Promise(resolve => setTimeout(resolve, 100));
            
//             if (!posterRef.current) {
//                 Alert.alert('Error', 'Unable to generate poster');
//                 setIsSharing(false);
//                 setShowPosterView(false);
//                 return;
//             }
            
//             // Generate a high-quality image of our poster component
//             const imageUri = await captureRef(posterRef, {
//                 format: 'jpg',
//                 quality: 1,
//                 result: 'file',
//             });
            
//             // Hide the poster view after capture
//             setShowPosterView(false);
            
//             // Extract movie title from HTML
//             const movieTitle = item?.body ? item.body.replace(/<[^>]*>/g, '').trim() : 'PlotTwist Movie';
            
//             // Create share content
//             const ratingText = avgRating && avgRating > 0 ? `\nRating: ${avgRating.toFixed(1)}/5 ⭐` : '';
//             const releaseText = createdAt ? `\nRelease: ${createdAt}` : '';
            
//             const shareText = `Check out "${movieTitle}" on PlotTwist! 🎬${ratingText}${releaseText}\n\nhttps://itsdlhqcp.github.io/plotTwistapp/`;
            
//             // For iOS, we can share both image and text/URL
//             // For Android, we need to choose one or the other
//             const shareOptions = {
//                 title: `${movieTitle} - PlotTwist`,
//                 message: shareText,
//                 url: imageUri, // This will be the image on iOS, ignored on Android
//             };
            
//             // On Android, we can include the image as a file URL in the message
//             if (Platform.OS === 'android') {
//                 shareOptions.message = `${shareText}\n\nImage: ${imageUri}`;
//                 // Alternative: You can also try setting the url to the web link
//                 // shareOptions.url = 'https://itsdlhqcp.github.io/plotTwistapp/';
//             }
            
//             const result = await Share.share(shareOptions);
            
//             if (result.action === Share.sharedAction) {
//                 console.log('Content shared successfully');
//             } else if (result.action === Share.dismissedAction) {
//                 console.log('Share dismissed');
//             }
            
//         } catch (error) {
//             console.error('Error sharing:', error);
//             Alert.alert('Error', 'Failed to share content');
//             setShowPosterView(false);
//         } finally {
//             setIsSharing(false);
//         }
//     };

//     // Alternative function to share with image (keep this if you want both options)
//     const handleShareImage = async () => {
//         if (isSharing) return;
        
//         try {
//             setIsSharing(true);
            
//             // Show the poster view and wait a bit for it to render
//             setShowPosterView(true);
            
//             // Add a small delay to ensure the view is rendered
//             await new Promise(resolve => setTimeout(resolve, 100));
            
//             if (!posterRef.current) {
//                 Alert.alert('Error', 'Unable to generate poster');
//                 setIsSharing(false);
//                 setShowPosterView(false);
//                 return;
//             }
            
//             // Generate a high-quality image of our poster component
//             const uri = await captureRef(posterRef, {
//                 format: 'jpg',
//                 quality: 1,
//                 result: 'file',
//             });
            
//             // Hide the poster view after capture
//             setShowPosterView(false);
            
//             // Check if sharing is available
//             if (await Sharing.isAvailableAsync()) {
//                 await Sharing.shareAsync(uri, {
//                     mimeType: 'image/jpeg',
//                     dialogTitle: 'Share your PlotTwist',
//                     UTI: 'public.jpeg'
//                 });
//             } else {
//                 Alert.alert('Error', 'Sharing is not available on this device');
//             }
//         } catch (error) {
//             console.error('Sharing error:', error);
//             Alert.alert('Error', 'Failed to share poster');
//             setShowPosterView(false);
//         } finally {
//             setIsSharing(false);
//         }
//     };

//     // Function to show share options
//     const handleShareWithChoice = () => {
//         Alert.alert(
//             'Share Options',
//             'How would you like to share?',
//             [
//                 {
//                     text: 'Share Link',
//                     onPress: handleShare,
//                 },
//                 {
//                     text: 'Share Image',
//                     onPress: handleShareImage,
//                 },
//                 {
//                     text: 'Cancel',
//                     style: 'cancel',
//                 },
//             ]
//         );
//     };

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'center',
//             fontWeight: 'bold'
//         },
//         b: {
//             color: 'white',
//             fontWeight: 'bold'
//         }
//     }

//     const filmDetails = [
//         { label: 'Language', value: item?.lang || 'N/A' },
//         { label: 'Genre', value: item?.genre || 'N/A' },
//         { label: 'Duration', value: item?.duration || 'N/A' },
//         { label: 'Director', value: item?.director || 'N/A' },
//         { label: 'Writer', value: item?.writer || 'N/A' },
//         { label: 'Music', value: item?.music || 'N/A' },
//         { label: 'DOP', value: item?.dop || 'N/A' },
//         { label: 'Editor', value: item?.edit || 'N/A' },
//         { label: 'Cast', value: item?.cast || 'N/A' },
//     ];

//     const validFilmDetails = filmDetails.filter(detail => detail.value !== 'N/A');
//     const hasValidFilmDetails = validFilmDetails.length > 0;

//     const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
//     const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');
//     const isEnded = item?.endDate && moment(item.endDate).isBefore(moment(), 'day');
//     const waitingForDigital = isEnded && !item?.sconnectedId;

//     return (
//         <ScreenWrapper bg="#121212">
//         <View style={styles.mainContainer}>
//             {/* Hidden poster view for sharing */}
//             {showPosterView && (
//                 <View style={styles.hiddenContainer}>
//                     <PosterReview ref={posterRef} item={item} avgRating={avgRating} />
//                 </View>
//             )}
            
//             {/* Main Card */}
//             <View style={[styles.container, hasShadow && shadowStyle]}>
//                 {/* Poster Image */}
//                 {item?.file?.includes('postImage') ? (
//                     <Image
//                         source={getSupabaseFileUrl(item.filel)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 ) : (
//                     <View style={styles.fallbackImage} />
//                 )}
//                 <LinearGradient
//                     colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
//                     style={styles.gradientOverlay}
//                 />
                
//                 <View style={styles.overlay}>
//                     {show && avgRating?.average ? (
//                         renderRating()
//                         ) : (
//                             <Text style={styles.statusTextx}>
//                         </Text>
//                         )}
            
//                     <View style={styles.bottomContent}>
//                         {/* Title and Year */}
//                         <View style={styles.titleContainer}>
//                             {item?.body ? (
//                                 <RenderHtml
//                                     contentWidth={wp(100)}
//                                     source={{html: item.body}}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             ) : null}
//                         </View>
                        
//                         <Text style={styles.releaseInfo}>
//                             Release: {createdAt || 'N/A'}
//                         </Text>

//                     <Text style={styles.statusText}>
//                     Status: {
//                         waitingForDigital
//                         ? 'Coming Soon - Digital'
//                         : show
//                             ? item?.sconnectedId
//                             ? 'Now Streaming'
//                             : 'In Cinemas'
//                             : 'Coming Soon - Theatre'
//                     }
//                     </Text>
//                         {showReviewButton && (
//                             <View style={styles.actionButtons}>
//                                 {/* Read Reviews Button */}
//                                 <View style={styles.reviewButtonContainer}>
//                                     <TouchableOpacity 
//                                         style={styles.reviewButton}
//                                         onPress={handlePeopleReadReviews}
//                                     >
//                                         <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
//                                     </TouchableOpacity>
//                                     <View style={styles.reviewCountBadge}>
//                                         <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
//                                     </View>
//                                 </View>
                                
//                                 {/* Share Button */}
//                                 <TouchableOpacity 
//                                     style={styles.actionButton}
//                                     onPress={handleShareWithChoice} // Changed to show options
//                                     disabled={isSharing}
//                                 >
//                                     <Animated.View style={{
//                                         transform: [{ scale: scaleAnim }]
//                                     }}>
//                                         <Icon 
//                                             name="share" 
//                                             size={hp(2.5)} 
//                                             color={isSharing ? theme.colors.red : theme.colors.blue} 
//                                         />
//                                     </Animated.View>
//                                 </TouchableOpacity>
//                             </View>
//                         )}
//                     </View>
//                 </View>
//             </View>

//             {/* Film Details Section - Only show if there are valid details */}
//             {hasValidFilmDetails && (
//                 <View style={styles.detailsContainerOuter}>
//                     <View style={[styles.detailsContainer, hasShadow && shadowStyle]}>
//                         <Text style={styles.detailsTitle}>Film Details</Text>
//                         <ScrollView 
//                             horizontal 
//                             showsHorizontalScrollIndicator={false} 
//                             style={styles.detailsScrollView}
//                             contentContainerStyle={styles.detailsScrollContent}
//                         >
//                             {validFilmDetails.map((detail, index) => (
//                                 <View key={index} style={styles.detailCard}>
//                                     <Text style={styles.detailLabel}>{detail.label}</Text>
//                                     <Text style={styles.detailValue}>{detail.value}</Text>
//                                 </View>
//                             ))}
//                         </ScrollView>
//                     </View>
//                 </View>
//             )}
//         </View>
//     </ScreenWrapper>
//     )
// }

// export default ReleaseCardInfo

const styles = StyleSheet.create({
    mainContainer: {
        marginBottom: 20,
        width: '100%',
    },
    container: {
        marginBottom: 12,
        backgroundColor: '#121212',
        overflow: 'hidden',
        height: hp(73),
        position: 'relative',
        borderRadius: 12,
    },
    postMedia: {
        height: '100%',
        width: '100%',
    },
    fallbackImage: {
        height: '100%',
        width: '100%',
        backgroundColor: '#1a1a1a',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: hp(60),
        zIndex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
        justifyContent: 'space-between',
        zIndex: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
    },
    star: {
        color: theme.colors.star,   // #FFD700 yellow star
        fontSize: hp(2.2),
        marginRight: 2,
    },
    ratingText: {
        color: 'white',
        marginLeft: 5,
        fontSize: hp(1.8),
        fontWeight: '600',
    },
    bottomContent: {
        alignItems: 'center',
        width: '100%',
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    yearText: {
        color: 'white',
        fontSize: hp(2.2),
        fontWeight: '600',
        marginTop: 4,
    },
    releaseInfo: {
        color: 'white',
        fontSize: hp(1.8),
        marginBottom: 6,
        fontWeight: '400',
    },
    statusText: {
        color: 'white',
        fontSize: hp(1.8),
        marginBottom: 16,
        fontWeight: '500',
    },
    statusTextx: {
        color: 'white',
        fontSize: hp(2),
        marginBottom: 16,
        fontWeight: '500',
    },
    // User Rating Styles - Enhanced with animation support
    userRatingContainer: {
        width: '100%',
        backgroundColor: 'rgba(38, 38, 38, 0.8)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#363636',
    },
    userRatingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userRatingTitle: {
        color: 'white',
        fontSize: hp(1.8),
        fontWeight: '600',
        marginLeft: 6,
    },
    ratingMeterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingMeterBackground: {
        flex: 1,
        height: hp(1.2),
        backgroundColor: '#3A3A3C',
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 10,
    },
    ratingMeterFill: {
        height: '100%',
        borderRadius: 6,
    },
    ratingBadge: {
        width: hp(3.5),
        height: hp(3.5),
        borderRadius: hp(1.75),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    ratingBadgeText: {
        color: 'white',
        fontSize: hp(1.6),
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 4,
    },
    reviewButtonContainer: {
        position: 'relative',
    },
    reviewButton: {
        backgroundColor: '#262626',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#363636',
    },
    reviewButtonText: {
        color: theme.colors.blue || '#0095F6',
        fontWeight: 'bold',
        fontSize: hp(1.8),
    },
    reviewCountBadge: {
        backgroundColor: theme.colors.blue || '#0095F6',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: -12,
        top: -12,
        paddingHorizontal: 8,
    },
    reviewCountText: {
        color: 'white',
        fontSize: hp(1.3),
        fontWeight: 'bold',
    },
    // Modified button styles for both plus and share buttons
    actionButton: {
        backgroundColor: '#262626',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#363636',
    },
    // Film Details Section
    detailsContainerOuter: {
        paddingHorizontal: wp(0.8),
    },
    detailsContainer: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#262626',
    },
    detailsTitle: {
        fontSize: hp(2.2),
        fontWeight: 'bold',
        color: theme.colors.blue || '#0095F6',
        marginBottom: 12,
        marginLeft: 4,
    },
    detailsScrollView: {
        flexGrow: 0,
    },
    detailsScrollContent: {
        paddingRight: 12,
        paddingBottom: 4,
    },
    detailCard: {
        backgroundColor: '#262626',
        borderRadius: 10,
        padding: 12,
        marginRight: 12,
        minWidth: wp(28),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#363636',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    detailLabel: {
        color: theme.colors.blue || '#0095F6',
        fontSize: hp(1.6),
        fontWeight: 'bold',
        marginBottom: 6,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: hp(1.5),
        textAlign: 'center',
    },
    ratingoutxpanel: {
        paddingHorizontal: wp(0.8),
    },
    // Styles for sharing
    hiddenContainer: {
        position: 'absolute',
        top: -1000, // Position off-screen
        left: 0,
        width: 600,
        height: 800,
        zIndex: -1,
    }
})


// import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert, Animated } from 'react-native'
// import React, { useRef, useState, useEffect } from 'react'
// import { wp, hp, stripHtmlTags } from '@/helpers/common'
// import theme from '../constants/theme'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import RenderHtml from 'react-native-render-html'
// import Icon from '../assets/icons'
// import moment from 'moment/moment'
// import { LinearGradient } from 'expo-linear-gradient'
// import * as Sharing from 'expo-sharing'
// import { captureRef } from 'react-native-view-shot'
// import PosterReview from '../components/PosterReview'
// import ScreenWrapper from './ScreenWrapper'
// import { fetchAverageRating } from '@/services/releaseService'

// const ReleaseCardInfo = ({
//     item,
//     handlePeopleReadReviews,
//     handleReadReviews,
//     peoplesReviewCount,
//     hasShadow = true,
//     showReviewButton = true,
// }) => {
//     const posterRef = useRef(null);
//     const [isSharing, setIsSharing] = useState(false);
//     const [showPosterView, setShowPosterView] = useState(false);
//     const scaleAnim = useRef(new Animated.Value(1)).current;
//     const ratingBarAnim = useRef(new Animated.Value(0)).current;
//     const [avgRating, setAvgRating] = useState(0);
//     const [isLoading, setIsLoading] = useState(false);
    
//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 4
//         },
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//         elevation: 5
//     }

//     const createdAt = item?.rDate ? moment(item.rDate).format('MMM D YYYY') : '';
//     const extractYear = item?.rDate ? moment(item.rDate).format('YYYY') : '';

//     useEffect(() => {
//         // Fetch the average rating when component mounts
//         const getAverageRating = async () => {
//             try {
//                 if (!item?.id) return;
//                 setIsLoading(true);
//                 const avgRes = await fetchAverageRating(item?.id, item?.sconnectedId);
//                 setAvgRating(avgRes || 0);
//             } catch (error) {
//                 console.error("Error fetching average rating:", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         getAverageRating();
//     }, [item?.id, item?.sconnectedId]);

//     // Animate the rating bar when average rating changes
//     useEffect(() => {
//         const percentage = (avgRating / 5) * 100;
        
//         Animated.timing(ratingBarAnim, {
//             toValue: percentage,
//             duration: 1000,
//             useNativeDriver: false
//         }).start();
//     }, [avgRating]);

//     // Function to render user rating with visual meter and animation
//     const renderUserRating = () => {
//         const formattedRating = Number(avgRating.toFixed(1));
        
//         // Determine color based on rating
//         let ratingColor = '#FF3B30'; // Red for low ratings
        
//         if (formattedRating >= 4.7) {
//             ratingColor = theme.colors.blue; // Use theme.colors.blue for very high ratings (4.7+)
//         } else if (formattedRating >= 3.5) {
//             ratingColor = '#34C759'; // Green for high ratings
//         } else if (formattedRating >= 2.5) {
//             ratingColor = '#FF9500'; // Orange for medium ratings
//         }
        
//         return (
//             <View style={styles.ratingoutxpanel}>
//                 <View style={styles.userRatingContainer}>
//                     <View style={styles.userRatingHeader}>
//                         <Icon name="user" size={hp(2)} color="white" />
//                         <Text style={styles.userRatingTitle}>User Rating</Text>
//                     </View>
                    
//                     <View style={styles.ratingMeterContainer}>
//                         <View style={styles.ratingMeterBackground}>
//                             <Animated.View 
//                                 style={[
//                                     styles.ratingMeterFill, 
//                                     { 
//                                         width: ratingBarAnim.interpolate({
//                                             inputRange: [0, 100],
//                                             outputRange: ['0%', '100%']
//                                         }),
//                                         backgroundColor: ratingColor 
//                                     }
//                                 ]} 
//                             />
//                         </View>
                        
//                         <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
//                             <Text style={styles.ratingBadgeText}>{formattedRating}</Text>
//                         </View>
//                     </View>
//                 </View>
//             </View>
//         );
//     }

//     // Using the avgRating for the star display
//     const renderRating = () => {
//         const stars = Array(5).fill(0).map((_, index) => (
//             <Text key={index} style={styles.star}>
//                 {index < avgRating?.average ? '★' : '☆'}
//             </Text>
//         ));
//         return (
//             <View style={styles.ratingContainer}>
//                 {stars}
//                 <Text style={styles.ratingText}>{avgRating?.average}/5</Text>
//             </View>
//         );
//     }

//     // Share functionality
//     const handleShare = async () => {
//         if (isSharing) return; // Prevent multiple share requests
        
//         try {
//             setIsSharing(true);
            
//             // Animate the share button
//             Animated.sequence([
//                 Animated.timing(scaleAnim, {
//                     toValue: 1.2,
//                     duration: 150,
//                     useNativeDriver: true
//                 }),
//                 Animated.timing(scaleAnim, {
//                     toValue: 1,
//                     duration: 150,
//                     useNativeDriver: true
//                 })
//             ]).start();
            
//             // Show the poster view and wait a bit for it to render
//             setShowPosterView(true);
            
//             // Add a small delay to ensure the view is rendered
//             await new Promise(resolve => setTimeout(resolve, 100));
            
//             if (!posterRef.current) {
//                 Alert.alert('Error', 'Unable to generate poster');
//                 setIsSharing(false);
//                 setShowPosterView(false);
//                 return;
//             }
            
//             // Generate a high-quality image of our poster component
//             const uri = await captureRef(posterRef, {
//                 format: 'jpg',
//                 quality: 1,
//                 result: 'file',
//             });
            
//             // Hide the poster view after capture
//             setShowPosterView(false);
            
//             // Check if sharing is available
//             if (await Sharing.isAvailableAsync()) {
//                 await Sharing.shareAsync(uri, {
//                     mimeType: 'image/jpeg',
//                     dialogTitle: 'Share your PlotTwist',
//                     UTI: 'public.jpeg'
//                 });
//             } else {
//                 Alert.alert('Error', 'Sharing is not available on this device');
//             }
//         } catch (error) {
//             console.error('Sharing error:', error);
//             Alert.alert('Error', 'Failed to share poster');
//             setShowPosterView(false);
//         } finally {
//             setIsSharing(false);
//         }
//     };

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'center',
//             fontWeight: 'bold'
//         },
//         b: {
//             color: 'white',
//             fontWeight: 'bold'
//         }
//     }

//     // Film details to display
//     const filmDetails = [
//         { label: 'Language', value: item?.lang || 'N/A' },
//         { label: 'Genre', value: item?.genre || 'N/A' },
//         { label: 'Duration', value: item?.duration || 'N/A' },
//         { label: 'Director', value: item?.director || 'N/A' },
//         { label: 'Writer', value: item?.writer || 'N/A' },
//         { label: 'Music', value: item?.music || 'N/A' },
//         { label: 'DOP', value: item?.dop || 'N/A' },
//         { label: 'Editor', value: item?.edit || 'N/A' },
//         { label: 'Cast', value: item?.cast || 'N/A' },
//     ];

//     // Filter out film details with 'N/A' values
//     const validFilmDetails = filmDetails.filter(detail => detail.value !== 'N/A');
    
//     // Check if there are any valid film details to show
//     const hasValidFilmDetails = validFilmDetails.length > 0;

//     // const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
//     // const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');
//     const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
//     const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');
//     const isEnded = item?.endDate && moment(item.endDate).isBefore(moment(), 'day');
//     const waitingForDigital = isEnded && !item?.sconnectedId;

//     return (
//         <ScreenWrapper bg="#121212">
//         <View style={styles.mainContainer}>
//             {/* Hidden poster view for sharing */}
//             {showPosterView && (
//                 <View style={styles.hiddenContainer}>
//                     <PosterReview ref={posterRef} item={item} avgRating={avgRating} />
//                 </View>
//             )}
            
//             {/* Main Card */}
//             <View style={[styles.container, hasShadow && shadowStyle]}>
//                 {/* Poster Image */}
//                 {item?.file?.includes('postImage') ? (
//                     <Image
//                         source={getSupabaseFileUrl(item.filel)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 ) : (
//                     <View style={styles.fallbackImage} />
//                 )}

//                 {/* Enhanced Gradient Overlay */}
//                 <LinearGradient
//                     colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
//                     style={styles.gradientOverlay}
//                 />
                
//                 {/* Content Overlay */}
//                 <View style={styles.overlay}>
//                     {/* Rating Stars - Top Left - Now using avgRating */}
//                     {show && avgRating?.average ? (
//                         renderRating()
//                         ) : (
//                             <Text style={styles.statusTextx}>
//                         </Text>
//                         )}
                    
//                     {/* Bottom Content */}
//                     <View style={styles.bottomContent}>
//                         {/* Title and Year */}
//                         <View style={styles.titleContainer}>
//                             {item?.body ? (
//                                 <RenderHtml
//                                     contentWidth={wp(100)}
//                                     source={{html: item.body}}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             ) : null}
//                         </View>
                        
//                         {/* Release Info */}
//                         <Text style={styles.releaseInfo}>
//                             Release: {createdAt || 'N/A'}
//                         </Text>

//                         {/* {show ? (
//                             <Text style={styles.statusText}>
//                             Status: {item.sconnectedId ? 'Now Streaming' : 'In Cinemas'}
//                         </Text>
//                         ) : (
//                             <Text style={styles.statusText}>
//                             Status: Coming Soon In Cinemas 
//                         </Text>
//                         )} */}

//                     <Text style={styles.statusText}>
//                     Status: {
//                         waitingForDigital
//                         ? 'Coming Soon - Digital'
//                         : show
//                             ? item?.sconnectedId
//                             ? 'Now Streaming'
//                             : 'In Cinemas'
//                             : 'Coming Soon - Theatre'
//                     }
//                     </Text>
                        
//                         {/* Status */}
//                         {/* <Text style={styles.statusText}>
//                             Status: {item.sconnectedId ? 'Now Streaming' : 'Now Showing on Theatres'}
//                         </Text> */}

                       
//                         {/* Action Buttons */}
//                         {showReviewButton && (
//                             <View style={styles.actionButtons}>
//                                 {/* Read Reviews Button */}
//                                 <View style={styles.reviewButtonContainer}>
//                                     <TouchableOpacity 
//                                         style={styles.reviewButton}
//                                         onPress={handlePeopleReadReviews}
//                                     >
//                                         <Text style={styles.reviewButtonText}>READ REVIEWS</Text>
//                                     </TouchableOpacity>
//                                     <View style={styles.reviewCountBadge}>
//                                         <Text style={styles.reviewCountText}>{peoplesReviewCount}</Text>
//                                     </View>
//                                 </View>
                                
//                                 {/* Share Button */}
//                                 <TouchableOpacity 
//                                     style={styles.actionButton}
//                                     onPress={handleShare}
//                                     disabled={isSharing}
//                                 >
//                                     <Animated.View style={{
//                                         transform: [{ scale: scaleAnim }]
//                                     }}>
//                                         <Icon 
//                                             name="share" 
//                                             size={hp(2.5)} 
//                                             color={isSharing ? theme.colors.red : theme.colors.blue} 
//                                         />
//                                     </Animated.View>
//                                 </TouchableOpacity>
//                             </View>
//                         )}
//                     </View>
//                 </View>
//             </View>

//             {/* Film Details Section - Only show if there are valid details */}
//             {hasValidFilmDetails && (
//                 <View style={styles.detailsContainerOuter}>
//                     <View style={[styles.detailsContainer, hasShadow && shadowStyle]}>
//                         <Text style={styles.detailsTitle}>Film Details</Text>
//                         <ScrollView 
//                             horizontal 
//                             showsHorizontalScrollIndicator={false} 
//                             style={styles.detailsScrollView}
//                             contentContainerStyle={styles.detailsScrollContent}
//                         >
//                             {validFilmDetails.map((detail, index) => (
//                                 <View key={index} style={styles.detailCard}>
//                                     <Text style={styles.detailLabel}>{detail.label}</Text>
//                                     <Text style={styles.detailValue}>{detail.value}</Text>
//                                 </View>
//                             ))}
//                         </ScrollView>
//                     </View>
//                 </View>
//             )}
//         </View>
//         </ScreenWrapper>
//     )
// }

// export default ReleaseCardInfo

// const styles = StyleSheet.create({
//     mainContainer: {
//         marginBottom: 20,
//         width: '100%',
//     },
//     container: {
//         marginBottom: 12,
//         backgroundColor: '#121212',
//         overflow: 'hidden',
//         height: hp(73),
//         position: 'relative',
//         borderRadius: 12,
//     },
//     postMedia: {
//         height: '100%',
//         width: '100%',
//     },
//     fallbackImage: {
//         height: '100%',
//         width: '100%',
//         backgroundColor: '#1a1a1a',
//     },
//     gradientOverlay: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         height: hp(60),
//         zIndex: 1,
//     },
//     overlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         padding: 16,
//         justifyContent: 'space-between',
//         zIndex: 2,
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         alignSelf: 'flex-start',
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 16,
//     },
//     star: {
//         color: theme.colors.star,   // #FFD700 yellow star
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingText: {
//         color: 'white',
//         marginLeft: 5,
//         fontSize: hp(1.8),
//         fontWeight: '600',
//     },
//     bottomContent: {
//         alignItems: 'center',
//         width: '100%',
//     },
//     titleContainer: {
//         alignItems: 'center',
//         marginBottom: 8,
//     },
//     yearText: {
//         color: 'white',
//         fontSize: hp(2.2),
//         fontWeight: '600',
//         marginTop: 4,
//     },
//     releaseInfo: {
//         color: 'white',
//         fontSize: hp(1.8),
//         marginBottom: 6,
//         fontWeight: '400',
//     },
//     statusText: {
//         color: 'white',
//         fontSize: hp(1.8),
//         marginBottom: 16,
//         fontWeight: '500',
//     },
//     statusTextx: {
//         color: 'white',
//         fontSize: hp(2),
//         marginBottom: 16,
//         fontWeight: '500',
//     },
//     // User Rating Styles - Enhanced with animation support
//     userRatingContainer: {
//         width: '100%',
//         backgroundColor: 'rgba(38, 38, 38, 0.8)',
//         borderRadius: 10,
//         padding: 12,
//         marginBottom: 16,
//         borderWidth: 1,
//         borderColor: '#363636',
//     },
//     userRatingHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 8,
//     },
//     userRatingTitle: {
//         color: 'white',
//         fontSize: hp(1.8),
//         fontWeight: '600',
//         marginLeft: 6,
//     },
//     ratingMeterContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },
//     ratingMeterBackground: {
//         flex: 1,
//         height: hp(1.2),
//         backgroundColor: '#3A3A3C',
//         borderRadius: 6,
//         overflow: 'hidden',
//         marginRight: 10,
//     },
//     ratingMeterFill: {
//         height: '100%',
//         borderRadius: 6,
//     },
//     ratingBadge: {
//         width: hp(3.5),
//         height: hp(3.5),
//         borderRadius: hp(1.75),
//         justifyContent: 'center',
//         alignItems: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.3,
//         shadowRadius: 3,
//         elevation: 3,
//     },
//     ratingBadgeText: {
//         color: 'white',
//         fontSize: hp(1.6),
//         fontWeight: 'bold',
//     },
//     actionButtons: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 12,
//         marginTop: 4,
//     },
//     reviewButtonContainer: {
//         position: 'relative',
//     },
//     reviewButton: {
//         backgroundColor: '#262626',
//         paddingHorizontal: 20,
//         paddingVertical: 10,
//         borderRadius: 8,
//         borderWidth: 1,
//         borderColor: '#363636',
//     },
//     reviewButtonText: {
//         color: theme.colors.blue || '#0095F6',
//         fontWeight: 'bold',
//         fontSize: hp(1.8),
//     },
//     reviewCountBadge: {
//         backgroundColor: theme.colors.blue || '#0095F6',
//         borderRadius: 12,
//         minWidth: 24,
//         height: 24,
//         justifyContent: 'center',
//         alignItems: 'center',
//         position: 'absolute',
//         right: -12,
//         top: -12,
//         paddingHorizontal: 8,
//     },
//     reviewCountText: {
//         color: 'white',
//         fontSize: hp(1.3),
//         fontWeight: 'bold',
//     },
//     // Modified button styles for both plus and share buttons
//     actionButton: {
//         backgroundColor: '#262626',
//         width: 44,
//         height: 44,
//         borderRadius: 22,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#363636',
//     },
//     // Film Details Section
//     detailsContainerOuter: {
//         paddingHorizontal: wp(0.8),
//     },
//     detailsContainer: {
//         backgroundColor: '#121212',
//         borderRadius: 12,
//         padding: 16,
//         borderWidth: 1,
//         borderColor: '#262626',
//     },
//     detailsTitle: {
//         fontSize: hp(2.2),
//         fontWeight: 'bold',
//         color: theme.colors.blue || '#0095F6',
//         marginBottom: 12,
//         marginLeft: 4,
//     },
//     detailsScrollView: {
//         flexGrow: 0,
//     },
//     detailsScrollContent: {
//         paddingRight: 12,
//         paddingBottom: 4,
//     },
//     detailCard: {
//         backgroundColor: '#262626',
//         borderRadius: 10,
//         padding: 12,
//         marginRight: 12,
//         minWidth: wp(28),
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#363636',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     detailLabel: {
//         color: theme.colors.blue || '#0095F6',
//         fontSize: hp(1.6),
//         fontWeight: 'bold',
//         marginBottom: 6,
//     },
//     detailValue: {
//         color: '#FFFFFF',
//         fontSize: hp(1.5),
//         textAlign: 'center',
//     },
//     ratingoutxpanel: {
//         paddingHorizontal: wp(0.8),
//     },
//     // Styles for sharing
//     hiddenContainer: {
//         position: 'absolute',
//         top: -1000, // Position off-screen
//         left: 0,
//         width: 600,
//         height: 800,
//         zIndex: -1,
//     }
// })