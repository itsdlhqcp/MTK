import theme from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const CustomDotIndicator = ({ count = 55, dotSize = 22, containerSize = 200, startColor = theme.colors.red, alternateColor = theme.colors.blue }) => {
  // Create animated values for each dot
  const dotAnimatedValues = useRef(
    Array(count).fill().map(() => new Animated.Value(0))
  ).current;
  
  useEffect(() => {
    // Function to create a dropping animation for a single dot
    const animateDot = (index, delay) => {
      // Reset the position to start from the top
      dotAnimatedValues[index].setValue(0);
      
      Animated.sequence([
        // Wait for delay before starting this dot's animation
        Animated.delay(delay),
        
        // Fade in the dot from invisible state
        Animated.timing(dotAnimatedValues[index], {
          toValue: 0.5,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        
        // Drop the dot from top to bottom
        Animated.timing(dotAnimatedValues[index], {
          toValue: 1,
          duration: 700,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        
        // Hold briefly at the bottom
        Animated.delay(200),
        
        // Fade out
        Animated.timing(dotAnimatedValues[index], {
          toValue: 2,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        
        // Delay before next cycle
        Animated.delay(150),
      ]).start(() => {
        // Queue up the next dot animation
        const nextIndex = (index + 1) % count;
        animateDot(nextIndex, 80);
      });
    };

    // Only start with the first dot (index 0)
    animateDot(0, 400);

    return () => {
      // Cleanup animations if needed
      dotAnimatedValues.forEach(value => value.stopAnimation());
    };
  }, [count]);

  return (
    <View style={[styles.dotIndicatorContainer, { height: containerSize, width: containerSize }]}>
      {dotAnimatedValues.map((value, index) => {
        // Alternate colors between startColor and alternateColor
        const dotColor = index % 2 === 0 ? startColor : alternateColor;
        
        // Main dot animation
        const translateY = value.interpolate({
          inputRange: [0, 0.5, 1, 2],
          outputRange: [-70, -70, 0, 0], // Start from top, stay at top during appearance, then drop
        });
        
        const dotOpacity = value.interpolate({
          inputRange: [0, 0.25, 0.5, 0.9, 1, 1.5, 2],
          outputRange: [0, 0.7, 1, 1, 1, 0, 0], // Start invisible, fade in, stay visible during drop, fade out at the end
        });

        // Scale animation for appearing effect
        const dotScale = value.interpolate({
          inputRange: [0, 0.25, 0.5, 1, 2],
          outputRange: [0.3, 0.8, 1, 1, 1], // Start small, grow during appearance
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { 
                backgroundColor: dotColor,
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                left: (containerSize - dotSize) / 2, // Center the dot horizontally
                position: 'absolute',
                transform: [
                  { translateY },
                  { scale: dotScale }
                ],
                opacity: dotOpacity
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dotIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  }
});

export default CustomDotIndicator;