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
      text: item.cupOfTea === 'x' ? 'My Cup of Tea' : 'Not My Cup of Tea',
      isPositive: item.cupOfTea === 'x'
    },
    item?.prefer && {
      type: 'prefer',
      value: item.prefer,
      icon: 'tv',
      text: item.prefer === 'p' ? 'Prefer Theatre Watch' : 'Prefer OTT Watch',
      isPositive: item.prefer === 'p'
    },
    item?.predict && {
      type: 'predict',
      value: item.predict,
      icon: 'plot',
      text: item.predict === 'a' ? 'Unpredictable Story' : 'Predictable Story',
      isPositive: item.predict === 'a'
    },
    item?.repeat && {
      type: 'repeat',
      value: item.repeat,
      icon: 'repeat',
      text: item.repeat === 'r' ? 'Repeat Watchable' : 'One Time Watchable',
      isPositive: item.repeat === 'r'
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
  
  // If only one indicator is available, don't show the indicator
  if (availableIndicators.length === 1) {
    return null;
  }
  
  // Get the current and next indicator
  const currentIndicator = availableIndicators[currentIndex];
  const nextIndex = (currentIndex + 1) % availableIndicators.length;
  const nextIndicator = availableIndicators[nextIndex];
  
  // Get the appropriate color theme based on indicator type
  const getColorTheme = (indicator) => {
    return indicator.isPositive ? theme.colors.ourgn : theme.colors.red;
  };

  const currentColor = getColorTheme(currentIndicator);
  
  // Always show the first two icons but cycle through all texts
  const visibleIcons = availableIndicators.slice(0, 2);
  
  // For multiple indicators, show cycling text with navigation
  return (
    <TouchableOpacity onPress={cycleNext} activeOpacity={0.7}>
      <View style={[
        styles.stackedIndicator,
        { backgroundColor: `${currentColor}10` } // 10% opacity of the theme color
      ]}>
        {/* First section: Stacked icons */}
        <View style={styles.stackedIconsContainer}>
          {visibleIcons.map((indicator, index) => (
            <View 
              key={indicator.type} 
              style={[
                styles.stackedIcon, 
                { 
                  marginLeft: index > 0 ? -hp(1) : 0,
                  // Highlight icon if it's the current one with appropriate color
                  backgroundColor: indicator.type === currentIndicator.type 
                    ? `${currentColor}30` // 30% opacity
                    : `${currentColor}20` // 20% opacity
                }
              ]}
            >
              <Icon 
                name={indicator.icon} 
                size={hp(1.8)} 
                color={currentColor} 
              />
            </View>
          ))}
        </View>
        
        {/* Second section: Text container */}
        <View style={styles.textContainer}>
          <Text style={[styles.indicatorText, { color: currentColor }]}>
            {currentIndicator.text}
          </Text>
        </View>
        
        {/* Third section: Middle icon container */}
        <View style={[
          styles.middleIconContainer,
          { borderLeftColor: `${currentColor}20` } // 20% opacity for border
        ]}>
          <Icon 
            name={currentIndicator.icon}
            size={hp(1.6)} 
            color={currentColor}
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
    fontSize: hp(1.5),
    fontWeight: '500',
  },
  stackedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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