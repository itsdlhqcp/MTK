import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, Animated, Alert, View } from 'react-native';
import Icon from '../assets/icons';
import theme from '../constants/theme';
import { hp } from '../helpers/common';
import { createPostLike, removePostLike } from '../services/postService';

const LikeButton = ({ 
  item, 
  currentUser, 
  updatePost = () => {} 
}) => {
  const [likes, setLikes] = useState([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    setLikes(item?.postLikes || []);
  }, [item?.postLikes]);
  
  const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;
  
  const animateHeart = (isLiking) => {
    if (isLiking) {
      // When liking: scale up, rotate slightly, then return to normal
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // When unliking: small bounce animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };
  
  const onLike = async () => {
    if (!currentUser?.id || !item?.id) {
      Alert.alert('Error', 'Unable to like post');
      return;
    }

    try {
      if (liked) {
        // First animate, then update state
        animateHeart(false);
        
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
        // First animate, then update state
        animateHeart(true);
        
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
  
  // Convert rotation value to rotation string
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
        <Animated.View
          style={{
            transform: [
              { scale: scaleAnim },
              { rotate: rotate }
            ]
          }}
        >
          <Icon 
            name='heart' 
            size={24} 
            fill={liked ? theme.colors.rose : 'transparent'} 
            strokeWidth={1.4} 
            color={liked ? theme.colors.blue : theme.colors.textDark}
          />
        </Animated.View>
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