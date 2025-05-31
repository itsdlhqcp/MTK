import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import PollCard from '../components/PollCard';
import Icon from '../assets/icons';
import { supabase } from '../lib/supabase';
import { fetchPolls } from '../services/pollservice';

const PollsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time subscription ref
  const pollChannelRef = useRef(null);

  // Fetch polls from API
  const getPolls = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await fetchPolls(50);
      if (result.success) {
        setPolls(result.data);
      } else {
        Alert.alert('Error', result.msg);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch polls');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  // Handle real-time vote updates
  const handleVoteEvent = useCallback((payload) => {
    if (payload.eventType === 'INSERT') {
      const { poll_id, option_id } = payload.new;
      
      // Update vote counts in real-time for other users
      setPolls(prevPolls => 
        prevPolls.map(poll => {
          if (poll.id === poll_id) {
            const updatedOptions = poll.poll_options.map(option => {
              if (option.id === option_id) {
                return { ...option, vote_count: option.vote_count + 1 };
              }
              return option;
            });
            
            return {
              ...poll,
              poll_options: updatedOptions,
              total_votes: poll.total_votes + 1
            };
          }
          return poll;
        })
      );
    }
  }, []);

  const handlePollUpdate = useCallback(() => {
     getPolls();    

  }, []);

  useEffect(() => {
    if (!user?.id) return;
  
    // Subscribe to poll changes and vote changes
    const pollChannel = supabase
      .channel('polls-realtime')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'polls' 
        },
        (payload) => {
          console.log('New poll created:', payload);
          handlePollUpdate();
        }
      )
      .on('postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'polls' 
        },
        (payload) => {
          console.log('Poll deleted:', payload);
          setPolls(prevPolls => 
            prevPolls.filter(poll => poll.id !== payload.old.id)
          );
        }
      )
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'poll_votes' 
        },
        (payload) => {
          console.log('New vote:', payload);
          handleVoteEvent(payload);
        }
      )
      .on('postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'poll_votes' 
        },
        (payload) => {
          console.log('Vote deleted:', payload);
          // Handle vote deletion - decrease vote count
          const { poll_id, option_id } = payload.old;
          
          setPolls(prevPolls => 
            prevPolls.map(poll => {
              if (poll.id === poll_id) {
                const updatedOptions = poll.poll_options.map(option => {
                  if (option.id === option_id) {
                    return { ...option, vote_count: Math.max(0, option.vote_count - 1) };
                  }
                  return option;
                });
                
                return {
                  ...poll,
                  poll_options: updatedOptions,
                  total_votes: Math.max(0, poll.total_votes - 1)
                };
              }
              return poll;
            })
          );
        }
      )
      .subscribe((status) => {
       // console.log('Subscription status:', status);
      });
  
    pollChannelRef.current = pollChannel;
  
    // Initial fetch
    getPolls();
  
    return () => {
      if (pollChannelRef.current) {
        supabase.removeChannel(pollChannelRef.current);
        pollChannelRef.current = null;
      }
    };
  }, [user?.id, handleVoteEvent, handlePollUpdate]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    getPolls();
  }, [getPolls]);

const handleVoteUpdate = useCallback((pollId, updatedPollData) => {
    // Instantly update the specific poll in the state
    setPolls(prevPolls => 
      prevPolls.map(poll => 
        poll.id === pollId ? updatedPollData : poll
      )
    );
  }, []);

  // Navigate to create poll screen
  const handleCreatePoll = () => {
    router.push('newPoll');
  };

  // Render individual poll item
  const renderPollItem = useCallback(({ item }) => (
    <PollCard 
      item={item} 
      onVoteUpdate={handleVoteUpdate}
    />
  ), [handleVoteUpdate]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Empty state component
  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="plus" size={hp(8)} color="#666" />
      <Text style={styles.emptyTitle}>No Polls Yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to create a poll and get opinions from the community!
      </Text>
      <Pressable style={styles.createButton} onPress={handleCreatePoll}>
        <Text style={styles.createButtonText}>Create Poll</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenWrapper bg="#121212">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="back" size={hp(2.8)} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Polls</Text>
          <Pressable onPress={handleCreatePoll} style={styles.createHeaderButton}>
            <Icon name="plus" size={hp(2.8)} color="white" />
          </Pressable>
        </View>

        {/* Polls List */}
        <FlatList
          data={polls}
          renderItem={renderPollItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.blue]}
              tintColor={theme.colors.blue}
              progressBackgroundColor={theme.colors.textDark}
            />
          }
          ListEmptyComponent={!loading ? EmptyComponent : null}
        />
      </View>
    </ScreenWrapper>
  );
};

export default PollsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: 'rgb(19, 21, 22)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: hp(0.5),
  },
  headerTitle: {
    color: 'white',
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
  },
  createHeaderButton: {
    padding: hp(0.5),
  },
  listContainer: {
    paddingBottom: hp(2),
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    minHeight: hp(60),
  },
  emptyTitle: {
    color: 'white',
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptySubtitle: {
    color: '#888',
    fontSize: hp(1.7),
    textAlign: 'center',
    lineHeight: hp(2.3),
    marginBottom: hp(3),
  },
  createButton: {
    backgroundColor: theme.colors.blue,
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.md,
  },
  createButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
  },
});

