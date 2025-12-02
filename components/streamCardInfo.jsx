import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert, Animated, Dimensions } from 'react-native'
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
import { fetchAverageRatingDirect } from '../services/releaseService'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Comprehensive device type detection
const getDeviceType = () => {
    const aspectRatio = screenHeight / screenWidth;
    
    if (screenWidth >= 1024) return 'desktop';
    if (screenWidth >= 768) return 'tablet';
    if (screenWidth >= 414) return 'large_phone'; // iPhone Plus, Max series
    if (screenWidth >= 375) return 'medium_phone'; // iPhone 6-14 standard
    if (screenWidth >= 320) return 'small_phone'; // iPhone SE, older phones
    return 'tiny_phone'; // Very small devices
};

const deviceType = getDeviceType();

// Responsive scaling based on device type
const getResponsiveScale = (baseSize, scaleFactor = 1) => {
    const scales = {
        desktop: 1.3,
        tablet: 1.15,
        large_phone: 1.05,
        medium_phone: 1.0,
        small_phone: 0.95,
        tiny_phone: 0.9
    };
    
    return baseSize * scales[deviceType] * scaleFactor;
};

// Responsive spacing
const getSpacing = (size) => {
    const spacing = {
        desktop: size * 1.2,
        tablet: size * 1.1,
        large_phone: size,
        medium_phone: size,
        small_phone: size * 0.9,
        tiny_phone: size * 0.8
    };
    
    return spacing[deviceType];
};

// Dynamic height calculation based on screen size
const getCardHeight = () => {
    const baseHeight = hp(70);
    const heights = {
        desktop: Math.min(baseHeight * 0.8, hp(60)),
        tablet: Math.min(baseHeight * 0.9, hp(65)),
        large_phone: baseHeight,
        medium_phone: baseHeight,
        small_phone: Math.min(baseHeight * 1.1, hp(75)),
        tiny_phone: Math.min(baseHeight * 1.2, hp(80))
    };
    
    return heights[deviceType];
};

const StreamCardInfo = ({
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
        if (!item?.directRelease && item?.connectedId) {
            getAverageRating();
        }else{
            getAverageRatingOfDirect();
        }

    }, [item?.connectedId, item?.id]);

           // Fetch the average rating when component mounts
           const getAverageRating = async () => {
            try {
                if (!item?.id) return;
                setIsLoading(true);
                const avgRes = await fetchAverageRating(item?.connectedId, item?.id);
                setAvgRating(avgRes || 0);
            } catch (error) {
                console.error("Error fetching average rating:", error);
            } finally {
                setIsLoading(false);
            }
        };

          // Fetch the average rating of direct release
               const getAverageRatingOfDirect = async () => {
                try {
                  if (!item?.id) return;
                  setIsLoading(true);
                  const avgRes = await fetchAverageRatingDirect(item?.id);
                  setAvgRating(avgRes || 0);
                } catch (error) {
                  console.error("Error fetching average rating:", error);
                } finally {
                  setIsLoading(false);
                }
              };

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
                        <Icon name="user" size={getResponsiveScale(hp(2))} color="white" />
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
            fontSize: getResponsiveScale(hp(2.5)),
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: getResponsiveScale(hp(3))
        },
        b: {
            color: 'white',
            fontWeight: 'bold'
        }
    }

    // Film details to display
    const filmDetails = [
        { label: 'Language', value: item?.lang || 'N/A' },
        { label: 'Genre', value: item?.genre || 'N/A' },
        { label: 'Duration', value: (item?.duration === '00:00:00' ? 'N/A' : item?.duration) || 'N/A' },
        { label: 'Director', value: item?.director || 'N/A' },
        { label: 'Writer', value: item?.writer || 'N/A' },
        { label: 'Music', value: item?.music || 'N/A' },
        { label: 'DOP', value: item?.dop || 'N/A' },
        { label: 'Editor', value: item?.edit || 'N/A' },
        { label: 'Cast', value: item?.cast || 'N/A' },
    ];

    // Filter out film details with 'N/A' values
    const validFilmDetails = filmDetails.filter(detail => detail.value !== 'N/A');
    
    // Check if there are any valid film details to show
    const hasValidFilmDetails = validFilmDetails.length > 0;

    const parsedTags = item.tags ? JSON.parse(item.tags) : [];

   const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

   const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
   const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');

    return (
        <ScreenWrapper bg="#121212">
        <View style={styles.mainContainer}>
            {/* Hidden poster view for sharing */}
            {showPosterView && (
                <View style={styles.hiddenContainer}>
                    <PosterReview  ref={posterRef} item={item} avgRating={avgRating}/>
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

                {/* Enhanced Gradient Overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                />
                
                {/* Content Overlay */}
                <View style={styles.overlay}>
                    {/* Rating Stars - Top Left - Now using avgRating */}
                    {show && avgRating?.average ? (
                        renderRating()
                        ) : (
                            <Text style={styles.statusTextx}>
                        </Text>
                        )}
                    
                    {/* Bottom Content */}
                    <View style={styles.bottomContent}>
                        {/* Title and Year */}
                        <View style={styles.titleContainer}>
                            {item?.body ? (
                                <RenderHtml
                                    contentWidth={wp(90)}
                                    source={{html: item.body}}
                                    tagsStyles={titleTagsStyles}
                                />
                            ) : null}
                        </View>
                        
                        {/* Release Info */}
                        <Text style={styles.releaseInfo}>
                            Release: {createdAt || 'N/A'}
                        </Text>
                        
                        {/* Status */}
                        <Text style={styles.statusText}>
                {show
                    ? 'Status: Now Streaming'
                    : 'Status: Coming Soon - Digital'}
                </Text>

                    {/* platformstatus */}
                    {parsedTags.length > 0 && (
                          <Text style={styles.statusText}>
                          {parsedTags.length > 0
                              ? `Streaming Platform - ${
                                  parsedTags.length === 1
                                  ? capitalize(parsedTags[0])
                                  : parsedTags.map(capitalize).join(' and ')
                              }`
                              : ''}
                          </Text>
                    )}
                   
                        {/* Action Buttons */}
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
                                            size={getResponsiveScale(hp(2.5))} 
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

export default StreamCardInfo

const styles = StyleSheet.create({
    mainContainer: {
        marginBottom: getSpacing(20),
        width: '100%',
        maxWidth: deviceType === 'desktop' ? wp(85) : deviceType === 'tablet' ? wp(95) : wp(100),
        alignSelf: 'center',
        paddingHorizontal: getSpacing(1),
    },
    container: {
        marginBottom: getSpacing(hp(1)),
        backgroundColor: '#121212',
        overflow: 'hidden',
        height: getCardHeight(),
        position: 'relative',
        borderRadius: getSpacing(12),
        marginHorizontal: deviceType === 'desktop' ? getSpacing(8) : 0,
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
        padding: getSpacing(16),
        justifyContent: 'space-between',
        zIndex: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: getSpacing(8),
        paddingVertical: getSpacing(4),
        borderRadius: getSpacing(16),
    },
    star: {
        color: theme.colors.star,
        fontSize: getResponsiveScale(hp(2.2)),
        marginRight: getSpacing(2),
    },
    ratingText: {
        color: 'white',
        marginLeft: getSpacing(5),
        fontSize: getResponsiveScale(hp(1.8)),
        fontWeight: '600',
    },
    bottomContent: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: deviceType === 'desktop' ? wp(8) : deviceType === 'tablet' ? wp(4) : 0,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: getSpacing(8),
        maxWidth: '95%',
        paddingHorizontal: getSpacing(4),
    },
    yearText: {
        color: 'white',
        fontSize: getResponsiveScale(hp(2.2)),
        fontWeight: '600',
        marginTop: getSpacing(4),
    },
    releaseInfo: {
        color: 'white',
        fontSize: getResponsiveScale(hp(1.8)),
        marginBottom: getSpacing(6),
        fontWeight: '400',
        textAlign: 'center',
    },
    statusText: {
        color: 'white',
        fontSize: getResponsiveScale(hp(1.8)),
        marginBottom: getSpacing(8),
        fontWeight: '500',
        textAlign: 'center',
    },
    statusTextx: {
        color: 'white',
        fontSize: getResponsiveScale(hp(2)),
        marginBottom: getSpacing(16),
        fontWeight: '500',
    },
    // User Rating Styles - Enhanced with animation support
    userRatingContainer: {
        width: '100%',
        backgroundColor: 'rgba(38, 38, 38, 0.8)',
        borderRadius: getSpacing(10),
        padding: getSpacing(12),
        marginBottom: getSpacing(16),
        borderWidth: 1,
        borderColor: '#363636',
    },
    userRatingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getSpacing(8),
    },
    userRatingTitle: {
        color: 'white',
        fontSize: getResponsiveScale(hp(1.8)),
        fontWeight: '600',
        marginLeft: getSpacing(6),
    },
    ratingMeterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingMeterBackground: {
        flex: 1,
        height: getSpacing(hp(1.2)),
        backgroundColor: '#3A3A3C',
        borderRadius: getSpacing(6),
        overflow: 'hidden',
        marginRight: getSpacing(10),
    },
    ratingMeterFill: {
        height: '100%',
        borderRadius: getSpacing(6),
    },
    ratingBadge: {
        width: getSpacing(hp(3.5)),
        height: getSpacing(hp(3.5)),
        borderRadius: getSpacing(hp(1.75)),
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
        fontSize: getResponsiveScale(hp(1.6)),
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: getSpacing(12),
        marginTop: getSpacing(4),
        flexWrap: deviceType === 'tiny_phone' ? 'wrap' : 'nowrap',
    },
    reviewButtonContainer: {
        position: 'relative',
    },
    reviewButton: {
        backgroundColor: '#262626',
        paddingHorizontal: getSpacing(20),
        paddingVertical: getSpacing(10),
        borderRadius: getSpacing(8),
        borderWidth: 1,
        borderColor: '#363636',
        minWidth: getSpacing(100),
        alignItems: 'center',
    },
    reviewButtonText: {
        color: theme.colors.blue || '#0095F6',
        fontWeight: 'bold',
        fontSize: getResponsiveScale(hp(1.8)),
    },
    reviewCountBadge: {
        backgroundColor: theme.colors.blue || '#0095F6',
        borderRadius: getSpacing(12),
        minWidth: getSpacing(24),
        height: getSpacing(24),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: getSpacing(-12),
        top: getSpacing(-12),
        paddingHorizontal: getSpacing(8),
    },
    reviewCountText: {
        color: 'white',
        fontSize: getResponsiveScale(hp(1.3)),
        fontWeight: 'bold',
    },
    // Modified button styles for both plus and share buttons
    actionButton: {
        backgroundColor: '#262626',
        width: getSpacing(44),
        height: getSpacing(44),
        borderRadius: getSpacing(22),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#363636',
    },
    // Film Details Section
    detailsContainerOuter: {
        paddingHorizontal: getSpacing(1),
    },
    detailsContainer: {
        backgroundColor: '#121212',
        borderRadius: getSpacing(12),
        padding: getSpacing(16),
        borderWidth: 1,
        borderColor: '#262626',
    },
    detailsTitle: {
        fontSize: getResponsiveScale(hp(2.2)),
        fontWeight: 'bold',
        color: theme.colors.blue || '#0095F6',
        marginBottom: getSpacing(12),
        marginLeft: getSpacing(4),
    },
    detailsScrollView: {
        flexGrow: 0,
    },
    detailsScrollContent: {
        paddingRight: getSpacing(12),
        paddingBottom: getSpacing(4),
    },
    detailCard: {
        backgroundColor: '#262626',
        borderRadius: getSpacing(10),
        padding: getSpacing(12),
        marginRight: getSpacing(12),
        minWidth: (() => {
            const widths = {
                desktop: wp(15),
                tablet: wp(18),
                large_phone: wp(25),
                medium_phone: wp(28),
                small_phone: wp(32),
                tiny_phone: wp(35)
            };
            return widths[deviceType];
        })(),
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
        fontSize: getResponsiveScale(hp(1.6)),
        fontWeight: 'bold',
        marginBottom: getSpacing(6),
        textAlign: 'center',
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: getResponsiveScale(hp(1.5)),
        textAlign: 'center',
        lineHeight: getResponsiveScale(hp(1.8)),
    },
    ratingoutxpanel: {
        paddingHorizontal: getSpacing(4),
    },
    // Styles for sharing
    hiddenContainer: {
        position: 'absolute',
        top: -1000, // Position off-screen
        left: 0,
        width: (() => {
            const widths = {
                desktop: 800,
                tablet: 700,
                large_phone: 600,
                medium_phone: 600,
                small_phone: 500,
                tiny_phone: 400
            };
            return widths[deviceType];
        })(),
        height: (() => {
            const heights = {
                desktop: 1000,
                tablet: 900,
                large_phone: 800,
                medium_phone: 800,
                small_phone: 700,
                tiny_phone: 600
            };
            return heights[deviceType];
        })(),
        zIndex: -1,
    }
})