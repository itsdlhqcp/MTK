import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { wp, hp } from '@/helpers/common';
import theme from '../constants/theme';
import { fetchWatchNowReleases } from '../services/ProfileTilesService';
import { useRouter } from 'expo-router';
import { getSupabaseFileUrl } from '../services/imageService';
import SkeletonLoader from './SkeletonLoader';

// Global cache to share data across all component instances
let globalWatchNowCache = {
  data: null,
  loading: false,
  hasLoaded: false
};

const WatchNowCard = memo(({ release }) => {
  const router = useRouter();
  
  const handleCardPress = () => {
    if (!release?.id) return;
    
    // Check if this is a digital/stream release or theatre release
    if (release.type === 'theatre') {
      router.push({ 
        pathname: 'releasePeopleSection/releasePeopleDetails', 
        params: { releaseId: release.id } 
      });
    } else {
      router.push({ 
        pathname: 'streamPeopleSection/streamPeopleDetails', 
        params: { streamId: release.id } 
      });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.releaseCard}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      {release.poster ? (
        <Image
          source={getSupabaseFileUrl(release.poster)}
          style={styles.posterImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noImagePlaceholder}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      
      {/* Type label at top */}
      <View style={styles.typeLabelContainer}>
        <Text style={styles.typeLabel}>{release.label}</Text>
      </View>
    </TouchableOpacity>
  );
});

const WatchNow = memo(() => {
  const router = useRouter();
  const [releases, setReleases] = useState(globalWatchNowCache.data || []);
  const [loading, setLoading] = useState(!globalWatchNowCache.hasLoaded);

  const fetchReleases = useCallback(async () => {
    // If already loading globally, wait for it
    if (globalWatchNowCache.loading) {
      const checkInterval = setInterval(() => {
        if (!globalWatchNowCache.loading) {
          clearInterval(checkInterval);
          setReleases(globalWatchNowCache.data || []);
          setLoading(false);
        }
      }, 100);
      return;
    }

    // If already loaded, use cached data
    if (globalWatchNowCache.hasLoaded && globalWatchNowCache.data) {
      setReleases(globalWatchNowCache.data);
      setLoading(false);
      return;
    }

    // Start loading
    globalWatchNowCache.loading = true;
    setLoading(true);

    try {
      const result = await fetchWatchNowReleases(10);
      
      if (result.success && result.data) {
        globalWatchNowCache.data = result.data;
        globalWatchNowCache.hasLoaded = true;
        setReleases(result.data);
      } else {
        console.error('Error fetching watch now releases:', result.msg);
      }
    } catch (error) {
      console.error('Error in fetchReleases:', error);
    } finally {
      globalWatchNowCache.loading = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // Skeleton card component
  const SkeletonCard = memo(() => (
    <View style={styles.releaseCard}>
      <SkeletonLoader
        width={wp(28)}
        height={hp(20)}
        borderRadius={4}
        shimmerColor="rgba(255, 255, 255, 0.4)"
      />
    </View>
  ));

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Watch Now</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          simultaneousHandlers={[]}
          shouldCancelWhenOutside={false}
          bounces={false}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (releases.length === 0) {
    return null; // Don't show if no releases
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Watch Now</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        bounces={false}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        {releases.map((release) => (
          <WatchNowCard key={release.id} release={release} />
        ))}
      </ScrollView>
    </View>
  );
});

export default WatchNow;

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(2),
    marginHorizontal: wp(2),
  },
  header: {
    marginBottom: hp(1.5),
    paddingHorizontal: wp(2),
  },
  title: {
    fontSize: hp(2),
    fontWeight: theme.fonts.bold,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: wp(2),
    gap: wp(3),
  },
  releaseCard: {
    width: wp(28),
    height: hp(20),
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: wp(2),
    backgroundColor: '#222',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: hp(1.5),
  },
  typeLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: hp(0.3),
  },
  typeLabel: {
    fontSize: hp(1.2),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});




