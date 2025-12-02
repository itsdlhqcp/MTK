import React from 'react';
import { View, StyleSheet } from 'react-native';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import SkeletonLoader from './SkeletonLoader';
import { useColorScheme } from 'react-native';

const ProfileSkeleton = () => {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonLoader width={wp(30)} height={hp(2.5)} borderRadius={4} />
        <View style={styles.headerActions}>
          <SkeletonLoader width={hp(3)} height={hp(3)} borderRadius={hp(1.5)} />
          <SkeletonLoader width={hp(3)} height={hp(3)} borderRadius={hp(1.5)} />
        </View>
      </View>

      {/* Profile Section Skeleton */}
      <View style={styles.profileSection}>
        {/* Avatar Skeleton */}
        <SkeletonLoader width={hp(12)} height={hp(12)} borderRadius={hp(6)} />
        
        {/* Stats Skeleton */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <SkeletonLoader width={wp(15)} height={hp(2.2)} borderRadius={4} />
            <SkeletonLoader width={wp(12)} height={hp(1.6)} borderRadius={4} style={{ marginTop: hp(0.5) }} />
          </View>
          <View style={styles.statItem}>
            <SkeletonLoader width={wp(15)} height={hp(2.2)} borderRadius={4} />
            <SkeletonLoader width={wp(12)} height={hp(1.6)} borderRadius={4} style={{ marginTop: hp(0.5) }} />
          </View>
          <View style={styles.statItem}>
            <SkeletonLoader width={wp(15)} height={hp(2.2)} borderRadius={4} />
            <SkeletonLoader width={wp(12)} height={hp(1.6)} borderRadius={4} style={{ marginTop: hp(0.5) }} />
          </View>
        </View>
      </View>

      {/* Bio Section Skeleton */}
      <View style={styles.bioSection}>
        <SkeletonLoader width={wp(40)} height={hp(1.8)} borderRadius={4} />
        <SkeletonLoader width={wp(80)} height={hp(1.6)} borderRadius={4} style={{ marginTop: hp(1) }} />
        <SkeletonLoader width={wp(60)} height={hp(1.6)} borderRadius={4} style={{ marginTop: hp(0.5) }} />
        <SkeletonLoader width={wp(50)} height={hp(1.4)} borderRadius={4} style={{ marginTop: hp(1) }} />
        <SkeletonLoader width={wp(70)} height={hp(1.4)} borderRadius={4} style={{ marginTop: hp(0.5) }} />
      </View>

      {/* Tags Skeleton */}
      <View style={styles.tagsContainer}>
        <SkeletonLoader width={wp(25)} height={hp(3)} borderRadius={20} />
        <SkeletonLoader width={wp(25)} height={hp(3)} borderRadius={20} />
        <SkeletonLoader width={wp(25)} height={hp(3)} borderRadius={20} />
      </View>
    </View>
  );
};

export default ProfileSkeleton;

const styles = StyleSheet.create({
  container: {
    padding: wp(3.5),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  headerActions: {
    flexDirection: 'row',
    gap: wp(3),
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: wp(4),
  },
  statItem: {
    alignItems: 'center',
  },
  bioSection: {
    marginBottom: hp(2),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2.5),
    marginBottom: hp(2),
    marginTop: hp(0.5),
  },
});

