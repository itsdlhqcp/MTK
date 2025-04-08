import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import RenderHtml from 'react-native-render-html';
import moment from 'moment';
import Icon from '../assets/icons';
import { useReview } from '../contexts/ReviewContext'
import { useLocalSearchParams, useRouter } from 'expo-router';

const StarIcon = ({ fillPercentage = 0 }) => {
  const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
  // Create a gradient fill based on the exact percentage (0.0 to 1.0)
  const getFillColor = () => {
    if (fillPercentage <= 0) return "none";
    if (fillPercentage >= 1) return "#FFD700";
    return "url(#partialGradient)";
  };


  return (
    <Svg width={46} height={46} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="partialGradient" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
          <Stop offset={fillPercentage} stopColor="#FFD700" stopOpacity="1" />
          <Stop offset={fillPercentage} stopColor="transparent" stopOpacity="0" />
          <Stop offset="1" stopColor="transparent" stopOpacity="0" />
        </LinearGradient>
        <ClipPath id="starClip">
          <Path d={starPath} />
        </ClipPath>
      </Defs>
      <Path
        d={starPath}
        fill="#e5e7eb"
        stroke="#d1d5db"
        strokeWidth={1}
      />
      <Rect
        x="0"
        y="0"
        width="24"
        height="24"
        fill={getFillColor()}
        clipPath="url(#starClip)"
      />
    </Svg>
  );
};

const StarRating = ({ rating, onRatingChange }) => {
  // Calculate the exact fill percentage for each star (0.0-1.0)
  const getStarFillPercentage = (position) => {
    if (rating >= position) return 1.0; // Full star
    if (rating < position - 1) return 0.0; // Empty star
    
    // Partial star - calculate exact fill percentage
    const partialFill = (rating - (position - 1));
    return partialFill;
  };

  // Function to handle star press with 0.1 precision
  const handleStarPress = (event, position) => {
    // Get the relative X position within the star (0-1)
    const star = event.currentTarget;
    const { locationX } = event.nativeEvent;
    const starWidth = 32; // Width of the star touch area
    
    // Calculate position within the star (0.0 to 1.0)
    let positionInStar = Math.max(0, Math.min(1, locationX / starWidth));
    
    // Round to nearest 0.1
    positionInStar = Math.round(positionInStar * 10) / 10;
    
    // Calculate the rating based on position and star number
    const newRating = (position - 1) + positionInStar;
    
    // Special handling for last star with 0.1 decrements
    if (position === 5 && rating > 4.9 && rating <= 5.0) {
      // If at full 5 stars, clicking last star should decrement by 0.1
      onRatingChange(rating - 0.1);
    } else if (Math.abs(newRating - rating) < 0.05) {
      // If clicking the same spot, toggle off
      onRatingChange(0);
    } else {
      // Normal case - set to the calculated rating
      onRatingChange(newRating);
    }
  };

  return (
    <View style={{ marginTop: hp(2) }}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {[1, 2, 3, 4, 5].map((position) => (
          <TouchableOpacity
            key={position}
            onPress={(event) => handleStarPress(event, position)}
            style={{
              width: 35,
              height: 35,
            }}
          >
            <StarIcon fillPercentage={getStarFillPercentage(position)} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingText}>
        Rating: {rating.toFixed(1)} / 5.0
      </Text>
    </View>
  );
};

const RatingBottomSheet = ({ visible, onClose, onSubmit, item }) => {
  const [rating, setRating] = useState(0);
  const [cupOfTea, setCupOfTea] = useState(null);
  // Added new state variables for the three new fields
  const [prefer, setPrefer] = useState(null);
  const [predict, setPredict] = useState(null);
  const [repeat, setRepeat] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const bottomSheetRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();

   // Use the review context
   const { activeReview, clearReviewData } = useReview();

   // Update the reviewText from context when the sheet becomes visible
   useEffect(() => {
     if (visible && activeReview.reviewText) {
       setReviewText(activeReview.reviewText);
       console.log("Review text from context:", activeReview.reviewText);
     }
   }, [visible, activeReview]);

  // Add useEffect to listen for returned review text
//  useEffect(() => {
//   if (visible && router?.params?.reviewText) {
//     setReviewText(router.params.reviewText);
//     // Clear the param to avoid issues
//     router.params.reviewText = undefined;
//   }
// }, [visible, router?.params]);

// useEffect(() => {
//   if (visible && params?.reviewText) {
//     setReviewText(params.reviewText);
//   }
// }, [visible, params?.reviewText]);

// consoling the review text

useEffect(() => {
  console.log("Params received:", params);
  console.log("Review Text from Params:", params?.reviewText);
}, [params]);


useEffect(() => {
  // When reviewText changes (from router params), update the component state
  if (reviewText) {
    // For debugging - check if reviewText is actually populated
    console.log("Review text received in bottom sheet:", reviewText);
  }
}, [reviewText]);

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
}
  
  // Snap points for the bottom sheet (50% of screen height)
  const snapPoints = useMemo(() => ['65%'], []);

  // Callbacks
  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      handleClose();
    }
  }, []);

  const handleSubmit = () => {
    // Pass all values to onSubmit
    onSubmit(rating, cupOfTea, prefer, predict, repeat, activeReview.reviewText || reviewText);
    resetState();
    clearReviewData();
    bottomSheetRef.current?.close();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setRating(0);
    setCupOfTea(null);
    setPrefer(null);
    setPredict(null);
    setRepeat(null);
    setReviewText('');
    clearReviewData();
  };

  // Effect to open/close bottom sheet based on visible prop
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Helper function to determine if a button is a "Not" button
  const isNotButton = (buttonText) => {
    return buttonText.includes('Not');
  };

  const releaseAt = item?.rDate ? moment(item.rDate).format('MMM D') : '';

    const handleNavigateToWriteReview = () => {
      // Don't close the bottom sheet yet
      // Pass current rating state to the review page
      const reviewData = {
        rating: rating,
        cupOfTea: cupOfTea,
        prefer: prefer,
        predict: predict,
        repeat: repeat
      };
      
      // Navigate to review page with movie and review data
      const movieData = {
        title: item?.body ? item.body.replace(/<[^>]*>/g, '') : 'Movie Title',
        year: item?.rDate ? moment(item.rDate).format('YYYY') : '',
        id: item?.id || ''
      };
      
      router.push({
        pathname: 'createReview',
        params: { 
          movie: JSON.stringify(movieData),
          movieId: item?.id || '',
          reviewState: JSON.stringify(reviewData)
        }
      });
    };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.indicator}
      style={styles.bottomSheetContainer}
    >
      <View style={styles.contentContainer}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.title}>
          {item?.body && (
                                <RenderHtml
                                    contentWidth={wp(90)}
                                    source={{ html: item.body }}
                                    tagsStyles={titleTagsStyles}
                                />
                            )}
          </Text>
          <Text style={styles.dtitle}>
            {releaseAt}
          </Text>
        </View>
        <View style={styles.greenBorderTop} />
        <StarRating rating={rating} onRatingChange={setRating} />
        <View style={styles.greenBorderTop} />  
          {/* Text write a review with icon first */}

          <TouchableOpacity 
            style={styles.writeReviewContainer} 
            onPress={handleNavigateToWriteReview}
          >
            <Icon name="pencil" size={hp(2.8)} color={theme.colors.silver} />
            <Text style={styles.writeReviewText}>{reviewText
              ? `Your review: ${reviewText.length > 12 ? reviewText.slice(0, 12) + '...' : reviewText}`
              : 'Write a review'}</Text>
          </TouchableOpacity>

        <View style={styles.greenBorderTop} />
        {/* Cup of Tea Buttons */}
        <View style={styles.cupOfTeaContainer}>
          <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.leftButton,
              cupOfTea === "My Cup of Tea" && styles.cupButtonSelected
            ]}
            onPress={() => setCupOfTea(cupOfTea === "My Cup of Tea" ? null : "My Cup of Tea")}
          >
            <Text style={[
              styles.cupButtonText,
              cupOfTea === "My Cup of Tea" && styles.cupButtonTextSelected
            ]}>My Cup of Tea</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.rightButton,
              cupOfTea === "Not My Cup of Tea" && styles.cupButtonSelectedx
            ]}
            onPress={() => setCupOfTea(cupOfTea === "Not My Cup of Tea" ? null : "Not My Cup of Tea")}
          >
            <Text style={[
              styles.cupButtonText,
              cupOfTea === "Not My Cup of Tea" && styles.cupButtonTextSelected
            ]}>Not My Cup of Tea</Text>
          </TouchableOpacity>
          </View>
          
          {/* Prefer - Theatre vs OTT Watch */}
          <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.leftButton,
              prefer === "Theatre Watch" && styles.cupButtonSelected
            ]}
            onPress={() => setPrefer(prefer === "Theatre Watch" ? null : "Theatre Watch")}
          >
            <Text style={[
              styles.cupButtonText,
              prefer === "Theatre Watch" && styles.cupButtonTextSelected
            ]}>Prefer Theatre Watch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.rightButton,
              prefer === "OTT Watch" && styles.cupButtonSelectedx
            ]}
            onPress={() => setPrefer(prefer === "OTT Watch" ? null : "OTT Watch")}
          >
            <Text style={[
              styles.cupButtonText,
              prefer === "OTT Watch" && styles.cupButtonTextSelected
            ]}>Prefer OTT Watch</Text>
          </TouchableOpacity>
          </View>

          {/* Predict - Predictable vs Not Predictable */}
          <View style={styles.buttonGroup}>
          <TouchableOpacity
              style={[
                styles.cupButton,
                styles.leftButton,
                predict === "Predictable" && styles.cupButtonSelected
              ]}
              onPress={() => setPredict(predict === "Predictable" ? null : "Predictable")}
            >
              <Text style={[
                styles.cupButtonText,
                predict === "Predictable" && styles.cupButtonTextSelected
              ]}>Unpredictable Story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cupButton,
                styles.rightButton,
                predict === "Not Predictable" && styles.cupButtonSelectedx
              ]}
              onPress={() => setPredict(predict === "Not Predictable" ? null : "Not Predictable")}
            >
              <Text style={[
                styles.cupButtonText,
                predict === "Not Predictable" && styles.cupButtonTextSelected
              ]}>Predictable Story</Text>
            </TouchableOpacity>
          </View>
          
          {/* Repeat - Repeat Watchable vs One Time Watchable */}
          <View style={styles.buttonGroup}>
          <TouchableOpacity
           style={[
          styles.cupButton,
          styles.leftButton,
              repeat === "Repeat Watchable" && styles.cupButtonSelected
            ]}
            onPress={() => setRepeat(repeat === "Repeat Watchable" ? null : "Repeat Watchable")}
          >
            <Text style={[
              styles.cupButtonText,
              repeat === "Repeat Watchable" && styles.cupButtonTextSelected
            ]}>Repeat Watchable</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.rightButton,
              repeat === "One Time Watchable" && styles.cupButtonSelectedx
            ]}
            onPress={() => setRepeat(repeat === "One Time Watchable" ? null : "One Time Watchable")}
          >
            <Text style={[
              styles.cupButtonText,
              repeat === "One Time Watchable" && styles.cupButtonTextSelected
            ]}>One Time Watchable</Text>
          </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={rating === 0}
          >
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

export default RatingBottomSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor:  'linear-gradient(to top,rgb(30, 30, 30),rgb(56, 56, 56))',
  },
  indicator: {
    backgroundColor: '#FFFFFF',
    width: wp(10),
  },
  contentContainer: {
    flex: 1,
    padding: hp(1),
    alignItems: 'center',
    paddingBottom: 0
  },
  title: {
    fontSize: hp(1.7),
    fontWeight: '600',
    marginBottom: hp(2),
    color: '#FFFFFF',
  },
  dtitle:{
    fontSize: hp(1),
    fontWeight: '600',
    marginBottom: hp(2),
    color: 'gray',
  },
  ratingText: {
    textAlign: 'center',
    marginTop: hp(3),
    fontSize: hp(1.8),
    color: '#A0A0A0',
    marginBottom: hp(1),
  },
  cupOfTeaContainer: {
    width: '100%',
    marginTop: hp(2),
  },
  toggleText: {
    color: '#A0A0A0',
    marginBottom: hp(1),
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(1),
  },
  cupButton: {
    backgroundColor: '#333333',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    flex: 1,
    marginHorizontal: wp(1),
    alignItems: 'center',
  },

  leftButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    borderWidth: 1,
  },
  rightButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)', 
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderWidth: 1,
  },
  cupButtonSelected: {
    backgroundColor: 'green', 
  },
  cupButtonSelectedx: {
    backgroundColor: 'red'
  },
  cupButtonText: {
    color: '#FFFFFF',
  },
  cupButtonTextSelected: {
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(3),
  },
  cancelButton: {
    backgroundColor: '#333333',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    flex: 1,
    marginRight: wp(2),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: hp(1),
    flex: 1,
    marginLeft: wp(2),
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
  bottomSheetContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1000,
  },
  greenBorderTop: {
    width: '100%',
    height: hp(0.2),
    backgroundColor: theme.colors.gray,
    opacity: 0.3,
  },
  writeReviewContainer: {
    flexDirection: 'row',
    alignItems: 'left',
   // justifyContent: 'space-between',
    width: '100%',
    paddingVertical: hp(2),
    marginLeft: wp(5),
  },
  writeReviewText: {
    color: 'gray',
    fontSize: hp(1.8),
    fontWeight: '600',
    marginLeft: wp(2),
  }
});