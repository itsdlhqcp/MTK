import React from 'react';
import { View, StyleSheet } from 'react-native';
import { wp, hp } from '../helpers/common';
import SkeletonLoader from './SkeletonLoader';
import { useColorScheme } from 'react-native';

const DigitalTabSkeleton = ({ count = 3 }) => {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#FFFFFF';
  // Light red shimmer color
  const shimmerColor = colorScheme === 'dark' ? 'rgba(255, 182, 193, 0.3)' : 'rgba(255, 200, 210, 0.4)';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.item}>
          <SkeletonLoader 
            width={wp(90)} 
            height={hp(15)} 
            borderRadius={12} 
            shimmerColor={shimmerColor}
          />
          <View style={styles.content}>
            <SkeletonLoader 
              width={wp(60)} 
              height={hp(1.8)} 
              borderRadius={4} 
              style={{ marginTop: hp(1) }} 
              shimmerColor={shimmerColor}
            />
            <SkeletonLoader 
              width={wp(80)} 
              height={hp(1.6)} 
              borderRadius={4} 
              style={{ marginTop: hp(0.5) }} 
              shimmerColor={shimmerColor}
            />
            <SkeletonLoader 
              width={wp(50)} 
              height={hp(1.4)} 
              borderRadius={4} 
              style={{ marginTop: hp(0.5) }} 
              shimmerColor={shimmerColor}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

export default DigitalTabSkeleton;

const styles = StyleSheet.create({
  container: {
    padding: wp(2),
  },
  item: {
    marginBottom: hp(2),
  },
  content: {
    marginTop: hp(1),
    paddingHorizontal: wp(1),
  },
});








