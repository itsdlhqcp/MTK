import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { wp, hp } from '@/helpers/common';
import theme from '../constants/theme';
import { fetchLatestReviews } from '../services/ProfileTilesService';
import { useRouter } from 'expo-router';
import { getSupabaseFileUrl } from '../services/imageService';
import SkeletonLoader from './SkeletonLoader';

// Global cache to share data across all component instances
let globalReviewsCache = {
  data: null,
  loading: false,
  hasLoaded: false
};

const ReviewCard = memo(({ review }) => {
  const router = useRouter();
  
  const handleCardPress = () => {
    if (!review?.releaseId) return;
    
    // Check if this is a digital/stream review or theatre review
    const isStream = review.original_table === 'dpeopreviews';
    
    if (isStream) {
      router.push({ 
        pathname: 'streamPeopleSection/streamPeopleDetails', 
        params: { streamId: review.releaseId, reviewId: review.id } 
      });
    } else {
      router.push({ 
        pathname: 'releasePeopleSection/releasePeopleDetails', 
        params: { releaseId: review.releaseId, reviewId: review.id } 
      });
    }
  };

  const getReviewTypeLabel = () => {
    if (review.reviewType === 'series') return 'SERIES';
    if (review.reviewType === 'digital') return 'DIGITAL';
    if (review.reviewType === 'theatre') return 'THEATRE';
    return review.original_table === 'peoplesReview' ? 'THEATRE' : 'DIGITAL';
  };

  return (
    <TouchableOpacity 
      style={styles.reviewCard}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      {review.releasePoster ? (
        <Image
          source={getSupabaseFileUrl(review.releasePoster)}
          style={styles.posterImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noImagePlaceholder}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      
      {/* Rating overlay at bottom */}
      {review.userRating > 0 && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{review.userRating}/5</Text>
        </View>
      )}
      
      {/* Review type label at top */}
      <View style={styles.typeLabelContainer}>
        <Text style={styles.typeLabel}>{getReviewTypeLabel()}</Text>
      </View>
    </TouchableOpacity>
  );
});

const Reviews = memo(() => {
  const router = useRouter();
  const [reviews, setReviews] = useState(globalReviewsCache.data || []);
  const [loading, setLoading] = useState(!globalReviewsCache.hasLoaded);

  const fetchReviews = useCallback(async () => {
    // If already loading globally, wait for it
    if (globalReviewsCache.loading) {
      const checkInterval = setInterval(() => {
        if (!globalReviewsCache.loading) {
          clearInterval(checkInterval);
          setReviews(globalReviewsCache.data || []);
          setLoading(false);
        }
      }, 100);
      return;
    }

    // If already loaded, use cached data
    if (globalReviewsCache.hasLoaded && globalReviewsCache.data) {
      setReviews(globalReviewsCache.data);
      setLoading(false);
      return;
    }

    // Start loading
    globalReviewsCache.loading = true;
    setLoading(true);

    try {
      const result = await fetchLatestReviews(5);
      
      if (result.success && result.data) {
        globalReviewsCache.data = result.data;
        globalReviewsCache.hasLoaded = true;
        setReviews(result.data);
      } else {
        console.error('Error fetching reviews:', result.msg);
      }
    } catch (error) {
      console.error('Error in fetchReviews:', error);
    } finally {
      globalReviewsCache.loading = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Skeleton card component
  const SkeletonCard = memo(() => (
    <View style={styles.reviewCard}>
      <SkeletonLoader
        width={wp(28)}
        height={hp(20)}
        borderRadius={4}
        shimmerColor="rgba(255, 255, 255, 0.4)"
      />
    </View>
  ));

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Latest Reviews</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          simultaneousHandlers={[]}
          shouldCancelWhenOutside={false}
          bounces={false}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show if no reviews
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Latest Reviews</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        bounces={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ScrollView>
    </View>
  );
});

export default Reviews;

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(2),
    marginHorizontal: wp(2),
  },
  header: {
    marginBottom: hp(1.5),
    paddingHorizontal: wp(2),
  },
  title: {
    fontSize: hp(2),
    fontWeight: theme.fonts.bold,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: wp(2),
    gap: wp(3),
  },
  reviewCard: {
    width: wp(28),
    height: hp(20),
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: wp(2),
    backgroundColor: '#222',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: hp(1.5),
  },
  ratingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: hp(0.5),
  },
  ratingText: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: theme.colors.ourgn || '#FFD700',
  },
  typeLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: hp(0.3),
  },
  typeLabel: {
    fontSize: hp(1.2),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

