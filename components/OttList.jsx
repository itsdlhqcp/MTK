import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity,Image } from 'react-native';
import moment from 'moment';
import OttCard from '../components/OttCard';
import FeedLoader from './FeedLoader';
import { hp, wp } from '../helpers/common';
import Icon from '../assets/icons'; // Make sure you have this Icon component
import { getSupabaseFileUrl } from '../services/imageService';
import PratingStars from './pRatingStars';
import { fetchAverageRating, fetchAverageRatingDirect } from '../services/releaseService';
import CustomDotIndicator from './CutomDotIndicator';

// Modified header with toggle button that only shows for the first header
const ReleaseDateHeader = ({ date, viewMode, onToggleView, isFirstHeader, onFilterPress, filterLabel }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerPillContainer}>
      <View style={styles.headerPill}>
        <Text style={styles.headerText}>{date}</Text>
      </View>
      {/* Filter and Toggle buttons - only shown for first header */}
      {isFirstHeader && (
        <View style={styles.headerButtonsContainer}>
          {/* Filter Button */}
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={onFilterPress}
          >
            <Icon name="filter" size={hp(1.8)} color='white' />
            <Text style={styles.filterButtonText}>
              {filterLabel}
            </Text>
            <Icon name="chevrondown" size={hp(1.2)} color='white' />
          </TouchableOpacity>
          {/* Toggle button for grid/list view */}
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
        </View>
      )}
    </View>
  </View>
);

// Grid version of OttCard
const OttGridCard = ({ item, router }) => {
   const [avgRating, setAvgRating] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      if (!item?.directRelease && item?.connectedId) {
        getAverageRating();
      }else{
        getAverageRatingOfDirect();
      }
    }, [item?.id]);

       // Fetch the average rating when component mounts
       const getAverageRating = async () => {
        try {
          if (!item?.id) return;
          setIsLoading(true);
          const avgRes = await fetchAverageRating(item?.connectedId,item?.id);
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


  const handleCardPress = () => {
    if (!item?.id) return null;
    
    // Check if this is a series item
    if (item.isSeries && item.originalId) {
      router.push({ pathname: 'seriesDetails', params: { seriesId: item.originalId } });
    } else {
      router.push({ pathname: 'streamInfo', params: { streamId: item.id } });
    }
  };

    // Format the date as requested
    const releaseAt = item?.rDate ? moment(item?.rDate).format('MMM D') : '';
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
              <View style={styles.gridRatingContainer}>
                    {show ? ( 
                                      <> <PratingStars 
                                              rating={avgRating?.average} 
                                              showRatingText={false} 
                                              starSize={hp(1.6)}
                                            />
                                            <Text style={styles.gridRatingText}>
                                              {isLoading ? '...' : `${avgRating?.average}/5`}
                                            </Text></>
                                             
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

const OttList = ({ streams, currentUser, router, loading, hasMore, onLoadMore, onFilterPress, filterLabel, onDelete }) => {
  // Add view mode state
  const [viewMode, setViewMode] = useState('grid'); 
  
  const getHeaderText = (date, endDate) => {
    // If date is null, return "COMING SOON"
    if (date === null) return 'COMING SOON';
    
    const today = moment().startOf('day');
    const releaseDate = moment(date).startOf('day');
    const diffDays = releaseDate.diff(today, 'days');

    if (endDate && moment().isBetween(releaseDate, moment(endDate), null, '[]')) {
      return 'NOW STREAMING';
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
    // if (diffDays === 0) return 'TODAY';
    // if (diffDays === -1) return 'YESTERDAY';
    if (diffDays >= -7) return 'COMING STREAMS';
    if (diffDays < -7) return 'COMING STREAMS';
    return releaseDate.format('MMMM YYYY').toUpperCase();
  };

  // Helper function for header priority
  const getHeaderPriority = (header) => {
    // Define the custom priority order
    const priorityOrder = {
      'NOW STREAMING': 0,
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
    
    // Filter streams where the current date is not after endDate
    const filteredStreams = streams.filter(stream => {
      // If there's no endDate, always show the stream
      if (!stream.endDate) return true;
      
      // Don't display if current date is after endDate
      return !today.isAfter(moment(stream.endDate));
    });
    
    filteredStreams.forEach(release => {
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
        return dateA.diff(dateB); // Ascending order
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
  }, [streams]);

  // Toggle view mode between list and grid
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
  };

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
          viewMode={viewMode} 
          onToggleView={toggleViewMode}
          isFirstHeader={isFirstHeader}
          onFilterPress={onFilterPress}
          filterLabel={filterLabel}
        />
      );
    }
    // here the list of cards are rendered
    return (
      <OttCard
        item={item}
        currentUser={currentUser}
        router={router}
        onDelete={(itemId, seriesId) => {
          // Remove the deleted item from the list
          if (onDelete && typeof onDelete === 'function') {
            onDelete(itemId, seriesId);
          }
        }}
      />
    );
  };

  // Render grid row
  const renderGridRow = ({ item }) => {
    return (
      <View style={styles.gridRow}>
        {item.map((stream, index) => (
          <OttGridCard
            key={`grid-item-${stream.id || index}`}
            item={stream}
            router={router}
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
    // Only the first section (index 0) should have the toggle button
    const isFirstHeader = index === 0;
    
    return (
      <View style={styles.gridSection}>
        <ReleaseDateHeader 
          date={item.header} 
          viewMode={viewMode} 
          onToggleView={toggleViewMode}
          isFirstHeader={isFirstHeader}
          onFilterPress={onFilterPress}
          filterLabel={filterLabel}
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

  // List view data preparation
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
    if (streams.length === 0) return null;

    return (
      <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
        {loading && <FeedLoader />}
        {!hasMore && streams.length > 0 && (
          <Text style={styles.noMoreText}>No more OTT content to load!</Text>
        )}
      </View>
    );
  };

  // Empty component for both views
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.noMoreText}>
        {loading ? <CustomDotIndicator size={6}/> : "This is End of the Road!"}
      </Text>
    </View>
  );

  return (
    <>
      {viewMode === 'list' ? (
        // List View
        <FlatList
          key="list"
          data={flatListData}
          renderItem={renderListItem}
          keyExtractor={(item, index) => 
            item.isHeader ? `header-${item.header}` : `stream-${item.id}`
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

export default OttList;

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
  },
  headerPill: {
    backgroundColor: '#424242',
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 20,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    position: 'absolute',
    right: wp(4),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.3),
    fontWeight: '600',
  },
  toggleButton: {
    padding: hp(0.5),
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
    minHeight: 300,
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
  gridStar: {
    fontSize: hp(1.8),
    color: '#de571a',
    marginRight: wp(1),
  },
  gridRatingText: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: '#00ac62',
  },
});