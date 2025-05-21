import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { fetchAverageRating, fetchReleases, searchReleases } from '../services/releaseService';
import { hp, wp } from '../helpers/common';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { NetworkUtils } from '../utils/network';
import Icon from '../assets/icons';
import RenderHtml from 'react-native-render-html';
import moment from 'moment/moment';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabaseFileUrl } from '../services/imageService';
import theme from '../constants/theme';
import PratingStars from './pRatingStars';
import { useToast } from '../contexts/ToastContext';
import CustomDotIndicator from './CutomDotIndicator';

const ITEMS_PER_PAGE = 20;

// Month Header component with toggle button
const MonthHeader = ({ monthYear}) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerPillContainer}>
      <View style={styles.headerPill}>
        <Text style={styles.headerText}>{monthYear}</Text>
      </View>
    </View>
  </View>
);

// Helper function to chunk array into groups of specified size
function chunk(array, size) {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}

const AllReleasesList = ({ searchQuery = '' }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false); // Add search loading state
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [releaseRatings, setReleaseRatings] = useState({}); // Store ratings by release ID
  const [loadingRatings, setLoadingRatings] = useState({}); // Track loading state for each rating
  const [searchResults, setSearchResults] = useState([]); // Store search results separately
  const [isSearching, setIsSearching] = useState(false); // Track if we're in search mode
  
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
  
  // Handle initial data fetch - only when we know we're online
  useEffect(() => {
    if (initialCheckDone && isConnected) {
      // Initial data fetch - only when online
      getAllReleases();
      
      // Set up Supabase real-time subscription - only when online
      const releaseChannel = supabase
        .channel('all-releases')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'releases' },
          handleReleaseEvent
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(releaseChannel);
      };
    }
  }, [initialCheckDone, isConnected]); 

  // Handle search query changes
  useEffect(() => {
    // Reset states when search query changes
    if (searchQuery !== '') {
      setPage(1);
      setIsSearching(true);
      performSearch(searchQuery);
    } else {
      setIsSearching(false);
      // If exiting search, make sure we have regular data
      if (releases.length === 0) {
        getAllReleases();
      }
    }
  }, [searchQuery]);
  
  // Handle real-time release updates
  const handleReleaseEvent = (payload) => {
    // Only process events when online
    if (!isConnected) return;
    
    // Handle new release
    if (payload.eventType === 'INSERT') {
      setReleases(prev => [payload.new, ...prev]);
    }
    
    // Handle release deletion
    if (payload.eventType === 'DELETE' && payload.old.id) {
      setReleases(prev => 
        prev.filter(release => release.id !== payload.old.id)
      );
    }
    
    // Handle release update
    if (payload.eventType === 'UPDATE' && payload.new.id) {
      setReleases(prev => {
        // Check if it already exists
        const exists = prev.some(r => r.id === payload.new.id);
        if (exists) {
          // Update existing
          return prev.map(r => r.id === payload.new.id ? payload.new : r);
        } else {
          // Add new
          return [payload.new, ...prev];
        }
      });
    }
  };

  // New function to perform search
  const performSearch = async (query) => {
    if (!isConnected) {
      Alert.alert('Offline', 'Search is only available when online');
      return;
    }
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      const res = await searchReleases(query);
      
      if (res.success) {
        setSearchResults(res.data);
        
        // Fetch ratings for search results
        res.data.forEach(release => {
          fetchRatingForRelease(release);
        });
      } else {
        console.error('Search error:', res.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error during search:', error);
      Alert.alert('Search Error', 'Failed to perform search');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const getAllReleases = async () => {
    if (!isConnected || loading || !hasMore) return;
    
    try {
      console.log('Fetching releases - device is online');
      setLoading(true);
      
      const res = await fetchReleases(page * ITEMS_PER_PAGE);
      if (res.success) {
        const allReleases = res.data;
        
        if (allReleases.length === 0 || allReleases.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
        
        setReleases(prevReleases => {
          const newReleases = allReleases.filter(
            newRelease => !prevReleases.some(
              existingRelease => existingRelease.id === newRelease.id
            )
          );
          
          // Fetch average ratings for new releases
          newReleases.forEach(release => {
            fetchRatingForRelease(release);
          });
          
          return [...prevReleases, ...newReleases];
        });
        
        setPage(prev => prev + 1);
      } else {
        showToast('success', 'Failed to fetch releases!! - Network Problem');
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
      Alert.alert('Error', 'Something went wrong while fetching releases');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch the average rating for a single release
  const fetchRatingForRelease = async (release) => {
    if (!release?.id) return;
    
    // Don't fetch if already loading or if we already have the rating
    if (loadingRatings[release.id]) return;
    
    try {
      setLoadingRatings(prev => ({ ...prev, [release.id]: true }));
      const avgRating = await fetchAverageRating(release.id, release.sconnectedId);
      setReleaseRatings(prev => ({ ...prev, [release.id]: avgRating || 0 }));
    } catch (error) {
      console.error(`Error fetching rating for release ${release.id}:`, error);
    } finally {
      setLoadingRatings(prev => ({ ...prev, [release.id]: false }));
    }
  };

  // Use the appropriate data source based on whether we're searching or not
  const displayData = useMemo(() => {
    return isSearching ? searchResults : releases;
  }, [isSearching, searchResults, releases]);

  // Group releases by month-year - useMemo for performance
  const groupedReleases = useMemo(() => {
    const grouped = {};
    
    displayData.forEach(release => {
      // Use rDate or created_at for grouping
      const date = release.rDate || release.created_at;
      const monthYear = moment(date).format('MMMM YYYY');
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(release);
    });

    // Sort by latest month first
    return Object.entries(grouped)
      .sort((a, b) => {
        const dateA = moment(a[1][0].rDate || a[1][0].created_at);
        const dateB = moment(b[1][0].rDate || b[1][0].created_at);
        return dateB.diff(dateA);
      })
      .map(([monthYear, items]) => {
        // Sort items within each month group in ascending order by rDate
        const sortedItems = [...items].sort((a, b) => {
          const dateA = moment(a.rDate || a.created_at);
          const dateB = moment(b.rDate || b.created_at);
          return dateA.diff(dateB); // Ascending order (oldest to newest)
        });
        
        return {
          monthYear,
          data: sortedItems
        };
      });
  }, [displayData]);

  // Handle card press
  const handleCardPress = (item) => {
    if (!item?.id) return null;
    router.push({ 
      pathname: 'releaseInfo', 
      params: { 
        releaseId: item.id,
        lib: true  // Always set to true when coming from AllReleasesList
      } 
    });
  };

  // Render rating stars
  const renderRating = (item) => {
    // Use the fetched average rating if available, otherwise fall back to defRating
    const avgRating = releaseRatings[item?.id] !== undefined ? releaseRatings[item.id] : (item?.defRating || 0);
    const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
    const show = releaseAt && moment(item.rDate).isSameOrBefore(moment(), 'day');
    
    if (avgRating <= 0) return null;
    
    return (
      <View style={styles.gridRatingContainer}>
        

         {show ? ( 
                    <> <PratingStars 
                    rating={avgRating?.average} 
                    showRatingText={false} 
                    starSize={hp(1.6)}
                  />
                  <Text style={styles.gridRatingText}>{avgRating?.average}/5</Text></>
                           
                        ) : (
                          <Text style={styles.gridRatingText}></Text>
                )}
      </View>
    );
  };

  // Render a grid item (release card)
  const renderGridItem = (item) => {
    const createdAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';
    
    const titleTagsStyles = {
      div: {
        color: 'white',
        fontSize: hp(1.7),
        textAlign: 'left',
        fontWeight: '600'
      },
      b: {
        color: 'white',
        fontSize: hp(1.6),
        textAlign: 'left',
        fontWeight: 'bold'
      }
    };

    return (
      <TouchableOpacity
        style={styles.gridItemCard}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {item?.filel?.includes('postImage') ? (
            <Image
              source={getSupabaseFileUrl(item?.filel)}
              style={styles.postMedia}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.postMedia, styles.noImagePlaceholder]}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
          
          {/* Gradients for image overlay */}
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
            {/* Top section with rating */}
            <View style={styles.topContainer}>
              {renderRating(item)}
            </View>

            {/* Bottom section with title and date */}
            <View style={styles.bottomContainer}>
              <View style={styles.titleDateContainer}>
                {item?.body && (
                  <RenderHtml
                    contentWidth={wp(40)} // Narrower for grid
                    source={{ html: item.body }}
                    tagsStyles={titleTagsStyles}
                  />
                )}
                {/* <Text style={styles.releaseDate}>
                  {createdAt || 'N/A'}
                </Text> */}
              </View>
            </View>
          </View>
          
          {/* White horizontal line at the bottom */}
          <View style={styles.whiteLine} />
        </View>
      </TouchableOpacity>
    );
  };

  // Render a row of grid items (3 per row)
  const renderGridRow = ({ item }) => {
    return (
      <View style={styles.gridRow}>
        {item.map((release, index) => (
          <View key={`grid-item-${release.id || index}`} style={styles.gridItem}>
            {renderGridItem(release)}
          </View>
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
    
    return (
      <View style={styles.gridSection}>
        <MonthHeader 
          monthYear={item.monthYear} 
        />
        <FlatList
          data={chunk(item.data, 3)}
          renderItem={renderGridRow}
          keyExtractor={(rowItems, rowIndex) => 
            `row-${rowIndex}-${rowItems[0]?.id || 'empty'}`
          }
          scrollEnabled={false}
        />
      </View>
    );
  };

  // Empty component - handles offline state
  const renderEmptyComponent = () => {
    // When offline with no cached data
    if (!isConnected && displayData.length === 0) {
      return (
        <View style={styles.offlineContainer}>
          <Icon
            name="noicon"
            size={hp(10.5)} 
            color="white" 
          />
          <Text style={styles.offlineText}>You're offline</Text>
          <Text style={styles.offlineSubText}>
            Connect to the internet to see the library
          </Text>
        </View>
      );
    }
    
    // Search is loading
    if (isSearching && searchLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }
    
    // No search results
    if (isSearching && !searchLoading && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon
            name="search"
            size={hp(8)} 
            color="#666" 
          />
          <Text style={styles.noMoreText}>
            No results found for "{searchQuery}"
          </Text>
        </View>
      );
    }
    
    // Regular empty state
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.noMoreText}>
          {loading ? "" : "No releases found!"}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (displayData.length === 0) return null;

    return (
      <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
        {loading && hasMore && isConnected && !isSearching && <CustomDotIndicator size={6}/>}
        {(!loading || !hasMore || !isConnected || isSearching) && (
          <Text style={styles.noMoreText}>
            {!isConnected ? "You're offline" : 
             isSearching ? "End of search results" :
             hasMore ? "" : "End of library"}
          </Text>
        )}
      </View>
    );
  };

  const handleEndReached = async () => {
    if (loading || !hasMore || isSearching) return;
    const connected = await NetworkUtils.isConnected();
    if (connected) {
      getAllReleases();
    }
  };

  return (
    <View style={styles.container}>
      {(isConnected || displayData.length > 0) ? (
        <FlatList
          data={groupedReleases}
          renderItem={renderGridSection}
          keyExtractor={(item) => `month-section-${item.monthYear}`}
          onEndReached={isConnected && !isSearching ? handleEndReached : null}
          onEndReachedThreshold={0.01}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          refreshing={loading || searchLoading}
        />
      ) : (
        renderEmptyComponent()
      )}
    </View>
  );
};

export default AllReleasesList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    marginHorizontal: 16,
  },
  listContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  noMoreText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  offlineText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: hp(1),
  },
  offlineSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  headerContainer: {
    marginBottom: hp(1),
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
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.3),
    borderRadius: 20,
    marginVertical: hp(1),
  },
  headerText: {
    fontSize: hp(1.2),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  toggleButton: {
    padding: hp(0.5),
    position: 'absolute',
    right: wp(4),
  },
  gridSection: {
    marginBottom: hp(2),
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    paddingHorizontal: wp(1),
  },
  gridItem: {
    width: wp(30),
    height: hp(24),
    marginHorizontal: wp(0.5),
  },
  placeholderItem: {
    backgroundColor: 'transparent',
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
  // Grid item card styles
  gridItemCard: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  postMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
    justifyContent: 'space-between',
  },
  radialVignette: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  topContainer: {
    alignItems: 'flex-end',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: hp(0.1),
  },
  titleDateContainer: {
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  star: {
    fontSize: hp(1.8),
    marginRight: 1,
  },
  ratingText: {
    fontSize: hp(1.3),
    fontWeight: '500',
    color: theme.colors.ourgn || '#1ED760',
    marginLeft: wp(1),
  },
  releaseDate: {
    color: '#FFFFFF',
    fontSize: hp(1.4),
    marginTop: 4,
  },
  whiteLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridRatingContainer: {
    position: 'absolute',
    left: 0,
   right: 0,
    flexDirection: 'row',
   // backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  gridRatingText: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: '#00ac62',
    marginLeft: wp(1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(10),
  },
  loadingText: {
    color: 'white',
    fontSize: hp(2),
    marginTop: hp(2),
  },
});