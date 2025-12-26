import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, Alert, View } from 'react-native';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp } from '../helpers/common';
import { createPostLike, removePostLike } from '../services/postService';

const LikeButton = ({ 
  item, 
  currentUser, 
  updatePost = () => {},
  iconType = 'heart' // 'heart' for spotlight, 'popcorn' for home
}) => {
  const [likes, setLikes] = useState([]);
  
  useEffect(() => {
    setLikes(item?.postLikes || []);
  }, [item?.postLikes]);
  
  const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;
  
  const onLike = async () => {
    if (!currentUser?.id || !item?.id) {
      Alert.alert('Error', 'Unable to like post');
      return;
    }

    try {
      if (liked) {
        const updatedLikes = likes.filter(like => like.userId !== currentUser.id);
        setLikes(updatedLikes);
        
        // Update parent component
        updatePost(item.id, { postLikes: updatedLikes });
        
        const res = await removePostLike(item.id, currentUser.id);
        if (!res.success) {
          Alert.alert('Post', 'Something went wrong');
          setLikes(likes); // Revert on error
          updatePost(item.id, { postLikes: likes });
        }
      } else {
        const newLike = {
          userId: currentUser.id,
          postId: item.id
        };
        const updatedLikes = [...likes, newLike];
        setLikes(updatedLikes);
        
        // Update parent component
        updatePost(item.id, { postLikes: updatedLikes });
        
        const res = await createPostLike(newLike);
        if (!res.success) {
          Alert.alert('Post', 'Something went wrong');
          setLikes(likes); // Revert on error
          updatePost(item.id, { postLikes: likes });
        }
      }
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={onLike} 
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View>
          <Icon 
            name={iconType} 
            size={24} 
            fill={iconType === 'popcorn' ? 'transparent' : (liked ? theme.colors.blue : 'transparent')} 
            strokeWidth={iconType === 'popcorn' && liked ? 2.5 : 1.4} 
            color={iconType === 'popcorn' && liked ? '#FFD700' : (liked ? theme.colors.blue : theme.colors.blue)}
          />
        </View>
      </TouchableOpacity>
      <Text style={styles.count}>
        {likes?.length || 0}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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

export default LikeButton;