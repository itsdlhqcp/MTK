import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useColorScheme } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';

const SkeletonLoader = ({ width, height, borderRadius = 8, style }) => {
  const colorScheme = useColorScheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  const backgroundColor = colorScheme === 'dark' ? '#262626' : '#E1E1E1';
  const shimmerColor = colorScheme === 'dark' ? '#333333' : '#F0F0F0';

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
            opacity,
            borderRadius,
          },
        ]}
      />
      <View
        style={[
          styles.base,
          {
            backgroundColor,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

export default SkeletonLoader;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  base: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
});

