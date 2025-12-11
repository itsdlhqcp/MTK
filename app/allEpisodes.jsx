import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import EpisodeCard from '../components/EpisodeCard';
import { fetchPosts } from '../services/homeService';
import { useAuth } from '../contexts/AuthContext';

const AllEpisodes = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const title = params.title || 'All Episodes';
  
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      const res = await fetchPosts(currentPage * ITEMS_PER_PAGE);

      if (res.success) {
        // Filter episodes (posts with cover_image and episode_type)
        const filteredEpisodes = res.data.filter(
          post => post.cover_image && (post.episode_type === 'pdf' || post.episode_type === 'section_based')
        );

        // Deduplicate episodes by id
        const uniqueEpisodes = [];
        const seenIds = new Set();
        
        filteredEpisodes.forEach(episode => {
          const episodeId = episode?.id?.toString();
          if (episodeId && !seenIds.has(episodeId)) {
            seenIds.add(episodeId);
            uniqueEpisodes.push(episode);
          }
        });

        if (resetPage) {
          setEpisodes(uniqueEpisodes);
          setPage(2);
        } else {
          setEpisodes(prev => {
            const newEpisodes = uniqueEpisodes.filter(
              newEp => !prev.some(existingEp => existingEp?.id === newEp?.id)
            );
            return [...prev, ...newEpisodes];
          });
          setPage(prev => prev + 1);
        }

        setHasMore(uniqueEpisodes.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setEpisodes([]);
    setHasMore(true);
    fetchEpisodes(true);
  };

  const handleEpisodePress = (episode) => {
    router.push({
      pathname: '/episodeDetails',
      params: { episodeId: episode.id }
    });
  };

  const handleEndReached = () => {
    if (hasMore && !loading) {
      fetchEpisodes();
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.episodeCardWrapper}>
        <EpisodeCard
          item={item}
          onPress={() => handleEpisodePress(item)}
          style={styles.episodeCard}
          showDescription={true}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#121212">
      <Header title={title} showBackButton={true} />
      
      {loading && episodes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : episodes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No episodes found</Text>
        </View>
      ) : (
        <FlatList
          data={episodes}
          renderItem={renderItem}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </ScreenWrapper>
  );
};

export default AllEpisodes;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: hp(2),
  },
  listContent: {
    padding: wp(4),
    paddingBottom: hp(4),
  },
  episodeCardWrapper: {
    flex: 1,
    maxWidth: '33.33%',
    paddingHorizontal: wp(1),
    marginBottom: hp(2),
  },
  episodeCard: {
    width: '100%',
  },
  footerLoader: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
});

