import { Image, StyleSheet, Text, TouchableOpacity, View, Modal, Animated } from 'react-native'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import moment from 'moment/moment'
import RenderHtml from 'react-native-render-html'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import TagsList from './TagList'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from 'expo-router'
import Icon from '../assets/icons'
import DatePicker from '../components/DatePicker'
import { updateStreamEndDate, deleteStream } from '../services/ottService'
import { useToast } from '../contexts/ToastContext'
import { adminIds } from '../constants/admin'
import { useAuth } from '../contexts/AuthContext'
import { fetchAverageRating, fetchAverageRatingDirect } from '../services/releaseService'
import { deleteSeries } from '../services/seriesService'
import {
  subscribeToReleaseNotifications,
  unsubscribeFromReleaseNotifications,
  checkSubscriptionStatus
} from '../services/releaseNotificationSubscriptionService.js'
import { playBellActivateSound, playBellDeactivateSound } from '../services/bellSoundService.js'

const OttCard = ({
    item,
    router,
    hasShadow = true,
    showMoreIcon = true,
    onEdit = () => {},
    onEndDateUpdated = () => {}, // Add callback for when end date is updated
    onDelete = () => {} // Add callback for when card is deleted
}) => {
    const { user: currentUser } = useAuth();
    const [userRating, setUserRating] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { showToast } = useToast();
    // State for date picker modal
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    // State to track loading state during end date update
    const [updating, setUpdating] = useState(false);
    // State to hold the selected date in the picker
    const [selectedEndDate, setSelectedEndDate] = useState(
        item?.endDate ? new Date(item.endDate) : null
    );
    // State for delete confirmation modal
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);
    // State for notification subscription
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);
    // Animation values for bell icon
    const bellScale = useRef(new Animated.Value(1)).current;
    const bellRotation = useRef(new Animated.Value(0)).current;

    // Compute if item is a series using useMemo
    const isSeriesItem = useMemo(() => {
        // Check for old series format (from separate series table)
        if (item?.isSeries && item?.originalId) {
            return true;
        }
        // Check for new series format (from streams table with episodes)
        if (item?.episodes && Array.isArray(item.episodes) && item.episodes.length > 0) {
            return true;
        }
        // Check seriesType
        if (item?.seriesType === 'series') {
            return true;
        }
        return false;
    }, [item?.isSeries, item?.originalId, item?.episodes, item?.seriesType]);

    // Fetch the average rating when component mounts
    useEffect(() => {
        if (!item?.directRelease && item?.connectedId) {
            getAverageRating();
        }else{
            getAverageRatingOfDirect();
        }
    }, [item?.id]);

    // Check subscription status on mount
    useEffect(() => {
        const checkSubscription = async () => {
            if (!currentUser?.id || !item?.id) return;
            try {
                const result = await checkSubscriptionStatus(currentUser.id, item.id, 'digital');
                if (result.success) {
                    setIsSubscribed(result.isSubscribed);
                }
            } catch (error) {
                console.error("Error checking subscription:", error);
            }
        };
        checkSubscription();
    }, [currentUser?.id, item?.id]);


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
              console.error("Error fetching average rating of direct:", error);
            } finally {
              setIsLoading(false);
            }
          };

    // which reset on coming the page 
    useFocusEffect(
        React.useCallback(() => {
            setIsNavigating(false);
        }, [])
    );

    const shadowStyle = {
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 1
    }

    const handleCardPress = () => {
        if (isNavigating || showDropdown) return; // Prevent navigation if dropdown is open
        if (!item?.id) return null;
        setIsNavigating(true);
        
        // Check if this is a series item
        if (isSeriesItem) {
            // For old series table format
            if (item.isSeries && item.originalId) {
                router.push({ pathname: 'seriesDetails', params: { seriesId: item.originalId } });
            } else {
                // For new series format from streams table, navigate to stream details
                // Series reviews should work since they're in streams table
                router.push({ pathname: 'streamInfo', params: { streamId: item.id } });
            }
        } else {
            router.push({ pathname: 'streamInfo', params: { streamId: item.id } });
        }
    }

    // Handle more button press - toggle dropdown
    const handleMorePress = (e) => {
        e.stopPropagation(); // Prevent card press event
        setShowDropdown(!showDropdown);
        
        if (!showDropdown) {
            // Auto-close dropdown after 5 seconds
            setTimeout(() => {
                setShowDropdown(false);
            }, 5000);
        }
    };

    // Handle edit press
    const handleEditPress = (e) => {
        e.stopPropagation(); // Prevent card press event
        // For series items from old series table, navigate to createSeries
        if (item.isSeries && item.originalId) {
            router.push({ pathname: 'createSeries', params: { id: item.originalId } });
        } 
        // For direct-release series in streams table, open full series editor (newOtt)
        else if (item.seriesType === 'series') {
            router.push({ pathname: 'newOtt', params: { ...item, id: item.id } });
        } 
        // For normal (non-series) streams, use lightweight editDigitals
        else {
            router.push({ pathname: 'editDigitals', params: { id: item.id } });
        }
        setShowDropdown(false);
    };

    // Handle showing date picker modal
    const handleEndDatePress = (e) => {
        e.stopPropagation(); // Prevent card press event
        setDatePickerVisible(true);
        setShowDropdown(false);
    };

    // Handle delete press
    const handleDeletePress = (e) => {
        e.stopPropagation(); // Prevent card press event
        setDeleteModalVisible(true);
        setShowDropdown(false);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!item?.id) return;
        
        setDeleting(true);
        try {
            let result;
            // Check if it's a series from old series table
            if (item.isSeries && item.originalId) {
                result = await deleteSeries(item.originalId);
            } else {
                // For both normal and series from streams table, use deleteStream
                result = await deleteStream(item.id);
            }
            
            if (result.success) {
                showToast('success', result.msg || 'Deleted successfully');
                setDeleteModalVisible(false);
                onDelete(item.id, item.isSeries ? item.originalId : null);
            } else {
                showToast('error', result.msg || 'Failed to delete');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'Failed to delete. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const onEditDigital = async (item) => {
        router.push({pathname: 'editDigitals', params: {...item}})
    }

    // Handle date selection from the date picker
    const handleDateSelect = async (date) => {
        setSelectedEndDate(date);
        
        if (date && item?.id) {
            setUpdating(true);
            
            // Convert date to ISO string format used by the backend
            const formattedDate = moment(date).format('YYYY-MM-DD');
            
            // Call API to update end date
            const result = await updateStreamEndDate(item.id, formattedDate);
            
            setUpdating(false);
            
            if (result.success) {
                showToast('success', 'End Date Updated!!');
                onEndDateUpdated(item.id, formattedDate);
                setDatePickerVisible(false);
            } else {
                // Show error handling here (could use Alert or other notification)
                console.error("Failed to update end date:", result.error);
                // Keep modal open if there was an error
            }
        } else {
            setDatePickerVisible(false);
        }
    };

    const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';
    const endDate = item?.endDate ? moment(item.endDate).format('MMM D, YYYY') : 'No end date';

    const renderRating = () => {
        // Using avgRating instead of item?.defRating
        const filledStars = avgRating?.average || 0;
        
        return (
            <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, index) => {
                    const isYellow = index < filledStars;
                    return (
                        <Text 
                            key={index} 
                            style={[
                                styles.star,
                                { color: isYellow ? theme.colors.star : '#FFFFFF' }
                            ]}
                        >
                            {isYellow ? '★' : '☆'}
                        </Text>
                    );
                })}
                <Text style={[styles.ratingValue, { color: '#FFFFFF' }]}>
                    {avgRating?.average}/5
                </Text>
            </View>
        );
    }

    const titleTagsStyles = {
        div: {
            color: 'white',
            fontSize: hp(3.1),
            textAlign: 'left',
            fontWeight: '600'
        },
        p: {
            color: 'white',
            fontSize: hp(2.5),
            textAlign: 'left',
            fontWeight: 'bold'
        }
    }

    const isadmin = adminIds.includes(currentUser?.id);

     const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
     const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');

    // Animation function for bell toggle
    const animateBell = () => {
        // Scale down then up with rotation
        Animated.sequence([
            Animated.parallel([
                Animated.spring(bellScale, {
                    toValue: 0.8,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 7,
                }),
                Animated.timing(bellRotation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.spring(bellScale, {
                    toValue: 1.2,
                    useNativeDriver: true,
                    tension: 300,
                    friction: 7,
                }),
                Animated.timing(bellRotation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(bellScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 7,
            }),
        ]).start();
    };

    // Handle notification bell toggle
    const handleNotificationToggle = async (e) => {
        e.stopPropagation(); // Prevent card press event
        if (!currentUser?.id || !item?.id || subscriptionLoading) return;

        // Start animation
        animateBell();

        setSubscriptionLoading(true);
        try {
            if (isSubscribed) {
                // Play deactivation sound
                playBellDeactivateSound();
                
                // Unsubscribe
                const result = await unsubscribeFromReleaseNotifications(
                    currentUser.id,
                    item.id,
                    'digital'
                );
                if (result.success) {
                    setIsSubscribed(false);
                    showToast('success', 'Notifications disabled for this release');
                } else {
                    showToast('error', result.msg || 'Failed to unsubscribe');
                }
            } else {
                // Play activation sound
                playBellActivateSound();
                
                // Subscribe
                const result = await subscribeToReleaseNotifications(
                    currentUser.id,
                    item.id,
                    'digital'
                );
                if (result.success) {
                    setIsSubscribed(true);
                    showToast('success', 'You will be notified when this release is available');
                } else {
                    showToast('error', result.msg || 'Failed to subscribe');
                }
            }
        } catch (error) {
            console.error('Error toggling notification:', error);
            showToast('error', 'Something went wrong');
        } finally {
            setSubscriptionLoading(false);
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.container, hasShadow && shadowStyle]}
            onPress={handleCardPress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                {(item?.file || item?.filel) && (
                    <Image
                        source={getSupabaseFileUrl(item?.file || item?.filel)}
                        style={styles.postMedia}
                        resizeMode="cover"
                    />
                )}

                {/* Radial vignette effect */}
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 1, y: 1}}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 0, y: 1}}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 1, y: 0}}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                    style={styles.radialVignette}
                    start={{x: 0.5, y: 0.5}}
                    end={{x: 0, y: 0}}
                />

                <View style={styles.overlay}>
                    {/* Top section with rating, tags and more button */}
                    <View style={styles.topContainer}>
                        {/* <View style={styles.leftTopSection}>
                            {renderRating()}
                        </View> */}

                         {show && avgRating?.average ? (
                                     <View style={styles.leftTopSection}>
                                      {renderRating()}
                                  </View>
                                ) : (
                              <Text style={styles.statusText}></Text>
                        )}
                        
                        <View style={styles.rightTopSection}>
                            <View style={styles.tagsContainer}>
                                <TagsList tags={item?.tags} />
                            </View>
                            
                            {/* More button */}
                            {showMoreIcon && isadmin && (
                                <TouchableOpacity 
                                    style={styles.moreButton} 
                                    onPress={handleMorePress}
                                    activeOpacity={0.7}
                                >
                                    <Icon name="more" size={hp(2.2)} color={theme.colors.light || '#E0E0E0'} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Bottom section with title and date */}
                    <View style={styles.bottomContainer}>
                        <View style={styles.titleDateContainer}>
                            {item?.body && (
                                <RenderHtml
                                    contentWidth={wp(90)}
                                    source={{ html: item.body }}
                                    tagsStyles={titleTagsStyles}
                                />
                            )}
                            {rDate && (
                               <Text style={styles.releaseDate}>
                               {rDate}
                           </Text>
                            )}
                            {/* Display End Date if available */}
                            {item?.endDate && isadmin && (
                                <Text style={styles.endDateText}>
                                    Ends: {endDate}
                                </Text>
                            )}
                        </View>
                        <View style={styles.bottomRightContainer}>
                            {/* Notification bell button - Bottom right */}
                            {currentUser?.id && (
                                <TouchableOpacity 
                                    style={[
                                        styles.notificationButton,
                                        isSubscribed && styles.notificationButtonActive
                                    ]} 
                                    onPress={handleNotificationToggle}
                                    activeOpacity={0.7}
                                    disabled={subscriptionLoading}
                                >
                                    <Animated.View
                                        style={{
                                            transform: [
                                                { scale: bellScale },
                                                {
                                                    rotate: bellRotation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: ['0deg', '15deg'],
                                                    }),
                                                },
                                            ],
                                        }}
                                    >
                                        <Text style={[
                                            styles.notificationIcon,
                                            isSubscribed && styles.notificationIconActive
                                        ]}>
                                            {isSubscribed ? '🔔' : '🔕'}
                                        </Text>
                                    </Animated.View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                    <View style={styles.dropdown}>
                        <TouchableOpacity 
                            style={styles.dropdownItem} 
                            onPress={handleEditPress}
                        >
                            <Icon name="edit" size={hp(2)} color={theme.colors.light || '#E0E0E0'} />
                            <Text style={styles.dropdownText}>Edit</Text>
                        </TouchableOpacity>
                        {/* Show End Date option only for non-series items */}
                        {!isSeriesItem && (
                            <>
                                <View style={styles.divider} />
                                <TouchableOpacity 
                                    style={styles.dropdownItem} 
                                    onPress={handleEndDatePress}
                                >
                                    <Icon name="calender" size={hp(2)} color={theme.colors.light || '#E0E0E0'} />
                                    <Text style={styles.dropdownText}>End Date</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        <View style={styles.divider} />
                        <TouchableOpacity 
                            style={styles.dropdownItem} 
                            onPress={handleDeletePress}
                        >
                            <Icon name="delete" size={hp(2)} color="#FF3B30" />
                            <Text style={[styles.dropdownText, { color: '#FF3B30' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {/* Background overlay to close dropdown when clicking outside */}
                {showDropdown && (
                    <TouchableOpacity 
                        style={styles.dropdownBackdrop} 
                        onPress={(e) => {
                            e.stopPropagation();
                            setShowDropdown(false);
                        }}
                        activeOpacity={0}
                    />
                )}
                
                {/* Date Picker Modal */}
                <Modal
                    visible={datePickerVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setDatePickerVisible(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setDatePickerVisible(false)}
                    >
                        <View 
                            style={styles.modalContent}
                            onStartShouldSetResponder={() => true}
                            onTouchEnd={(e) => e.stopPropagation()}
                        >
                            <Text style={styles.modalTitle}>Select End Date</Text>
                            
                            <DatePicker
                                onDateSelect={handleDateSelect}
                                initialDate={item?.endDate ? new Date(item.endDate) : null}
                                label="End Date"
                                disablePastDates={true}
                            />
                            
                            <View style={styles.modalButtonsContainer}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setDatePickerVisible(false)}
                                    disabled={updating}
                                >
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[
                                        styles.modalButton, 
                                        styles.saveButton,
                                        updating && styles.disabledButton
                                    ]}
                                    onPress={() => handleDateSelect(selectedEndDate)}
                                    disabled={updating}
                                >
                                    <Text style={styles.modalButtonText}>
                                        {updating ? 'Saving...' : 'Save'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>
                
                {/* Delete Confirmation Modal */}
                <Modal
                    visible={deleteModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => !deleting && setDeleteModalVisible(false)}
                >
                    <View style={styles.deleteModalOverlay}>
                        <View style={styles.deleteModalContent}>
                            <Text style={styles.deleteModalTitle}>Confirm Delete</Text>
                            <Text style={styles.deleteModalMessage}>
                                Are you sure you want to delete this {isSeriesItem ? 'series' : 'digital'}? This action cannot be undone.
                            </Text>
                            <View style={styles.deleteModalButtons}>
                                <TouchableOpacity
                                    style={[styles.deleteModalButton, styles.deleteModalCancelButton]}
                                    onPress={() => setDeleteModalVisible(false)}
                                    disabled={deleting}
                                >
                                    <Text style={styles.deleteModalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.deleteModalButton, 
                                        styles.deleteModalConfirmButton,
                                        deleting && styles.disabledButton
                                    ]}
                                    onPress={handleDeleteConfirm}
                                    disabled={deleting}
                                >
                                    <Text style={styles.deleteModalConfirmText}>
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </TouchableOpacity>
    )
}

export default OttCard

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        backgroundColor: 'red',
        height: hp(30),
        width: '100%',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    postMedia: {
        width: '100%',
        height: '100%',
    },
    radialVignette: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)', 
        justifyContent: 'space-between',
        padding: 10,
    },
    topContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        zIndex: 10,
    },
    leftTopSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightTopButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1),
    },
    rightTopSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        paddingBottom: 10,
    },
    titleDateContainer: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        maxWidth: '80%',
    },
    emptySpace: {
        width: 40,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    tagsContainer: {
        alignSelf: 'flex-start',
        padding: 8,
    },
    star: {
        fontSize: hp(2.2),
        marginRight: 2,
    },
    ratingValue: {
        marginLeft: 5,
        fontSize: hp(1.7),
        fontWeight: '500',
    },
    releaseDate: {
        color: theme.colors.silver,
        fontSize: hp(2.4),
        marginTop: 2,
        textAlign: 'left',
        fontWeight: '500'
    },
    endDateText: {
        color: theme.colors.silver || '#C0C0C0',
        fontSize: hp(1.8),
        fontWeight: '400',
        marginTop: 2
    },
    bottomRightContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationButton: {
        padding: hp(0.8),
        borderRadius: hp(2),
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: hp(3.5),
        minHeight: hp(3.5),
    },
    notificationButtonActive: {
        backgroundColor: 'rgba(229, 9, 20, 0.3)',
    },
    notificationIcon: {
        fontSize: hp(2.2),
        color: theme.colors.light || '#E0E0E0',
    },
    notificationIconActive: {
        color: theme.colors.primary || '#E50914',
    },
    moreButton: {
        padding: hp(0.8),
        borderRadius: hp(2),
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginRight: 10,
        marginTop: 8,
    },
    // Dropdown menu styles
    dropdown: {
        position: 'absolute',
        top: hp(5),
        right: hp(1.5),
        width: wp(28),
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 100,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: hp(1.2),
        gap: 10,
    },
    dropdownText: {
        color: theme.colors.light || '#E0E0E0',
        fontSize: hp(1.6),
    },
    divider: {
        height: 1,
        backgroundColor: '#333333',
        width: '100%',
    },
    dropdownBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 5,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: wp(80),
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: hp(2.2),
        fontWeight: '600',
        color: theme.colors.dark || '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    saveButton: {
        backgroundColor: theme.colors.primary || '#007AFF',
    },
    disabledButton: {
        opacity: 0.6,
    },
    modalButtonText: {
        fontWeight: '600',
        fontSize: hp(1.8),
        color: 'white',
    },
    // Delete modal styles
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteModalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: wp(6),
        width: wp(80),
        alignItems: 'center',
    },
    deleteModalTitle: {
        color: '#FFFFFF',
        fontSize: hp(2.2),
        fontWeight: 'bold',
        marginBottom: hp(1),
    },
    deleteModalMessage: {
        color: '#E0E0E0',
        fontSize: hp(1.8),
        textAlign: 'center',
        marginBottom: hp(3),
    },
    deleteModalButtons: {
        flexDirection: 'row',
        gap: wp(3),
        width: '100%',
    },
    deleteModalButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteModalCancelButton: {
        backgroundColor: '#2D2D2D',
    },
    deleteModalConfirmButton: {
        backgroundColor: '#FF3B30',
    },
    deleteModalCancelText: {
        color: '#FFFFFF',
        fontSize: hp(1.8),
        fontWeight: '600',
    },
    deleteModalConfirmText: {
        color: '#FFFFFF',
        fontSize: hp(1.8),
        fontWeight: '600',
    },
})

// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useState } from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import moment from 'moment/moment'
// import RenderHtml from 'react-native-render-html'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TagsList from './TagList'
// import { LinearGradient } from 'expo-linear-gradient'
// import { useFocusEffect } from 'expo-router'
// import Icon from '../assets/icons'; // Import Icon component

// const OttCard = ({
//     item,
//     router,
//     hasShadow = true,
//     showMoreIcon = true, // Add prop to conditionally show more icon
//     onEdit = () => {}, // Add onEdit prop for edit functionality
// }) => {
//     const [userRating, setUserRating] = useState(0);
//     const [clickCount, setClickCount] = useState(0);
//     const [isNavigating, setIsNavigating] = useState(false);
//     // Add state for dropdown
//     const [showDropdown, setShowDropdown] = useState(false);

//     // which reset on coming the page 
//     useFocusEffect(
//         React.useCallback(() => {
//             setIsNavigating(false);
//         }, [])
//     );

//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     const handleCardPress = () => {
//         if (isNavigating || showDropdown) return; // Prevent navigation if dropdown is open
//         if (!item?.id) return null;
//         setIsNavigating(true);
//         router.push({ pathname: 'streamInfo', params: { streamId: item.id } });
//     }

//     // Handle more button press - toggle dropdown
//     const handleMorePress = (e) => {
//         e.stopPropagation(); // Prevent card press event
//         setShowDropdown(!showDropdown);
        
//         if (!showDropdown) {
//             // Auto-close dropdown after 5 seconds
//             setTimeout(() => {
//                 setShowDropdown(false);
//             }, 5000);
//         }
//     };

//     // Handle edit press
//     const handleEditPress = (e) => {
//         e.stopPropagation(); // Prevent card press event
//         onEdit(item);
//         setShowDropdown(false);
//     };

//     const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

//     const renderRating = () => {
//         const rating = userRating || item?.defRating || 0;
//         const filledStars = Math.floor(rating);
        
//         return (
//             <View style={styles.ratingContainer}>
//                 {[...Array(5)].map((_, index) => {
//                     const isYellow = index < filledStars;
//                     return (
//                         <Text 
//                             key={index} 
//                             style={[
//                                 styles.star,
//                                 { color: isYellow ? theme.colors.star : '#FFFFFF' }
//                             ]}
//                         >
//                             {isYellow ? '★' : '☆'}
//                         </Text>
//                     );
//                 })}
//                 <Text style={[styles.ratingValue, { color: theme.colors.primaryDark }]}>
//                     {rating.toFixed(1)}/5
//                 </Text>
//             </View>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(3.7),
//             textAlign: 'left',
//             fontWeight: '600'
//         },
//         p: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'left',
//             fontWeight: 'bold'
//         }
//     }

//     return (
//         <TouchableOpacity 
//             style={[styles.container, hasShadow && shadowStyle]}
//             onPress={handleCardPress}
//             activeOpacity={0.9}
//         >
//             <View style={styles.imageContainer}>
//                 {item?.file?.includes('postImage') && (
//                     <Image
//                         source={getSupabaseFileUrl(item?.file)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 )}

//                 {/* Radial vignette effect */}
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 1, y: 1}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 0, y: 1}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 1, y: 0}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 0, y: 0}}
//                 />

//                 <View style={styles.overlay}>
//                     {/* Top section with rating, tags and more button */}
//                     <View style={styles.topContainer}>
//                         <View style={styles.leftTopSection}>
//                             {renderRating()}
//                         </View>
                        
//                         <View style={styles.rightTopSection}>
//                             <View style={styles.tagsContainer}>
//                                 <TagsList tags={item?.tags} />
//                             </View>
                            
//                             {/* More button */}
//                             {showMoreIcon && (
//                                 <TouchableOpacity 
//                                     style={styles.moreButton} 
//                                     onPress={handleMorePress}
//                                     activeOpacity={0.7}
//                                 >
//                                     <Icon name="more" size={hp(2.2)} color={theme.colors.light || '#E0E0E0'} />
//                                 </TouchableOpacity>
//                             )}
//                         </View>
//                     </View>

//                     {/* Bottom section with title and date */}
//                     <View style={styles.bottomContainer}>
//                         <View style={styles.titleDateContainer}>
//                             {item?.body && (
//                                 <RenderHtml
//                                     contentWidth={wp(90)}
//                                     source={{ html: item.body }}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             )}
//                             <Text style={styles.releaseDate}>
//                                 {rDate}
//                             </Text>
//                         </View>
//                         <View style={styles.emptySpace} />
//                     </View>
//                 </View>
                
//                 {/* Dropdown Menu */}
//                 {showDropdown && (
//                     <View style={styles.dropdown}>
//                         <TouchableOpacity 
//                             style={styles.dropdownItem} 
//                             onPress={(e) => {
//                                 e.stopPropagation();
//                                 setShowDropdown(false);
//                                 // Add navigation to share screen or share functionality
//                                 console.log("Share pressed for stream:", item?.id);
//                             }}
//                         >
//                             <Icon name="edit" size={hp(2)} color={theme.colors.light || '#E0E0E0'} />
//                             <Text style={styles.dropdownText}>Details</Text>
//                         </TouchableOpacity>
//                         <View style={styles.divider} />
//                         <TouchableOpacity 
//                             style={styles.dropdownItem} 
//                             onPress={handleEditPress}
//                         >
//                             <Icon name="calender" size={hp(2)} color={theme.colors.light || '#E0E0E0'} />
//                             <Text style={styles.dropdownText}>End Date</Text>
//                         </TouchableOpacity>
//                     </View>
//                 )}
                
//                 {/* Background overlay to close dropdown when clicking outside */}
//                 {showDropdown && (
//                     <TouchableOpacity 
//                         style={styles.dropdownBackdrop} 
//                         onPress={(e) => {
//                             e.stopPropagation();
//                             setShowDropdown(false);
//                         }}
//                         activeOpacity={0}
//                     />
//                 )}
//             </View>
//         </TouchableOpacity>
//     )
// }

// export default OttCard

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 8,
//         backgroundColor: 'red',
//         height: hp(30),
//         width: '100%',
//     },
//     imageContainer: {
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//         overflow: 'hidden',
//     },
//     postMedia: {
//         width: '100%',
//         height: '100%',
//     },
//     radialVignette: {
//         ...StyleSheet.absoluteFillObject,
//         opacity: 0.7,
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.2)', 
//         justifyContent: 'space-between',
//     },
//     topContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         width: '100%',
//         zIndex: 10,
//     },
//     leftTopSection: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     rightTopSection: {
//         flexDirection: 'row',
//         alignItems: 'flex-start',
//     },
//     bottomContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-end',
//         width: '100%',
//         paddingBottom: 10,
//     },
//     titleDateContainer: {
//         paddingLeft: 10,
//         alignItems: 'flex-start',
//         justifyContent: 'flex-end',
//         maxWidth: '80%',
//     },
//     emptySpace: {
//         width: 40,
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 8,
//     },
//     tagsContainer: {
//         alignSelf: 'flex-start',
//         padding: 8,
//     },
//     star: {
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingValue: {
//         marginLeft: 5,
//         fontSize: hp(1.7),
//         fontWeight: '500',
//     },
//     releaseDate: {
//         color: theme.colors.silver,
//         fontSize: hp(2.4),
//         marginTop: 2,
//         textAlign: 'left',
//         fontWeight: '500'
//     },
//     moreButton: {
//         padding: hp(0.8),
//         borderRadius: hp(2),
//         backgroundColor: 'rgba(0,0,0,0.3)',
//         marginRight: 10,
//         marginTop: 8,
//     },
//     // Dropdown menu styles
//     dropdown: {
//         position: 'absolute',
//         top: hp(5),
//         right: hp(1.5),
//         width: wp(28),
//         backgroundColor: '#2A2A2A',
//         borderRadius: 12,
//         overflow: 'hidden',
//         elevation: 5,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.3,
//         shadowRadius: 4,
//         zIndex: 100,
//     },
//     dropdownItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: hp(1.2),
//         gap: 10,
//     },
//     dropdownText: {
//         color: theme.colors.light || '#E0E0E0',
//         fontSize: hp(1.6),
//     },
//     divider: {
//         height: 1,
//         backgroundColor: '#333333',
//         width: '100%',
//     },
//     dropdownBackdrop: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: 'transparent',
//         zIndex: 5,
//     },
// })

// import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useState } from 'react'
// import { wp, hp } from '@/helpers/common'
// import theme from '../constants/theme'
// import moment from 'moment/moment'
// import RenderHtml from 'react-native-render-html'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import TagsList from './TagList'
// import { LinearGradient } from 'expo-linear-gradient'
// import { useFocusEffect } from 'expo-router'

// const OttCard = ({
//     item,
//     router,
//     hasShadow = true,
// }) => {
//     const [userRating, setUserRating] = useState(0);
//     const [clickCount, setClickCount] = useState(0);
//     const [isNavigating, setIsNavigating] = useState(false);

//     // which reset on coming the page 
//       useFocusEffect(
//         React.useCallback(() => {
//           setIsNavigating(false);
//         }, [])
//       );

//     const shadowStyle = {
//         shadowOffset: {
//             width: 0,
//             height: 2
//         },
//         shadowOpacity: 0.25,
//         shadowRadius: 6,
//         elevation: 1
//     }

//     const handleCardPress = () => {
//         if (isNavigating) return;
//         if (!item?.id) return null;
//         setIsNavigating(true);
//         router.push({ pathname: 'streamInfo', params: { streamId: item.id } });
//     }

//     const rDate = item?.rDate ? moment(item.rDate).format('MMM DD') : '';

//     const renderRating = () => {
//         const rating = userRating || item?.defRating || 0;
//         const filledStars = Math.floor(rating);
        
//         return (
//             <View style={styles.ratingContainer}>
//                 {[...Array(5)].map((_, index) => {
//                     const isYellow = index < filledStars;
//                     return (
//                         <Text 
//                             key={index} 
//                             style={[
//                                 styles.star,
//                                 { color: isYellow ? theme.colors.star : '#FFFFFF' }
//                             ]}
//                         >
//                             {isYellow ? '★' : '☆'}
//                         </Text>
//                     );
//                 })}
//                 <Text style={[styles.ratingValue, { color: theme.colors.primaryDark }]}>
//                     {rating.toFixed(1)}/5
//                 </Text>
//             </View>
//         );
//     }

//     const titleTagsStyles = {
//         div: {
//             color: 'white',
//             fontSize: hp(3.7),
//             textAlign: 'left',
//             fontWeight: '600'
//         },
//         p: {
//             color: 'white',
//             fontSize: hp(2.5),
//             textAlign: 'left',
//             fontWeight: 'bold'
//         }
//     }

//     return (
//         <TouchableOpacity 
//             style={[styles.container, hasShadow && shadowStyle]}
//             onPress={handleCardPress}
//             activeOpacity={0.9}
//         >
//             <View style={styles.imageContainer}>
//                 {item?.file?.includes('postImage') && (
//                     <Image
//                         source={getSupabaseFileUrl(item?.file)}
//                         style={styles.postMedia}
//                         resizeMode="cover"
//                     />
//                 )}

//                 {/* Radial vignette effect */}
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 1, y: 1}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 0, y: 1}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 1, y: 0}}
//                 />
//                 <LinearGradient
//                     colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
//                     style={styles.radialVignette}
//                     start={{x: 0.5, y: 0.5}}
//                     end={{x: 0, y: 0}}
//                 />

//                 <View style={styles.overlay}>
//                     {/* Top section with rating and tags */}
//                     <View style={styles.topContainer}>
//                         {renderRating()}
//                         <View style={styles.tagsContainer}>
//                             <TagsList tags={item?.tags} />
//                         </View>
//                     </View>

//                     {/* Bottom section with title and date */}
//                     <View style={styles.bottomContainer}>
//                         <View style={styles.titleDateContainer}>
//                             {item?.body && (
//                                 <RenderHtml
//                                     contentWidth={wp(90)}
//                                     source={{ html: item.body }}
//                                     tagsStyles={titleTagsStyles}
//                                 />
//                             )}
//                             <Text style={styles.releaseDate}>
//                                 {rDate}
//                             </Text>
//                         </View>
//                         <View style={styles.emptySpace} />
//                     </View>
//                 </View>
                
//                 {/* White horizontal line at the bottom of the image */}
//                 {/* <View style={styles.whiteLine} /> */}
//             </View>
//         </TouchableOpacity>
//     )
// }

// export default OttCard

// const styles = StyleSheet.create({
//     container: {
//         marginBottom: 8,
//         backgroundColor: 'red',
//         height: hp(30),
//         width: '100%',
//     },
//     imageContainer: {
//         width: '100%',
//         height: '100%',
//         position: 'relative',
//         overflow: 'hidden',
//     },
//     postMedia: {
//         width: '100%',
//         height: '100%',
//     },
//     radialVignette: {
//         ...StyleSheet.absoluteFillObject,
//         opacity: 0.7,
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: 'rgba(0,0,0,0.2)', 
//         justifyContent: 'space-between',
//     },
//     topContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         width: '100%',
//     },
//     bottomContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-end',
//         width: '100%',
//         paddingBottom: 10,
//     },
//     titleDateContainer: {
//         paddingLeft: 10,
//         alignItems: 'flex-start',
//         justifyContent: 'flex-end',
//         maxWidth: '80%',
//     },
//     emptySpace: {
//         width: 40,
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 8,
//     },
//     tagsContainer: {
//         alignSelf: 'flex-start',
//         padding: 8,
//     },
//     star: {
//         fontSize: hp(2.2),
//         marginRight: 2,
//     },
//     ratingValue: {
//         marginLeft: 5,
//         fontSize: hp(1.7),
//         fontWeight: '500',
//     },
//     releaseDate: {
//         color: theme.colors.silver,
//         fontSize: hp(2.4),
//         marginTop: 2,
//         textAlign: 'left',
//         fontWeight: '500'
//     },
//     whiteLine: {
//         position: 'absolute',
//         bottom: 0,
//         alignSelf: 'center',
//         width: '97%',
//         height: 0.6, 
//         backgroundColor: theme.colors.textLight,
//     },
// });


