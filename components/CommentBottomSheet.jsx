import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';
import { createComment, createReply, fetchCommentReplies, fetchPostDetails } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import CommentsSection from '../components/postComponents/commentsSection';
import { supabase } from '../lib/supabase';
import { createNotifications } from '../services/notificationService';
import FeedLoader from '../components/FeedLoader';

const CommentBottomSheet = ({ postId, isVisible, onClose }) => {
  const bottomSheetRef = useRef(null);
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const commentRef = useRef('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Snap points for the bottom sheet (percentage of screen height)
  const snapPoints = ['70%', '90%'];

  // Open or close the bottom sheet based on isVisible prop
  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand();
      getPostDetails();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  // Handle when the sheet changes index
  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      // Sheet is closed
      onClose();
    }
  }, [onClose]);

  // Fetch post details including comments
  const getPostDetails = async () => {
    try {
      setLoading(true);
      let res = await fetchPostDetails(postId);
      if (res.success) {
        setPost(res.data);
      } else {
        setError('Failed to load comments');
      }
    } catch (err) {
      setError('Error loading comments');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time comment updates
  useEffect(() => {
    if (!postId) return;

    const handleNewComment = async (payload) => {
      if (payload.new) {
        let newComment = { ...payload.new };
        // In production code, you'd need to fetch user data here
        // let res = await getUserData(newComment.userId);
        // newComment.user = res.success ? res.data : {};
        
        // For now, we'll just refresh the post details
        getPostDetails();
      }
    };

    // Subscribe to comment changes for this post
    let commentChannel = supabase
      .channel('comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}` }, handleNewComment)
      .subscribe();

    return () => {
      supabase.removeChannel(commentChannel);
    };
  }, [postId]);

  // Submit a new comment
  const onNewComment = async () => {
    if (!commentRef.current || !user?.id || !postId) return null;

    let data = {
      userId: user.id,
      postId: postId,
      text: commentRef.current
    };

    setCommentLoading(true);
    try {
      let res = await createComment(data);
      if (res.success) {
        if (user.id !== post?.userId) {
          // Send notification for the comment
          let notify = {
            senderId: user.id,
            receiverId: post.userId,
            title: 'commented on your post',
            data: JSON.stringify({ postId: postId, commentId: res?.data?.id })
          };
          createNotifications(notify);
        }
        inputRef?.current?.clear();
        commentRef.current = "";
        // Optionally refresh the post details to show new comment
        await getPostDetails();
      } else {
        Alert.alert('Comment', res.msg || 'Something went wrong');
      }
    } catch (err) {
      Alert.alert('Comment', 'Something went wrong');
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete a comment
  const onDeleteComment = async (comment) => {
    let res = await removeComment(comment?.id);
    if (res.success) {
      setPost(prevPost => {
        let updatedPost = { ...prevPost };
        updatedPost.comments = updatedPost.comments.filter(c => c.id !== comment.id);
        return updatedPost;
      });
    } else {
      Alert.alert('Error', res.msg || 'Something went wrong');
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <FeedLoader />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : post ? (
          <CommentsSection
            comments={post?.comments || []}
            user={user}
            post={post}
            onDeleteComment={onDeleteComment}
            fetchCommentReplies={fetchCommentReplies}
            createReply={createReply}
            onNewComment={onNewComment}
            commentRef={commentRef}
            inputRef={inputRef}
            loading={commentLoading}
            router={null} // We don't need navigation within the bottom sheet
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet</Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBg: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: '#333',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1),
    marginBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: hp(2.2),
    fontWeight: '600',
    color: theme.colors.light,
  },
  closeButton: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: hp(2.5),
    color: theme.colors.light,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.rose,
    fontSize: hp(1.8),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.light,
    fontSize: hp(1.8),
  },
});

export default CommentBottomSheet;