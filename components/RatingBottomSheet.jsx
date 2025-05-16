import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, PanResponder } from 'react-native';
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
    if (fillPercentage >= 1) return theme.colors.star;
    return "url(#partialGradient)";
  };

  return (
    <Svg width={64} height={64} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="partialGradient" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor= {theme.colors.star} stopOpacity="1" />
          <Stop offset={fillPercentage} stopColor={theme.colors.star} stopOpacity="1" />
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
  // Refs for component dimensions and star positions
  const containerRef = useRef(null);
  const [containerLayout, setContainerLayout] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
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
    // Skip if we're currently dragging to avoid conflicts
    if (isDragging) return;
    
    // Get the relative X position within the star (0-1)
    const { locationX } = event.nativeEvent;
    const starWidth = 35; // Width of the star touch area
    
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

  // Function to calculate rating based on touch position
  const calculateRatingFromTouchEvent = useCallback((pageX) => {
    if (!containerLayout) return;
    
    // Get position relative to container
    const touchX = Math.max(0, Math.min(containerLayout.width, pageX - containerLayout.x));
    
    // Star width including gap
    const totalStarWidth = containerLayout.width / 5;
    
    // Calculate star position (1-5) and position within star (0-1)
    const starPosition = Math.ceil(touchX / totalStarWidth);
    const posWithinStar = (touchX % totalStarWidth) / totalStarWidth;
    
    // Calculate the exact rating with 0.1 precision
    let newRating;
    
    if (touchX <= 0) {
      newRating = 0;
    } else {
      // Calculate star number (1-5) and position within that star (0-1)
      const baseRating = starPosition - 1;
      const partialRating = Math.round(posWithinStar * 10) / 10;
      newRating = Math.min(5, Math.max(0, baseRating + partialRating));
    }
    
    onRatingChange(newRating);
  }, [containerLayout, onRatingChange]);

  // Create a PanResponder for sliding rating functionality
  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        calculateRatingFromTouchEvent(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        calculateRatingFromTouchEvent(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: () => {
        // Add a small delay before allowing touches again
        setTimeout(() => setIsDragging(false), 100);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      }
    }),
    [calculateRatingFromTouchEvent]
  );

  // Measure container layout after render and when visibility changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.measure((x, y, width, height, pageX, pageY) => {
          setContainerLayout({ x: pageX, y: pageY, width, height });
        });
      }
    }, 100); // Small delay to ensure the component is fully rendered
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <View style={{ marginTop: hp(2) }}>
      <View 
        ref={containerRef}
        {...panResponder.panHandlers}
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginEnd: wp(3),
          justifyContent: 'space-between',
          width: '100%', 
          paddingHorizontal: 40,
          height: 50 // Make touch area taller for easier sliding
        }}
      >
        {[1, 2, 3, 4, 5].map((position) => (
          <View 
            key={position}
            style={{
              width: 35,
              height: 35,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TouchableOpacity
              onPress={(event) => handleStarPress(event, position)}
              activeOpacity={0.7}
              style={{
                width: 35,
                height: 35,
              }}
              disabled={isDragging}
            >
              <StarIcon fillPercentage={getStarFillPercentage(position)} />
            </TouchableOpacity>
          </View>
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
  const [favour, setFavour] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const bottomSheetRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log("value of favour favour", favour);

   // Use the review context
   const { activeReview, clearReviewData, updateFavoriteStatus } = useReview();
  
   // Update the reviewText from context when the sheet becomes visible
   useEffect(() => {
     if (visible && activeReview.reviewText) {
       setReviewText(activeReview.reviewText);
       setFavour(activeReview.isFavorite);
      // console.log("Review text from context:", activeReview.reviewText);
     }
   }, [visible, activeReview]);

  const titleTagsStyles = {
    div: {
         color: 'white',
         fontSize: hp(2),
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
  const snapPoints = useMemo(() => ['63%'], []);

  // Callbacks
  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      handleClose();
    }
  }, []);

  const handleSubmit = () => {
    // Pass all values to onSubmit
    onSubmit(rating, cupOfTea, prefer, predict, repeat, activeReview.reviewText || reviewText, favour);
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
    updateFavoriteStatus(false);
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
        id: item?.id || '',
        image: item?.filel
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
      // handleIndicatorStyle={styles.indicator}
      handleIndicatorStyle={{ display: 'none' }}
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
          {/* <Text style={styles.dtitle}>
            {releaseAt}
          </Text> */}
        </View>
        <View style={styles.greenBorderTop} />
        <StarRating rating={rating} onRatingChange={setRating} />
        <View style={styles.greenBorderTop} />  
          {/* Text write a review with icon first */}

          <TouchableOpacity 
            style={styles.writeReviewContainer} 
            onPress={handleNavigateToWriteReview}
          >
            <Icon name="pencil" size={hp(2.2)} color={theme.colors.silver} />
            <Text style={styles.writeReviewText}>{reviewText
              ? `${reviewText.length > 12 ? reviewText.slice(0, 32) + '...' : reviewText}`
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
              cupOfTea === "x" && styles.cupButtonSelected
            ]}
            onPress={() => setCupOfTea(cupOfTea === "x" ? null : "x")}
          >
            <Text style={[
              styles.cupButtonText,
              cupOfTea === "x" && styles.cupButtonTextSelected
            ]}>My Cup of Tea</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.rightButton,
              cupOfTea === "y" && styles.cupButtonSelectedx
            ]}
            onPress={() => setCupOfTea(cupOfTea === "y" ? null : "y")}
          >
            <Text style={[
              styles.cupButtonText,
              cupOfTea === "y" && styles.cupButtonTextSelected
            ]}>Not My Cup of Tea</Text>
          </TouchableOpacity>
          </View>
          
          {/* Prefer - Theatre vs OTT Watch */}
          <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.leftButton,
              prefer === "p" && styles.cupButtonSelected
            ]}
            onPress={() => setPrefer(prefer === "p" ? null : "p")}
          >
            <Text style={[
              styles.cupButtonText,
              prefer === "p" && styles.cupButtonTextSelected
            ]}>Prefer Theatre Watch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.rightButton,
              prefer === "q" && styles.cupButtonSelectedx
            ]}
            onPress={() => setPrefer(prefer === "q" ? null : "q")}
          >
            <Text style={[
              styles.cupButtonText,
              prefer === "q" && styles.cupButtonTextSelected
            ]}>Prefer OTT Watch</Text>
          </TouchableOpacity>
          </View>

          {/* Predict - Predictable vs Not Predictable */}
          <View style={styles.buttonGroup}>
          <TouchableOpacity
              style={[
                styles.cupButton,
                styles.leftButton,
                predict === "a" && styles.cupButtonSelected
              ]}
              onPress={() => setPredict(predict === "a" ? null : "a")}
            >
              <Text style={[
                styles.cupButtonText,
                predict === "a" && styles.cupButtonTextSelected
              ]}>Unpredictable Story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cupButton,
                styles.rightButton,
                predict === "b" && styles.cupButtonSelectedx
              ]}
              onPress={() => setPredict(predict === "b" ? null : "b")}
            >
              <Text style={[
                styles.cupButtonText,
                predict === "b" && styles.cupButtonTextSelected
              ]}>Predictable Story</Text>
            </TouchableOpacity>
          </View>
          
          {/* Repeat - Repeat Watchable vs One Time Watchable */}
          <View style={styles.buttonGroup}>
          <TouchableOpacity
           style={[
          styles.cupButton,
          styles.leftButton,
              repeat === "r" && styles.cupButtonSelected
            ]}
            onPress={() => setRepeat(repeat === "r" ? null : "r")}
          >
            <Text style={[
              styles.cupButtonText,
              repeat === "r" && styles.cupButtonTextSelected
            ]}>Repeat Watchable</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cupButton,
              styles.rightButton,
              repeat === "o" && styles.cupButtonSelectedx
            ]}
            onPress={() => setRepeat(repeat === "o" ? null : "o")}
          >
            <Text style={[
              styles.cupButtonText,
              repeat === "o" && styles.cupButtonTextSelected
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
    backgroundColor:  '#1A252B',
  },
  indicator: {
    backgroundColor: 'transparent',
    width: wp(10),
  },
  contentContainer: {
    flex: 1,
    padding: hp(1),
    alignItems: 'center',
    paddingBottom: 0
  },
  title: {
    fontSize: hp(2.2),
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
    fontSize: hp(1.6),
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