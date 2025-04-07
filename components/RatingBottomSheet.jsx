import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';
import RenderHtml from 'react-native-render-html';
import moment from 'moment';

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
  const bottomSheetRef = useRef(null);

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
  const snapPoints = useMemo(() => ['53%'], []);

  // Callbacks
  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      handleClose();
    }
  }, []);

  const handleSubmit = () => {
    // Pass all values to onSubmit
    onSubmit(rating, cupOfTea, prefer, predict, repeat);
    resetState();
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
              ]}>Predictable Story</Text>
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
              ]}>Unpredictable Story</Text>
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
  }
});



// import React, { useState, useRef, useCallback, useMemo } from 'react';
// import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
// import BottomSheet from '@gorhom/bottom-sheet';
// import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const StarIcon = ({ state = 'empty' }) => {
//   const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
//   const getFillColor = () => {
//     switch (state) {
//       case 'full':
//         return "#FFD700";
//       case 'half':
//         return "url(#halfGradient)";
//       default:
//         return "none";
//     }
//   };

//   return (
//     <Svg width={46} height={46} viewBox="0 0 24 24">
//       <Defs>
//         <LinearGradient id="halfGradient" x1="0" x2="1" y1="0" y2="0">
//           <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="transparent" stopOpacity="0" />
//           <Stop offset="1" stopColor="transparent" stopOpacity="0" />
//         </LinearGradient>
//         <ClipPath id="starClip">
//           <Path d={starPath} />
//         </ClipPath>
//       </Defs>
//       <Path
//         d={starPath}
//         fill="#e5e7eb"
//         stroke="#d1d5db"
//         strokeWidth={1}
//       />
//       <Rect
//         x="0"
//         y="0"
//         width="24"
//         height="24"
//         fill={getFillColor()}
//         clipPath="url(#starClip)"
//       />
//     </Svg>
//   );
// };

// const StarRating = ({ rating, onRatingChange }) => {
//   const getStarState = (position) => {
//     if (rating >= position) return 'full';
//     if (rating >= position - 0.5) return 'half';
//     return 'empty';
//   };

//   const handleStarPress = (position, isLeft) => {
//     let newRating;
//     if (isLeft) {
//       if (rating === position - 0.5) {
//         newRating = 0;
//       } else {
//         newRating = position - 0.5;
//       }
//     } else {
//       if (rating === position) {
//         newRating = position - 0.5;
//       } else {
//         newRating = position;
//       }
//     }
//     onRatingChange(newRating);
//   };

//   return (
//     <View style={{ marginTop: hp(2) }}>
//       <View style={{ flexDirection: 'row', gap: 14 }}>
//         {[1, 2, 3, 4, 5].map((position) => (
//           <View key={position} style={{ flexDirection: 'row' }}>
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, true)}
//             />
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, false)}
//             >
//               <View style={{ position: 'absolute', left: -22 }}>
//                 <StarIcon state={getStarState(position)} />
//               </View>
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>
//       <Text style={styles.ratingText}>
//         Rating: {rating.toFixed(1)} / 5.0
//       </Text>
//     </View>
//   );
// };

// const RatingBottomSheet = ({ visible, onClose, onSubmit }) => {
//   const [rating, setRating] = useState(0);
//   const [cupOfTea, setCupOfTea] = useState(null);
//   // Added new state variables for the three new fields
//   const [prefer, setPrefer] = useState(null);
//   const [predict, setPredict] = useState(null);
//   const [repeat, setRepeat] = useState(null);
//   const bottomSheetRef = useRef(null);
  
//   // Snap points for the bottom sheet (50% of screen height)
//   const snapPoints = useMemo(() => ['52%'], []);

//   // Callbacks
//   const handleSheetChanges = useCallback((index) => {
//     if (index === -1) {
//       handleClose();
//     }
//   }, []);

//   const handleSubmit = () => {
//     // Pass all values to onSubmit
//     onSubmit(rating, cupOfTea, prefer, predict, repeat);
//     resetState();
//     bottomSheetRef.current?.close();
//   };

//   const handleClose = () => {
//     resetState();
//     onClose();
//   };

//   const resetState = () => {
//     setRating(0);
//     setCupOfTea(null);
//     setPrefer(null);
//     setPredict(null);
//     setRepeat(null);
//   };

//   // Effect to open/close bottom sheet based on visible prop
//   React.useEffect(() => {
//     if (visible) {
//       bottomSheetRef.current?.expand();
//     } else {
//       bottomSheetRef.current?.close();
//     }
//   }, [visible]);

//   // Helper function to determine if a button is a "Not" button
//   const isNotButton = (buttonText) => {
//     return buttonText.includes('Not');
//   };

//   return (
//     <BottomSheet
//       ref={bottomSheetRef}
//       index={visible ? 0 : -1}
//       snapPoints={snapPoints}
//       onChange={handleSheetChanges}
//       enablePanDownToClose={true}
//       backgroundStyle={styles.sheetBackground}
//       handleIndicatorStyle={styles.indicator}
//       style={styles.bottomSheetContainer}
//     >
//       <View style={styles.contentContainer}>
//         <View style={{ flexDirection: 'row', gap: 8 }}>
//           <Text style={styles.title}>
//             Invisible
//           </Text>
//           <Text style={styles.dtitle}>
//             APR 22
//           </Text>
//         </View>
//         <View style={styles.greenBorderTop} />
//         <StarRating rating={rating} onRatingChange={setRating} />
        
//         {/* Cup of Tea Buttons */}
//         <View style={styles.cupOfTeaContainer}>
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.leftButton,
//               cupOfTea === "My Cup of Tea" && styles.cupButtonSelected
//             ]}
//             onPress={() => setCupOfTea(cupOfTea === "My Cup of Tea" ? null : "My Cup of Tea")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               cupOfTea === "My Cup of Tea" && styles.cupButtonTextSelected
//             ]}>My Cup of Tea</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.rightButton,
//               cupOfTea === "Not My Cup of Tea" && styles.cupButtonSelectedx
//             ]}
//             onPress={() => setCupOfTea(cupOfTea === "Not My Cup of Tea" ? null : "Not My Cup of Tea")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               cupOfTea === "Not My Cup of Tea" && styles.cupButtonTextSelected
//             ]}>Not My Cup of Tea</Text>
//           </TouchableOpacity>
//           </View>
          
//           {/* Prefer - Theatre vs OTT Watch */}
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.leftButton,
//               prefer === "Theatre Watch" && styles.cupButtonSelected
//             ]}
//             onPress={() => setPrefer(prefer === "Theatre Watch" ? null : "Theatre Watch")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               prefer === "Theatre Watch" && styles.cupButtonTextSelected
//             ]}>Prefer Theatre Watch</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.rightButton,
//               prefer === "OTT Watch" && styles.cupButtonSelectedx
//             ]}
//             onPress={() => setPrefer(prefer === "OTT Watch" ? null : "OTT Watch")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               prefer === "OTT Watch" && styles.cupButtonTextSelected
//             ]}>Prefer OTT Watch</Text>
//           </TouchableOpacity>
//           </View>

//           {/* Predict - Predictable vs Not Predictable */}
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.leftButton,
//                 predict === "Predictable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setPredict(predict === "Predictable" ? null : "Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 predict === "Predictable" && styles.cupButtonTextSelected
//               ]}>Predictable Story</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.rightButton,
//                 predict === "Not Predictable" && styles.cupButtonSelectedx
//               ]}
//               onPress={() => setPredict(predict === "Not Predictable" ? null : "Not Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 predict === "Not Predictable" && styles.cupButtonTextSelected
//               ]}>Unredictable Story</Text>
//             </TouchableOpacity>
//           </View>
          
//           {/* Repeat - Repeat Watchable vs One Time Watchable */}
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//            style={[
//           styles.cupButton,
//           styles.leftButton,
//               repeat === "Repeat Watchable" && styles.cupButtonSelected
//             ]}
//             onPress={() => setRepeat(repeat === "Repeat Watchable" ? null : "Repeat Watchable")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               repeat === "Repeat Watchable" && styles.cupButtonTextSelected
//             ]}>Repeat Watchable</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.rightButton,
//               repeat === "One Time Watchable" && styles.cupButtonSelectedx
//             ]}
//             onPress={() => setRepeat(repeat === "One Time Watchable" ? null : "One Time Watchable")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               repeat === "One Time Watchable" && styles.cupButtonTextSelected
//             ]}>One Time Watchable</Text>
//           </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={handleClose}
//           >
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               rating === 0 && styles.submitButtonDisabled
//             ]}
//             onPress={handleSubmit}
//             disabled={rating === 0}
//           >
//             <Text style={styles.submitButtonText}>Submit Review</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </BottomSheet>
//   );
// };

// export default RatingBottomSheet;

// const styles = StyleSheet.create({
//   sheetBackground: {
//     backgroundColor: 'black',
//   },
//   indicator: {
//     backgroundColor: '#FFFFFF',
//     width: wp(10),
//   },
//   contentContainer: {
//     flex: 1,
//     padding: hp(1),
//     alignItems: 'center',
//     paddingBottom: 0
//   },
//   title: {
//     fontSize: hp(1.7),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: '#FFFFFF',
//   },
//   dtitle:{
//     fontSize: hp(1),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: 'gray',
//   },
//   ratingText: {
//     textAlign: 'center',
//     marginTop: hp(3),
//     fontSize: hp(1.8),
//     color: '#A0A0A0',
//   },
//   cupOfTeaContainer: {
//     width: '100%',
//     marginTop: hp(2),
//   },
//   toggleText: {
//     color: '#A0A0A0',
//     marginBottom: hp(1),
//   },
//   buttonGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(1),
//   },
//   cupButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginHorizontal: wp(1),
//     alignItems: 'center',
//   },

//   leftButton: {
//     backgroundColor: 'rgba(34, 197, 94, 0.2)',
//     borderColor: 'rgba(34, 197, 94, 0.5)',
//     borderWidth: 1,
//   },
//   rightButton: {
//     backgroundColor: 'rgba(239, 68, 68, 0.2)', 
//     borderColor: 'rgba(239, 68, 68, 0.5)',
//     borderWidth: 1,
//   },
//   cupButtonSelected: {
//     backgroundColor: 'green', 
//   },
//   cupButtonSelectedx: {
//     backgroundColor: 'red', 
//   },
//   cupButtonText: {
//     color: '#FFFFFF',
//   },
//   cupButtonTextSelected: {
//     fontWeight: '600',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(3),
//   },
//   cancelButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginRight: wp(2),
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#FFFFFF',
//   },
//   submitButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginLeft: wp(2),
//     alignItems: 'center',
//   },
//   submitButtonDisabled: {
//     opacity: 0.5,
//   },
//   submitButtonText: {
//     color: '#FFFFFF',
//   },
//   bottomSheetContainer: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     zIndex: 1000,
//   },
//   greenBorderTop: {
//     width: '100%',
//     height: hp(0.2),
//     backgroundColor: theme.colors.gray,
//     opacity: 0.3,
//   }
// });

// import React, { useState, useRef, useCallback, useMemo } from 'react';
// import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
// import BottomSheet from '@gorhom/bottom-sheet';
// import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const StarIcon = ({ state = 'empty' }) => {
//   const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
//   const getFillColor = () => {
//     switch (state) {
//       case 'full':
//         return "#FFD700";
//       case 'half':
//         return "url(#halfGradient)";
//       default:
//         return "none";
//     }
//   };

//   return (
//     <Svg width={46} height={46} viewBox="0 0 24 24">
//       <Defs>
//         <LinearGradient id="halfGradient" x1="0" x2="24" y1="0" y2="0">
//           <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="1" stopColor="#FFD700" stopOpacity="1" />
//         </LinearGradient>
//         <ClipPath id="starClip">
//           <Path d={starPath} />
//         </ClipPath>
//       </Defs>
//       <Path
//         d={starPath}
//         fill="#e5e7eb"  //  #FFD700   #e5e7eb  #facc15   #FFD700
//         stroke="#d1d5db"
//         strokeWidth={1}
//       />
//       <Rect
//         x="0"
//         y="0"
//         width="24"
//         height="24"
//         fill={getFillColor()}
//         clipPath="url(#starClip)"
//       />
//     </Svg>
//   );
// };

// const StarRating = ({ rating, onRatingChange }) => {
//   const getStarState = (position) => {
//     if (rating >= position) return 'full';
//     if (rating >= position - 0.5) return 'half';
//     return 'empty';
//   };

//   const handleStarPress = (position, isLeft) => {
//     let newRating;
//     if (isLeft) {
//       if (rating === position - 0.5) {
//         newRating = 0;
//       } else {
//         newRating = position - 0.5;
//       }
//     } else {
//       if (rating === position) {
//         newRating = position - 0.5;
//       } else {
//         newRating = position;
//       }
//     }
//     onRatingChange(newRating);
//   };

//   return (
//     <View style={{ marginTop: hp(2) }}>
//       <View style={{ flexDirection: 'row', gap: 14 }}>
//         {[1, 2, 3, 4, 5].map((position) => (
//           <View key={position} style={{ flexDirection: 'row' }}>
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, true)}
//             />
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, false)}
//             >
//               <View style={{ position: 'absolute', left: -22 }}>
//                 <StarIcon state={getStarState(position)} />
//               </View>
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>
//       <Text style={styles.ratingText}>
//         Rating: {rating.toFixed(1)} / 5.0
//       </Text>
//     </View>
//   );
// };

// const RatingBottomSheet = ({ visible, onClose, onSubmit }) => {
//   const [rating, setRating] = useState(0);
//   const [cupOfTea, setCupOfTea] = useState(null);
//   // Added new state variables for the three new fields
//   const [prefer, setPrefer] = useState(null);
//   const [predict, setPredict] = useState(null);
//   const [repeat, setRepeat] = useState(null);
//   const bottomSheetRef = useRef(null);
  
//   // Snap points for the bottom sheet (50% of screen height)
//   const snapPoints = useMemo(() => ['52%'], []);

//   // Callbacks
//   const handleSheetChanges = useCallback((index) => {
//     if (index === -1) {
//       handleClose();
//     }
//   }, []);

//   const handleSubmit = () => {
//     // Pass all values to onSubmit
//     onSubmit(rating, cupOfTea, prefer, predict, repeat);
//     resetState();
//     bottomSheetRef.current?.close();
//   };

//   const handleClose = () => {
//     resetState();
//     onClose();
//   };

//   const resetState = () => {
//     setRating(0);
//     setCupOfTea(null);
//     setPrefer(null);
//     setPredict(null);
//     setRepeat(null);
//   };

//   // Effect to open/close bottom sheet based on visible prop
//   React.useEffect(() => {
//     if (visible) {
//       bottomSheetRef.current?.expand();
//     } else {
//       bottomSheetRef.current?.close();
//     }
//   }, [visible]);

//   // Helper function to determine if a button is a "Not" button
//   const isNotButton = (buttonText) => {
//     return buttonText.includes('Not');
//   };

//   return (
//     <BottomSheet
//       ref={bottomSheetRef}
//       index={visible ? 0 : -1}
//       snapPoints={snapPoints}
//       onChange={handleSheetChanges}
//       enablePanDownToClose={true}
//       backgroundStyle={styles.sheetBackground}
//       handleIndicatorStyle={styles.indicator}
//       style={styles.bottomSheetContainer}
//     >
//       <View style={styles.contentContainer}>
//         <View style={{ flexDirection: 'row', gap: 8 }}>
//           <Text style={styles.title}>
//             Invisible
//           </Text>
//           <Text style={styles.dtitle}>
//             APR 22
//           </Text>
//         </View>
//         <View style={styles.greenBorderTop} />
//         <StarRating rating={rating} onRatingChange={setRating} />
        
//         {/* Cup of Tea Buttons */}
//         <View style={styles.cupOfTeaContainer}>
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.leftButton,
//               cupOfTea === "My Cup of Tea" && styles.cupButtonSelected
//             ]}
//             onPress={() => setCupOfTea(cupOfTea === "My Cup of Tea" ? null : "My Cup of Tea")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               cupOfTea === "My Cup of Tea" && styles.cupButtonTextSelected
//             ]}>My Cup of Tea</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.rightButton,
//               cupOfTea === "Not My Cup of Tea" && styles.cupButtonSelected
//             ]}
//             onPress={() => setCupOfTea(cupOfTea === "Not My Cup of Tea" ? null : "Not My Cup of Tea")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               cupOfTea === "Not My Cup of Tea" && styles.cupButtonTextSelected
//             ]}>Not My Cup of Tea</Text>
//           </TouchableOpacity>
//           </View>
          
//           {/* Prefer - Theatre vs OTT Watch */}
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.leftButton,
//               prefer === "Theatre Watch" && styles.cupButtonSelected
//             ]}
//             onPress={() => setPrefer(prefer === "Theatre Watch" ? null : "Theatre Watch")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               prefer === "Theatre Watch" && styles.cupButtonTextSelected
//             ]}>Prefer Theatre Watch</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.rightButton,
//               prefer === "OTT Watch" && styles.cupButtonSelected
//             ]}
//             onPress={() => setPrefer(prefer === "OTT Watch" ? null : "OTT Watch")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               prefer === "OTT Watch" && styles.cupButtonTextSelected
//             ]}>Prefer OTT Watch</Text>
//           </TouchableOpacity>
//           </View>

//           {/* Predict - Predictable vs Not Predictable */}
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.leftButton,
//                 predict === "Predictable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setPredict(predict === "Predictable" ? null : "Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 predict === "Predictable" && styles.cupButtonTextSelected
//               ]}>Predictable Story</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.rightButton,
//                 predict === "Not Predictable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setPredict(predict === "Not Predictable" ? null : "Not Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 predict === "Not Predictable" && styles.cupButtonTextSelected
//               ]}>Not Predictable Story</Text>
//             </TouchableOpacity>
//           </View>
          
//           {/* Repeat - Repeat Watchable vs One Time Watchable */}
//           <View style={styles.buttonGroup}>
//           <TouchableOpacity
//            style={[
//           styles.cupButton,
//           styles.leftButton,
//               repeat === "Repeat Watchable" && styles.cupButtonSelected
//             ]}
//             onPress={() => setRepeat(repeat === "Repeat Watchable" ? null : "Repeat Watchable")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               repeat === "Repeat Watchable" && styles.cupButtonTextSelected
//             ]}>Repeat Watchable</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.cupButton,
//               styles.rightButton,
//               repeat === "One Time Watchable" && styles.cupButtonSelected
//             ]}
//             onPress={() => setRepeat(repeat === "One Time Watchable" ? null : "One Time Watchable")}
//           >
//             <Text style={[
//               styles.cupButtonText,
//               repeat === "One Time Watchable" && styles.cupButtonTextSelected
//             ]}>One Time Watchable</Text>
//           </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={handleClose}
//           >
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               rating === 0 && styles.submitButtonDisabled
//             ]}
//             onPress={handleSubmit}
//             disabled={rating === 0}
//           >
//             <Text style={styles.submitButtonText}>Submit Review</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </BottomSheet>
//   );
// };

// export default RatingBottomSheet;

// const styles = StyleSheet.create({
//   sheetBackground: {
//     backgroundColor: 'black',
//   },
//   indicator: {
//     backgroundColor: '#FFFFFF',
//     width: wp(10),
//   },
//   contentContainer: {
//     flex: 1,
//     padding: hp(1),
//     alignItems: 'center',
//     paddingBottom: 0
//   },
//   title: {
//     fontSize: hp(1.7),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: '#FFFFFF',
//   },
//   dtitle:{
//     fontSize: hp(1),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: 'gray',
//   },
//   ratingText: {
//     textAlign: 'center',
//     marginTop: hp(3),
//     fontSize: hp(1.8),
//     color: '#A0A0A0',
//   },
//   cupOfTeaContainer: {
//     width: '100%',
//     marginTop: hp(2),
//   },
//   toggleText: {
//     color: '#A0A0A0',
//     marginBottom: hp(1),
//   },
//   buttonGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(1),
//   },
//   cupButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginHorizontal: wp(1),
//     alignItems: 'center',
//   },

//   leftButton: {
//     backgroundColor: 'rgba(34, 197, 94, 0.2)',
//     borderColor: 'rgba(34, 197, 94, 0.5)',
//     borderWidth: 1,
//   },
//   rightButton: {
//     backgroundColor: 'rgba(239, 68, 68, 0.2)', 
//     borderColor: 'rgba(239, 68, 68, 0.5)',
//     borderWidth: 1,
//   },
//   cupButtonSelected: {
//     backgroundColor: 'green', 
//   },
//   cupButtonText: {
//     color: '#FFFFFF',
//   },
//   cupButtonTextSelected: {
//     fontWeight: '600',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(3),
//   },
//   cancelButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginRight: wp(2),
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#FFFFFF',
//   },
//   submitButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginLeft: wp(2),
//     alignItems: 'center',
//   },
//   submitButtonDisabled: {
//     opacity: 0.5,
//   },
//   submitButtonText: {
//     color: '#FFFFFF',
//   },
//   bottomSheetContainer: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     zIndex: 1000,
//   },
//   greenBorderTop: {
//     width: '100%',
//     height: hp(0.2),
//     backgroundColor: theme.colors.gray,
//     opacity: 0.3,
//   }
// });




// import React, { useState, useRef, useCallback, useMemo } from 'react';
// import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
// import BottomSheet from '@gorhom/bottom-sheet';
// import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const StarIcon = ({ state = 'empty' }) => {
//   const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
//   const getFillColor = () => {
//     switch (state) {
//       case 'full':
//         return "#FFD700";
//       case 'half':
//         return "url(#halfGradient)";
//       default:
//         return "none";
//     }
//   };

//   return (
//     <Svg width={46} height={46} viewBox="0 0 24 24">
//       <Defs>
//         <LinearGradient id="halfGradient" x1="0" x2="24" y1="0" y2="0">
//           <Stop offset="0" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#FFD700" stopOpacity="1" />
//           <Stop offset="1" stopColor="#FFD700" stopOpacity="1" />
//         </LinearGradient>
//         <ClipPath id="starClip">
//           <Path d={starPath} />
//         </ClipPath>
//       </Defs>
//       <Path
//         d={starPath}
//         fill="#e5e7eb"  //  #FFD700   #e5e7eb  #facc15   #FFD700
//         stroke="#d1d5db"
//         strokeWidth={1}
//       />
//       <Rect
//         x="0"
//         y="0"
//         width="24"
//         height="24"
//         fill={getFillColor()}
//         clipPath="url(#starClip)"
//       />
//     </Svg>
//   );
// };

// const StarRating = ({ rating, onRatingChange }) => {
//   const getStarState = (position) => {
//     if (rating >= position) return 'full';
//     if (rating >= position - 0.5) return 'half';
//     return 'empty';
//   };

//   const handleStarPress = (position, isLeft) => {
//     let newRating;
//     if (isLeft) {
//       if (rating === position - 0.5) {
//         newRating = 0;
//       } else {
//         newRating = position - 0.5;
//       }
//     } else {
//       if (rating === position) {
//         newRating = position - 0.5;
//       } else {
//         newRating = position;
//       }
//     }
//     onRatingChange(newRating);
//   };

//   return (
//     <View style={{ marginTop: hp(2) }}>
//       <View style={{ flexDirection: 'row', gap: 14 }}>
//         {[1, 2, 3, 4, 5].map((position) => (
//           <View key={position} style={{ flexDirection: 'row' }}>
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, true)}
//             />
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, false)}
//             >
//               <View style={{ position: 'absolute', left: -22 }}>
//                 <StarIcon state={getStarState(position)} />
//               </View>
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>
//       <Text style={styles.ratingText}>
//         Rating: {rating.toFixed(1)} / 5.0
//       </Text>
//     </View>
//   );
// };

// const RatingBottomSheet = ({ visible, onClose, onSubmit }) => {
//   const [rating, setRating] = useState(0);
//   const [cupOfTea, setCupOfTea] = useState(null);
//   const bottomSheetRef = useRef(null);
  
//   // Snap points for the bottom sheet (50% of screen height)
//   const snapPoints = useMemo(() => ['52%'], []);

//   // Callbacks
//   const handleSheetChanges = useCallback((index) => {
//     if (index === -1) {
//       handleClose();
//     }
//   }, []);

//   const handleSubmit = () => {
//     // Pass cupOfTea as a string value
//     onSubmit(rating, cupOfTea, prefer, predict, repeat);
//     resetState();
//     bottomSheetRef.current?.close();
//   };

//   const handleClose = () => {
//     resetState();
//     onClose();
//   };

//   const resetState = () => {
//     setRating(0);
//     setCupOfTea(null);
//   };

//   // Effect to open/close bottom sheet based on visible prop
//   React.useEffect(() => {
//     if (visible) {
//       bottomSheetRef.current?.expand();
//     } else {
//       bottomSheetRef.current?.close();
//     }
//   }, [visible]);

//   // Helper function to determine if a button is a "Not" button
//   const isNotButton = (buttonText) => {
//     return buttonText.includes('Not');
//   };

//   return (
//     <BottomSheet
//       ref={bottomSheetRef}
//       index={visible ? 0 : -1}
//       snapPoints={snapPoints}
//       onChange={handleSheetChanges}
//       enablePanDownToClose={true}
//       backgroundStyle={styles.sheetBackground}
//       handleIndicatorStyle={styles.indicator}
//       style={styles.bottomSheetContainer}
//     >
//       <View style={styles.contentContainer}>
//         <View style={{ flexDirection: 'row', gap: 8 }}>
//           <Text style={styles.title}>
//             Invisible
//           </Text>
//           <Text style={styles.dtitle}>
//             APR 22
//           </Text>
//         </View>
//         <View style={styles.greenBorderTop} />
//         <StarRating rating={rating} onRatingChange={setRating} />
        
//         {/* Cup of Tea Buttons */}
//         <View style={styles.cupOfTeaContainer}>
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.leftButton, // Add green background for left buttons
//                 cupOfTea === "My Cup of Tea" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("My Cup of Tea")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "My Cup of Tea" && styles.cupButtonTextSelected
//               ]}>My Cup of Tea</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.rightButton, // Add red background for right "Not" buttons
//                 cupOfTea === "Not My Cup of Tea" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Not My Cup of Tea")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Not My Cup of Tea" && styles.cupButtonTextSelected
//               ]}>Not My Cup of Tea</Text>
//             </TouchableOpacity>
//           </View>
          
//           {/* Recommended */}
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.leftButton, // Add green background for left buttons
//                 cupOfTea === "Recommended to Watch" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Recommended to Watch")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Recommended to Watch" && styles.cupButtonTextSelected
//               ]}>Prefer Theatre Watch</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.rightButton, // Add red background for right "Not" buttons
//                 cupOfTea === "Not Recommended" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Not Recommended")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Not Recommended" && styles.cupButtonTextSelected
//               ]}>Prefer OTT Watch</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Predictable */}
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.leftButton, // Add green background for left buttons
//                 cupOfTea === "Predictable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Predictable" && styles.cupButtonTextSelected
//               ]}>Predictable Story</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.rightButton, // Add red background for right "Not" buttons
//                 cupOfTea === "Not Predictable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Not Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Not Predictable" && styles.cupButtonTextSelected
//               ]}>Not Predictable Story</Text>
//             </TouchableOpacity>
//           </View>
          
//           {/* Time of Watch */}
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.leftButton, // Add green background for left buttons
//                 cupOfTea === "One Time Watch" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("One Time Watch")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "One Time Watch" && styles.cupButtonTextSelected
//               ]}>Repeat Watchable</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 styles.rightButton, // This one is not a "Not" button so it gets green background
//                 cupOfTea === "Repeated Watchable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Repeated Watchable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Repeated Watchable" && styles.cupButtonTextSelected
//               ]}>One Time Watchable</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={handleClose}
//           >
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               rating === 0 && styles.submitButtonDisabled
//             ]}
//             onPress={handleSubmit}
//             disabled={rating === 0}
//           >
//             <Text style={styles.submitButtonText}>Submit Review</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </BottomSheet>
//   );
// };

// export default RatingBottomSheet;

// const styles = StyleSheet.create({
//   sheetBackground: {
//     backgroundColor: 'black',
//   },
//   indicator: {
//     backgroundColor: '#FFFFFF',
//     width: wp(10),
//   },
//   contentContainer: {
//     flex: 1,
//     padding: hp(1),
//     alignItems: 'center',
//     paddingBottom: 0
//   },
//   title: {
//     fontSize: hp(1.7),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: '#FFFFFF',
//   },
//   dtitle:{
//     fontSize: hp(1),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: 'gray',
//   },
//   ratingText: {
//     textAlign: 'center',
//     marginTop: hp(3),
//     fontSize: hp(1.8),
//     color: '#A0A0A0',
//   },
//   cupOfTeaContainer: {
//     width: '100%',
//     marginTop: hp(2),
//   },
//   toggleText: {
//     color: '#A0A0A0',
//     marginBottom: hp(1),
//   },
//   buttonGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(1),
//   },
//   cupButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginHorizontal: wp(1),
//     alignItems: 'center',
//   },
//   // New styles for left (green) buttons
//   leftButton: {
//     backgroundColor: 'rgba(34, 197, 94, 0.2)', // Light green with transparency
//     borderColor: 'rgba(34, 197, 94, 0.5)',
//     borderWidth: 1,
//   },
//   // New styles for right (red) "Not" buttons
//   rightButton: {
//     backgroundColor: 'rgba(239, 68, 68, 0.2)', // Light red with transparency
//     borderColor: 'rgba(239, 68, 68, 0.5)',
//     borderWidth: 1,
//   },
//   cupButtonSelected: {
//     backgroundColor: '#3B82F6', // Keep the blue highlight for selected buttons
//   },
//   cupButtonText: {
//     color: '#FFFFFF',
//   },
//   cupButtonTextSelected: {
//     fontWeight: '600',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(3),
//   },
//   cancelButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginRight: wp(2),
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#FFFFFF',
//   },
//   submitButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginLeft: wp(2),
//     alignItems: 'center',
//   },
//   submitButtonDisabled: {
//     opacity: 0.5,
//   },
//   submitButtonText: {
//     color: '#FFFFFF',
//   },
//   bottomSheetContainer: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     zIndex: 1000,
//   },
//   greenBorderTop: {
//     width: '100%',
//     height: hp(0.2),
//     backgroundColor: theme.colors.gray,
//     opacity: 0.3,
//   }
// });




// import React, { useState, useRef, useCallback, useMemo } from 'react';
// import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
// import BottomSheet from '@gorhom/bottom-sheet';
// import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const StarIcon = ({ state = 'empty' }) => {
//   const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
//   const getFillColor = () => {
//     switch (state) {
//       case 'full':
//         return "#facc15";
//       case 'half':
//         return "url(#halfGradient)";
//       default:
//         return "none";
//     }
//   };

//   return (
//     <Svg width={46} height={46} viewBox="0 0 24 24">
//       <Defs>
//         <LinearGradient id="halfGradient" x1="0" x2="24" y1="0" y2="0">
//           <Stop offset="0" stopColor="#facc15" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#facc15" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#e5e7eb" stopOpacity="1" />
//           <Stop offset="1" stopColor="#e5e7eb" stopOpacity="1" />
//         </LinearGradient>
//         <ClipPath id="starClip">
//           <Path d={starPath} />
//         </ClipPath>
//       </Defs>
//       <Path
//         d={starPath}
//         fill="#e5e7eb"
//         stroke="#d1d5db"
//         strokeWidth={1}
//       />
//       <Rect
//         x="0"
//         y="0"
//         width="24"
//         height="24"
//         fill={getFillColor()}
//         clipPath="url(#starClip)"
//       />
//     </Svg>
//   );
// };

// const StarRating = ({ rating, onRatingChange }) => {
//   const getStarState = (position) => {
//     if (rating >= position) return 'full';
//     if (rating >= position - 0.5) return 'half';
//     return 'empty';
//   };

//   const handleStarPress = (position, isLeft) => {
//     let newRating;
//     if (isLeft) {
//       if (rating === position - 0.5) {
//         newRating = 0;
//       } else {
//         newRating = position - 0.5;
//       }
//     } else {
//       if (rating === position) {
//         newRating = position - 0.5;
//       } else {
//         newRating = position;
//       }
//     }
//     onRatingChange(newRating);
//   };

//   return (
//     <View style={{ marginTop: hp(2) }}>
//       <View style={{ flexDirection: 'row', gap: 14 }}>
//         {[1, 2, 3, 4, 5].map((position) => (
//           <View key={position} style={{ flexDirection: 'row' }}>
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, true)}
//             />
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, false)}
//             >
//               <View style={{ position: 'absolute', left: -22 }}>
//                 <StarIcon state={getStarState(position)} />
//               </View>
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>
//       <Text style={styles.ratingText}>
//         Rating: {rating.toFixed(1)} / 5.0
//       </Text>
//     </View>
//   );
// };

// const RatingBottomSheet = ({ visible, onClose, onSubmit }) => {
//   const [rating, setRating] = useState(0);
//   const [cupOfTea, setCupOfTea] = useState(null); // Changed from boolean to string/null
//   const bottomSheetRef = useRef(null);
  
//   // Snap points for the bottom sheet (50% of screen height)
//   const snapPoints = useMemo(() => ['55%'], []);

//   // Callbacks
//   const handleSheetChanges = useCallback((index) => {
//     if (index === -1) {
//       handleClose();
//     }
//   }, []);

//   const handleSubmit = () => {
//     // Pass cupOfTea as a string value
//     onSubmit(rating, cupOfTea, null, null);
//     resetState();
//     bottomSheetRef.current?.close();
//   };

//   const handleClose = () => {
//     resetState();
//     onClose();
//   };

//   const resetState = () => {
//     setRating(0);
//     setCupOfTea(null);
//   };

//   // Effect to open/close bottom sheet based on visible prop
//   React.useEffect(() => {
//     if (visible) {
//       bottomSheetRef.current?.expand();
//     } else {
//       bottomSheetRef.current?.close();
//     }
//   }, [visible]);

//   return (
//     <BottomSheet
//       ref={bottomSheetRef}
//       index={visible ? 0 : -1}
//       snapPoints={snapPoints}
//       onChange={handleSheetChanges}
//       enablePanDownToClose={true}
//       backgroundStyle={styles.sheetBackground}
//       handleIndicatorStyle={styles.indicator}
//       style={styles.bottomSheetContainer}
//     >
//       <View style={styles.contentContainer}>
//         <View style={{ flexDirection: 'row', gap: 8 }}>
//           <Text style={styles.title}>
//             Invisible
//           </Text>
//           <Text style={styles.dtitle}>
//             APR 22
//           </Text>
//         </View>
//         <View style={styles.greenBorderTop} />
//         <StarRating rating={rating} onRatingChange={setRating} />
        
//         {/* Cup of Tea Buttons */}
//         <View style={styles.cupOfTeaContainer}>
//           {/* <Text style={styles.toggleText}>Is this your cup of tea?</Text> */}
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "My Cup of Tea" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("My Cup of Tea")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "My Cup of Tea" && styles.cupButtonTextSelected
//               ]}>My Cup of Tea ☕</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "Not My Cup of Tea" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Not My Cup of Tea")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Not My Cup of Tea" && styles.cupButtonTextSelected
//               ]}>Not My Cup of Tea</Text>
//             </TouchableOpacity>
//           </View>
//        {/* recommeneded */}
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "Recommended to Watch" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Recommended to Watch")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Recommended to Watch" && styles.cupButtonTextSelected
//               ]}>Recommended to Watch</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "Not Recommended" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Not Recommended")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Not Recommended" && styles.cupButtonTextSelected
//               ]}>Not Recommended</Text>
//             </TouchableOpacity>
//           </View>

//           {/* predictable */}
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "Predictable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Predictable" && styles.cupButtonTextSelected
//               ]}>Predictable</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "Not Predictable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Not Predictable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Not Predictable" && styles.cupButtonTextSelected
//               ]}>Not Predictable</Text>
//             </TouchableOpacity>
//           </View>
//         {/* TIME OF WATCH */}
//           <View style={styles.buttonGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "One Time Watch" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("One Time Watch")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "One Time Watch" && styles.cupButtonTextSelected
//               ]}>One Time Watch</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[
//                 styles.cupButton,
//                 cupOfTea === "Repeated Watchable" && styles.cupButtonSelected
//               ]}
//               onPress={() => setCupOfTea("Repeated Watchable")}
//             >
//               <Text style={[
//                 styles.cupButtonText,
//                 cupOfTea === "Repeated Watchable" && styles.cupButtonTextSelected
//               ]}>Repeated Watchable</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={handleClose}
//           >
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               rating === 0 && styles.submitButtonDisabled
//             ]}
//             onPress={handleSubmit}
//             disabled={rating === 0}
//           >
//             <Text style={styles.submitButtonText}>Submit</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </BottomSheet>
//   );
// };

// export default RatingBottomSheet;

// const styles = StyleSheet.create({
//   sheetBackground: {
//     backgroundColor: 'black',
//   },
//   indicator: {
//     backgroundColor: '#FFFFFF',
//     width: wp(10),
//   },
//   contentContainer: {
//     flex: 1,
//     padding: hp(1),
//     alignItems: 'center',
//     paddingBottom: 0
//   },
//   title: {
//     fontSize: hp(1.7),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: '#FFFFFF',
//   },
//   dtitle:{
//     fontSize: hp(1),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: 'gray',
//   },
//   ratingText: {
//     textAlign: 'center',
//     marginTop: hp(3),
//     fontSize: hp(1.8),
//     color: '#A0A0A0',
//   },
//   cupOfTeaContainer: {
//     width: '100%',
//     marginTop: hp(2),
//   },
//   toggleText: {
//     color: '#A0A0A0',
//     marginBottom: hp(1),
//   },
//   buttonGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(1),
//   },
//   cupButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginHorizontal: wp(1),
//     alignItems: 'center',
//   },
//   cupButtonSelected: {
//     backgroundColor: '#3B82F6',
//   },
//   cupButtonText: {
//     color: '#FFFFFF',
//   },
//   cupButtonTextSelected: {
//     fontWeight: '600',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(3),
//   },
//   cancelButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginRight: wp(2),
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#FFFFFF',
//   },
//   submitButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginLeft: wp(2),
//     alignItems: 'center',
//   },
//   submitButtonDisabled: {
//     opacity: 0.5,
//   },
//   submitButtonText: {
//     color: '#FFFFFF',
//   },
//   bottomSheetContainer: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     zIndex: 1000,
//   },
//   greenBorderTop: {
//     width: '100%',
//     height: hp(0.2),
//     backgroundColor: theme.colors.gray,
//     opacity: 0.3,
//   }
// });




// import React, { useState, useRef, useCallback, useMemo } from 'react';
// import { View, TouchableOpacity, Switch, Text, StyleSheet } from 'react-native';
// import BottomSheet from '@gorhom/bottom-sheet';
// import Svg, { Path, Defs, LinearGradient, Stop, ClipPath, Rect } from 'react-native-svg';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const StarIcon = ({ state = 'empty' }) => {
//   const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
//   const getFillColor = () => {
//     switch (state) {
//       case 'full':
//         return "#facc15";
//       case 'half':
//         return "url(#halfGradient)";
//       default:
//         return "none";
//     }
//   };

//   return (
//     <Svg width={46} height={46} viewBox="0 0 24 24">
//       <Defs>
//         <LinearGradient id="halfGradient" x1="0" x2="24" y1="0" y2="0">
//           <Stop offset="0" stopColor="#facc15" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#facc15" stopOpacity="1" />
//           <Stop offset="0.5" stopColor="#e5e7eb" stopOpacity="1" />
//           <Stop offset="1" stopColor="#e5e7eb" stopOpacity="1" />
//         </LinearGradient>
//         <ClipPath id="starClip">
//           <Path d={starPath} />
//         </ClipPath>
//       </Defs>
//       <Path
//         d={starPath}
//         fill="#e5e7eb"
//         stroke="#d1d5db"
//         strokeWidth={1}
//       />
//       <Rect
//         x="0"
//         y="0"
//         width="24"
//         height="24"
//         fill={getFillColor()}
//         clipPath="url(#starClip)"
//       />
//     </Svg>
//   );
// };

// const StarRating = ({ rating, onRatingChange }) => {
//   const getStarState = (position) => {
//     if (rating >= position) return 'full';
//     if (rating >= position - 0.5) return 'half';
//     return 'empty';
//   };

//   const handleStarPress = (position, isLeft) => {
//     let newRating;
//     if (isLeft) {
//       if (rating === position - 0.5) {
//         newRating = 0;
//       } else {
//         newRating = position - 0.5;
//       }
//     } else {
//       if (rating === position) {
//         newRating = position - 0.5;
//       } else {
//         newRating = position;
//       }
//     }
//     onRatingChange(newRating);
//   };

//   return (
//     <View style={{ marginTop: hp(2) }}>
//       <View style={{ flexDirection: 'row', gap: 14 }}>
//         {[1, 2, 3, 4, 5].map((position) => (
//           <View key={position} style={{ flexDirection: 'row' }}>
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, true)}
//             />
//             <TouchableOpacity
//               style={{
//                 width: 16,
//                 height: 32,
//                 zIndex: 1,
//               }}
//               onPress={() => handleStarPress(position, false)}
//             >
//               <View style={{ position: 'absolute', left: -22 }}>
//                 <StarIcon state={getStarState(position)} />
//               </View>
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>
//       <Text style={styles.ratingText}>
//         Rating: {rating.toFixed(1)} / 5.0
//       </Text>
//     </View>
//   );
// };

// const RatingBottomSheet = ({ visible, onClose, onSubmit }) => {
//   const [rating, setRating] = useState(0);
//   const [cupOfTea, setCupOfTea] = useState(false);
//   const [mustWatch, setMustWatch] = useState(false);
//   const [selectedEmoji, setSelectedEmoji] = useState(null);
//   const bottomSheetRef = useRef(null);
  
//   // Snap points for the bottom sheet (50% of screen height)
//   const snapPoints = useMemo(() => ['55%'], []);

//   // Callbacks
//   const handleSheetChanges = useCallback((index) => {
//     if (index === -1) {
//       handleClose();
//     }
//   }, []);

//   const handleSubmit = () => {
//     onSubmit(rating, cupOfTea, selectedEmoji, mustWatch);
//     resetState();
//     bottomSheetRef.current?.close();
//   };

//   const handleClose = () => {
//     resetState();
//     onClose();
//   };

//   const resetState = () => {
//     setRating(0);
//     setCupOfTea(false);
//     setMustWatch(false);
//     setSelectedEmoji(null);
//   };

//   // Effect to open/close bottom sheet based on visible prop
//   React.useEffect(() => {
//     if (visible) {
//       bottomSheetRef.current?.expand();
//     } else {
//       bottomSheetRef.current?.close();
//     }
//   }, [visible]);

//   return (
//     <BottomSheet
//       ref={bottomSheetRef}
//       index={visible ? 0 : -1}
//       snapPoints={snapPoints}
//       onChange={handleSheetChanges}
//       enablePanDownToClose={true}
//       backgroundStyle={styles.sheetBackground}
//       handleIndicatorStyle={styles.indicator}
//       style={styles.bottomSheetContainer}
//     >
//       <View style={styles.contentContainer}>
//             <View style={{ flexDirection: 'row', gap: 8 }}>
//                   <Text style={styles.title}>
//                     Invisible
//                   </Text>
//                   <Text style={styles.dtitle}>
//                     APR 22
//                   </Text>
//              </View>
//           <View style={styles.greenBorderTop} />
//         <StarRating rating={rating} onRatingChange={setRating} />
        
//         {/* Cup of Tea Toggle Switch */}
//         <View style={styles.toggleContainer}>
//           <Text style={styles.toggleText}>My Cup of Tea ☕</Text>
//           <Switch
//             value={cupOfTea}
//             onValueChange={setCupOfTea}
//             trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
//             thumbColor={cupOfTea ? '#3b82f6' : '#9ca3af'}
//           />
//         </View>

//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.cancelButton}
//             onPress={handleClose}
//           >
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               rating === 0 && styles.submitButtonDisabled
//             ]}
//             onPress={handleSubmit}
//             disabled={rating === 0}
//           >
//             <Text style={styles.submitButtonText}>Submit</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </BottomSheet>
//   );
// };

// export default RatingBottomSheet;

// const styles = StyleSheet.create({
//   sheetBackground: {
//     backgroundColor: 'black',
   
//   },
//   indicator: {
//     backgroundColor: '#FFFFFF',
//     width: wp(10),
//   },
//   contentContainer: {
//     flex: 1,
//     padding: hp(1),
//     alignItems: 'center',
//     paddingBottom: 0
//   },
//   title: {
//     fontSize: hp(1.7),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: '#FFFFFF',
//   },
//   dtitle:{
//     fontSize: hp(1),
//     fontWeight: '600',
//     marginBottom: hp(2),
//     color: 'gray',
//   },
//   ratingText: {
//     textAlign: 'center',
//     marginTop: hp(3),
//     fontSize: hp(1.8),
//     color: '#A0A0A0',
//   },
//   toggleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(2),
//   },
//   toggleText: {
//     color: '#A0A0A0',
//   },
//   emojiSection: {
//     marginTop: hp(2),
//     alignItems: 'center',
//     width: '100%',
//   },
//   emojiContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '100%',
//     marginTop: hp(1),
//   },
//   emojiButton: {
//     padding: hp(1),
//     borderRadius: hp(1),
//     backgroundColor: '#333333',
//   },
//   emojiButtonSelected: {
//     backgroundColor: '#3B82F6',
//   },
//   emoji: {
//     fontSize: hp(3),
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp(3),
//   },
//   cancelButton: {
//     backgroundColor: '#333333',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginRight: wp(2),
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     color: '#FFFFFF',
//   },
//   submitButton: {
//     backgroundColor: '#3B82F6',
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(1),
//     borderRadius: hp(1),
//     flex: 1,
//     marginLeft: wp(2),
//     alignItems: 'center',
//   },
//   submitButtonDisabled: {
//     opacity: 0.5,
//   },
//   submitButtonText: {
//     color: '#FFFFFF',
//   },
//   bottomSheetContainer: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     zIndex: 1000,
//   },
//   greenBorderTop: {
//     width: '100%',
//     height: hp(0.2),
//     backgroundColor: theme.colors.gray,
//     opacity: 0.3,
//   }
// });

