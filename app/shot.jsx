import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import moment from 'moment';
import ScreenWrapper from '../components/ScreenWrapper';
import { fetchAllUserReviews } from '../services/ProfileTilesService';
import { wp, hp } from '../helpers/common';
import { useAuth } from '../contexts/AuthContext';
import theme from '../constants/theme';
import Icon from '@/assets/icons';
import { getSupabaseFileUrl } from '../services/imageService';
import PratingStars from '../components/pRatingStars';
import { NetworkUtils } from '../utils/network';
import SkeletonLoader from '../components/SkeletonLoader';

const ITEMS_PER_ROW = 5;
const PAGE_SIZE = 50; // Load more reviews for the shot view

const appLogo = require('../assets/images/appicontrans.png');

// Month Header component
const MonthHeader = ({ month }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerPillContainer}>
      <View style={styles.headerPill}>
        <Text style={styles.headerText}>{month}</Text>
      </View>
    </View>
  </View>
);

const ShotPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showHeaderForScreenshot, setShowHeaderForScreenshot] = useState(false);
  const contentRef = useRef(null);
  const targetUserId = params.userId || user?.id;

  // Check network status
  useEffect(() => {
    const checkNetworkStatus = async () => {
      const connected = await NetworkUtils.isConnected();
      setIsConnected(connected);
    };
    
    checkNetworkStatus();
    const unsubscribe = NetworkUtils.initNetworkListener(setIsConnected);
    
    return () => unsubscribe();
  }, []);

  // Load all reviews
  useEffect(() => {
    if (targetUserId && isConnected) {
      loadAllReviews();
    }
  }, [targetUserId, isConnected]);

  const loadAllReviews = useCallback(async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      if (!isConnected) {
        Alert.alert('Offline', 'Please connect to the internet to load reviews');
        setLoading(false);
        return;
      }

      // Load all reviews (multiple pages if needed)
      let allReviews = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore && currentPage <= 10) { // Limit to 10 pages to avoid infinite loops
        const result = await fetchAllUserReviews(targetUserId, currentPage, PAGE_SIZE);
        
        if (result.success && result.data && result.data.length > 0) {
          allReviews = [...allReviews, ...result.data];
          hasMore = result.pagination?.hasMore || false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      setReviews(allReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isConnected]);

  // Helper function to chunk array into groups of 5
  const chunk = useCallback((array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }, []);

  // Group reviews by month - useMemo for performance
  const groupedReviews = useMemo(() => {
    const grouped = {};
    
    reviews.forEach(review => {
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
  }, [reviews]);

  // Calculate item width for 5 items per row
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = wp(4) * 2; // Left and right padding
  const gapBetweenItems = wp(1.5) * (ITEMS_PER_ROW - 1); // Gaps between 5 items
  const itemWidth = (screenWidth - horizontalPadding - gapBetweenItems) / ITEMS_PER_ROW;

  // Render a row of grid items (5 per row)
  const renderGridRow = ({ item }) => {
    return (
      <View style={styles.gridRow}>
        {item.map((review, index) => (
          <View
            key={`grid-item-${review?.id || index}`}
            style={[
              styles.gridItem, 
              { width: itemWidth },
              index < item.length - 1 && styles.gridItemMargin
            ]}
          >
            {review.releasePoster ? (
              <Image
                source={getSupabaseFileUrl(review.releasePoster)}
                style={styles.gridItemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.gridItemImage, styles.noImagePlaceholder]}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}
            
            {/* Rating at the bottom */}
            {review.userRating > 0 && (
              <View style={styles.gridRatingContainer}>
                <PratingStars 
                  rating={review.userRating} 
                  showRatingText={false} 
                  starSize={hp(1.2)}
                />
                <Text style={styles.gridRatingText}>{review.userRating}/5</Text>
              </View>
            )}
          </View>
        ))}
        {/* Add placeholder items to fill the row if needed */}
        {Array.from({ length: ITEMS_PER_ROW - item.length }).map((_, index) => (
          <View 
            key={`placeholder-${index}`} 
            style={[
              styles.gridItem, 
              styles.placeholderItem, 
              { width: itemWidth },
              (item.length + index) < ITEMS_PER_ROW - 1 && styles.gridItemMargin
            ]} 
          />
        ))}
      </View>
    );
  };

  // Render grid section with header and rows
  const renderGridSection = ({ item, index }) => {
    return (
      <View style={styles.gridSection}>
        <MonthHeader month={item.month} />
        <FlatList
          data={chunk(item.data, ITEMS_PER_ROW)}
          renderItem={renderGridRow}
          keyExtractor={(item, index) => `row-${index}-${item[0]?.id || 'empty'}`}
          scrollEnabled={false}
        />
      </View>
    );
  };

  // Handle screenshot capture
  const handleCaptureScreenshot = useCallback(async () => {
    if (!contentRef.current) {
      Alert.alert('Error', 'Cannot capture screenshot');
      return;
    }

    setIsCapturing(true);
    try {
      // Show header for screenshot capture
      setShowHeaderForScreenshot(true);
      
      // Wait for header to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait a bit more for the UI to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      const uri = await captureRef(contentRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      // Hide header after screenshot
      setShowHeaderForScreenshot(false);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Sharing not available', 'Screenshot saved but sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      Alert.alert('Error', 'Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Film reflection animation for skeleton cards
  const FilmSkeletonCard = ({ width, style }) => {
    const reflectionAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(reflectionAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(reflectionAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const translateX = reflectionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width * 2, width * 2],
    });

    const opacity = reflectionAnim.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0, 0.6, 0.6, 0],
    });

    return (
      <View style={[styles.skeletonCardBase, { width }, style]}>
        <SkeletonLoader
          width="100%"
          height={hp(16)}
          borderRadius={4}
          style={styles.skeletonImage}
        />
        {/* Film reflection overlay */}
        <Animated.View
          style={[
            styles.filmReflection,
            {
              transform: [{ translateX }],
              opacity,
            },
          ]}
        />
      </View>
    );
  };

  // Render skeleton grid cards with film-type reflection animation
  const renderSkeletonGrid = () => {
    const screenWidth = Dimensions.get('window').width;
    const horizontalPadding = wp(4) * 2;
    const gapBetweenItems = wp(1.5) * (ITEMS_PER_ROW - 1);
    const itemWidth = (screenWidth - horizontalPadding - gapBetweenItems) / ITEMS_PER_ROW;
    const rows = 6; // Show 6 rows of skeleton cards

    return (
      <View style={styles.skeletonContainer}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <View key={`skeleton-row-${rowIndex}`} style={styles.skeletonRow}>
            {Array.from({ length: ITEMS_PER_ROW }).map((_, colIndex) => (
              <FilmSkeletonCard
                key={`skeleton-${rowIndex}-${colIndex}`}
                width={itemWidth}
                style={colIndex < ITEMS_PER_ROW - 1 && styles.skeletonCardMargin}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper bg="#000">
        <StatusBar barStyle="light-content" />
        
        {/* Header - excluded from screenshot */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrowLeft" size={hp(2.5)} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Skeleton grid with film-type reflection animation */}
        <View style={styles.contentContainer}>
          {renderSkeletonGrid()}
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="#000">
      <StatusBar barStyle="light-content" />
      
      {/* Header - excluded from screenshot */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrowLeft" size={hp(2.5)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content area - this will be captured in screenshot (header excluded) */}
      <View ref={contentRef} style={styles.contentContainer} collapsable={false}>
        {/* Header text for screenshot - only visible when capturing */}
        {showHeaderForScreenshot && (
          <View style={styles.shareHeader}>
            <Image source={appLogo} style={styles.appLogoImage} resizeMode="contain" />
            <Text style={styles.shareHeaderText}>
              Shared on <Text style={styles.plotText}>Plot</Text><Text style={styles.twistText}>Twist</Text>
            </Text>
          </View>
        )}

        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews found</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={groupedReviews}
              renderItem={renderGridSection}
              keyExtractor={(item) => `month-section-${item.month}`}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          </>
        )}
      </View>

      {/* Floating button - excluded from screenshot */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCaptureScreenshot}
        disabled={isCapturing || reviews.length === 0}
        activeOpacity={0.8}
      >
        {isCapturing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Icon name="camera" size={hp(3)} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

export default ShotPage;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: hp(0.5),
  },
  headerTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: hp(3.5), // Same width as back button to center the title
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 0, // Remove top padding for screenshot
    paddingBottom: hp(2),
    marginTop: 0, // Remove top margin for screenshot
    position: 'relative',
  },
  filmBorderTop: {
    height: 0, // Hidden - removed border styling
  },
  filmBorderBottom: {
    height: 0, // Hidden - removed border styling
  },
  shareHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0, // No top padding
    paddingBottom: hp(2),
    paddingHorizontal: wp(4),
    gap: hp(1),
    marginTop: 0, // No top margin
  },
  appLogoImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: 8,
  },
  shareHeaderText: {
    fontSize: hp(2.5),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  plotText: {
    color: '#E50914', // Red color from theme
  },
  twistText: {
    color: '#0066B1', // Blue color from theme
  },
  gridContainer: {
    paddingHorizontal: wp(1.4),
    paddingBottom: hp(10), // Extra padding for floating button
    paddingTop: 0, // Remove top padding to eliminate space
    zIndex: 1,
  },
  headerContainer: {
    marginBottom: hp(1),
    marginTop: 0, // Remove top margin for screenshot
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 1,
    paddingTop: 0, // Remove top padding for screenshot
    paddingBottom: hp(0.5),
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
    paddingVertical: hp(0.4),
    borderRadius: 20,
    marginTop: 0, // Remove top margin for screenshot
    marginBottom: hp(1),
  },
  headerText: {
    fontSize: hp(1.25),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  gridSection: {
    marginBottom: hp(2),
    marginTop: 0, // Remove top margin for screenshot
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: hp(1.5),
    paddingHorizontal: wp(2),
  },
  gridItem: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  gridItemMargin: {
    marginRight: wp(1.5),
  },
  placeholderItem: {
    backgroundColor: 'transparent',
  },
  gridItemImage: {
    width: '100%',
    height: hp(16),
    borderRadius: 4,
  },
  noImagePlaceholder: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: hp(1.2),
  },
  gridRatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: hp(0.3),
    paddingHorizontal: wp(1),
  },
  gridRatingText: {
    fontSize: hp(1.1),
    fontWeight: '500',
    color: theme.colors.ourgn,
    marginLeft: wp(0.5),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(20),
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: wp(4),
    paddingTop: 0,
    paddingBottom: hp(2),
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: hp(1.5),
  },
  skeletonCardBase: {
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonCardMargin: {
    marginRight: wp(1.5),
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
  },
  filmReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  floatingButton: {
    position: 'absolute',
    bottom: hp(3),
    alignSelf: 'center',
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

