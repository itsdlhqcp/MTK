import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image } from 'react-native';
import moment from 'moment';
import ReleaseCard from '../components/RelesaeCard';
import FeedLoader from './FeedLoader';
import { hp, wp } from '../helpers/common';
import Icon from '../assets/icons';
import { getSupabaseFileUrl } from '../services/imageService';
import PratingStars from './pRatingStars';

// Modified header with toggle button
const ReleaseDateHeader = ({ date, viewMode, onToggleView }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerPillContainer}>
      <View style={styles.headerPill}>
        <Text style={styles.headerText}>{date}</Text>
      </View>
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
  </View>
);

// Grid version of ReleaseCard with date added above rating
const ReleaseGridCard = ({ item, router }) => {
  const handleCardPress = () => {
    if (!item?.id) return null;
    router.push({ pathname: 'releasePeopleSection/releasePeopleDetails', params: { releaseId: item.id } });
  };

  // Format the date as requested
  const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';

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
        
        {/* Date display - now separate from overlay */}
        {/* {createdAt && (
          <View style={styles.gridDateContainer}>
            <Text style={styles.gridDateText}>{createdAt}</Text>
          </View>
        )} */}
        
        {/* Rating display - keeps the overlay background */}
        {(item?.defRating > 0) && (
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

const ReleaseList = ({ releases, currentUser, router, loading, hasMore, onLoadMore }) => {
  // Add view mode state
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  const getHeaderText = (date) => {
    const today = moment();
    const releaseDate = moment(date);
    const diffDays = releaseDate.diff(today, 'days');
    
    // Future dates
    if (diffDays === 1) return 'TOMORROW';
    if (diffDays === 2) return 'DAY AFTER TOMORROW';
    if (diffDays > 2 && diffDays <= 7) return 'THIS WEEK';
    if (diffDays > 7 && diffDays <= 14) return 'NEXT WEEK';
    if (diffDays > 14) return 'COMING WEEKS';
    
    // Past dates
    if (diffDays === 0) return 'TODAY';
    if (diffDays === -1) return 'YESTERDAY';
    if (diffDays >= -7) return releaseDate.format('dddd').toUpperCase();
    if (diffDays < -7) return 'RECENT RELEASES';
  };

  const groupedReleases = useMemo(() => {
    const grouped = {};
    
    releases.forEach(release => {
      const headerText = getHeaderText(release.rDate);
      if (!grouped[headerText]) {
        grouped[headerText] = [];
      }
      grouped[headerText].push(release);
    });

    return Object.entries(grouped)
      .sort((a, b) => {
        const dateA = moment(a[1][0].rDate);
        const dateB = moment(b[1][0].rDate);
        return dateB.diff(dateA);
      })
      .map(([header, items]) => ({
        header,
        data: items
      }));
  }, [releases]);

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
  const renderListItem = ({ item }) => {
    if (item.isHeader) {
      return (
        <ReleaseDateHeader 
          date={item.header} 
          viewMode={viewMode} 
          onToggleView={toggleViewMode} 
        />
      );
    }
    
    return (
      <ReleaseCard
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
        {item.map((release, index) => (
          <ReleaseGridCard
            key={`grid-item-${release.id || index}`}
            item={release}
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
  const renderGridSection = ({ item }) => {
    return (
      <View style={styles.gridSection}>
        <ReleaseDateHeader 
          date={item.header} 
          viewMode={viewMode} 
          onToggleView={toggleViewMode} 
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
        {loading ? "Loading..." : "No releases found!"}
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

// Calculate item width for grid view (3 items per row)
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - (wp(4) * 2 + wp(2) * 2)) / 3;

const styles = StyleSheet.create({
  listContainer: {
    padding: 2,
  },
  gridContainer: {
    padding: 8,
   // paddingHorizontal: '4%'
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
 // New container for date only (no background)
 gridDateContainer: {
  position: 'absolute',
  top: hp(1), // Position at top with some padding
  right: hp(1), // Position at right with some padding
  paddingHorizontal: wp(1.5),
  paddingVertical: hp(0.3),
  borderRadius: hp(0.5),
  // Optional: add a text shadow to make the date visible against various backgrounds
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.8,
  shadowRadius: 1,
},
gridDateText: {
  fontSize: hp(1.8),
  fontWeight: '800',
  color: '#ffffff',
  // Optional: add text shadow to improve readability against various backgrounds
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
  backgroundColor: 'rgba(0, 0, 0, 0.6)', // Keep background for rating only
  paddingVertical: hp(0.5),
},
gridRatingText: {
  fontSize: hp(1.4),
  fontWeight: '500',
  color: '#00ac62',
},
});

export default ReleaseList;