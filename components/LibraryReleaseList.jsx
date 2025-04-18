import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { fetchReleases } from '../services/releaseService';
import ReleaseCard from '../components/RelesaeCard';
import FeedLoader from '../components/FeedLoader';
import { hp, wp } from '../helpers/common';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const ITEMS_PER_PAGE = 8;

const AllReleasesList = ({ searchQuery = '' }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Handle real-time release updates
  const handleReleaseEvent = (payload) => {
    // Handle new release
    if (payload.eventType === 'INSERT') {
      setReleases(prev => [payload.new, ...prev]);
    }
    
    // Handle release deletion
    if (payload.eventType === 'DELETE' && payload.old.id) {
      setReleases(prev => 
        prev.filter(release => release.id !== payload.old.id)
      );
    }
    
    // Handle release update
    if (payload.eventType === 'UPDATE' && payload.new.id) {
      setReleases(prev => {
        // Check if it already exists
        const exists = prev.some(r => r.id === payload.new.id);
        if (exists) {
          // Update existing
          return prev.map(r => r.id === payload.new.id ? payload.new : r);
        } else {
          // Add new
          return [payload.new, ...prev];
        }
      });
    }
  };

  // Set up Supabase real-time subscription
  useEffect(() => {
    const releaseChannel = supabase
      .channel('all-releases')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'releases' },
        handleReleaseEvent
      )
      .subscribe();

    // Initial data fetch
    getAllReleases();

    return () => {
      supabase.removeChannel(releaseChannel);
    };
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    if (searchQuery !== '') {
      setPage(1);
      // Don't clear releases here to avoid UI flicker
      // Just let the filtered results show
    }
  }, [searchQuery]);

  const getAllReleases = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const res = await fetchReleases(page * ITEMS_PER_PAGE);
      
      if (res.success) {
        // No filtering for expired releases anymore - show all releases
        const allReleases = res.data;
        
        if (allReleases.length === 0 || allReleases.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }
        
        setReleases(prevReleases => {
          const newReleases = allReleases.filter(
            newRelease => !prevReleases.some(
              existingRelease => existingRelease.id === newRelease.id
            )
          );
          return [...prevReleases, ...newReleases];
        });
        
        setPage(prev => prev + 1);
      } else {
        Alert.alert('Error', 'Failed to fetch releases');
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
      Alert.alert('Error', 'Something went wrong while fetching releases');
    } finally {
      setLoading(false);
    }
  };

  // Filter releases based on search query
  const filteredReleases = useMemo(() => {
    if (!searchQuery) return releases;
    
    const lowerQuery = searchQuery.toLowerCase();
    return releases.filter(release => 
      // Adjust these fields based on your actual release object structure
      (release.title && release.title.toLowerCase().includes(lowerQuery)) ||
      (release.description && release.description.toLowerCase().includes(lowerQuery)) ||
      (release.artist && release.artist.toLowerCase().includes(lowerQuery))
    );
  }, [releases, searchQuery]);

  const renderItem = ({ item }) => (
    <ReleaseCard
      item={item}
      currentUser={user}
      router={router}
    />
  );

  const renderFooter = () => {
    if (filteredReleases.length === 0) return null;

    return (
      <View style={{ marginVertical: 0, paddingBottom: hp(14) }}>
        {loading && hasMore && <FeedLoader />}
        {(!loading || !hasMore) && (
          <Text style={styles.noMoreText}>
            {hasMore ? "" : "End of library"}
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.noMoreText}>
        {loading ? "Loading..." : 
         searchQuery ? "No matching releases found" : "No releases found!"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Releases</Text>
      <FlatList
        data={filteredReleases}
        renderItem={renderItem}
        keyExtractor={(item) => `release-${item.id}`}
        onEndReached={searchQuery ? null : getAllReleases}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
};

export default AllReleasesList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  listContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  noMoreText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});