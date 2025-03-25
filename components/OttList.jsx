import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import moment from 'moment';
import OttCard from '../components/OttCard';
import FeedLoader from './FeedLoader';

const ReleaseDateHeader = ({ date }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerPill}>
      <Text style={styles.headerText}>{date}</Text>
    </View>
  </View>
);

const OttList = ({ streams, currentUser, router, loading, hasMore, onLoadMore }) => {
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
    return releaseDate.format('MMMM D').toUpperCase();
  };

  const groupedReleases = useMemo(() => {
    const grouped = {};
    
    streams.forEach(release => {
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
  }, [streams]);

  const renderItem = ({ item }) => {
  
    if (item.isHeader) {
      return <ReleaseDateHeader date={item.header} />;
    }
    
    return (
      <OttCard
        item={item}
        currentUser={currentUser}
        router={router}
      />
    );
  };

  const flatListData = useMemo(() => {
    return groupedReleases.reduce((acc, group) => {
      return [
        ...acc,
        { header: group.header, id: `header-${group.header}`, isHeader: true }, // Ensure headers have unique IDs
        ...group.data
      ];
    }, []);
  }, [groupedReleases]);
  

  const renderFooter = () => {
    if (streams.length === 0) return null;

    return (
      <View style={{ marginVertical: 0, paddingBottom: 16 }}>
        {loading && <FeedLoader />}
        {!hasMore && streams.length > 0 && (
          <Text style={styles.noMoreText}>No more OTT content to load!</Text>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={flatListData}
      renderItem={renderItem}
      // Improved keyExtractor to handle both header and non-header items more explicitly
      keyExtractor={(item, index) => 
        item.isHeader ? item.id : `stream-${item.id || index}`
      }
      
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
      // stickyHeaderIndices={flatListData.map((item, index) => 
      //   item.isHeader ? index : null
      // ).filter(Boolean)}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.noMoreText}>
            {loading ? "Loading..." : "This is End of the Road!"}
          </Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 10,
    paddingHorizontal: '4%'
  },
  headerContainer: {
    paddingVertical: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 1,
  },
  headerPill: {
    backgroundColor: '#424242',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
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
  }
});

export default OttList;