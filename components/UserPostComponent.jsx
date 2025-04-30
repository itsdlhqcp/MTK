import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { NetworkUtils } from '../utils/network';
import moment from 'moment/moment';
import Icon from '../assets/icons';
import MLoading from '../components/MaterialLoader';
import FeedLoader from '../components/FeedLoader';
import { getSupabaseFileUrl } from '../services/imageService';
import { fetchTwists } from '../services/homeService';
import { hp, wp } from '../helpers/common';
import RenderHtml from 'react-native-render-html';
import { router } from 'expo-router';

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

const UserPostsComponent = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // Default to grid view
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10); // Initialize limit with a constant value
  const [lastFetchCount, setLastFetchCount] = useState(0); // Track the last fetch count

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
      getPosts(true); // Pass true to indicate initial load
    }
  }, [initialCheckDone]);

  const getPosts = async (isInitialLoad = false) => {
    // Don't fetch if we know there's no more data
    if (!isInitialLoad && !hasMore) return;
    
    // Set appropriate loading state
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      if (!isConnected) {
        console.log('Skipping fetch - device is offline');
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      
      // For initial load, start with default limit
      // For load more, increase the limit
      const currentLimit = isInitialLoad ? 10 : limit + 10;
      console.log('fetching posts with limit:', currentLimit);
      
      let res = await fetchTwists(currentLimit, user.id);
      
      if (res.success) {
        setPosts(res.data);
        setLimit(currentLimit); // Update limit state
        
        // Determine if there's more data to load
        // If the current result count equals the previous result count, we've reached the end
        if (!isInitialLoad && lastFetchCount === res.data.length) {
          setHasMore(false);
        }
        
        // Store current count for next comparison
        setLastFetchCount(res.data.length);
        
        // Update pagination info
        const pageSize = 10;
        setCurrentPage(Math.ceil(res.data.length / pageSize));
        setTotalPages(Math.max(1, Math.ceil(res.data.length / pageSize)));
        
        // If we received fewer items than requested, we've reached the end
        if (res.data.length < currentLimit) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    if (isConnected) {
      // Reset pagination state
      setLimit(10);
      setHasMore(true);
      setLastFetchCount(0);
      getPosts(true);
    }
  }, [isConnected]);

  // Load more data when reaching end of list
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && isConnected) {
      getPosts(false);
    }
  }, [hasMore, loadingMore, isConnected]);

  // Group posts by month - useMemo for performance
  const groupedPosts = useMemo(() => {
    const grouped = {};
    
    posts.forEach(post => {
      const monthYear = moment(post.created_at).format('MMMM YYYY');
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(post);
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
  }, [posts]);

  // Flatten data for FlatList with headers
  const flatListData = useMemo(() => {
    return groupedPosts.reduce((acc, group) => {
      return [
        ...acc,
        { month: group.month, id: `header-${group.month}`, isHeader: true },
        ...group.data
      ];
    }, []);
  }, [groupedPosts]);

  // Navigate to release details screen
  const handleViewPost = (item) => {
    if (!item?.id) return null;
    
    // Call your navigation logic here
    console.log("Viewing post:", item.id);
    // Example navigation
    router.push({ 
      pathname: 'postDetails', 
      params: { postId: item.id } 
    });
  };
  
  // Toggle view mode between list and grid
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
  };
  
  // Extract day of month from date
  const extractDay = (dateString) => {
    return moment(dateString).format('D');
  };
  
  // Extract month abbreviation from date
  const extractMonth = (dateString) => {
    return moment(dateString).format('MMM');
  };

  // Render list view item or header
  const renderListItem = ({ item, index }) => {
    const isFirstHeader = flatListData.findIndex(i => i.isHeader) === index;
    
    // Render header if isHeader is true
    if (item.isHeader) {
      return <MonthHeader month={item.month} viewMode={viewMode} onToggleView={toggleViewMode} isFirstHeader={isFirstHeader} />;
    }

    const monName = extractMonth(item.created_at);
    const day = extractDay(item.created_at);
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.cardContainer}>
          {/* Main content area */}
          <View style={styles.contentContainer}>
            <TouchableOpacity 
              style={styles.movieHeaderContainer}
              onPress={() => handleViewPost(item)}
            >
              {/* Post information section */}
              <View style={styles.movieInfoContainer}>
                {/* User profile image */}
                {item.user?.image && (
                  <Image
                    source={getSupabaseFileUrl(item.user.image)}
                    style={styles.posterImage}
                    contentFit='cover'
                  />
                )}
                
                {/* Title and content */}
                <View style={styles.titleContainer}>
                  <View style={styles.both}>
                    {item.user?.name && (
                      <View style={styles.titleHtmlContainer}>
                        <Text style={styles.userNameText}>{item.user.name}</Text>
                      </View>
                    )}

                    {item.verified && (
                      <TouchableOpacity activeOpacity={0.7}>
                        <Icon 
                          name='heart' 
                          size={15} 
                          fill="#FF375F" 
                          strokeWidth={1.4} 
                          color="#121212"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.dayContainer}>
                  <Text style={styles.dayText}>{monName}</Text>
                  <Text style={styles.dayText}>{day}</Text> 
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Post body content */}
            {item?.body && (
                <RenderHtml
                   contentWidth={wp(90)}
                   source={{ html: item.body }}
                   tagsStyles={titleTagsStyles}
                />
            )}
            
            {/* Image if available */}
            {item?.file && (
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
        {item.map((post, index) => (
          <TouchableOpacity
            key={`grid-item-${post.id || index}`}
            style={styles.gridItem}
            onPress={() => handleViewPost(post)}
          >
            {post.file ? (
              <Image
                source={getSupabaseFileUrl(post.file)}
                style={styles.gridItemImage}
                contentFit='cover'
              />
            ) : (
              <View style={[styles.gridItemImage, styles.noImagePlaceholder]}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}
            
            {/* Add user name at the bottom center */}
            {/* <View style={styles.gridUserContainer}>
              <Text style={styles.gridUserText} numberOfLines={1}>
                {post.user?.name || 'User'}
              </Text>
            </View> */}
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

  // Empty component - handles offline state
  const renderEmptyComponent = () => {
    // When offline with no cached data
    if (!isConnected) {
      return (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>You're offline</Text>
          <Text style={styles.offlineSubText}>
            Connect to the internet to see your posts
          </Text>
        </View>
      );
    }
    
    // Regular empty state
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You haven't created any posts yet.</Text>
      </View>
    );
  };

  // Pagination info display
  const renderPaginationInfo = () => {
    if (posts.length === 0 || loading) return null;
    
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
        {loadingMore && <FeedLoader />}
        {!hasMore && posts.length > 0 && (
          <Text style={styles.noPosts}>End of posts!</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <MLoading />
        </View>
      ) : (
        <>
          {viewMode === 'list' ? (
            // List View with headers
            <FlatList
              key="list"
              data={flatListData}
              renderItem={renderListItem}
              keyExtractor={(item, index) => 
                item.isHeader ? `header-${item.month}` : `post-list-${item.id || index}`
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyComponent}
              ListFooterComponent={renderFooter}
              onRefresh={handleRefresh}
              refreshing={loading}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
            />
          ) : (
            // Grid View with month sections
            <FlatList
              key="grid"
              data={groupedPosts}
              renderItem={renderGridSection}
              keyExtractor={(item) => `month-section-${item.month}`}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyComponent}
              ListFooterComponent={renderFooter}
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

// Calculate item width for grid view (3 items per row)
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - (wp(4) * 2 + wp(2) * 2)) / 3;

// Styles for the component
const styles = {
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
  },
  loadingContainer: {
    padding: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(20),
  },
  listContainer: {
    padding: wp(2),
    paddingBottom: hp(10),
  },
  gridContainer: {
    padding: wp(2),
    paddingBottom: hp(10),
  },
  headerContainer: {
    marginBottom: hp(1.5),
    marginTop: hp(1),
  },
  headerPillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  headerPill: {
    backgroundColor: '#222222',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: hp(2),
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
  },
  toggleButton: {
    padding: hp(0.5),
  },
  gridSection: {
    marginBottom: hp(2),
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  gridItem: {
    width: itemWidth,
    height: itemWidth * 1.5,
   // borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#777777',
    fontSize: hp(1.5),
  },
  placeholderItem: {
    backgroundColor: 'transparent',
  },
  gridUserContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: hp(0.5),
  },
  gridUserText: {
    color: '#FFFFFF',
    fontSize: hp(1.4),
  },
  reviewCard: {
    backgroundColor: '#121212',
    borderRadius: 8,
    marginBottom: hp(1.5),
    overflow: 'hidden',
  },
  cardContainer: {
    padding: wp(3),
  },
  contentContainer: {
    gap: hp(1),
  },
  movieHeaderContainer: {
    marginBottom: hp(1),
  },
  movieInfoContainer: {
    flexDirection: 'row',
  },
  posterImage: {
    width: wp(6),
    height: wp(6),
    borderRadius: 6,
    marginRight: wp(2),
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  both: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleHtmlContainer: {
    flex: 1,
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1),
    flexDirection: 'row',
    gap: wp(1),
  },
  dayText: {
    color: '#FFFFFF',
    fontSize: hp(1.4),
    fontWeight: '500',
  },
  postMedia: {
    width: '100%',
    height: hp(25),
    borderRadius: 8,
  },
  emptyContainer: {
    padding: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#777777',
    fontSize: hp(1.8),
    textAlign: 'center',
  },
  offlineContainer: {
    padding: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: hp(2),
    fontWeight: '600',
    marginBottom: hp(1),
  },
  offlineSubText: {
    color: '#777777',
    fontSize: hp(1.6),
    textAlign: 'center',
  },
  paginationInfoContainer: {
    paddingVertical: hp(1),
    alignItems: 'center',
  },
  paginationText: {
    color: '#777777',
    fontSize: hp(1.4),
  },
  noPosts: {
    textAlign: 'center',
    padding: hp(2),
    color: '#777777',
  },
};

// Tags styles for displaying HTML content
const titleTagsStyles = {
  div: {
    color: 'white',
    fontSize: hp(1.6),
    textAlign: 'left',
    fontWeight: '600'
  },
  p: {
    color: 'white',
    fontSize: hp(2.5),
    textAlign: 'left',
    fontWeight: 'bold'
  }
};

export default UserPostsComponent;