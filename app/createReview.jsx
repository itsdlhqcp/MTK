import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native'
import React, { useState, useEffect, memo, useMemo, useRef } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import Icon from '@/assets/icons'
import { useReview } from '../contexts/ReviewContext'
import RenderHTML from 'react-native-render-html'
import { getSupabaseFileUrl } from '../services/userProfileImage'

// Simple cache mechanism
const apiCache = {
  data: new Map(),
  timestamp: new Map(),
  get: function(key) {
    // Check if cached data exists and is less than 5 minutes old
    const cachedTime = this.timestamp.get(key);
    if (cachedTime && (Date.now() - cachedTime < 5 * 60 * 1000)) {
      return this.data.get(key);
    }
    return null;
  },
  set: function(key, value) {
    this.data.set(key, value);
    this.timestamp.set(key, Date.now());
  }
};

// API throttling utility
const useApiThrottle = () => {
  const lastCallTime = useRef({});
  const pendingPromises = useRef({});
  
  const throttledApiCall = async (key, apiFunction, ...args) => {
    // Check cache first
    const cachedData = apiCache.get(key);
    if (cachedData) {
      console.log(`Using cached data for: ${key}`);
      return cachedData;
    }
    
    // If there's already a pending request for this key, return that promise
    if (pendingPromises.current[key]) {
      console.log(`Request already in progress for: ${key}`);
      return pendingPromises.current[key];
    }
    
    // Throttle time - 2 seconds between same API calls
    const now = Date.now();
    const lastCall = lastCallTime.current[key] || 0;
    const timeToWait = Math.max(0, 2000 - (now - lastCall));
    
    if (timeToWait > 0) {
      console.log(`Throttling API call for: ${key}, waiting ${timeToWait}ms`);
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
    
    try {
      // Set this request as pending
      const promise = apiFunction(...args);
      pendingPromises.current[key] = promise;
      
      // Execute the API call
      lastCallTime.current[key] = Date.now();
      const result = await promise;
      
      // Cache the result
      apiCache.set(key, result);
      
      // Clear pending promise
      delete pendingPromises.current[key];
      
      return result;
    } catch (error) {
      // Clear pending promise on error too
      delete pendingPromises.current[key];
      throw error;
    }
  };
  
  return throttledApiCall;
};

// Memoized component for rendering HTML content
const WebDisplay = memo(function WebDisplay({ html, contentWidth, tagsStyles }) {
  return (
    <RenderHTML
      contentWidth={contentWidth}
      source={{ html }}
      tagsStyles={tagsStyles}
    />
  );
});

export default function CreateReview() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [movieId, setMovieId] = useState('');
  const [movieData, setMovieData] = useState(null);
  const [reviewState, setReviewState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateReviewData } = useReview();
  const throttledApiCall = useApiThrottle();
  
  // Track if component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);

  // Create HTML content for the movie title without year
  const movieTitleHtml = useMemo(() => (
    movieData && movieData.title ? `<b>${movieData.title}</b>` : ''
  ), [movieData?.title]);
  
  // Define styles once to maintain stable reference
  const titleTagsStyles = useMemo(() => ({
    div: {
      color: 'white',
      fontSize: hp(1.7),
      textAlign: 'left',
      fontWeight: '600'
    },
    b: {
      color: 'white',
      fontSize: hp(2.5),
      textAlign: 'left',
      fontWeight: 'bold'
    }
  }), []);

  // Cleanup function to handle component unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {

    const currentDate = new Date();
    const options = { 
    //   weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    const formattedDate = currentDate.toLocaleDateString('en-US', options);
    
    // Replace commas according to the original format
    const dateWithCorrectCommas = formattedDate
      .replace(/,/g, '')  // Remove all commas first
      .replace(/(\w+) (\d+) (\w+) (\d+)/, '$1, $2 $3, $4'); // Add commas in the right places
    
    setDate(dateWithCorrectCommas);

    // Store movie ID if provided
    if (params?.movieId) {
      setMovieId(params.movieId);
    }

    // Parse movie data if it exists
    if (params?.movie) {
      try {
        const movie = typeof params.movie === 'string' ? JSON.parse(params.movie) : params.movie;
        setMovieData(movie);
      } catch (e) {
        console.error('Error parsing movie data:', e);
      }
    }

    // Parse review state if it exists
    if (params?.reviewState) {
      try {
        const reviewStateObj = typeof params.reviewState === 'string' 
          ? JSON.parse(params.reviewState) 
          : params.reviewState;
        setReviewState(reviewStateObj);
      } catch (e) {
        console.error('Error parsing review state:', e);
      }
    }

    // Parse existing review if it exists
    if (params?.review) {
      try {
        const review = typeof params.review === 'string' ? JSON.parse(params.review) : params.review;
        if (review.body) {
          setBody(review.body);
        }
        // If review has a date, use that instead of current date
        if (review.date) {
          setDate(review.date);
        }
      } catch (e) {
        console.error('Error parsing review:', e);
      }
    }
  }, [params]);

  // Debounce function for text input
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Debounced state updater for better performance
  const debouncedSetBody = useMemo(
    () => debounce((text) => {
      if (isMounted.current) {
        setBody(text);
      }
    }, 300),
    []
  );

  const onSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the review data
      let reviewData = {
        body: body,
        date: date,
        movieId: movieId
      };

      console.log('Submitting review:', reviewData);
      
      // Use throttled API call for submission
      const cacheKey = `submitReview_${movieId}`;
      
      await throttledApiCall(
        cacheKey,
        async () => {
          // This would be your actual API submission function
          // For example: return await submitReviewToAPI(reviewData);
          
          // Simulate API call with timeout
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true };
        }
      );
      
      // Update the global context with review data
      updateReviewData({
        reviewText: body,
        reviewDate: date
      });
      
      // Navigate back
      if (isMounted.current) {
        router.back();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      // Handle submission error here
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  //console.log("movie data", movieData);

  return (
    <ScreenWrapper bg="#1A252B">
      <Header 
        title="" 
        showBackButton={true}
        backButtonColor="white"
        rightIcon={
          <TouchableOpacity 
            onPress={onSubmit} 
            disabled={isSubmitting}
            style={{ opacity: isSubmitting ? 0.5 : 1 }}
          >
            <Icon name="check" size={28} color="white" />
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Display movie title without year or date */}
          {movieData && movieData.title && (
            <View style={styles.titleContainer}>
              <View style={styles.titleRow}>
                <View style={styles.titleTextContainer}>
                  <WebDisplay 
                    html={movieTitleHtml}
                    contentWidth={wp(60)}
                    tagsStyles={titleTagsStyles}
                  />
                </View>
                
                {/* Movie Image - Updated to use Supabase URL for postImage files */}
                {movieData.image && (
                  <View style={styles.imageContainer}>
                    {movieData.image.includes('postImage') ? (
                      <Image
                        source={getSupabaseFileUrl(movieData.image)}
                        style={styles.movieImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image 
                        source={{ uri: movieData.image }} 
                        style={styles.movieImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Date</Text>
            <View style={styles.dateValueContainer}>
              <Text style={styles.dateValue}>{date}</Text>
            </View>
          </View>

          <View style={styles.reviewTextContainer}>
            <TextInput
              style={styles.reviewTextInput}
              placeholder="Add review..."
              placeholderTextColor="#4A6275"
              multiline={true}
              numberOfLines={6}
              value={body}
              onChangeText={(text) => {
                // Update local state immediately for UI responsiveness
                setBody(text);
                // Debounce the actual processing
                debouncedSetBody(text);
              }}
            />
          </View>
          
          {/* Note section added below review area */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              Note: You can post only one review per movie.
            </Text>
            <Text style={styles.noteText}>
              Reviews can be edited or deleted within 12 hours of submission. After that, reviews are locked to maintain authenticity.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  titleContainer: {
    marginBottom: hp(1),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleTextContainer: {
    flex: 1,
    paddingRight: wp(2),
  },
  imageContainer: {
    width: wp(25),
    height: wp(25),
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2C3E50',
  },
  movieImage: {
    width: '100%',
    height: '100%',
  },
  dateContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    paddingBottom: hp(2),
  },
  dateLabel: {
    fontSize: hp(2),
    color: '#6D8296',
    marginBottom: hp(1),
  },
  dateValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: hp(2),
    color: 'white',
  },
  reviewTextContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C3E50',
    paddingBottom: hp(2),
  },
  reviewTextInput: {
    color: 'white',
    fontSize: hp(2),
    minHeight: hp(15),
    textAlignVertical: 'top',
  },
  // New styles for the note section
  noteContainer: {
    paddingVertical: hp(2),
    marginBottom: hp(2),
  },
  noteText: {
    color: '#6D8296',
    fontSize: hp(1.5),
    lineHeight: hp(2.2),
    marginBottom: hp(0.5),
  }
});