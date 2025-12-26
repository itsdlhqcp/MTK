import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Animated } from 'react-native';
import moment from 'moment';
import ReleaseCard from '../components/RelesaeCard';
import FeedLoader from './FeedLoader';
import { hp, wp } from '../helpers/common';
import Icon from '../assets/icons';
import { getSupabaseFileUrl } from '../services/imageService';
import PratingStars from './pRatingStars';
import { fetchAverageRating } from '../services/releaseService';
import CustomDotIndicator from './CutomDotIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  subscribeToReleaseNotifications,
  unsubscribeFromReleaseNotifications,
  checkSubscriptionStatus
} from '../services/releaseNotificationSubscriptionService.js';
import { playBellActivateSound, playBellDeactivateSound } from '../services/bellSoundService.js';
import theme from '../constants/theme';

// Modified header with toggle button that only shows for the first header
const ReleaseDateHeader = ({ date, viewMode, onToggleView, isFirstHeader }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerPillContainer}>
      <View style={styles.headerPill}>
        <Text style={styles.headerText}>{date}</Text>
      </View>
      {/* Toggle button for grid/list view - only shown for first header */}
      {isFirstHeader && (
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={onToggleView}
        >
          <Icon 
            name={viewMode === 'grid' ? 'list' : 'grid'} 
            size={hp(2.6)} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Grid version of ReleaseCard with date added above rating
const ReleaseGridCard = ({ item, router, currentUser }) => {
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const { showToast } = useToast();
  // Animation values for bell icon
  const bellScale = useRef(new Animated.Value(1)).current;
  const bellRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fetch the average rating when component mounts
    const getAverageRating = async () => {
      try {
        if (!item?.id) return;
        setIsLoading(true);
        const avgRes = await fetchAverageRating(item?.id, item?.connectedId);
        setAvgRating(avgRes || 0);
      } catch (error) {
        console.error("Error fetching average rating:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getAverageRating();
  }, [item?.id]);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!currentUser?.id || !item?.id) return;
      try {
        const result = await checkSubscriptionStatus(currentUser.id, item.id, 'theatre');
        if (result.success) {
          setIsSubscribed(result.isSubscribed);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };
    checkSubscription();
  }, [currentUser?.id, item?.id]);

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
          'theatre'
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
          'theatre'
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

  const handleCardPress = () => {
    if (!item?.id) return null;
    router.push({ pathname: 'releaseInfo', params: { releaseId: item.id }});
  };

  // Format the date as requested
  const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
  const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');

  return (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {item?.file?.includes('postImage') && (
        <View style={styles.gridImageContainer}>
          <Image
            source={getSupabaseFileUrl(item.filel)}
            style={styles.gridItemImage}
            resizeMode="cover"
          />
          
          {/* Notification bell button - Top right */}
          {currentUser?.id && (
            <TouchableOpacity 
              style={[
                styles.gridNotificationButton,
                isSubscribed && styles.gridNotificationButtonActive
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
                  styles.gridNotificationIcon,
                  isSubscribed && styles.gridNotificationIconActive
                ]}>
                  {isSubscribed ? '🔔' : '🔕'}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )}

            <View style={styles.gridRatingContainer}>
                 {show ? ( 
                    <> <PratingStars 
                            rating={avgRating?.average || 0} 
                            showRatingText={false} 
                            starSize={hp(1.6)}
                            isLoading={isLoading || avgRating?.average === undefined || avgRating?.average === null}
                          />
                          {isLoading || avgRating?.average === undefined || avgRating?.average === null ? (
                            <View style={styles.skeletonRatingText} />
                          ) : (
                            <Text style={styles.gridRatingText}>
                              {avgRating?.average}/5
                            </Text>
                          )}
                        </>
                           
                        ) : (
                          <Text style={styles.gridRatingText}>
                          {releaseAt}
                   </Text>
                )}
            </View>
      
        </View>
      )}
    </TouchableOpacity>
  );
};

const ReleaseList = ({ releases, currentUser, router, loading, hasMore, onLoadMore, onDelete, viewMode = 'grid', onToggleViewMode }) => { 
  // Map to store average ratings for each release
  const [ratingsMap, setRatingsMap] = useState({});
  // Loading state for ratings
  const [ratingsLoading, setRatingsLoading] = useState({});

  // Fetch average ratings for all releases
  useEffect(() => {
    const fetchAllRatings = async () => {
      const newRatingsMap = { ...ratingsMap };
      const newLoadingMap = { ...ratingsLoading };
      
      // Create a list of releases that need ratings fetched
      const releasesToFetch = releases.filter(release => 
        release.id && !newRatingsMap[release.id]
      );
      
      // Mark these releases as loading
      releasesToFetch.forEach(release => {
        newLoadingMap[release.id] = true;
      });
      setRatingsLoading(newLoadingMap);
      
      // Fetch ratings for each release
      await Promise.all(releasesToFetch.map(async (release) => {
        try {
          // const avgRes = await fetchAverageRating(release.id);
          const avgRes = await fetchAverageRating(release?.id, release?.sconnectedId);
          newRatingsMap[release.id] = avgRes || 0;
        } catch (error) {
          console.error(`Error fetching rating for release ${release.id}:`, error);
          newRatingsMap[release.id] = 0;
        } finally {
          newLoadingMap[release.id] = false;
        }
      }));
      
      setRatingsMap(newRatingsMap);
      setRatingsLoading(newLoadingMap);
    };
    
    if (releases.length > 0) {
      fetchAllRatings();
    }
  }, [releases]);

  const getHeaderText = (date, endDate) => {
    // If date is null, return "COMING SOON"
    if (date === null) return 'COMING SOON';
    
    const today = moment().startOf('day');
    const releaseDate = moment(date).startOf('day');
    const diffDays = releaseDate.diff(today, 'days');
    
    if (endDate && moment().isBetween(releaseDate, moment(endDate), null, '[]')) {
      return 'NOW SHOWING';
    }
    
    // Calculate week boundaries (Monday to Sunday)
    // Get current week's Monday (start of ISO week)
    const currentWeekMonday = moment().startOf('isoWeek'); // Monday of current week
    const currentWeekSunday = moment().endOf('isoWeek'); // Sunday of current week
    
    // Get next week's Monday (day after next Sunday)
    const nextWeekMonday = currentWeekSunday.clone().add(1, 'day'); // Monday of next week
    const nextWeekSunday = nextWeekMonday.clone().endOf('isoWeek'); // Sunday of next week
    
    // Future dates
    if (diffDays === 1) return 'TOMORROW';
    
    // Check if date is in current week (Monday to Sunday)
    if (releaseDate.isSameOrAfter(currentWeekMonday, 'day') && releaseDate.isSameOrBefore(currentWeekSunday, 'day')) {
      return 'THIS WEEK';
    }
    
    // Check if date is in next week (Monday to Sunday after current week)
    if (releaseDate.isSameOrAfter(nextWeekMonday, 'day') && releaseDate.isSameOrBefore(nextWeekSunday, 'day')) {
      return 'NEXT WEEK';
    }
    
    if (diffDays > 14) return 'LATER';
    
    // Past dates

    return releaseDate.format('MMMM YYYY').toUpperCase();
  };

  // Helper function for header priority
  const getHeaderPriority = (header) => {
    // Define the custom priority order
    const priorityOrder = {
      'NOW SHOWING': 0,
      'TOMORROW': 1,
      'AFTER TOMORROW': 2,
      'THIS WEEK': 3,
      'NEXT WEEK': 4,
      'COMING WEEKS': 5,
      'COMING SOON': 999 // Always the last priority
    };
    
    // Return the priority (lower number = higher priority)
    // If header is not in the list, give it low priority
    return priorityOrder[header] !== undefined ? priorityOrder[header] : 100;
  };

  const groupedReleases = useMemo(() => {
    const grouped = {};
    const today = moment().startOf('day');
    
    // Filter releases where the current date is not after endDate
    const filteredReleases = releases.filter(release => {
      // If there's no endDate, always show the release
      if (!release.endDate) return true;
      
      // Don't display if current date is after endDate
      return !today.isAfter(moment(release.endDate));
    });
    
    filteredReleases.forEach(release => {
      const headerText = getHeaderText(release.rDate, release.endDate);
      if (!grouped[headerText]) {
        grouped[headerText] = [];
      }
      grouped[headerText].push(release);
    });
  
    return Object.entries(grouped)
      .sort((a, b) => {
        // Get the custom priority for each header
        const priorityA = getHeaderPriority(a[0]);
        const priorityB = getHeaderPriority(b[0]);
        
        // Sort by priority first
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If priorities are the same, use the original date-based sorting
        // For null dates (COMING SOON), we already handled with the priority
        if (a[0] === 'COMING SOON' || b[0] === 'COMING SOON') {
          return 0;
        }
        
        const dateA = a[1][0].rDate ? moment(a[1][0].rDate) : moment().add(1000, 'years');
        const dateB = b[1][0].rDate ? moment(b[1][0].rDate) : moment().add(1000, 'years');
        return dateA.diff(dateB); // Reverted to ascending order
      })
      .map(([header, items]) => {
        // Sort items within each group in ascending date order
        const sortedItems = [...items].sort((a, b) => {
          const dateA = a.rDate ? moment(a.rDate) : moment().add(1000, 'years');
          const dateB = b.rDate ? moment(b.rDate) : moment().add(1000, 'years');
          return dateA.diff(dateB); // Sort items in ascending order
        });
        
        return {
          header,
          data: sortedItems
        };
      });
  }, [releases]);

  // Toggle view mode between list and grid (use prop if provided, otherwise use local handler)
  const toggleViewMode = onToggleViewMode || (() => {
    // Fallback if no handler provided (shouldn't happen, but for safety)
    console.warn('onToggleViewMode not provided to ReleaseList');
  });

  // Helper function to chunk array into groups of specified size (for grid view)
  function chunk(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  // Render list item or header
  const renderListItem = ({ item, index }) => {
    if (item.isHeader) {
      // Find if this is the first header in the flattened list
      const isFirstHeader = flatListData.findIndex(i => i.isHeader) === index;
      
      return (
        <ReleaseDateHeader 
          date={item.header} 
          viewMode={viewMode || 'grid'} 
          onToggleView={toggleViewMode}
          isFirstHeader={isFirstHeader}
        />
      );
    }
    
    // Pass the corresponding average rating to ReleaseCard
    // remove all rating map and loading state
    const avgRating = ratingsMap[item.id] || 0;
    const isRatingLoading = ratingsLoading[item.id] || false;
    
    return (
      <ReleaseCard
        item={item}
        currentUser={currentUser}
        router={router}
        onDelete={(releaseId) => {
          // Remove the deleted release from the list
          if (onDelete && typeof onDelete === 'function') {
            onDelete(releaseId);
          }
        }}
        // avgRating={avgRating}
        // isRatingLoading={isRatingLoading}
      />
    );
  };

  // Render grid row
  const renderGridRow = ({ item }) => {
    return (
      <View style={styles.gridRow}>
        {item.map((release, index) => (
          <ReleaseGridCard
            key={`grid-item-${release.id || index}`}
            item={release}
            router={router}
            currentUser={currentUser}
          />
        ))}
        {/* Add placeholder items to fill the row if needed */}
        {item.length === 1 && (
          <>
            <View style={[styles.gridItem, styles.placeholderItem]} />
            <View style={[styles.gridItem, styles.placeholderItem]} />
          </>
        )}
        {item.length === 2 && (
          <View style={[styles.gridItem, styles.placeholderItem]} />
        )}
      </View>
    );
  };

  // Grid section with header and rows
  const renderGridSection = ({ item, index }) => {
    const isFirstHeader = index === 0;
    
    return (
      <View style={styles.gridSection}>
        <ReleaseDateHeader 
          date={item.header} 
          viewMode={viewMode || 'grid'} 
          onToggleView={toggleViewMode}
          isFirstHeader={isFirstHeader}
        />
        <FlatList
          data={chunk(item.data, 3)}
          renderItem={renderGridRow}
          keyExtractor={(item, index) => `row-${index}-${item[0]?.id || 'empty'}`}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const flatListData = useMemo(() => {
    return groupedReleases.reduce((acc, group) => {
      return [
        ...acc,
        { header: group.header, id: `header-${group.header}`, isHeader: true },
        ...group.data
      ];
    }, []);
  }, [groupedReleases]);

  const renderFooter = () => {
    if (releases.length === 0) return null;

    return (
      <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
        {loading && <FeedLoader />}
        {!hasMore && releases.length > 0 && (
          <Text style={styles.noMoreText}>No more releases to load!</Text>
        )}
      </View>
    );
  };

  // Empty component for both views
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.noMoreText}>
        {loading ? <CustomDotIndicator size={6}/> : "No releases found!"}
      </Text>
    </View>
  );

  return (
    <>
      {(viewMode || 'grid') === 'list' ? (
        // List View
        <FlatList
          key="list"
          data={flatListData}
          renderItem={renderListItem}
          keyExtractor={(item, index) => 
            item.isHeader ? `header-${item.header}` : `release-${item.id}`
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
        />
      ) : (
        // Grid View
        <FlatList
          key="grid"
          data={groupedReleases}
          renderItem={renderGridSection}
          keyExtractor={(item) => `month-section-${item.header}`}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </>
  );
};

export default ReleaseList;

const styles = StyleSheet.create({
  listContainer: {
    padding: 2,
  },
  gridContainer: {
    padding: 8,
  },
  headerContainer: {
    paddingBottom: 5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 1,
  },
  headerPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    paddingHorizontal: wp(15), // Add padding to ensure space for button
  },
  headerPill: {
    backgroundColor: '#424242',
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 20,
    maxWidth: '70%', // Limit pill width to prevent touching button
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  toggleButton: {
    padding: hp(0.5),
    position: 'absolute',
    right: wp(4),
  },
  noMoreText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(78),
  },
  // Grid view styles
  gridSection: {
    marginBottom: hp(2),
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    paddingHorizontal: wp(2),
  },
  gridItem: {
    width: wp(30),
    height: hp(24),
    borderRadius: 4,
    overflow: 'hidden',
  },
  placeholderItem: {
    backgroundColor: 'transparent',
  },
  gridImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },

 gridDateContainer: {
  position: 'absolute',
  top: hp(1), 
  right: hp(1), 
  paddingHorizontal: wp(1.5),
  paddingVertical: hp(0.3),
  borderRadius: hp(0.5),
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.8,
  shadowRadius: 1,
},
gridDateText: {
  fontSize: hp(1.8),
  fontWeight: '800',
  color: '#ffffff',
  textShadowColor: 'rgba(0, 0, 0, 0.75)',
  textShadowOffset: { width: -1, height: 1 },
  textShadowRadius: 10,
},
gridRatingContainer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.6)', 
  paddingVertical: hp(0.5),
},
gridRatingText: {
  fontSize: hp(1.4),
  fontWeight: '500',
  color: '#00ac62',
},
skeletonRatingText: {
  width: wp(8),
  height: hp(1.4),
  backgroundColor: 'rgba(0, 172, 98, 0.2)',
  borderRadius: 4,
  marginLeft: wp(1),
},
gridNotificationButton: {
  position: 'absolute',
  top: hp(0.5),
  right: wp(2),
  padding: hp(0.6),
  borderRadius: hp(1.5),
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: hp(3),
  minHeight: hp(3),
  zIndex: 10,
},
gridNotificationButtonActive: {
  backgroundColor: 'rgba(229, 9, 20, 0.6)',
},
gridNotificationIcon: {
  fontSize: hp(1.8),
  color: theme.colors.light || '#E0E0E0',
},
gridNotificationIconActive: {
  color: theme.colors.primary || '#E50914',
},
});

