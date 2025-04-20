
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import React from 'react';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import LikeButton from './AnimatedHeartButton';
import { usePost } from '../contexts/PostContext';

const SpotlightFooter = ({
  item = {},
  currentUser,
  router,
  showMoreIcon = true,
}) => {
  // Add default values to protect against undefined context
  const { updatePost = () => {} } = usePost() || {};
  
  const openPostDetails = () => {
    if (!showMoreIcon || !item?.id) return null;
    router.push({pathname: 'postDetails', params: {postId: item.id}});
  }
  
  return (
    <View style={styles.container}>
      {/* Action buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <LikeButton 
            item={item} 
            currentUser={currentUser} 
            updatePost={updatePost} 
          />
          
          <TouchableOpacity style={styles.actionButton} onPress={openPostDetails}>
            <Icon name='comment' size={hp(2.8)} strokeWidth={2} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name='share' size={hp(2.6)} strokeWidth={2} color={theme.colors.light} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name='bookmark' size={hp(2.6)} strokeWidth={2} color={theme.colors.light} />
        </TouchableOpacity>
      </View>
      
      {/* Likes count */}
      <View style={styles.countsSection}>
      <Text style={styles.comments} onPress={openPostDetails}>
            {item?.comments === 0 
                ? "Be the first to comment" 
                : item?.comments === 1 
                ? "View the first comment" 
                : `View all ${item?.comments} comments`}
            </Text>
      </View>
    </View>
  );
};

export default SpotlightFooter;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
  },
  leftActions: {
    flexDirection: 'row',
    gap: wp(3),
  },
  actionButton: {
    padding: hp(0.5),
  },
  countsSection: {
    paddingBottom: hp(1),
  },
  likes: {
    fontSize: hp(1.7),
    fontWeight: '600',
    color: theme.colors.light,
    marginBottom: hp(0.5),
  },
  comments: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  }
});

