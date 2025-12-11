import React from 'react';
import { View, StyleSheet } from 'react-native';
import { wp, hp } from '../helpers/common';
import SkeletonLoader from './SkeletonLoader';

const SearchSkeleton = ({ count = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.userCard}>
          <View style={styles.userInfoContainer}>
            {/* Avatar Skeleton */}
            <SkeletonLoader 
              width={hp(7)} 
              height={hp(7)} 
              borderRadius={hp(7) / 2} 
            />
            
            {/* User Info Skeleton */}
            <View style={styles.userTextContainer}>
              <SkeletonLoader 
                width={wp(45)} 
                height={hp(1.8)} 
                borderRadius={4}
              />
              <SkeletonLoader 
                width={wp(35)} 
                height={hp(1.4)} 
                borderRadius={4}
                style={{ marginTop: hp(0.3) }}
              />
            </View>
          </View>
          
          {/* Button Skeleton */}
          <SkeletonLoader 
            width={wp(16)} 
            height={hp(3)} 
            borderRadius={4}
          />
        </View>
      ))}
    </View>
  );
};

export default SearchSkeleton;

const styles = StyleSheet.create({
  container: {
    padding: wp(2),
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextContainer: {
    marginLeft: wp(3),
    flex: 1,
    justifyContent: 'center',
  },
});

