import React from 'react';
import { View, StyleSheet } from 'react-native';
import { wp, hp } from '../helpers/common';
import SkeletonLoader from './SkeletonLoader';
import { useColorScheme } from 'react-native';

const WatchListSkeleton = ({ count = 3 }) => {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.reviewCard}>
          <View style={styles.cardContainer}>
            <View style={styles.contentContainer}>
              {/* Movie Info Section */}
              <View style={styles.movieInfoContainer}>
                {/* Poster Skeleton */}
                <SkeletonLoader 
                  width={wp(12)} 
                  height={hp(7)} 
                  borderRadius={4} 
                  style={styles.posterSkeleton}
                />
                
                {/* Title and Rating Section */}
                <View style={styles.titleSection}>
                  <SkeletonLoader 
                    width={wp(50)} 
                    height={hp(1.8)} 
                    borderRadius={4}
                  />
                  <SkeletonLoader 
                    width={wp(30)} 
                    height={hp(1.4)} 
                    borderRadius={4} 
                    style={{ marginTop: hp(0.5) }}
                  />
                </View>

                {/* Date Section */}
                <View style={styles.dateSection}>
                  <SkeletonLoader 
                    width={wp(8)} 
                    height={hp(1.2)} 
                    borderRadius={4}
                  />
                  <SkeletonLoader 
                    width={wp(8)} 
                    height={hp(1.2)} 
                    borderRadius={4}
                    style={{ marginTop: hp(0.2) }}
                  />
                  <SkeletonLoader 
                    width={wp(10)} 
                    height={hp(1.2)} 
                    borderRadius={4}
                    style={{ marginTop: hp(0.4) }}
                  />
                </View>
              </View>

              {/* Review Text Skeleton */}
              <SkeletonLoader 
                width={wp(70)} 
                height={hp(1.6)} 
                borderRadius={4} 
                style={{ marginTop: hp(1) }}
              />
              <SkeletonLoader 
                width={wp(60)} 
                height={hp(1.6)} 
                borderRadius={4} 
                style={{ marginTop: hp(0.5) }}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default WatchListSkeleton;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(1.4),
    paddingVertical: hp(1),
  },
  reviewCard: {
    marginBottom: hp(0.5),
    backgroundColor: '#111',
    borderRadius: 0,
  },
  cardContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: wp(2),
  },
  contentContainer: {
    flex: 1,
    paddingVertical: hp(1.5),
    paddingRight: wp(2),
  },
  movieInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  posterSkeleton: {
    marginRight: wp(2),
  },
  titleSection: {
    flex: 1,
  },
  dateSection: {
    alignItems: 'center',
    paddingTop: hp(0.3),
  },
});








