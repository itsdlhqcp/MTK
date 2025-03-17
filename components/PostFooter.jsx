
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import React from 'react';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp } from '../helpers/common';
import LikeButton from './AnimatedHeartButton';
import { usePost } from '../contexts/PostContext';

const PostFooter = ({
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
    <View style={styles.footer}>
      <View style={[styles.footerButton, { width: 60 }]}>
        <LikeButton 
          item={item} 
          currentUser={currentUser} 
          updatePost={updatePost} 
        />
      </View>
      <View style={[styles.footerButton, { width: 60 }]}>
        <TouchableOpacity onPress={openPostDetails}>
          <Icon name='comment' size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.count}>
          {item?.comments?.[0]?.count || 0}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  }
});

export default PostFooter;