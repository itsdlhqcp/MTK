import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions 
} from 'react-native';
import { fetchAllUserReviews, fetchRateNowSuggestions } from '../services/ProfileTilesService';
import RateNowSuggestionCard from './RateNowSuggestionCard';
import { wp, hp } from '../helpers/common';
import MLoading from '../components/MaterialLoader';
import FeedLoader from '../components/FeedLoader';
import { useAuth } from '../contexts/AuthContext'; 
import theme from '../constants/theme';
import moment from 'moment/moment';
import { router } from 'expo-router';
import Icon from '../assets/icons';
import RenderHtml from 'react-native-render-html';
import PratingStars from '../components/pRatingStars';
import { getSupabaseFileUrl } from '../services/imageService';
import { NetworkUtils } from '../utils/network';
import CustomDotIndicator from './CutomDotIndicator';
import WatchListSkeleton from './WatchListSkeleton';

// Modified Month Header component with toggle button
const MonthHeader = ({ month, viewMode, onToggleView, isFirstHeader }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerPillContainer}>
      <View style={styles.headerPill}>
        <Text style={styles.headerText}>{month}</Text>
      </View>

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

const UserReviewsComponent = ({ navigation, userId }) => {
  const [combinedReviews, setCombinedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 12; // Number of reviews per page
  
  // Check network status on mount
  useEffect(() => {
    const checkNetworkStatus = async () => {
      const connected = await NetworkUtils.isConnected();
      setIsConnected(connected);
      setInitialCheckDone(true);
    };
    
    checkNetworkStatus();
    
    // Set up network listener
    const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
      setIsConnected(connected);
      setInitialCheckDone(true);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialCheckDone) {
      loadReviews(1, true); // Load first page on initial load
      // Load suggestions only for authenticated user viewing their own profile
      if (user?.id && (!userId || userId === user.id)) {
        loadSuggestions();
      }
    }
  }, [initialCheckDone, user?.id, userId]);

  // Load rate now suggestions
  const loadSuggestions = useCallback(async () => {
    if (!user?.id || loadingSuggestions) return;
    
    setLoadingSuggestions(true);
    try {
      if (!isConnected) {
        console.log('Skipping suggestions fetch - device is offline');
        setLoadingSuggestions(false);
        return;
      }
      
      const result = await fetchRateNowSuggestions(user.id);
      if (result.success) {
        setSuggestions(result.data || []);
      } else {
        console.error('Failed to load suggestions:', result.msg);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [user?.id, isConnected]);

  // Load reviews with pagination
  const loadReviews = useCallback(async (page = 1, reset = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Check if we're online before attempting to fetch
      if (!isConnected) {
        console.log('Skipping fetch - device is offline');
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      
      const targetUserId = userId || user?.id;
      const result = await fetchAllUserReviews(targetUserId, page, PAGE_SIZE);
      
      if (result.success) {
        if (reset) {
          // Replace all existing data
          setCombinedReviews(result.data);
        } else {
          // Append new data to existing
          setCombinedReviews(prevReviews => [...prevReviews, ...result.data]);
        }
        
        // Update pagination state
        setCurrentPage(page);
        setTotalPages(result.pagination.totalPages);
        setHasMorePages(result.pagination.hasMore);
      } else {
        console.error('Failed to load reviews:', result.msg);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id, isConnected]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    if (isConnected) {
      loadReviews(1, true);
    }
  }, [isConnected, loadReviews]);

  // Load more data when reaching end of list
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMorePages && isConnected) {
      loadReviews(currentPage + 1, false);
    }
  }, [currentPage, hasMorePages, loadingMore, isConnected, loadReviews]);

  // Group reviews by month - useMemo for performance
  const groupedReviews = useMemo(() => {
    const grouped = {};
    
    combinedReviews.forEach(review => {
      const monthYear = moment(review.created_at).format('MMMM YYYY');
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(review);
    });

    // Sort by latest month first
    return Object.entries(grouped)
      .sort((a, b) => {
        const dateA = moment(a[1][0].created_at);
        const dateB = moment(b[1][0].created_at);
        return dateB.diff(dateA);
      })
      .map(([month, items]) => ({
        month,
        data: items
      }));
  }, [combinedReviews]);

  // Flatten data for FlatList with headers
  const flatListData = useMemo(() => {
    return groupedReviews.reduce((acc, group) => {
      return [
        ...acc,
        { month: group.month, id: `header-${group.month}`, isHeader: true },
        ...group.data
      ];
    }, []);
  }, [groupedReviews]);

  // Navigate to release details screen which can be also stream details page
  const handleViewRelease = (item) => {
    if (!item?.releaseId) return null;
    
    // Check which table the data came from
    // For dpeopreviews (digital streams), the raw data uses stream: streams(...) relationship
    // For peoplesReview (physical releases), the raw data uses release: releases(...) relationship
    
    // Check if this item is from the dpeopreviews table (digital stream)
    const isStream = item.hasOwnProperty('original_table') 
          ? item?.original_table === 'dpeopreviews'
          : item?.hasOwnProperty('streamId');
          
    if (isStream) {
      router.push({ 
        pathname: 'streamPeopleSection/streamPeopleDetails', 
        params: { streamId: item?.releaseId, reviewId: item?.id } 
      });
    } else {
      router.push({ 
        pathname: 'releasePeopleSection/releasePeopleDetails', 
        params: { releaseId: item?.releaseId, reviewId: item?.id } 
      });
    }
  };
  
  // Toggle view mode between list and grid
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
  };
  
  // Extract day of month from date
  const extractDay = (dateString) => {
    return moment(dateString).format('D');
  };
  
  // Extract year from release date
  const extractYear = (releaseDate) => {
    return releaseDate ? moment(releaseDate).format('YYYY') : '';
  };

  // Render list view item (Format 1) or header
  const renderListItem = ({ item, index }) => {
    const isFirstHeader = flatListData.findIndex(i => i.isHeader) === index;
    
    // Render header if isHeader is true
    if (item.isHeader) {
      return <MonthHeader month={item.month} viewMode={viewMode} onToggleView={toggleViewMode} isFirstHeader={isFirstHeader} />;
    }

    const monName = moment(item.created_at).format('MMM');
    
    // Get day from created_at date for the left number
    const day = extractDay(item.created_at);
    // Get year from release date for displaying after title
    const year = extractYear(item.releaseDate);
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.cardContainer}>
          {/* Main content area */}
          <View style={styles.contentContainer}>
            <TouchableOpacity 
              style={styles.movieHeaderContainer}
              onPress={() => handleViewRelease(item)}
            >
              {/* Movie poster and title section */}
              <View style={styles.movieInfoContainer}>
                {/* Movie poster */}
                {item.releasePoster && (
                  <Image
                    source={getSupabaseFileUrl(item.releasePoster)}
                    style={styles.posterImage}
                    contentFit='cover'
                  />
                )}
                
                {/* Title and year - now using RenderHtml for title (releaseBody) */}
                <View style={styles.titleContainer}>
                  {/* Modified section: Using RenderHtml for the title instead of Text */}

                  <View style={styles.both}>
                    
                      {item.releaseBody && (
                        <View style={styles.titleHtmlContainer}>
                          <RenderHtml
                            contentWidth={wp(60)}
                            source={{html: item.releaseBody}}
                            tagsStyles={titleTagsStyles}
                          />
                        </View>
                      )}

                      {item.favour && (
                        <TouchableOpacity activeOpacity={0.7}>
                          <Icon 
                            name='heart' 
                            size={15} 
                            fill={theme.colors.bmw} 
                            strokeWidth={1.4} 
                            color={theme.colors.dark}
                          />
                        </TouchableOpacity>
                      )}
                  </View>
                  
                  {/* Rating stars and popcorn */}
                  {item.userRating > 0 && (
                    <View style={styles.ratingContainer}>
                      <PratingStars 
                        rating={item.userRating} 
                        showRatingText={false} 
                        starSize={hp(1.8)}
                      />
                      <Text style={styles.ratingtext}>{item.userRating}/5</Text>
                      {item?.popCorn && (
                        <View style={styles.popcornContainer}>
                          <Icon name="popcorn" size={hp(2)} color="#FFD700" />
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.dayContainer}>
                  <View style={styles.dayRow}>
                    <Text style={styles.dayText}>{monName}</Text>
                    <Text style={styles.dayText}>{day}</Text>
                  </View>
                  {/* Show Theatre or Digital label below date */}
                  <Text style={styles.reviewTypeLabel}>
                    {item.original_table === 'peoplesReview' ? 'THEATRE' : 'DIGITAL'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Review body content */}
            {item?.body && (
              <View style={styles.reviewContent}>
                <RenderHtml
                  contentWidth={wp(80)}
                  source={{html: item.body}}
                  tagsStyles={tagsStyles}
                />
              </View>
            )}
            
            {/* Image if available */}
            {item?.file?.includes('postImage') && (
              <Image
                source={getSupabaseFileUrl(item.file)} 
                transition={100}
                style={styles.postMedia}
                contentFit='cover'
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Helper function to chunk array into groups of specified size
  function chunk(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  // Render a row of grid items (3 per row)
  const renderGridRow = ({ item }) => {
    return (
      <View style={styles.gridRow}>
        {item.map((review, index) => (
          <TouchableOpacity
            key={`grid-item-${review?.id || index}`}
            style={styles.gridItem}
            onPress={() => handleViewRelease(review)}
          >
            {review.releasePoster ? (
              <Image
                source={getSupabaseFileUrl(review.releasePoster)}
                style={styles.gridItemImage}
                contentFit='cover'
              />
            ) : (
              <View style={[styles.gridItemImage, styles.noImagePlaceholder]}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}
            
            {/* Add rating stars at the bottom center */}
            {review.userRating > 0 && (
              <View style={styles.gridRatingContainer}>
                <PratingStars 
                  rating={review.userRating} 
                  showRatingText={false} 
                  starSize={hp(1.6)}
                />
                <Text style={styles.gridRatingText}>{review.userRating}/5</Text>
              </View>
            )}
          </TouchableOpacity>
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
        <MonthHeader month={item.month} viewMode={viewMode} onToggleView={toggleViewMode} isFirstHeader={isFirstHeader} />
        <FlatList
          data={chunk(item.data, 3)}
          renderItem={renderGridRow}
          keyExtractor={(item, index) => `row-${index}-${item[0]?.id || 'empty'}`}
          scrollEnabled={false}
        />
      </View>
    );
  };

  // Empty component for both views - now handles offline state
  const renderEmptyComponent = () => {
    // When offline with no cached data
    if (!isConnected) {
      return (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>You're offline</Text>
          <Text style={styles.offlineSubText}>
            Connect to the internet to see your reviews
          </Text>
        </View>
      );
    }
    
    // Regular empty state
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{userId? "He haven't posted any reviews yet.": "You haven't posted any reviews yet."}</Text>
      </View>
    );
  };

  // Pagination info display
  const renderPaginationInfo = () => {
    if (combinedReviews.length === 0 || loading) return null;
    
    return (
      <View style={styles.paginationInfoContainer}>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages}
        </Text>
      </View>
    );
  };

  // Footer component for pagination
  const renderFooter = () => {
    return (
      <View style={{ marginVertical: 0, paddingBottom: 16 }}>
        {loadingMore && <CustomDotIndicator size={6}/>}
        {!hasMorePages && combinedReviews.length > 0 && (
          <Text style={styles.noPosts}>End of DLHQ review !!</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <WatchListSkeleton count={3} />
      ) : (
        <>
          {viewMode === 'list' ? (
            // List View with headers (Format 1)
            <FlatList
              key="list"
              data={flatListData}
              renderItem={renderListItem}
              keyExtractor={(item, index) => 
                item.isHeader ? `header-${item?.month}` : `review-list-${item?.id || index}`
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                // Only show suggestions for authenticated user viewing their own profile
                user?.id && (!userId || userId === user.id) && suggestions.length > 0 ? (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Rate Now</Text>
                    <FlatList
                      horizontal
                      data={suggestions}
                      renderItem={({ item }) => <RateNowSuggestionCard suggestion={item} />}
                      keyExtractor={(item, index) => `suggestion-${item.releaseId}-${index}`}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.suggestionsList}
                    />
                  </View>
                ) : null
              }
              ListEmptyComponent={renderEmptyComponent}
              ListFooterComponent={renderFooter}
              onRefresh={handleRefresh}
              refreshing={loading}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              nestedScrollEnabled={true}
            />
          ) : (
            // Grid View with month sections
            <FlatList
              key="grid"
              data={groupedReviews}
              renderItem={renderGridSection}
              keyExtractor={(item) => `month-section-${item.month}`}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyComponent}
              ListFooterComponent={renderFooter}
              ListHeaderComponent={
                // Only show suggestions for authenticated user viewing their own profile
                user?.id && (!userId || userId === user.id) && suggestions.length > 0 ? (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Rate Now</Text>
                    <FlatList
                      horizontal
                      data={suggestions}
                      renderItem={({ item }) => <RateNowSuggestionCard suggestion={item} />}
                      keyExtractor={(item, index) => `suggestion-${item.releaseId}-${index}`}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.suggestionsList}
                    />
                  </View>
                ) : null
              }
              onRefresh={handleRefresh}
              refreshing={loading}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
            />
          )}
          
          {/* Pagination info at the bottom */}
          {renderPaginationInfo()}
        </>
      )}
    </View>
  );
};

export default UserReviewsComponent;

const tagsStyles = {
  body: {
    color: '#333333',
    fontSize: hp(1.7),
    lineHeight: hp(2.4),
  },
  p: {
    marginBottom: hp(1),
  },
};

const titleTagsStyles = {
  body: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
    display: 'flex',
    flexDirection: 'row',
  },
  p: {
    margin: 0,
    padding: 0,
  },
};

// Calculate item width for grid view (3 items per row)
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - (wp(4) * 2 + wp(2) * 2)) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(16),
  },
  listContainer: {
    paddingHorizontal: wp(1.4),
    paddingVertical: hp(1),
  },
  gridContainer: {
    paddingHorizontal: wp(1.4),
    paddingVertical: hp(1),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(30),
  },
  emptyText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  // List view styles
  reviewCard: {
    marginBottom: hp(0.5),
    backgroundColor: '#111',
    borderRadius: 0,
  },
  cardContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: wp(2),
  },
  contentContainer: {
    flex: 1,
    paddingVertical: hp(1.5),
    paddingRight: wp(2),
  },
  headerContainer: {
    marginBottom: hp(1),
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 1,
    paddingVertical: hp(0.5),
  },
  headerPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  movieHeaderContainer: {
    marginBottom: hp(1),
  },
  headerPill: {
    backgroundColor: '#424242',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.4),
    borderRadius: 20,
    marginVertical: hp(1),
  },
  headerText: {
    fontSize: hp(1.25),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  toggleButton: {
    padding: hp(0.5),
    position: 'absolute',
    right: wp(4),
  },
  movieInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posterImage: {
    width: wp(12),
    height: hp(7),
    borderRadius: 4,
    marginRight: wp(2),
  },
  titleContainer: {
    flex: 1,
  },
  titleHtmlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  popcornContainer: {
    marginLeft: wp(1),
  },
  menuButton: {
    padding: wp(1),
  },
  reviewContent: {
    marginTop: hp(0.5),
  },
  postMedia: {
    width: '100%',
    height: hp(20),
    borderRadius: 4,
    marginTop: hp(1),
  },
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
  gridItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  noImagePlaceholder: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: hp(1.5),
  },
  ratingtext: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.ourgn,
  },
  gridRatingContainer: {
    position: 'absolute',
    bottom: hp(0),
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: hp(0.5),
  },
  gridRatingText: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: theme.colors.ourgn,
    marginLeft: wp(1),
  },
  dayContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'flex-start',
    paddingTop: hp(0.3),
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.4),
  },
  dayText: {
    color: theme.colors.textLight,
    marginRight: 4, 
    alignSelf: 'center',
  },
  reviewTypeLabel: {
    color: '#FF0000', // Red color
    fontSize: hp(1.2),
    fontWeight: '500',
    marginTop: hp(0.2),
    alignSelf: 'center',
    lineHeight: hp(1.4),
  },
  suggestionsContainer: {
    marginBottom: hp(2),
    paddingHorizontal: wp(1.4),
    paddingTop: hp(1),
  },
  suggestionsTitle: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: hp(1.5),
    paddingLeft: wp(1),
  },
  suggestionsList: {
    paddingLeft: wp(1),
  },
  both: {
    flexDirection: 'row',
    gap: 10,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  offlineText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(0.8),
  },
  offlineSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  noPosts: {
    textAlign: 'center',
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    marginTop: hp(1),
  },
  // Pagination info styles
  paginationInfoContainer: {
    padding: hp(1.5),
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: hp(1),
    marginBottom: hp(1),
    marginHorizontal: wp(4),
  },
  paginationText: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
  },
});