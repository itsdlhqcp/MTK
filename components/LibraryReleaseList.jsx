import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Image, TouchableOpacity, Dimensions } from 'react-native';
import { fetchReleases } from '../services/releaseService';
import FeedLoader from '../components/FeedLoader';
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

const ITEMS_PER_PAGE = 8;

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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isConnected, setIsConnected] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
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

  useEffect(() => {
    if (searchQuery !== '') {
      setPage(1);
    }
  }, [searchQuery]);

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
          return [...prevReleases, ...newReleases];
        });
        
        setPage(prev => prev + 1);
      } else {
        Alert.alert('Error', 'Failed to fetch releases');
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
      Alert.alert('Error', 'Something went wrong while fetching releases');
    } finally {
      setLoading(false);
    }
  };

  const filteredReleases = useMemo(() => {
    if (!searchQuery) return releases;
    
    const lowerQuery = searchQuery.toLowerCase();
    return releases.filter(release => 
      (release.title && release.title.toLowerCase().includes(lowerQuery)) ||
      (release.description && release.description.toLowerCase().includes(lowerQuery)) ||
      (release.artist && release.artist.toLowerCase().includes(lowerQuery))
    );
  }, [releases, searchQuery]);

  // Group releases by month-year - useMemo for performance
  const groupedReleases = useMemo(() => {
    const grouped = {};
    
    filteredReleases.forEach(release => {
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
      .map(([monthYear, items]) => ({
        monthYear,
        data: items
      }));
  }, [filteredReleases]);

  // Handle card press
  const handleCardPress = (item) => {
    if (!item?.id) return null;
    router.push({ pathname: 'releaseInfo', params: { releaseId: item.id } });
  };

  // Render rating stars
  const renderRating = (item) => {
    if (!item?.defRating || item.defRating <= 0) return null;
    
    return (
      <View style={styles.gridRatingContainer}>
        <PratingStars 
          rating={item?.defRating} 
          showRatingText={false} 
          starSize={hp(1.6)}
        />
        <Text style={styles.gridRatingText}>{item?.defRating}/5</Text>
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
          {item?.file?.includes('postImage') ? (
            <Image
              source={getSupabaseFileUrl(item.file)}
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
                <Text style={styles.releaseDate}>
                  {createdAt || 'N/A'}
                </Text>
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
    if (!isConnected && filteredReleases.length === 0) {
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
    
    // Regular empty state
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.noMoreText}>
          {loading ? "Loading..." : 
          searchQuery ? "No matching releases found" : "No releases found!"}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    // if (filteredReleases.length === 0) return null;

    return (
      <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
        {loading && hasMore && isConnected && <FeedLoader />}
        {(!loading || !hasMore || !isConnected) && (
          <Text style={styles.noMoreText}>
            {!isConnected ? "You're offline" : 
             hasMore ? "" : "End of library"}
          </Text>
        )}
      </View>
    );
  };

  const handleEndReached = async () => {
    if (loading || !hasMore) return;
    const connected = await NetworkUtils.isConnected();
    if (connected && !searchQuery) {
      getAllReleases();
    }
  };

  return (
    <View style={styles.container}>
      {/* <Text style={styles.sectionTitle}>All Releases</Text> */}
      
      {(isConnected || filteredReleases.length > 0) ? (
        <FlatList
          data={groupedReleases}
          renderItem={renderGridSection}
          keyExtractor={(item) => `month-section-${item.monthYear}`}
           onEndReached={isConnected ? handleEndReached : null}
        //  onEndReached={getAllReleases}
          onEndReachedThreshold={0.01}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
         // onRefresh={isConnected ? getAllReleases : null}
          refreshing={loading}
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
});

// import React, { useEffect, useState, useMemo } from 'react';
// import { View, Text, StyleSheet, FlatList, Alert, Image } from 'react-native';
// import { fetchReleases } from '../services/releaseService';
// import ReleaseCard from '../components/RelesaeCard';
// import FeedLoader from '../components/FeedLoader';
// import { hp, wp } from '../helpers/common';
// import { useAuth } from '../contexts/AuthContext';
// import { useRouter } from 'expo-router';
// import { supabase } from '../lib/supabase';
// import { NetworkUtils } from '../utils/network';
// import Icon from '../assets/icons';

// const ITEMS_PER_PAGE = 8;

// const AllReleasesList = ({ searchQuery = '' }) => {
//   const { user } = useAuth();
//   const router = useRouter();
//   const [releases, setReleases] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [page, setPage] = useState(1);
//   const [isConnected, setIsConnected] = useState(true);
//   const [initialCheckDone, setInitialCheckDone] = useState(false);
  
//   // Check network status on mount
//   useEffect(() => {
//     const checkNetworkStatus = async () => {
//       const connected = await NetworkUtils.isConnected();
//       setIsConnected(connected);
//       setInitialCheckDone(true);
//     };
    
//     checkNetworkStatus();
    
//     // Set up network listener
//     const unsubscribe = NetworkUtils.initNetworkListener((connected) => {
//       setIsConnected(connected);
//       setInitialCheckDone(true);
//     });
    
//     return () => unsubscribe();
//   }, []);
  
//   // Handle initial data fetch - only when we know we're online
//   useEffect(() => {
//     if (initialCheckDone && isConnected) {
//       // Initial data fetch - only when online
//       getAllReleases();
      
//       // Set up Supabase real-time subscription - only when online
//       const releaseChannel = supabase
//         .channel('all-releases')
//         .on('postgres_changes',
//           { event: '*', schema: 'public', table: 'releases' },
//           handleReleaseEvent
//         )
//         .subscribe();
        
//       return () => {
//         supabase.removeChannel(releaseChannel);
//       };
//     }
//   }, [initialCheckDone, isConnected]); // Only run when network status is determined
  
//   // Handle real-time release updates
//   const handleReleaseEvent = (payload) => {
//     // Only process events when online
//     if (!isConnected) return;
    
//     // Handle new release
//     if (payload.eventType === 'INSERT') {
//       setReleases(prev => [payload.new, ...prev]);
//     }
    
//     // Handle release deletion
//     if (payload.eventType === 'DELETE' && payload.old.id) {
//       setReleases(prev => 
//         prev.filter(release => release.id !== payload.old.id)
//       );
//     }
    
//     // Handle release update
//     if (payload.eventType === 'UPDATE' && payload.new.id) {
//       setReleases(prev => {
//         // Check if it already exists
//         const exists = prev.some(r => r.id === payload.new.id);
//         if (exists) {
//           // Update existing
//           return prev.map(r => r.id === payload.new.id ? payload.new : r);
//         } else {
//           // Add new
//           return [payload.new, ...prev];
//         }
//       });
//     }
//   };

//   useEffect(() => {
//     if (searchQuery !== '') {
//       setPage(1);
//     }
//   }, [searchQuery]);

//   const getAllReleases = async () => {
//     if (!isConnected) {
//       console.log('Skipping fetch - device is offline');
//       return;
//     }
    
//     if (loading || !hasMore) return;
    
//     try {
//       console.log('Fetching releases - device is online');
//       setLoading(true);
//       const res = await fetchReleases(page * ITEMS_PER_PAGE);
      
//       if (res.success) {
//         const allReleases = res.data;
        
//         if (allReleases.length === 0 || allReleases.length < ITEMS_PER_PAGE) {
//           setHasMore(false);
//         }
        
//         setReleases(prevReleases => {
//           const newReleases = allReleases.filter(
//             newRelease => !prevReleases.some(
//               existingRelease => existingRelease.id === newRelease.id
//             )
//           );
//           return [...prevReleases, ...newReleases];
//         });
        
//         setPage(prev => prev + 1);
//       } else {
//         Alert.alert('Error', 'Failed to fetch releases');
//       }
//     } catch (error) {
//       console.error('Error fetching releases:', error);
//       Alert.alert('Error', 'Something went wrong while fetching releases');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredReleases = useMemo(() => {
//     if (!searchQuery) return releases;
    
//     const lowerQuery = searchQuery.toLowerCase();
//     return releases.filter(release => 
//       (release.title && release.title.toLowerCase().includes(lowerQuery)) ||
//       (release.description && release.description.toLowerCase().includes(lowerQuery)) ||
//       (release.artist && release.artist.toLowerCase().includes(lowerQuery))
//     );
//   }, [releases, searchQuery]);

//   const renderItem = ({ item }) => (
//     <ReleaseCard
//       item={item}
//       currentUser={user}
//       router={router}
//     />
//   );

//   const renderFooter = () => {
//     if (filteredReleases.length === 0) return null;

//     return (
//       <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
//         {loading && hasMore && isConnected && <FeedLoader />}
//         {(!loading || !hasMore || !isConnected) && (
//           <Text style={styles.noMoreText}>
//             {!isConnected ? "You're offline" : 
//              hasMore ? "" : "End of library"}
//           </Text>
//         )}
//       </View>
//     );
//   };
//   const handleEndReached = async () => {
//     const connected = await NetworkUtils.isConnected();
//     if (connected && !searchQuery) {
//       getAllReleases();
//     }
//   };

//   const renderEmptyComponent = () => {
//     if (!isConnected && filteredReleases.length === 0) {
//       return (
//         <View style={styles.offlineContainer}>
//            <Icon
//              name="noicon"
//              size={hp(10.5)} 
//              color="white" 
//            />
//           <Text style={styles.offlineText}>You're offline</Text>
//           <Text style={styles.offlineSubText}>
//             Connect to the internet to see the library
//           </Text>
//         </View>
//       );
//     }
    
//     return (
//       <View style={styles.emptyContainer}>
//         <Text style={styles.noMoreText}>
//           {loading ? "Loading..." : 
//           searchQuery ? "No matching releases found" : "No releases found!"}
//         </Text>
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.sectionTitle}>All Releases</Text>
      
//       {(isConnected || filteredReleases.length > 0) ? (
//         <FlatList
//           data={filteredReleases}
//           renderItem={renderItem}
//           keyExtractor={(item) => `release-${item.id}`}
//           onEndReached={isConnected ? handleEndReached : null}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={renderFooter}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContainer}
//           ListEmptyComponent={renderEmptyComponent}
//         />
//       ) : (
//         renderEmptyComponent()
//       )}
//     </View>
//   );
// };

// export default AllReleasesList;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: 'white',
//     marginHorizontal: 16,
//     marginBottom: 12,
//   },
//   listContainer: {
//     padding: 8,
//     paddingBottom: 20,
//   },
//   noMoreText: {
//     fontSize: 14,
//     textAlign: 'center',
//     color: '#666',
//     marginVertical: 10,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: 300,
//   },
//   offlineContainer: {
//      flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: 300,
//   },
//   offlineImage: {
//     width: wp(50),
//     height: wp(50),
//     marginBottom: hp(2),
//   },
//   offlineText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: hp(1),
//   },
//   offlineSubText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     paddingHorizontal: wp(10),
//   },
//   offlineBanner: {
//     backgroundColor: '#FF375F',
//     padding: hp(1),
//     alignItems: 'center',
//     marginBottom: hp(1),
//   },
//   offlineBannerText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
// });

// import React, { useEffect, useState, useMemo } from 'react';
// import { View, Text, StyleSheet, FlatList, Alert, Image } from 'react-native';
// import { fetchReleases } from '../services/releaseService';
// import ReleaseCard from '../components/RelesaeCard';
// import FeedLoader from '../components/FeedLoader';
// import { hp, wp } from '../helpers/common';
// import { useAuth } from '../contexts/AuthContext';
// import { useRouter } from 'expo-router';
// import { supabase } from '../lib/supabase';
// import { NetworkUtils } from '../utils/network';

// const ITEMS_PER_PAGE = 8;

// const AllReleasesList = ({ searchQuery = '' }) => {
//   const { user } = useAuth();
//   const router = useRouter();
//   const [releases, setReleases] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [page, setPage] = useState(1);
//   const [isConnected, setIsConnected] = useState(true);
  
//   // Set up network listener
//   useEffect(() => {
//     const unsubscribe = NetworkUtils.initNetworkListener(setIsConnected);
//     return () => unsubscribe();
//   }, []);
  
//   // Handle real-time release updates
//   const handleReleaseEvent = (payload) => {
//     // Handle new release
//     if (payload.eventType === 'INSERT') {
//       setReleases(prev => [payload.new, ...prev]);
//     }
    
//     // Handle release deletion
//     if (payload.eventType === 'DELETE' && payload.old.id) {
//       setReleases(prev => 
//         prev.filter(release => release.id !== payload.old.id)
//       );
//     }
    
//     // Handle release update
//     if (payload.eventType === 'UPDATE' && payload.new.id) {
//       setReleases(prev => {
//         // Check if it already exists
//         const exists = prev.some(r => r.id === payload.new.id);
//         if (exists) {
//           // Update existing
//           return prev.map(r => r.id === payload.new.id ? payload.new : r);
//         } else {
//           // Add new
//           return [payload.new, ...prev];
//         }
//       });
//     }
//   };

//   // Set up Supabase real-time subscription - only when online
//   useEffect(() => {
//     // Only subscribe to real-time updates when online
//     if (isConnected) {
//       const releaseChannel = supabase
//         .channel('all-releases')
//         .on('postgres_changes',
//           { event: '*', schema: 'public', table: 'releases' },
//           handleReleaseEvent
//         )
//         .subscribe();

//       // Initial data fetch - only when online
//       getAllReleases();

//       return () => {
//         supabase.removeChannel(releaseChannel);
//       };
//     }
//   }, [isConnected]); // Re-run when connection status changes

//   // Reset pagination when search query changes
//   useEffect(() => {
//     if (searchQuery !== '') {
//       setPage(1);
//       // Don't clear releases here to avoid UI flicker
//       // Just let the filtered results show
//     }
//   }, [searchQuery]);

//   const getAllReleases = async () => {
//     // Don't fetch if offline, loading, or no more items
//     if (!isConnected || loading || !hasMore) return;
    
//     try {
//       setLoading(true);
//       const res = await fetchReleases(page * ITEMS_PER_PAGE);
      
//       if (res.success) {
//         // No filtering for expired releases anymore - show all releases
//         const allReleases = res.data;
        
//         if (allReleases.length === 0 || allReleases.length < ITEMS_PER_PAGE) {
//           setHasMore(false);
//         }
        
//         setReleases(prevReleases => {
//           const newReleases = allReleases.filter(
//             newRelease => !prevReleases.some(
//               existingRelease => existingRelease.id === newRelease.id
//             )
//           );
//           return [...prevReleases, ...newReleases];
//         });
        
//         setPage(prev => prev + 1);
//       } else {
//         Alert.alert('Error', 'Failed to fetch releases');
//       }
//     } catch (error) {
//       console.error('Error fetching releases:', error);
//       Alert.alert('Error', 'Something went wrong while fetching releases');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter releases based on search query
//   const filteredReleases = useMemo(() => {
//     if (!searchQuery) return releases;
    
//     const lowerQuery = searchQuery.toLowerCase();
//     return releases.filter(release => 
//       // Adjust these fields based on your actual release object structure
//       (release.title && release.title.toLowerCase().includes(lowerQuery)) ||
//       (release.description && release.description.toLowerCase().includes(lowerQuery)) ||
//       (release.artist && release.artist.toLowerCase().includes(lowerQuery))
//     );
//   }, [releases, searchQuery]);

//   const renderItem = ({ item }) => (
//     <ReleaseCard
//       item={item}
//       currentUser={user}
//       router={router}
//     />
//   );

//   const renderFooter = () => {
//     if (filteredReleases.length === 0) return null;

//     return (
//       <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
//         {loading && hasMore && <FeedLoader />}
//         {(!loading || !hasMore) && (
//           <Text style={styles.noMoreText}>
//             {hasMore ? "" : "End of library"}
//           </Text>
//         )}
//       </View>
//     );
//   };

//   const renderEmptyComponent = () => {
//     // When offline with no cached data
//     if (!isConnected && filteredReleases.length === 0) {
//       return (
//         <View style={styles.offlineContainer}>
//           <Image 
//             source={require('../assets/images/iconsSvg/200.webp')} 
//             style={styles.offlineImage}
//             resizeMode="contain"
//           />
//           <Text style={styles.offlineText}>You're offline</Text>
//           <Text style={styles.offlineSubText}>
//             Connect to the internet to see the library
//           </Text>
//         </View>
//       );
//     }
    
//     // Regular empty state
//     return (
//       <View style={styles.emptyContainer}>
//         <Text style={styles.noMoreText}>
//           {loading ? "Loading..." : 
//           searchQuery ? "No matching releases found" : "No releases found!"}
//         </Text>
//       </View>
//     );
//   };

//   // Display offline banner at the top when offline
//   const renderOfflineBanner = () => {
//     if (!isConnected) {
//       return (
//         <View style={styles.offlineBanner}>
//           <Text style={styles.offlineBannerText}>Offline Mode</Text>
//         </View>
//       );
//     }
//     return null;
//   };

//   return (
//     <View style={styles.container}>
//       {renderOfflineBanner()}
//       <Text style={styles.sectionTitle}>All Releases</Text>
      
//       {/* Only render FlatList if we have data or we're online */}
//       {(isConnected || filteredReleases.length > 0) ? (
//         <FlatList
//           data={filteredReleases}
//           renderItem={renderItem}
//           keyExtractor={(item) => `release-${item.id}`}
//           onEndReached={isConnected && !searchQuery ? getAllReleases : null}
//           onEndReachedThreshold={0.5}
//           ListFooterComponent={renderFooter}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContainer}
//           ListEmptyComponent={renderEmptyComponent}
//         />
//       ) : (
//         renderEmptyComponent()
//       )}
//     </View>
//   );
// };

// export default AllReleasesList;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: 'white',
//     marginHorizontal: 16,
//     marginBottom: 12,
//   },
//   listContainer: {
//     padding: 8,
//     paddingBottom: 20,
//   },
//   noMoreText: {
//     fontSize: 14,
//     textAlign: 'center',
//     color: '#666',
//     marginVertical: 10,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: 300,
//   },
//   offlineContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: 300,
//   },
//   offlineImage: {
//     width: wp(50),
//     height: wp(50),
//     marginBottom: hp(2),
//   },
//   offlineText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: hp(1),
//   },
//   offlineSubText: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     paddingHorizontal: wp(10),
//   },
//   offlineBanner: {
//     backgroundColor: '#FF375F',
//     padding: hp(1),
//     alignItems: 'center',
//     marginBottom: hp(1),
//   },
//   offlineBannerText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
// });

// import React, { useEffect, useState, useMemo } from 'react';
// import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
// import { fetchReleases } from '../services/releaseService';
// import ReleaseCard from '../components/RelesaeCard';
// import FeedLoader from '../components/FeedLoader';
// import { hp, wp } from '../helpers/common';
// import { useAuth } from '../contexts/AuthContext';
// import { useRouter } from 'expo-router';
// import { supabase } from '../lib/supabase';

// const ITEMS_PER_PAGE = 8;

// const AllReleasesList = ({ searchQuery = '' }) => {
//   const { user } = useAuth();
//   const router = useRouter();
//   const [releases, setReleases] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [page, setPage] = useState(1);
  
//   // Handle real-time release updates
//   const handleReleaseEvent = (payload) => {
//     // Handle new release
//     if (payload.eventType === 'INSERT') {
//       setReleases(prev => [payload.new, ...prev]);
//     }
    
//     // Handle release deletion
//     if (payload.eventType === 'DELETE' && payload.old.id) {
//       setReleases(prev => 
//         prev.filter(release => release.id !== payload.old.id)
//       );
//     }
    
//     // Handle release update
//     if (payload.eventType === 'UPDATE' && payload.new.id) {
//       setReleases(prev => {
//         // Check if it already exists
//         const exists = prev.some(r => r.id === payload.new.id);
//         if (exists) {
//           // Update existing
//           return prev.map(r => r.id === payload.new.id ? payload.new : r);
//         } else {
//           // Add new
//           return [payload.new, ...prev];
//         }
//       });
//     }
//   };

//   // Set up Supabase real-time subscription
//   useEffect(() => {
//     const releaseChannel = supabase
//       .channel('all-releases')
//       .on('postgres_changes',
//         { event: '*', schema: 'public', table: 'releases' },
//         handleReleaseEvent
//       )
//       .subscribe();

//     // Initial data fetch
//     getAllReleases();

//     return () => {
//       supabase.removeChannel(releaseChannel);
//     };
//   }, []);

//   // Reset pagination when search query changes
//   useEffect(() => {
//     if (searchQuery !== '') {
//       setPage(1);
//       // Don't clear releases here to avoid UI flicker
//       // Just let the filtered results show
//     }
//   }, [searchQuery]);

//   const getAllReleases = async () => {
//     if (loading || !hasMore) return;
    
//     try {
//       setLoading(true);
//       const res = await fetchReleases(page * ITEMS_PER_PAGE);
      
//       if (res.success) {
//         // No filtering for expired releases anymore - show all releases
//         const allReleases = res.data;
        
//         if (allReleases.length === 0 || allReleases.length < ITEMS_PER_PAGE) {
//           setHasMore(false);
//         }
        
//         setReleases(prevReleases => {
//           const newReleases = allReleases.filter(
//             newRelease => !prevReleases.some(
//               existingRelease => existingRelease.id === newRelease.id
//             )
//           );
//           return [...prevReleases, ...newReleases];
//         });
        
//         setPage(prev => prev + 1);
//       } else {
//         Alert.alert('Error', 'Failed to fetch releases');
//       }
//     } catch (error) {
//       console.error('Error fetching releases:', error);
//       Alert.alert('Error', 'Something went wrong while fetching releases');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter releases based on search query
//   const filteredReleases = useMemo(() => {
//     if (!searchQuery) return releases;
    
//     const lowerQuery = searchQuery.toLowerCase();
//     return releases.filter(release => 
//       // Adjust these fields based on your actual release object structure
//       (release.title && release.title.toLowerCase().includes(lowerQuery)) ||
//       (release.description && release.description.toLowerCase().includes(lowerQuery)) ||
//       (release.artist && release.artist.toLowerCase().includes(lowerQuery))
//     );
//   }, [releases, searchQuery]);

//   const renderItem = ({ item }) => (
//     <ReleaseCard
//       item={item}
//       currentUser={user}
//       router={router}
//     />
//   );

//   const renderFooter = () => {
//     if (filteredReleases.length === 0) return null;

//     return (
//       <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
//         {loading && hasMore && <FeedLoader />}
//         {(!loading || !hasMore) && (
//           <Text style={styles.noMoreText}>
//             {hasMore ? "" : "End of library"}
//           </Text>
//         )}
//       </View>
//     );
//   };

//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.noMoreText}>
//         {loading ? "Loading..." : 
//          searchQuery ? "No matching releases found" : "No releases found!"}
//       </Text>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.sectionTitle}>All Releases</Text>
//       <FlatList
//         data={filteredReleases}
//         renderItem={renderItem}
//         keyExtractor={(item) => `release-${item.id}`}
//         onEndReached={searchQuery ? null : getAllReleases}
//         onEndReachedThreshold={0.5}
//         ListFooterComponent={renderFooter}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContainer}
//         ListEmptyComponent={renderEmptyComponent}
//       />
//     </View>
//   );
// };

// export default AllReleasesList;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: 'white',
//     marginHorizontal: 16,
//     marginBottom: 12,
//   },
//   listContainer: {
//     padding: 8,
//     paddingBottom: 20,
//   },
//   noMoreText: {
//     fontSize: 14,
//     textAlign: 'center',
//     color: '#666',
//     marginVertical: 10,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     minHeight: 300,
//   },
// });