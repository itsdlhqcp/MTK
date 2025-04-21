import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native';
import moment from 'moment';
import OttCard from '../components/OttCard';
import FeedLoader from './FeedLoader';
import { hp, wp } from '../helpers/common';
import Icon from '../assets/icons'; // Make sure you have this Icon component
import { getSupabaseFileUrl } from '../services/imageService';
import PratingStars from './pRatingStars';

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

// Grid version of OttCard
const OttGridCard = ({ item, router }) => {
  const handleCardPress = () => {
    if (!item?.id) return null;
    router.push({ pathname: 'streamPeopleSection/streamPeopleDetails', params: { streamId: item.id } });
  };

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
          {(item?.defRating > 0) > 0 && (
              <View style={styles.gridRatingContainer}>
                <PratingStars 
                  rating={item?.defRating} 
                  showRatingText={false} 
                  starSize={hp(1.6)}
                />
                <Text style={styles.gridRatingText}>{item?.defRating}/5</Text>
              </View>
            )}
        </View>
      )}
    </TouchableOpacity>
  );
};


const OttList = ({ streams, currentUser, router, loading, hasMore, onLoadMore }) => {
  // Add view mode state
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  const getHeaderText = (date, endDate) => {
    const today = moment();
    const releaseDate = moment(date);
    const diffDays = releaseDate.diff(today, 'days');

    if (endDate && moment().isBetween(releaseDate, moment(endDate), null, '[]')) {
      return 'NOW STREAMING';
    }
    
    // Future dates
    if (diffDays === 1) return 'TOMORROW';
    if (diffDays === 2) return 'AFTER TOMORROW';
    if (diffDays > 2 && diffDays <= 7) return 'THIS WEEK';
    if (diffDays > 7 && diffDays <= 14) return 'NEXT WEEK';
    if (diffDays > 14) return 'COMING WEEKS';
    
    // Past dates
    // if (diffDays === 0) return 'TODAY';
    // if (diffDays === -1) return 'YESTERDAY';
    if (diffDays >= -7) return releaseDate.format('dddd').toUpperCase();
    if (diffDays < -7) return 'COMING STREAMS';
    return releaseDate.format('MMMM YYYY').toUpperCase(); // RENOVE THIS LINE IF NOT WORKS
  };

  const groupedReleases = useMemo(() => {
    const grouped = {};
    const today = moment();
    
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
        // Always place "NOW STREAMING" at the top
        if (a[0] === 'NOW STREAMING') return -1;
        if (b[0] === 'NOW STREAMING') return 1;

        const dateA = moment(a[1][0].rDate);
        const dateB = moment(b[1][0].rDate);
        return dateB.diff(dateA);
      })
      .map(([header, items]) => ({
        header,
        data: items
      }));
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
        />
      );
    }
    // here the list of cards are rendered
    return (
      <OttCard
        item={item}
        currentUser={currentUser}
        router={router}
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
        {loading ? "Loading..." : "This is End of the Road!"}
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

// Calculate item width for grid view (3 items per row)
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - (wp(4) * 2 + wp(2) * 2)) / 3;

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
    fontSize: 14,
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
    width: itemWidth,
    height: hp(20),
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