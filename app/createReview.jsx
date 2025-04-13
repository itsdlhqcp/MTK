import React, { Component, useState, useEffect, memo, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import Icon from '@/assets/icons'
import { useReview } from '../contexts/ReviewContext'
import RenderHTML from 'react-native-render-html'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import BreathingHeartButton from '../components/BreathingHeartButton'
import { updatePeopleReview as updateReleasePeopleReview } from '../services/releaseService';
import { updatePeopleReview as updateOttPeopleReview } from '../services/ottService';
import { useToast } from '../contexts/ToastContext';

// Custom toast configuration for centered black toast with white text
const toastConfig = {
  success: (props) => (
    <View 
      style={{
        width: wp(80),
        height: 60,
        backgroundColor: 'black',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        alignSelf: 'center',
        top: '50%',
        marginTop: -30, // Half of height to center vertically
      }}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: 'white', fontSize: 14 }}>
          {props.text2}
        </Text>
      )}
    </View>
  ),
  error: (props) => (
    <View 
      style={{
        width: wp(80),
        height: 60,
        backgroundColor: 'black',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        alignSelf: 'center',
        top: '50%',
        marginTop: -30, // Half of height to center vertically
      }}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
        {props.text1}
      </Text>
      {props.text2 && (
        <Text style={{ color: 'white', fontSize: 14 }}>
          {props.text2}
        </Text>
      )}
    </View>
  )
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

const StableTextInput = memo(({ value, onChangeText, ...props }) => {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Handle text changes locally first
  const handleChangeText = useCallback((text) => {
    setLocalValue(text);
    // Then propagate to parent
    onChangeText && onChangeText(text);
  }, [onChangeText]);
  
  return (
    <TextInput
      ref={inputRef}
      value={localValue}
      onChangeText={handleChangeText}
      {...props}
    />
  );
});

export class createReview extends Component {
  render() {
    // This class component now wraps the functional component to maintain backward compatibility
    return <CreateReviewFunctional />;
  }
}

// The functional implementation with all the features
function CreateReviewFunctional() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [movieId, setMovieId] = useState('');
  const [movieData, setMovieData] = useState(null);
  const [reviewState, setReviewState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateReviewData, activeReview, updateFavoriteStatus } = useReview();
  const { showToast } = useToast();

  const isEdit = params?.review && JSON.parse(params.review).id;
  
  // Track if component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);
  // Add a ref to track the latest body value
  const bodyRef = useRef('');
  // Add a ref to track the latest favorite status - KEY ADDITION
  const favoriteRef = useRef(false);
  // Track the current favorite status separately from the context
  const [currentFavorite, setCurrentFavorite] = useState(false);

  // Create HTML content for the movie title without year
  const movieTitleHtml = movieData && movieData.title ? `<b>${movieData.title}</b>` : '';
  
  // Define styles for HTML content
  const titleTagsStyles = {
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
  };

  // Date formatting logic
  const currentDate = new Date();
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  const rawFormattedDate = currentDate.toLocaleDateString('en-US', options);
  
  // Replace commas according to the original format
  const formattedDate = rawFormattedDate
    .replace(/,/g, '')  // Remove all commas first
    .replace(/(\w+) (\d+) (\w+) (\d+)/, '$1, $2 $3, $4'); // Add commas in the right places

  // Update bodyRef when body state changes
  useEffect(() => {
    bodyRef.current = body;
  }, [body]);

  // Sync our local favorite state with context when it changes
  useEffect(() => {
    if (activeReview?.isFavorite !== undefined) {
      setCurrentFavorite(activeReview.isFavorite);
      // Update the ref as well - IMPORTANT
      favoriteRef.current = activeReview.isFavorite;
    }
  }, [activeReview?.isFavorite]);

  // ADDED: Update the ref immediately when currentFavorite changes
  useEffect(() => {
    favoriteRef.current = currentFavorite;
  }, [currentFavorite]);

  // Cleanup function to handle component unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Process initial data from params
  useEffect(() => {
    // Set the formatted date
    setDate(formattedDate);

    // Store movie ID if provided
    if (params?.movieId) {
      setMovieId(params.movieId);
    }

    // Parse movie data if it exists
    if (params?.movie) {
      try {
        const movie = typeof params.movie === 'string' ? JSON.parse(params.movie) : params.movie;
        setMovieData(movie);
        
        // Initialize favorite status from movie data if available
        if (movie.isFavorite !== undefined) {
          setCurrentFavorite(movie.isFavorite);
          // Also set the ref
          favoriteRef.current = movie.isFavorite;
          updateFavoriteStatus(movie.isFavorite);
        }
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
        
        // If review state has favorite info, prioritize it
        if (reviewStateObj && reviewStateObj.isFavorite !== undefined) {
          setCurrentFavorite(reviewStateObj.isFavorite);
          // Also set the ref
          favoriteRef.current = reviewStateObj.isFavorite;
          updateFavoriteStatus(reviewStateObj.isFavorite);
        }
      } catch (e) {
        console.error('Error parsing review state:', e);
      }
    }

    // Parse existing review if it exists (highest priority)
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
        // If review has favorite status, use that
        if (review.favour !== undefined) {
          setCurrentFavorite(review.favour);
          // Also set the ref
          favoriteRef.current = review.favour;
          updateFavoriteStatus(review.favour);
        }
      } catch (e) {
        console.error('Error parsing review:', e);
      }
    }
  }, [params, formattedDate, updateFavoriteStatus]);

  // We're using useCallback to ensure stability
  const handleTextChange = useCallback((text) => {
    if (isMounted.current) {
      setBody(text);
      // Update ref immediately
      bodyRef.current = text;
    }
  }, []);

  const onSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if this is an edit (has review id) or a new review
      const reviewId = isEdit ? JSON.parse(params.review).id : null;
      console.log('Review ID from create review page:', reviewId);
      
      // Log the favorite status we're about to send
      console.log('Current favorite status before submission:', favoriteRef.current);
      
      // Prepare the review data - use refs to ensure most recent values
      let reviewData = {
        text: bodyRef.current,
        movieId: movieId,
        favour: favoriteRef.current // Use the ref here instead of state
      };
      
      // Log the review data before submission
      console.log('Submitting review data:', JSON.stringify(reviewData));
      
      let updatedReview = null;
      if (isEdit) {
        // Determine which service to use based on source parameter
        const source = params?.source || 'release'; // Default to 'release' if not specified
        console.log(`Updating review using ${source} service`);

        showToast('success', 'Review Updated Successfully');
        
        if (source === 'stream') {
          // For stream people details, use ottService
          console.log("Calling stream update API with:", reviewId, reviewData);
          updatedReview = await updateOttPeopleReview(reviewId, reviewData);
        } else {
          // For release people details, use releaseService (default)
          console.log("Calling release update API with:", reviewId, reviewData);
          updatedReview =  await updateReleasePeopleReview(reviewId, reviewData);
        }
        
        
        // Add a small delay to allow the toast to be visible before navigating away
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // For new review case, use your existing logic
        console.log('Submitting new review:', reviewData);
      
        // showToast('success', 'Review Submitted Successfully');
        // Simulate API call with timeout - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('FINAL DATA BEING SENT BACK:', {
        id: reviewId,
        text: bodyRef.current,
        favour: favoriteRef.current
      });
      // Update context with final values before navigating back
      updateReviewData({
        reviewText: bodyRef.current,
        reviewDate: date,
        isFavorite: favoriteRef.current // Use the ref here as well
      });
      
      // Navigate back
      if (isMounted.current) {
        if (updatedReview) {
          router.back({
            params: {
              updatedReview: JSON.stringify({
                id: reviewId,
                text: bodyRef.current,
                favour: favoriteRef.current,
                timestamp: new Date().getTime()
              })
            }
          });
        } else {
          router.back();
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('error', 'Failed to Submit Review');
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  // Update favorite callback function - completely rewritten for reliability
  const handleUpdateFavorite = useCallback((id, data) => {
    // First ensure the data contains the expected properties
    if (!data || typeof data.isFavorite === 'undefined') {
      console.error('Invalid data structure in handleUpdateFavorite:', data);
      return;
    }
    
    const newFavoriteStatus = data.isFavorite;
    console.log("Updating favorite status to:", newFavoriteStatus);
    
    // Update our local state
    setCurrentFavorite(newFavoriteStatus);
    
    // IMPORTANT: Update our ref immediately
    favoriteRef.current = newFavoriteStatus;
    
    // Update movie data with new favorite status
    if (movieData) {
      setMovieData(prevData => ({
        ...prevData,
        isFavorite: newFavoriteStatus
      }));
    }
    
    // Use the dedicated function from context to update favorite status
    updateFavoriteStatus(newFavoriteStatus);
  }, [movieData, updateFavoriteStatus]);

  // TextInput styles
  const textInputStyle = [styles.reviewTextInput];

  return (
    <ScreenWrapper bg="#1A252B">
      <Header 
        title={isEdit ? "Edit Review" : "I watched"}
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
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
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
            <Text style={styles.dateLabel}>{isEdit? "Revised On" : "Date"}</Text>
            <View style={styles.dateValueContainer}>
              <Text style={styles.dateValue}>{date}</Text>
             
             {!isEdit && (
                  <BreathingHeartButton
                  item={movieData}
                  favour={currentFavorite} // Use our local state directly
                  updateItem={handleUpdateFavorite}
                />
             )}
            </View>
          </View>

          <View style={styles.reviewTextContainer}>
            {/* Using our custom StableTextInput component */}
            <StableTextInput
              style={textInputStyle}
              placeholder="Add review..."
              placeholderTextColor="#4A6275"
              multiline={true}
              numberOfLines={6}
              value={body}
              onChangeText={handleTextChange}
              scrollEnabled={false}
              textAlignVertical="top"
              autoCapitalize="sentences"
              returnKeyType="default"
              blurOnSubmit={false}
              autoCorrect={true}
              keyboardType="default"
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
      {/* Add Toast component at the root level */}
    </ScreenWrapper>
  );
}

export default createReview;

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
    paddingTop: Platform.OS === 'ios' ? hp(1) : 0,
  },
  // Styles for the note section
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


// import React, { Component, useState, useEffect, memo, useRef, useCallback } from 'react'
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native'
// import ScreenWrapper from '../components/ScreenWrapper'
// import Header from '../components/Header'
// import { useLocalSearchParams, useRouter } from 'expo-router'
// import { hp, wp } from '@/helpers/common'
// import Icon from '@/assets/icons'
// import { useReview } from '../contexts/ReviewContext'
// import RenderHTML from 'react-native-render-html'
// import { getSupabaseFileUrl } from '../services/userProfileImage'
// import BreathingHeartButton from '../components/BreathingHeartButton'
// // Import both services
// import { updatePeopleReview as updateReleasePeopleReview } from '../services/releaseService';
// import { updatePeopleReview as updateOttPeopleReview } from '../services/ottService';

// // Memoized component for rendering HTML content
// const WebDisplay = memo(function WebDisplay({ html, contentWidth, tagsStyles }) {
//   return (
//     <RenderHTML
//       contentWidth={contentWidth}
//       source={{ html }}
//       tagsStyles={tagsStyles}
//     />
//   );
// });

// const StableTextInput = memo(({ value, onChangeText, ...props }) => {
//   const inputRef = useRef(null);
//   const [localValue, setLocalValue] = useState(value);
  
//   // Update local value when prop value changes
//   useEffect(() => {
//     setLocalValue(value);
//   }, [value]);
  
//   // Handle text changes locally first
//   const handleChangeText = useCallback((text) => {
//     setLocalValue(text);
//     // Then propagate to parent
//     onChangeText && onChangeText(text);
//   }, [onChangeText]);
  
//   return (
//     <TextInput
//       ref={inputRef}
//       value={localValue}
//       onChangeText={handleChangeText}
//       {...props}
//     />
//   );
// });

// export class createReview extends Component {
//   render() {
//     // This class component now wraps the functional component to maintain backward compatibility
//     return <CreateReviewFunctional />;
//   }
// }

// // The functional implementation with all the features
// function CreateReviewFunctional() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const [body, setBody] = useState('');
//   const [date, setDate] = useState('');
//   const [movieId, setMovieId] = useState('');
//   const [movieData, setMovieData] = useState(null);
//   const [reviewState, setReviewState] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { updateReviewData, activeReview, updateFavoriteStatus } = useReview();

//   const isEdit = params?.review && JSON.parse(params.review).id;
  
//   // Track if component is mounted to prevent state updates after unmounting
//   const isMounted = useRef(true);
//   // Add a ref to track the latest body value
//   const bodyRef = useRef('');
//   // Add a ref to track the latest favorite status - KEY ADDITION
//   const favoriteRef = useRef(false);
//   // Track the current favorite status separately from the context
//   const [currentFavorite, setCurrentFavorite] = useState(false);

//   // Create HTML content for the movie title without year
//   const movieTitleHtml = movieData && movieData.title ? `<b>${movieData.title}</b>` : '';
  
//   // Define styles for HTML content
//   const titleTagsStyles = {
//     div: {
//       color: 'white',
//       fontSize: hp(1.7),
//       textAlign: 'left',
//       fontWeight: '600'
//     },
//     b: {
//       color: 'white',
//       fontSize: hp(2.5),
//       textAlign: 'left',
//       fontWeight: 'bold'
//     }
//   };

//   // Date formatting logic
//   const currentDate = new Date();
//   const options = { 
//     day: 'numeric', 
//     month: 'long', 
//     year: 'numeric' 
//   };
//   const rawFormattedDate = currentDate.toLocaleDateString('en-US', options);
  
//   // Replace commas according to the original format
//   const formattedDate = rawFormattedDate
//     .replace(/,/g, '')  // Remove all commas first
//     .replace(/(\w+) (\d+) (\w+) (\d+)/, '$1, $2 $3, $4'); // Add commas in the right places

//   // Update bodyRef when body state changes
//   useEffect(() => {
//     bodyRef.current = body;
//   }, [body]);

//   // Sync our local favorite state with context when it changes
//   useEffect(() => {
//     if (activeReview?.isFavorite !== undefined) {
//       setCurrentFavorite(activeReview.isFavorite);
//       // Update the ref as well - IMPORTANT
//       favoriteRef.current = activeReview.isFavorite;
//     }
//   }, [activeReview?.isFavorite]);

//   // ADDED: Update the ref immediately when currentFavorite changes
//   useEffect(() => {
//     favoriteRef.current = currentFavorite;
//   }, [currentFavorite]);

//   // Cleanup function to handle component unmounting
//   useEffect(() => {
//     return () => {
//       isMounted.current = false;
//     };
//   }, []);

//   // Process initial data from params
//   useEffect(() => {
//     // Set the formatted date
//     setDate(formattedDate);

//     // Store movie ID if provided
//     if (params?.movieId) {
//       setMovieId(params.movieId);
//     }

//     // Parse movie data if it exists
//     if (params?.movie) {
//       try {
//         const movie = typeof params.movie === 'string' ? JSON.parse(params.movie) : params.movie;
//         setMovieData(movie);
        
//         // Initialize favorite status from movie data if available
//         if (movie.isFavorite !== undefined) {
//           setCurrentFavorite(movie.isFavorite);
//           // Also set the ref
//           favoriteRef.current = movie.isFavorite;
//           updateFavoriteStatus(movie.isFavorite);
//         }
//       } catch (e) {
//         console.error('Error parsing movie data:', e);
//       }
//     }

//     // Parse review state if it exists
//     if (params?.reviewState) {
//       try {
//         const reviewStateObj = typeof params.reviewState === 'string' 
//           ? JSON.parse(params.reviewState) 
//           : params.reviewState;
//         setReviewState(reviewStateObj);
        
//         // If review state has favorite info, prioritize it
//         if (reviewStateObj && reviewStateObj.isFavorite !== undefined) {
//           setCurrentFavorite(reviewStateObj.isFavorite);
//           // Also set the ref
//           favoriteRef.current = reviewStateObj.isFavorite;
//           updateFavoriteStatus(reviewStateObj.isFavorite);
//         }
//       } catch (e) {
//         console.error('Error parsing review state:', e);
//       }
//     }

//     // Parse existing review if it exists (highest priority)
//     if (params?.review) {
//       try {
//         const review = typeof params.review === 'string' ? JSON.parse(params.review) : params.review;
//         if (review.body) {
//           setBody(review.body);
//         }
//         // If review has a date, use that instead of current date
//         if (review.date) {
//           setDate(review.date);
//         }
//         // If review has favorite status, use that
//         if (review.favour !== undefined) {
//           setCurrentFavorite(review.favour);
//           // Also set the ref
//           favoriteRef.current = review.favour;
//           updateFavoriteStatus(review.favour);
//         }
//       } catch (e) {
//         console.error('Error parsing review:', e);
//       }
//     }
//   }, [params, formattedDate, updateFavoriteStatus]);

//   // We're using useCallback to ensure stability
//   const handleTextChange = useCallback((text) => {
//     if (isMounted.current) {
//       setBody(text);
//       // Update ref immediately
//       bodyRef.current = text;
//     }
//   }, []);

//   const onSubmit = async () => {
//     if (isSubmitting) return;
    
//     try {
//       setIsSubmitting(true);
      
//       // Check if this is an edit (has review id) or a new review
//       const reviewId = isEdit ? JSON.parse(params.review).id : null;
//       console.log('Review ID from create review page:', reviewId);
      
//       // Log the favorite status we're about to send
//       console.log('Current favorite status before submission:', favoriteRef.current);
      
//       // Prepare the review data - use refs to ensure most recent values
//       let reviewData = {
//         text: bodyRef.current,
//         movieId: movieId,
//         favour: favoriteRef.current // Use the ref here instead of state
//       };
      
//       // Log the review data before submission
//       console.log('Submitting review data:', JSON.stringify(reviewData));
      
//       let updatedReview = null;
//       if (isEdit) {
//         // Determine which service to use based on source parameter
//         const source = params?.source || 'release'; // Default to 'release' if not specified
//         console.log(`Updating review using ${source} service`);
        
//         if (source === 'stream') {
//           // For stream people details, use ottService
//           console.log("Calling stream update API with:", reviewId, reviewData);
//           updatedReview = await updateOttPeopleReview(reviewId, reviewData);
//         } else {
//           // For release people details, use releaseService (default)
//           console.log("Calling release update API with:", reviewId, reviewData);
//           updatedReview =  await updateReleasePeopleReview(reviewId, reviewData);
//         }
//       } else {
//         // For new review case, use your existing logic
//         console.log('Submitting new review:', reviewData);
        
//         // Simulate API call with timeout - replace with actual API call
//         await new Promise(resolve => setTimeout(resolve, 500));
//       }
      
//       console.log('FINAL DATA BEING SENT BACK:', {
//         id: reviewId,
//         text: bodyRef.current,
//         favour: favoriteRef.current
//       });
//       // Update context with final values before navigating back
//       updateReviewData({
//         reviewText: bodyRef.current,
//         reviewDate: date,
//         isFavorite: favoriteRef.current // Use the ref here as well
//       });
      
//       // Navigate back
//       if (isMounted.current) {
//         if (updatedReview) {
//           router.back({
//             params: {
//               updatedReview: JSON.stringify({
//                 id: reviewId,
//                 text: bodyRef.current,
//                 favour: favoriteRef.current,
//                 timestamp: new Date().getTime()
//               })
//             }
//           });
//         } else {
//           router.back();
//         }
//       }
//     } catch (error) {
//       console.error('Error submitting review:', error);
//       // Handle submission error here
//     } finally {
//       if (isMounted.current) {
//         setIsSubmitting(false);
//       }
//     }
//   };

//   // Update favorite callback function - completely rewritten for reliability
//   const handleUpdateFavorite = useCallback((id, data) => {
//     // First ensure the data contains the expected properties
//     if (!data || typeof data.isFavorite === 'undefined') {
//       console.error('Invalid data structure in handleUpdateFavorite:', data);
//       return;
//     }
    
//     const newFavoriteStatus = data.isFavorite;
//     console.log("Updating favorite status to:", newFavoriteStatus);
    
//     // Update our local state
//     setCurrentFavorite(newFavoriteStatus);
    
//     // IMPORTANT: Update our ref immediately
//     favoriteRef.current = newFavoriteStatus;
    
//     // Update movie data with new favorite status
//     if (movieData) {
//       setMovieData(prevData => ({
//         ...prevData,
//         isFavorite: newFavoriteStatus
//       }));
//     }
    
//     // Use the dedicated function from context to update favorite status
//     updateFavoriteStatus(newFavoriteStatus);
//   }, [movieData, updateFavoriteStatus]);

//   // TextInput styles
//   const textInputStyle = [styles.reviewTextInput];

//   return (
//     <ScreenWrapper bg="#1A252B">
//       <Header 
//         title={isEdit ? "Edit Review" : "I watched"}
//         showBackButton={true}
//         backButtonColor="white"
//         rightIcon={
//           <TouchableOpacity 
//             onPress={onSubmit} 
//             disabled={isSubmitting}
//             style={{ opacity: isSubmitting ? 0.5 : 1 }}
//           >
//             <Icon name="check" size={28} color="white" />
//           </TouchableOpacity>
//         }
//       />
//       <View style={styles.container}>
//         <ScrollView
//           contentContainerStyle={{ gap: 20 }}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="always"
//           keyboardDismissMode="none"
//         >
//           {/* Display movie title without year or date */}
//           {movieData && movieData.title && (
//             <View style={styles.titleContainer}>
//               <View style={styles.titleRow}>
//                 <View style={styles.titleTextContainer}>
//                   <WebDisplay 
//                     html={movieTitleHtml}
//                     contentWidth={wp(60)}
//                     tagsStyles={titleTagsStyles}
//                   />
//                 </View>
                
//                 {/* Movie Image - Updated to use Supabase URL for postImage files */}
//                 {movieData.image && (
//                   <View style={styles.imageContainer}>
//                     {movieData.image.includes('postImage') ? (
//                       <Image
//                         source={getSupabaseFileUrl(movieData.image)}
//                         style={styles.movieImage}
//                         resizeMode="cover"
//                       />
//                     ) : (
//                       <Image 
//                         source={{ uri: movieData.image }} 
//                         style={styles.movieImage}
//                         resizeMode="cover"
//                       />
//                     )}
//                   </View>
//                 )}
//               </View>
//             </View>
//           )}

//           <View style={styles.dateContainer}>
//             <Text style={styles.dateLabel}>{isEdit? "Revised On" : "Date"}</Text>
//             <View style={styles.dateValueContainer}>
//               <Text style={styles.dateValue}>{date}</Text>
             
//              {!isEdit && (
//                   <BreathingHeartButton
//                   item={movieData}
//                   favour={currentFavorite} // Use our local state directly
//                   updateItem={handleUpdateFavorite}
//                 />
//              )}
//             </View>
//           </View>

//           <View style={styles.reviewTextContainer}>
//             {/* Using our custom StableTextInput component */}
//             <StableTextInput
//               style={textInputStyle}
//               placeholder="Add review..."
//               placeholderTextColor="#4A6275"
//               multiline={true}
//               numberOfLines={6}
//               value={body}
//               onChangeText={handleTextChange}
//               scrollEnabled={false}
//               textAlignVertical="top"
//               autoCapitalize="sentences"
//               returnKeyType="default"
//               blurOnSubmit={false}
//               autoCorrect={true}
//               keyboardType="default"
//             />
//           </View>
          
//           {/* Note section added below review area */}
//           <View style={styles.noteContainer}>
//             <Text style={styles.noteText}>
//               Note: You can post only one review per movie.
//             </Text>
//             <Text style={styles.noteText}>
//               Reviews can be edited or deleted within 12 hours of submission. After that, reviews are locked to maintain authenticity.
//             </Text>
//           </View>
//         </ScrollView>
//       </View>
//     </ScreenWrapper>
//   );
// }

// export default createReview;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: wp(4),
//     paddingTop: hp(1),
//   },
//   titleContainer: {
//     marginBottom: hp(1),
//     paddingBottom: hp(1),
//     borderBottomWidth: 1,
//     borderBottomColor: '#2C3E50',
//   },
//   titleRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   titleTextContainer: {
//     flex: 1,
//     paddingRight: wp(2),
//   },
//   imageContainer: {
//     width: wp(25),
//     height: wp(25),
//     borderRadius: 8,
//     overflow: 'hidden',
//     backgroundColor: '#2C3E50',
//   },
//   movieImage: {
//     width: '100%',
//     height: '100%',
//   },
//   dateContainer: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#2C3E50',
//     paddingBottom: hp(2),
//   },
//   dateLabel: {
//     fontSize: hp(2),
//     color: '#6D8296',
//     marginBottom: hp(1),
//   },
//   dateValueContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   dateValue: {
//     fontSize: hp(2),
//     color: 'white',
//   },
//   reviewTextContainer: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#2C3E50',
//     paddingBottom: hp(2),
//   },
//   reviewTextInput: {
//     color: 'white',
//     fontSize: hp(2),
//     minHeight: hp(15),
//     textAlignVertical: 'top',
//     paddingTop: Platform.OS === 'ios' ? hp(1) : 0,
//   },
//   // Styles for the note section
//   noteContainer: {
//     paddingVertical: hp(2),
//     marginBottom: hp(2),
//   },
//   noteText: {
//     color: '#6D8296',
//     fontSize: hp(1.5),
//     lineHeight: hp(2.2),
//     marginBottom: hp(0.5),
//   }
// });