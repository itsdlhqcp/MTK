import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Animated } from 'react-native';
import { deleteVote, getUserVote, votePoll, deletePoll } from '../services/pollservice';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../assets/icons';
import { useToast } from '../contexts/ToastContext';

const PollCard = ({ item, onVoteUpdate, onPollDelete }) => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const handleDeletePoll = async () => {
    Alert.alert(
      'Delete Poll',
      'Are you sure you want to delete this poll? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deletePoll(item.id, user.id);
              if (result.success) {
                showToast('error', 'poll deleted success!!'); 
                if (onPollDelete) {
                  onPollDelete(item.id);
                }
              } else {
                Alert.alert('Error', result.msg || 'Failed to delete poll');
              }
            } catch (error) {
              console.log('Delete poll error:', error);
              Alert.alert('Error', 'Failed to delete poll');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (item?.poll_options) {
      const initialValues = {};
      item.poll_options.forEach(option => {
        initialValues[option.id] = new Animated.Value(0);
      });
      setAnimatedValues(initialValues);
    }
  }, [item?.poll_options]);

  useEffect(() => {
    if (hasVoted && item?.poll_options && Object.keys(animatedValues).length > 0) {
      item.poll_options.forEach(option => {
        const percentage = getVotePercentage(option.vote_count);
        Animated.timing(animatedValues[option.id], {
          toValue: percentage,
          duration: 800,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [hasVoted, item?.poll_options, animatedValues]);

  // Check if user has already voted
  useEffect(() => {
    const checkUserVote = async () => {
      if (!user?.id || !item?.id) return;
      
      const result = await getUserVote(item.id, user.id);
      
      if (result.success && result.data) {
        setSelectedOption(result.data);
        setHasVoted(true);
      } else {
        setSelectedOption(null);
        setHasVoted(false);
      }
    };
    
    checkUserVote();
  }, [item?.id, user?.id]);

  const handleVote = async (optionId) => {
    if (!user?.id || isVoting) {
      console.log('Cannot vote: user not logged in or already voting');
      return;
    }

    setIsVoting(true);
    
    try {
      if (hasVoted && selectedOption === optionId) {
        
        const result = await deleteVote(item.id, user.id);
        
        if (result.success) {
          setSelectedOption(null);
          setHasVoted(false);
          
          Object.values(animatedValues).forEach(animValue => {
            animValue.setValue(0);
          });
          
          if (onVoteUpdate && result.updatedPoll) {
            onVoteUpdate(item.id, result.updatedPoll);
          }

        } else {
          console.log('Delete vote failed:', result.msg);
        }
      } else {
        const result = await votePoll(item.id, optionId, user.id);
        
        if (result.success) {
          const wasVoteChange = hasVoted && selectedOption !== optionId;
          setSelectedOption(optionId);
          setHasVoted(true);
          
          if (onVoteUpdate && result.updatedPoll) {
            onVoteUpdate(item.id, result.updatedPoll);
          }
          
        } else {
          console.log('Vote failed:', result.msg);
          Alert.alert('Error', result.msg);
        }
      }
    } catch (error) {
      console.log('Vote error:', error);
      Alert.alert('Error', 'Failed to process vote');
    } finally {
      setIsVoting(false);
    }
  };

  const getVotePercentage = (optionVotes) => {
    if (!item.total_votes || item.total_votes === 0) return 0;
    return Math.round((optionVotes / item.total_votes) * 100);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <View style={styles.container}>

      {/* Poll Question */}
      <Text style={styles.question}>{item.question}</Text>
      
      {/* Poll Description */}
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      {/* Poll Options */}
      <View style={styles.optionsContainer}>
        {item.poll_options
          ?.sort((a, b) => a.option_order - b.option_order)
          .map((option) => {
            const percentage = getVotePercentage(option.vote_count);
            const isSelected = selectedOption === option.id;
            
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.optionButton,
                  hasVoted && styles.optionButtonVoted,
                  isSelected && styles.optionButtonSelected
                ]}
                onPress={() => handleVote(option.id)}
                disabled={isVoting}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContainer}>
                    <Text style={[
                      styles.optionText,
                      hasVoted && styles.optionTextVoted,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.option_text}
                    </Text>
                    
                    {hasVoted && (
                      <Text style={[
                        styles.percentageText,
                        isSelected && styles.percentageTextSelected
                      ]}>
                        {percentage}%
                      </Text>
                    )}
                  </View>
                  
                  {hasVoted && (
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <Animated.View 
                          style={[
                            styles.progressBarFill,
                            isSelected && styles.progressBarFillSelected,
                            {
                              width: animatedValues[option.id] ? 
                                animatedValues[option.id].interpolate({
                                  inputRange: [0, 100],
                                  outputRange: ['0%', '100%'],
                                  extrapolate: 'clamp',
                                }) : '0%'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
      </View>

      {/* Vote Count */}
      <View style={styles.footer}>
        <Text style={styles.voteCount}>
          {item.total_votes || 0} vote{(item.total_votes || 0) !== 1 ? 's' : ''}
        </Text>
        {item.is_anonymous && (
          <Text style={styles.anonymousText}>Anonymous</Text>
        )}
        {hasVoted && (
          <Text style={styles.votedText}>You voted</Text>
        )}
         {user?.id === item.user_id && (
                <Pressable
                style={styles.deleteButton}
                onPress={handleDeletePoll}
                disabled={isDeleting}
                >
                <Icon name='delete' size={14} strokeWidth={2} color='#ff4444' />
                </Pressable>
            )}
      </View>
    </View>
  );
};

export default PollCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    marginHorizontal: wp(2),
    marginVertical: hp(1),
    borderRadius: theme.radius.md,
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  userInfo: {
    marginLeft: wp(3),
    flex: 1,
  },
  username: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
  },
  timestamp: {
    color: '#888',
    fontSize: hp(1.4),
    marginTop: hp(0.2),
  },
  question: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: theme.fonts.medium,
    marginBottom: hp(1),
    lineHeight: hp(2.5),
  },
  description: {
    color: '#ccc',
    fontSize: hp(1.6),
    marginBottom: hp(2),
    lineHeight: hp(2),
  },
  optionsContainer: {
    marginBottom: hp(1.5),
  },
  optionButton: {
    backgroundColor: '#121212',
    borderRadius: theme.radius.sm,
    padding: wp(3.5),
    paddingBottom: wp(2.5),
    marginBottom: hp(1),
    borderWidth: 1,
    borderColor: '#444',
  },
  optionButtonVoted: {
    backgroundColor: '#121212',
    paddingBottom: wp(1.5),
  },
  optionButtonSelected: {
    backgroundColor: '#1a4a80',
    borderColor: '#2196F3',
  },
  optionContent: {
    flex: 1,
  },
  optionTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  optionText: {
    color: 'white',
    fontSize: hp(1.7),
    flex: 1,
    lineHeight: hp(2.2),
  },
  optionTextVoted: {
    color: '#fff',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: theme.fonts.medium,
  },
  percentageText: {
    color: '#888',
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    marginLeft: wp(2),
    minWidth: wp(10),
    textAlign: 'right',
  },
  percentageTextSelected: {
    color: 'white',
  },
  progressBarContainer: {
    marginTop: hp(0.5),
  },
  progressBarBackground: {
    height: hp(0.4),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: hp(0.2),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: hp(0.2),
  },
  progressBarFillSelected: {
    backgroundColor: '#2196F3',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  voteCount: {
    color: '#888',
    fontSize: hp(1.5),
  },
  anonymousText: {
    color: '#666',
    fontSize: hp(1.4),
    fontStyle: 'italic',
  },
  votedText: {
    color: '#4CAF50',
    fontSize: hp(1.4),
    fontWeight: theme.fonts.medium,
  },
  deleteButton: {
    width: wp(4),
    height: wp(4),
    borderRadius: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(2),
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: hp(2.5),
    fontWeight: 'bold',
    lineHeight: hp(2.5),
  },
});