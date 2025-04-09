import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@/assets/icons';
import { hp, wp } from '../helpers/common';
import theme from '../constants/theme';

const ReviewIndicators = ({ item }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Check which indicators are available
  const availableIndicators = [
    item?.cupOfTea && {
      type: 'cupOfTea',
      value: item.cupOfTea,
      icon: 'cup',
      text: item.cupOfTea === 'x' ? 'My Cup of Tea' : 'Not My Cup of Tea'
    },
    item?.prefer && {
      type: 'prefer',
      value: item.prefer,
      icon: 'tv',
      text: item.prefer === 'p' ? 'Prefer Theatre Watch' : 'Prefer OTT Watch'
    },
    item?.predict && {
      type: 'predict',
      value: item.predict,
      icon: 'plot',
      text: item.predict === 'a' ? 'Unpredictable Story' : 'Predictable Story'
    },
    item?.repeat && {
      type: 'repeat',
      value: item.repeat,
      icon: 'repeat',
      text: item.repeat === 'r' ? 'Repeat Watchable' : 'One Time Watchable'
    }
  ].filter(Boolean);
  
  // If no indicators are available, don't render anything
  if (availableIndicators.length === 0) {
    return null;
  }
  
  // Move to next indicator
  const cycleNext = () => {
    setCurrentIndex((currentIndex + 1) % availableIndicators.length);
  };
  
  // If only one indicator is available, display it directly
  if (availableIndicators.length === 1) {
    const indicator = availableIndicators[0];
    return (
      <View style={styles.indicatorContainer}>
        <Icon name={indicator.icon} size={hp(1.8)} color={theme.colors.primary} />
        <Text style={styles.indicatorText}>{indicator.text}</Text>
      </View>
    );
  }
  
  // Get the current and next indicator
  const currentIndicator = availableIndicators[currentIndex];
  const nextIndex = (currentIndex + 1) % availableIndicators.length;
  const nextIndicator = availableIndicators[nextIndex];
  
  // Always show the first two icons but cycle through all texts
  const visibleIcons = availableIndicators.slice(0, 2);
  
  // For multiple indicators, show cycling text with navigation
  return (
    <TouchableOpacity onPress={cycleNext} activeOpacity={0.7}>
      <View style={styles.stackedIndicator}>
        {/* First section: Stacked icons */}
        <View style={styles.stackedIconsContainer}>
          {visibleIcons.map((indicator, index) => (
            <View 
              key={indicator.type} 
              style={[
                styles.stackedIcon, 
                { 
                  marginLeft: index > 0 ? -hp(1) : 0,
                  // Highlight icon if it's the current one
                  backgroundColor: indicator.type === currentIndicator.type 
                    ? 'rgba(71, 133, 168, 0.3)' 
                    : 'rgba(71, 133, 168, 0.2)'
                }
              ]}
            >
              <Icon 
                name={indicator.icon} 
                size={hp(1.8)} 
                color={theme.colors.primary} 
              />
            </View>
          ))}
        </View>
        
        {/* Second section: Text container */}
        <View style={styles.textContainer}>
          <Text style={styles.indicatorText}>{currentIndicator.text}</Text>
        </View>
        
        {/* New third section: Middle icon container */}
        <View style={styles.middleIconContainer}>
          <Icon 
            name={currentIndicator.icon}
            size={hp(1.6)} 
            color={theme.colors.primary}
          />
          <Icon 
            name={nextIndicator.icon}
            size={hp(1.6)} 
            color={theme.colors.textLight}
            style={styles.secondMiddleIcon}
          />
        </View>
        
        {/* Fourth section: Chevron button */}
        <TouchableOpacity 
          style={styles.chevronButton}
          onPress={cycleNext}
        >
          <Icon 
            name="chevrondown" 
            size={hp(1.8)} 
            color={theme.colors.textLight} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(154, 35, 35, 0.1)',
    borderRadius: hp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    marginTop: hp(1),
    alignSelf: 'flex-start',
  },
  indicatorText: {
    marginLeft: wp(1),
    color: theme.colors.primary,
    fontSize: hp(1.5),
    fontWeight: '500',
  },
  stackedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(71, 133, 168, 0.1)',
    borderRadius: hp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    marginTop: hp(1),
    alignSelf: 'flex-start',
  },
  stackedIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedIcon: {
    backgroundColor: 'rgba(71, 133, 168, 0.2)',
    borderRadius: hp(1),
    padding: hp(0.3),
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(1),
  },
  middleIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(1),
    paddingHorizontal: wp(1),
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(71, 133, 168, 0.2)',
    paddingLeft: wp(2),
  },
  secondMiddleIcon: {
    marginLeft: wp(1),
    opacity: 0.6,
  },
  chevronButton: {
    padding: hp(0.5),
  }
});

export default ReviewIndicators;

// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import Icon from '@/assets/icons';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const ReviewIndicators = ({ item }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
  
//   // Check which indicators are available
//   const availableIndicators = [
//     item?.cupOfTea && {
//       type: 'cupOfTea',
//       value: item.cupOfTea,
//       icon: 'cup',
//       text: item.cupOfTea === 'x' ? 'My Cup of Tea' : 'Not My Cup of Tea'
//     },
//     item?.prefer && {
//       type: 'prefer',
//       value: item.prefer,
//       icon: 'tv',
//       text: item.prefer === 'p' ? 'Prefer Theatre Watch' : 'Prefer OTT Watch'
//     },
//     item?.predict && {
//       type: 'predict',
//       value: item.predict,
//       icon: 'plot',
//       text: item.predict === 'a' ? 'Unpredictable Story' : 'Predictable Story'
//     },
//     item?.repeat && {
//       type: 'repeat',
//       value: item.repeat,
//       icon: 'repeat',
//       text: item.repeat === 'r' ? 'Repeat Watchable' : 'One Time Watchable'
//     }
//   ].filter(Boolean);
  
//   // If no indicators are available, don't render anything
//   if (availableIndicators.length === 0) {
//     return null;
//   }
  
//   // Move to next indicator
//   const cycleNext = () => {
//     setCurrentIndex((currentIndex + 1) % availableIndicators.length);
//   };
  
//   // If only one indicator is available, display it directly
//   if (availableIndicators.length === 1) {
//     const indicator = availableIndicators[0];
//     return (
//       <View style={styles.indicatorContainer}>
//         <Icon name={indicator.icon} size={hp(1.8)} color={theme.colors.primary} />
//         <Text style={styles.indicatorText}>{indicator.text}</Text>
//       </View>
//     );
//   }
  
//   // Get the current and next indicator
//   const currentIndicator = availableIndicators[currentIndex];
  
//   // Always show the first two icons but cycle through all texts
//   const visibleIcons = availableIndicators.slice(0, 2);
  
//   // For multiple indicators, show cycling text with navigation
//   return (
//     <TouchableOpacity onPress={cycleNext} activeOpacity={0.7}>
//       <View style={styles.stackedIndicator}>
//         <View style={styles.stackedIconsContainer}>
//           {visibleIcons.map((indicator, index) => (
//             <View 
//               key={indicator.type} 
//               style={[
//                 styles.stackedIcon, 
//                 { 
//                   marginLeft: index > 0 ? -hp(1) : 0,
//                   // Highlight icon if it's the current one
//                   backgroundColor: indicator.type === currentIndicator.type 
//                     ? 'rgba(71, 133, 168, 0.3)' 
//                     : 'rgba(71, 133, 168, 0.2)'
//                 }
//               ]}
//             >
//               <Icon 
//                 name={indicator.icon} 
//                 size={hp(1.8)} 
//                 color={theme.colors.primary} 
//               />
//             </View>
//           ))}
//         </View>
        
//         <View style={styles.textContainer}>
//           <Text style={styles.indicatorText}>{currentIndicator.text}</Text>
//           {/* <Text style={styles.indexText}>
//             {`${currentIndex + 1}/${availableIndicators.length}`}
//           </Text> */}
//         </View>
        
//         <TouchableOpacity 
//           style={styles.chevronButton}
//           onPress={cycleNext}
//         >
//           <Icon 
//             name="chevrondown" 
//             size={hp(1.8)} 
//             color={theme.colors.textLight} 
//           />
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   indicatorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(154, 35, 35, 0.1)',
//     borderRadius: hp(1),
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     marginTop: hp(1),
//     alignSelf: 'flex-start',
//   },
//   indicatorText: {
//     marginLeft: wp(1),
//     color: theme.colors.primary,
//     fontSize: hp(1.5),
//     fontWeight: '500',
//   },
//   stackedIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(71, 133, 168, 0.1)',
//     borderRadius: hp(1),
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     marginTop: hp(1),
//     alignSelf: 'flex-start',
//   },
//   stackedIconsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   stackedIcon: {
//     backgroundColor: 'rgba(71, 133, 168, 0.2)',
//     borderRadius: hp(1),
//     padding: hp(0.3),
//   },
//   textContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: wp(1),
//   },
//   indexText: {
//     fontSize: hp(1.2),
//     color: theme.colors.textLight,
//     marginLeft: wp(1),
//   },
//   chevronButton: {
//     padding: hp(0.5),
//   }
// });

// export default ReviewIndicators;


// import React, { useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
// import Icon from '@/assets/icons';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const ReviewIndicators = ({ item }) => {
//   const [expanded, setExpanded] = useState(false);
//   const [activeIndex, setActiveIndex] = useState(0);
//   const flatListRef = useRef(null);
  
//   // Check which indicators are available
//   const availableIndicators = [
//     item?.cupOfTea && {
//       type: 'cupOfTea',
//       value: item.cupOfTea,
//       icon: 'cup',
//       text: item.cupOfTea === 'x' ? 'My Cup of Tea' : 'Not My Cup of Tea'
//     },
//     item?.prefer && {
//       type: 'prefer',
//       value: item.prefer,
//       icon: 'tv',
//       text: item.prefer === 'p' ? 'Prefer Theatre Watch' : 'Prefer OTT Watch'
//     },
//     item?.predict && {
//       type: 'predict',
//       value: item.predict,
//       icon: 'plot',
//       text: item.predict === 'a' ? 'Unpredictable Story' : 'Predictable Story'
//     },
//     item?.repeat && {
//       type: 'repeat',
//       value: item.repeat,
//       icon: 'repeat',
//       text: item.repeat === 'r' ? 'Repeat Watchable' : 'One Time Watchable'
//     }
//   ].filter(Boolean);
  
//   // If no indicators are available, don't render anything
//   if (availableIndicators.length === 0) {
//     return null;
//   }
  
//   const toggleExpanded = () => {
//     setExpanded(!expanded);
//     // Reset to first item when expanding
//     if (!expanded) {
//       setActiveIndex(0);
//       flatListRef.current?.scrollToIndex({ index: 0, animated: false });
//     }
//   };
  
//   // If only one indicator is available, display it directly
//   if (availableIndicators.length === 1) {
//     const indicator = availableIndicators[0];
//     return (
//       <View style={styles.indicatorContainer}>
//         <Icon name={indicator.icon} size={hp(1.8)} color={theme.colors.primary} />
//         <Text style={styles.indicatorText}>{indicator.text}</Text>
//       </View>
//     );
//   }

//   // Handle scroll to next/previous item
//   const scrollToItem = (direction) => {
//     const totalItems = availableIndicators.length;
//     let newIndex;
    
//     if (direction === 'next') {
//       newIndex = (activeIndex + 1) % totalItems;
//     } else {
//       newIndex = (activeIndex - 1 + totalItems) % totalItems;
//     }
    
//     setActiveIndex(newIndex);
//     flatListRef.current?.scrollToIndex({
//       index: newIndex,
//       animated: true,
//       viewPosition: 0.5
//     });
//   };

//   // Render each indicator item
//   const renderItem = ({ item: indicator }) => (
//     <View style={styles.carouselItem}>
//       <Icon name={indicator.icon} size={hp(2)} color={theme.colors.primary} />
//       <Text style={styles.indicatorText}>{indicator.text}</Text>
//     </View>
//   );

//   // If multiple indicators, show stacked view that can be expanded
//   return (
//     <View>
//       <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
//         <View style={styles.stackedIndicator}>
//           <View style={styles.stackedIconsContainer}>
//             {availableIndicators.slice(0, 2).map((indicator, index) => (
//               <View key={indicator.type} style={[styles.stackedIcon, { marginLeft: index > 0 ? -hp(1) : 0 }]}>
//                 <Icon name={indicator.icon} size={hp(1.8)} color={theme.colors.primary} />
//               </View>
//             ))}
//           </View>
//           <Text style={styles.indicatorText}>{availableIndicators[0].text}</Text>
//           <Icon 
//             name={expanded ? "chevronup" : "chevrondown"} 
//             size={hp(1.8)} 
//             color={theme.colors.textLight} 
//           />
//         </View>
//       </TouchableOpacity>
      
//       {expanded && (
//         <View style={styles.expandedContainer}>
//           {/* Navigation buttons */}
//           <View style={styles.navigationRow}>
//             <TouchableOpacity 
//               style={styles.navButton} 
//               onPress={() => scrollToItem('prev')}
//             >
//               <Icon name="chevronup" size={hp(2)} color={theme.colors.primary} />
//             </TouchableOpacity>
            
//             {/* Current indicator index */}
//             <Text style={styles.indexText}>
//               {`${activeIndex + 1}/${availableIndicators.length}`}
//             </Text>
            
//             <TouchableOpacity 
//               style={styles.navButton} 
//               onPress={() => scrollToItem('next')}
//             >
//               <Icon name="chevrondown" size={hp(2)} color={theme.colors.primary} />
//             </TouchableOpacity>
//           </View>
          
//           {/* List of indicators */}
//           <FlatList
//             ref={flatListRef}
//             data={availableIndicators}
//             renderItem={renderItem}
//             keyExtractor={(item) => item.type}
//             horizontal={false}
//             showsVerticalScrollIndicator={false}
//             pagingEnabled
//             initialScrollIndex={activeIndex}
//             getItemLayout={(data, index) => ({
//               length: hp(6),
//               offset: hp(6) * index,
//               index,
//             })}
//             onMomentumScrollEnd={(event) => {
//               const index = Math.round(event.nativeEvent.contentOffset.y / hp(6));
//               setActiveIndex(index);
//             }}
//             style={styles.flatList}
//           />
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   indicatorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(71, 133, 168, 0.1)',
//     borderRadius: hp(1),
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     marginTop: hp(1),
//     alignSelf: 'flex-start',
//   },
//   indicatorText: {
//     marginLeft: wp(1),
//     color: theme.colors.primary,
//     fontSize: hp(1.5),
//     fontWeight: '500',
//   },
//   stackedIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(71, 133, 168, 0.1)',
//     borderRadius: hp(1),
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     marginTop: hp(1),
//     alignSelf: 'flex-start',
//   },
//   stackedIconsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   stackedIcon: {
//     backgroundColor: 'rgba(71, 133, 168, 0.2)',
//     borderRadius: hp(1),
//     padding: hp(0.3),
//   },
//   expandedContainer: {
//     backgroundColor: 'rgba(71, 133, 168, 0.05)',
//     borderRadius: hp(1),
//     padding: hp(1),
//     marginTop: hp(0.5),
//     height: hp(8), // Fixed height for showing just one item
//   },
//   navigationRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: wp(2),
//   },
//   navButton: {
//     padding: hp(0.5),
//   },
//   indexText: {
//     color: theme.colors.textLight,
//     fontSize: hp(1.4),
//   },
//   flatList: {
//     height: hp(6),
//   },
//   carouselItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     height: hp(6),
//     paddingVertical: hp(0.5),
//     paddingHorizontal: wp(2),
//   },
// });

// export default ReviewIndicators;


// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
// import Icon from '@/assets/icons';
// import { hp, wp } from '../helpers/common';
// import theme from '../constants/theme';

// const ReviewIndicators = ({ item }) => {
//   const [expanded, setExpanded] = useState(false);
  
//   // Check which indicators are available
//   const availableIndicators = [
//     item?.cupOfTea && {
//       type: 'cupOfTea',
//       value: item.cupOfTea,
//       icon: 'cup',
//       text: item.cupOfTea === 'x' ? 'My Cup of Tea' : 'Not My Cup of Tea'
//     },
//     item?.prefer && {
//       type: 'prefer',
//       value: item.prefer,
//       icon: 'tv',
//       text: item.prefer === 'p' ? 'Prefer Theatre Watch' : 'Prefer OTT Watch'
//     },
//     item?.predict && {
//       type: 'predict',
//       value: item.predict,
//       icon: 'plot',
//       text: item.predict === 'a' ? 'Unpredictable Story' : 'Predictable Story'
//     },
//     item?.repeat && {
//       type: 'repeat',
//       value: item.repeat,
//       icon: 'repeat',
//       text: item.repeat === 'r' ? 'Repeat Watchable' : 'One Time Watchable'
//     }
//   ].filter(Boolean);
  
//   // If no indicators are available, don't render anything
//   if (availableIndicators.length === 0) {
//     return null;
//   }
  
//   const toggleExpanded = () => {
//     setExpanded(!expanded);
//   };
  
//   // If only one indicator is available, display it directly
//   if (availableIndicators.length === 1) {
//     const indicator = availableIndicators[0];
//     return (
//       <View style={styles.indicatorContainer}>
//         <Icon name={indicator.icon} size={hp(1.8)} color={theme.colors.primary} />
//         <Text style={styles.indicatorText}>{indicator.text}</Text>
//       </View>
//     );
//   }
  
//   // If multiple indicators, show stacked view that can be expanded
//   return (
//     <View>
//       <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.7}>
//         <View style={styles.stackedIndicator}>
//           <View style={styles.stackedIconsContainer}>
//             {availableIndicators.slice(0, 2).map((indicator, index) => (
//               <View key={indicator.type} style={[styles.stackedIcon, { marginLeft: index > 0 ? -hp(1) : 0 }]}>
//                 <Icon name={indicator.icon} size={hp(1.8)} color={theme.colors.primary} />
//               </View>
//             ))}
//           </View>
//             {/* here i need to siplay the text of the first indicator */}
//           <Text style={styles.indicatorText}>{availableIndicators[0].text}</Text>
//           <Icon 
//             name={expanded ? "chevronup" : "chevrondown"} 
//             size={hp(1.8)} 
//             color={theme.colors.textLight} 
//           />
//         </View>
//       </TouchableOpacity>
      
//       {expanded && (
//         <View style={styles.expandedContainer}>
//           {availableIndicators.map(indicator => (
//             <View key={indicator.type} style={styles.indicatorRow}>
//               <Icon name={indicator.icon} size={hp(1.8)} color={theme.colors.primary} />
//               <Text style={styles.indicatorText}>{indicator.text}</Text>
//             </View>
//           ))}
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   indicatorContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(71, 133, 168, 0.1)',
//     borderRadius: hp(1),
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     marginTop: hp(1),
//     alignSelf: 'flex-start',
//   },
//   indicatorText: {
//     marginLeft: wp(1),
//     color: theme.colors.primary,
//     fontSize: hp(1.5),
//     fontWeight: '500',
//   },
//   stackedIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(71, 133, 168, 0.1)',
//     borderRadius: hp(1),
//     paddingHorizontal: wp(2),
//     paddingVertical: hp(0.5),
//     marginTop: hp(1),
//     alignSelf: 'flex-start',
//   },
//   stackedIconsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   stackedIcon: {
//     backgroundColor: 'rgba(71, 133, 168, 0.2)',
//     borderRadius: hp(1),
//     padding: hp(0.3),
//   },
//   expandedContainer: {
//     backgroundColor: 'rgba(71, 133, 168, 0.05)',
//     borderRadius: hp(1),
//     padding: hp(1),
//     marginTop: hp(0.5),
//   },
//   indicatorRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: hp(0.5),
//   },
// });

// export default ReviewIndicators;