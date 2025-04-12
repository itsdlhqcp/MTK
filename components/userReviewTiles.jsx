import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { fetchUserReviews, fetchUserDreviews } from '../services/ProfileTilesService';
import { wp, hp } from '../helpers/common';
import MLoading from '../components/MaterialLoader';
import { useAuth } from '../contexts/AuthContext'; 
import theme from '../constants/theme';
import moment from 'moment/moment';
import { router } from 'expo-router';
import Icon from '../assets/icons';
import RenderHtml from 'react-native-render-html';
import PratingStars from '../components/pRatingStars';
import { getSupabaseFileUrl } from '../services/imageService';

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

const UserReviewsComponent = ({ navigation }) => {
  const [combinedReviews, setCombinedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const { user } = useAuth();

  useEffect(() => {
    loadAllReviews();
  }, []);

  const loadAllReviews = async () => {
    setLoading(true);
    try {
      // Fetch both types of reviews concurrently
      const [reviewsResult, dreviewsResult] = await Promise.all([
        fetchUserReviews(user.id),
        fetchUserDreviews(user.id)
      ]);
      
      let allReviews = [];
      
      if (reviewsResult.success) {
        allReviews = [...allReviews, ...reviewsResult.data];
      } else {
        console.error('Failed to load reviews:', reviewsResult.msg);
      }
      
      if (dreviewsResult.success) {
        allReviews = [...allReviews, ...dreviewsResult.data];
      } else {
        console.error('Failed to load dreviews:', dreviewsResult.msg);
      }
      
      // Sort by created_at date, newest first
      allReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setCombinedReviews(allReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

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
  // const handleViewRelease = (item) => {
  //   router.push({pathname: 'ReleaseDetails', params: { releaseId: item?.id }});
  // };

  // Updated handleViewRelease function that detects whether the item is a stream or a release
const handleViewRelease = (item) => {
  if (!item?.releaseId) return null;
  
  // Check which table the data came from
  // For dpeopreviews (digital streams), the raw data uses stream: streams(...) relationship
  // For peoplesReview (physical releases), the raw data uses release: releases(...) relationship
  
  // Check if this item is from the dpeopreviews table (digital stream)
  const isStream = item.hasOwnProperty('original_table') 
        ? item.original_table === 'dpeopreviews'
        : item.hasOwnProperty('streamId');
        
      if (isStream) {
        router.push({ 
          pathname: 'streamPeopleSection/streamPeopleDetails', 
          params: { streamId: item.releaseId, reviewId: item.id } 
        });
      } else {
        router.push({ 
          pathname: 'releasePeopleSection/releasePeopleDetails', 
          params: { releaseId: item.releaseId, reviewId: item.id } 
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
  const renderListItem = ({ item , index }) => {

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

                      {item.favour  && (
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
                 {/* <Text style={styles.dayText}>{dayName}</Text> */}
                       <Text style={styles.dayText}>{monName}</Text>
                       <Text style={styles.dayText}>{day}</Text> 
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
            key={`grid-item-${review.id || index}`}
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
  const renderGridSection = ({ item , index }) => {
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

  // Empty component for both views
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>You haven't posted any reviews yet.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <MLoading />
        </View>
      ) : (
        viewMode === 'list' ? (
          // List View with headers (Format 1)
          <FlatList
            key="list"
            data={flatListData}
            renderItem={renderListItem}
            keyExtractor={(item, index) => 
              item.isHeader ? `header-${item.month}` : `review-list-${item.id || index}`
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            onRefresh={loadAllReviews}
            refreshing={loading}
          />
        ) : (
          // Grid View with headers (Format 2)
          <FlatList
            key="grid"
            data={groupedReviews}
            renderItem={renderGridSection}
            keyExtractor={(item) => `month-section-${item.month}`}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            onRefresh={loadAllReviews}
            refreshing={loading}
          />
        )
      )}
    </View>
  );
};

export default UserReviewsComponent;

// HTML tag styles for RenderHtml for body content
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

// New HTML tag styles for RenderHtml for title content
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
    marginBottom: hp(1),
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
    fontSize: hp(1.6),
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
    color: theme.colors.primary,
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
    color: theme.colors.primary,
    marginLeft: wp(1),
  },
  dayContainer: {
    paddingTop: hp(0.8),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100%',
  },
  dayText: {
    color: theme.colors.textLight,
    marginRight: 4, 
    alignSelf: 'center',
  },
  both: {
    flexDirection: 'row',
    gap: 10,
  }
});














// import React, { useState, useEffect, useMemo } from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
// import { fetchUserReviews, fetchUserDreviews } from '../services/ProfileTilesService';
// import { wp, hp } from '../helpers/common';
// import MLoading from '../components/MaterialLoader';
// import { useAuth } from '../contexts/AuthContext'; 
// import theme from '../constants/theme';
// import moment from 'moment/moment';
// import { router } from 'expo-router';
// import Icon from '../assets/icons'
// import RenderHtml from 'react-native-render-html';
// import PratingStars from '../components/pRatingStars';
// import { getSupabaseFileUrl } from '../services/imageService';

// // Modified Month Header component with toggle button
// const MonthHeader = ({ month, viewMode, onToggleView, isFirstHeader }) => (
//   <View style={styles.headerContainer}>
//     <View style={styles.headerPillContainer}>
//       <View style={styles.headerPill}>
//         <Text style={styles.headerText}>{month}</Text>
//       </View>
//       {/* Toggle button now inside the month header */}

//       {isFirstHeader && (
//          <TouchableOpacity 
//          style={styles.toggleButton} 
//          onPress={onToggleView}
//        >
//          <Icon 
//            name={viewMode === 'grid' ? 'list' : 'grid'} 
//            size={hp(2.6)} 
//            color="#FFFFFF" 
//          />
//        </TouchableOpacity>
//       )}
//     </View>
//   </View>
// );

// const UserReviewsComponent = ({ navigation }) => {
//   const [combinedReviews, setCombinedReviews] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
//   const { user } = useAuth();

//   useEffect(() => {
//     loadAllReviews();
//   }, []);

//   const loadAllReviews = async () => {
//     setLoading(true);
//     try {
//       // Fetch both types of reviews concurrently
//       const [reviewsResult, dreviewsResult] = await Promise.all([
//         fetchUserReviews(user.id),
//         fetchUserDreviews(user.id)
//       ]);
      
//       let allReviews = [];
      
//       if (reviewsResult.success) {
//         allReviews = [...allReviews, ...reviewsResult.data];
//       } else {
//         console.error('Failed to load reviews:', reviewsResult.msg);
//       }
      
//       if (dreviewsResult.success) {
//         allReviews = [...allReviews, ...dreviewsResult.data];
//       } else {
//         console.error('Failed to load dreviews:', dreviewsResult.msg);
//       }
      
//       // Sort by created_at date, newest first
//       allReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//       setCombinedReviews(allReviews);
//     } catch (error) {
//       console.error('Error loading reviews:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Group reviews by month - useMemo for performance
//   const groupedReviews = useMemo(() => {
//     const grouped = {};
    
//     combinedReviews.forEach(review => {
//       const monthYear = moment(review.created_at).format('MMMM YYYY');
//       if (!grouped[monthYear]) {
//         grouped[monthYear] = [];
//       }
//       grouped[monthYear].push(review);
//     });

//     // Sort by latest month first
//     return Object.entries(grouped)
//       .sort((a, b) => {
//         const dateA = moment(a[1][0].created_at);
//         const dateB = moment(b[1][0].created_at);
//         return dateB.diff(dateA);
//       })
//       .map(([month, items]) => ({
//         month,
//         data: items
//       }));
//   }, [combinedReviews]);

//   // Flatten data for FlatList with headers
//   const flatListData = useMemo(() => {
//     return groupedReviews.reduce((acc, group) => {
//       return [
//         ...acc,
//         { month: group.month, id: `header-${group.month}`, isHeader: true },
//         ...group.data
//       ];
//     }, []);
//   }, [groupedReviews]);

//   const handleViewRelease = (item) => {
//     // Navigate to release details screen
//     router.push({pathname: 'ReleaseDetails', params: { releaseId: item?.id }});
//   };
  
//   // Toggle view mode between list and grid
//   const toggleViewMode = () => {
//     setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
//   };
  
//   // Extract day of month from date
//   const extractDay = (dateString) => {
//     return moment(dateString).format('D');
//   };
  
//   // Extract year from release date
//   const extractYear = (releaseDate) => {
//     return releaseDate ? moment(releaseDate).format('YYYY') : '';
//   };

//   // Render list view item (Format 1) or header
//   const renderListItem = ({ item , index }) => {

//     const isFirstHeader = flatListData.findIndex(i => i.isHeader) === index;
    
//     // Render header if isHeader is true
//     if (item.isHeader) {
//       return <MonthHeader month={item.month} viewMode={viewMode} onToggleView={toggleViewMode} isFirstHeader={isFirstHeader} />;
//     }

//     const monName = moment(item.created_at).format('MMM');
    
//     // Get day from created_at date for the left number
//     const day = extractDay(item.created_at);
//     // Get year from release date for displaying after title
//     const year = extractYear(item.releaseDate);
    
//     return (
//       <View style={styles.reviewCard}>
//         <View style={styles.cardContainer}>
//           {/* Main content area */}
//           <View style={styles.contentContainer}>
//             <TouchableOpacity 
//               style={styles.movieHeaderContainer}
//               onPress={() => handleViewRelease(item)}
//             >
//               {/* Movie poster and title section */}
//               <View style={styles.movieInfoContainer}>
//                 {/* Movie poster */}
//                 {item.releasePoster && (
//                   <Image
//                     source={getSupabaseFileUrl(item.releasePoster)}
//                     style={styles.posterImage}
//                     contentFit='cover'
//                   />
//                 )}
                
//                 {/* Title and year - now using RenderHtml for title (releaseBody) */}
//                 <View style={styles.titleContainer}>
//                   {/* Modified section: Using RenderHtml for the title instead of Text */}

//                   <View style={styles.both}>
                    
//                       {item.releaseBody && (
//                         <View style={styles.titleHtmlContainer}>
//                           <RenderHtml
//                             contentWidth={wp(60)}
//                             source={{html: item.releaseBody}}
//                             tagsStyles={titleTagsStyles}
//                           />
//                         </View>
//                       )}

//                       {item.favour  && (
//                                         <TouchableOpacity activeOpacity={0.7}>
//                                         <Icon 
//                                           name='heart' 
//                                           size={15} 
//                                           fill={theme.colors.bmw} 
//                                           strokeWidth={1.4} 
//                                           color={theme.colors.dark}
//                                         />
//                                     </TouchableOpacity>
//                                         )}
//                      </View>
                  
                  
//                   {/* Rating stars and popcorn */}
//                   {item.userRating > 0 && (
//                     <View style={styles.ratingContainer}>
//                       <PratingStars 
//                         rating={item.userRating} 
//                         showRatingText={false} 
//                         starSize={hp(1.8)}
//                       />
//                       <Text style={styles.ratingtext}>{item.userRating}/5</Text>
//                       {item?.popCorn && (
//                         <View style={styles.popcornContainer}>
//                           <Icon name="popcorn" size={hp(2)} color="#FFD700" />
//                         </View>
//                       )}
//                     </View>
//                   )}
//                 </View>
                
//                 {/* Menu icon */}
//                 {/* <TouchableOpacity style={styles.menuButton}>
//                   <Icon name="menu" size={hp(2)} color="#BDBDBD" /> dayName
//                 </TouchableOpacity> */}
//                    {/* <View style={styles.dayContainer}>
//                        <Text style={styles.dayText}>{day}</Text>
//                     </View> */}

//                   {/* <View style={styles.dayContainer}>
//                        <Text style={styles.dayText}>{day}</Text>
//                     </View> */}

//             <View style={styles.dayContainer}>
//                  {/* <Text style={styles.dayText}>{dayName}</Text> */}
//                        <Text style={styles.dayText}>{monName}</Text>
//                        <Text style={styles.dayText}>{day}</Text> 
//               </View>

//               </View>
//             </TouchableOpacity>
            
//             {/* Review body content */}
//             {item?.body && (
//               <View style={styles.reviewContent}>
//                 <RenderHtml
//                   contentWidth={wp(80)}
//                   source={{html: item.body}}
//                   tagsStyles={tagsStyles}
//                 />
//               </View>
//             )}
            
//             {/* Image if available */}
//             {item?.file?.includes('postImage') && (
//               <Image
//                 source={getSupabaseFileUrl(item.file)} 
//                 transition={100}
//                 style={styles.postMedia}
//                 contentFit='cover'
//               />
//             )}
//           </View>
//         </View>
//       </View>
//     );
//   };

//   // Grid view - Render individual item
//   // const renderGridItem = ({ item }) => {
//   //   return (
//   //     <TouchableOpacity
//   //       style={styles.gridItem}
//   //       onPress={() => handleViewRelease(item)}
//   //     >
//   //       {item.releasePoster ? (
//   //         <Image
//   //           source={getSupabaseFileUrl(item.releasePoster)}
//   //           style={styles.gridItemImage}
//   //           contentFit='cover'
//   //         />
//   //       ) : (
//   //         <View style={[styles.gridItemImage, styles.noImagePlaceholder]}>
//   //           <Text style={styles.noImageText}>No Image</Text>
//   //         </View>
//   //       )}
//   //     </TouchableOpacity>
//   //   );
//   // };

//   // Process data for SectionList (grid view)
//   // const gridSections = useMemo(() => {
//   //   return groupedReviews.map(group => ({
//   //     month: group.month,
//   //     data: chunk(group.data, 3) // Split data into chunks of 3 for proper row rendering
//   //   }));
//   // }, [groupedReviews]);

//   // Helper function to chunk array into groups of specified size
//   function chunk(array, size) {
//     const chunked = [];
//     for (let i = 0; i < array.length; i += size) {
//       chunked.push(array.slice(i, i + size));
//     }
//     return chunked;
//   }

// // Render a row of grid items (3 per row)
// const renderGridRow = ({ item }) => {
//     return (
//       <View style={styles.gridRow}>
//         {item.map((review, index) => (
//           <TouchableOpacity
//             key={`grid-item-${review.id || index}`}
//             style={styles.gridItem}
//             onPress={() => handleViewRelease(review)}
//           >
//             {review.releasePoster ? (
//               <Image
//                 source={getSupabaseFileUrl(review.releasePoster)}
//                 style={styles.gridItemImage}
//                 contentFit='cover'
//               />
//             ) : (
//               <View style={[styles.gridItemImage, styles.noImagePlaceholder]}>
//                 <Text style={styles.noImageText}>No Image</Text>
//               </View>
//             )}
            
//             {/* Add rating stars at the bottom center */}
//             {review.userRating > 0 && (
//               <View style={styles.gridRatingContainer}>
//                 <PratingStars 
//                   rating={review.userRating} 
//                   showRatingText={false} 
//                   starSize={hp(1.6)}
//                 />
//                 <Text style={styles.gridRatingText}>{review.userRating}/5</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         ))}
//         {/* Add placeholder items to fill the row if needed */}
//         {item.length === 1 && (
//           <>
//             <View style={[styles.gridItem, styles.placeholderItem]} />
//             <View style={[styles.gridItem, styles.placeholderItem]} />
//           </>
//         )}
//         {item.length === 2 && (
//           <View style={[styles.gridItem, styles.placeholderItem]} />
//         )}
//       </View>
//     );
//   };

//   // Grid section with header and rows
//   const renderGridSection = ({ item , index }) => {
//     const isFirstHeader = index === 0;
//     return (
//       <View style={styles.gridSection}>
//         <MonthHeader month={item.month} viewMode={viewMode} onToggleView={toggleViewMode} isFirstHeader={isFirstHeader} />
//         <FlatList
//           data={chunk(item.data, 3)}
//           renderItem={renderGridRow}
//           keyExtractor={(item, index) => `row-${index}-${item[0]?.id || 'empty'}`}
//           scrollEnabled={false}
//         />
//       </View>
//     );
//   };

//   // Empty component for both views
//   const renderEmptyComponent = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>You haven't posted any reviews yet.</Text>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <MLoading />
//         </View>
//       ) : (
//         viewMode === 'list' ? (
//           // List View with headers (Format 1)
//           <FlatList
//             key="list"
//             data={flatListData}
//             renderItem={renderListItem}
//             keyExtractor={(item, index) => 
//               item.isHeader ? `header-${item.month}` : `review-list-${item.id || index}`
//             }
//             contentContainerStyle={styles.listContainer}
//             showsVerticalScrollIndicator={false}
//             ListEmptyComponent={renderEmptyComponent}
//             onRefresh={loadAllReviews}
//             refreshing={loading}
//           />
//         ) : (
//           // Grid View with headers (Format 2)
//           <FlatList
//             key="grid"
//             data={groupedReviews}
//             renderItem={renderGridSection}
//             keyExtractor={(item) => `month-section-${item.month}`}
//             contentContainerStyle={styles.gridContainer}
//             showsVerticalScrollIndicator={false}
//             ListEmptyComponent={renderEmptyComponent}
//             onRefresh={loadAllReviews}
//             refreshing={loading}
//           />
//         )
//       )}
//     </View>
//   );
// };

// // HTML tag styles for RenderHtml for body content
// const tagsStyles = {
//   body: {
//     color: '#333333',
//     fontSize: hp(1.7),
//     lineHeight: hp(2.4),
//   },
//   p: {
//     marginBottom: hp(1),
//   },
// };

// // New HTML tag styles for RenderHtml for title content
// const titleTagsStyles = {
//   body: {
//     color: '#FFFFFF',
//     fontSize: hp(1.8),
//     fontWeight: '600',
//     display: 'flex',
//     flexDirection: 'row',
//   },
//   p: {
//     margin: 0,
//     padding: 0,
//   },
// };

// // Calculate item width for grid view (3 items per row)
// const screenWidth = Dimensions.get('window').width;
// const itemWidth = (screenWidth - (wp(4) * 2 + wp(2) * 2)) / 3;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: hp(16),
//   },
//   listContainer: {
//     paddingHorizontal: wp(1.4),
//     paddingVertical: hp(1),
//   },
//   gridContainer: {
//     paddingHorizontal: wp(1.4),
//     paddingVertical: hp(1),
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: hp(30),
//   },
//   emptyText: {
//     fontSize: hp(1.8),
//     color: theme.colors.textLight,
//     textAlign: 'center',
//   },
//   // List view styles
//   reviewCard: {
//     marginBottom: hp(1),
//     backgroundColor: '#111',
//     borderRadius: 0,
//   },
//   cardContainer: {
//     flexDirection: 'row',
//     width: '100%',
//     paddingHorizontal: wp(2),
//   },
//   contentContainer: {
//     flex: 1,
//     paddingVertical: hp(1.5),
//     paddingRight: wp(2),
//   },
//   headerContainer: {
//     marginBottom: hp(1),
//     backgroundColor: 'transparent',
//     alignItems: 'center',
//     zIndex: 1,
//     paddingVertical: hp(0.5),
//   },
//   headerPillContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     position: 'relative',
//     width: '100%',
//   },
//   movieHeaderContainer: {
//     marginBottom: hp(1),
//   },
//   headerPill: {
//     backgroundColor: '#424242',
//     paddingHorizontal: wp(4),
//     paddingVertical: hp(0.4),
//     borderRadius: 20,
//     marginVertical: hp(1),
//   },
//   headerText: {
//     fontSize: hp(1.6),
//     fontWeight: '600',
//     color: '#fff',
//     textAlign: 'center',
//   },
//   toggleButton: {
//     padding: hp(0.5),
//     position: 'absolute',
//     right: wp(4),
//   },
//   movieInfoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   posterImage: {
//     width: wp(12),
//     height: hp(7),
//     borderRadius: 4,
//     marginRight: wp(2),
//   },
//   titleContainer: {
//     flex: 1,
//   },
//   titleHtmlContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: hp(0.5),
//   },
//   popcornContainer: {
//     marginLeft: wp(1),
//   },
//   menuButton: {
//     padding: wp(1),
//   },
//   reviewContent: {
//     marginTop: hp(0.5),
//   },
//   postMedia: {
//     width: '100%',
//     height: hp(20),
//     borderRadius: 4,
//     marginTop: hp(1),
//   },
//   // Grid view styles
//   gridSection: {
//     marginBottom: hp(2),
//   },
//   gridRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: hp(1),
//     paddingHorizontal: wp(2),
//   },
//   gridItem: {
//     width: itemWidth,
//     height: hp(20),
//     borderRadius: 4,
//     overflow: 'hidden',
//   },
//   placeholderItem: {
//     backgroundColor: 'transparent',
//   },
//   gridItemImage: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 4,
//   },
//   noImagePlaceholder: {
//     backgroundColor: '#222',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   noImageText: {
//     color: '#999',
//     fontSize: hp(1.5),
//   },
//   ratingtext: {
//     fontSize: hp(1.6),
//     fontWeight: '500',
//     color: theme.colors.primary,
//   },
//   // Add these to your styles object
// gridRatingContainer: {
//     position: 'absolute',
//     bottom: hp(0),
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     paddingVertical: hp(0.5),
//   },
//   gridRatingText: {
//     fontSize: hp(1.4),
//     fontWeight: '500',
//     color: theme.colors.primary,
//     marginLeft: wp(1),
//   },
//   dayContainer: {
//     paddingTop: hp(0.8),
//     display: 'flex',
//     flexDirection: 'row',
//     alignItems: 'center', 
//     justifyContent: 'center', // For vertical centering
//     height: '100%', // Make it take full height of the parent
//   },
//   dayText: {
//     color: theme.colors.textLight,
//     marginRight: 4, 
//     alignSelf: 'center',
//   },
//   both: {
//     flexDirection: 'row',
//     gap: 10,
//   }
// });

// export default UserReviewsComponent;