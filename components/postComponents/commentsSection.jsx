import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { hp, wp } from '../../helpers/common';
import theme from '../../constants/theme';
import CommentItem from './CommentItem';
import Input from '../Input';
import Icon from '../../assets/icons';
import FeedLoader from '../FeedLoader';

const CommentSection = ({ 
  comments = [], 
  user, 
  post,
  onDeleteComment, 
  highlightedCommentId,
  fetchCommentReplies,
  createReply,
  onNewComment,
  commentRef,
  inputRef,
  loading,
  openProfilePopup,
  router
}) => {
  const [openReplyBox, setOpenReplyBox] = useState(null);
  const [commentReplies, setCommentReplies] = useState({});
  const replyRef = useRef('');
  const [replyText, setReplyText] = useState(''); // Add state to control input field
  const [rloading, setRloading] = useState(false);
  const [mentionedUser, setMentionedUser] = useState('');

  // console.log('set of all comments', comments);

  const toggleReplyBox = (commentId, username) => {
    // Always set openReplyBox to commentId when username is provided
    if (username) {
      setOpenReplyBox(commentId);
      setReplyText(`@${username} `);
      replyRef.current = `@${username} `;
    } else {
      // Original toggle behavior only when no username is provided
      setOpenReplyBox(prev => prev === commentId ? null : commentId);
      setReplyText(''); // Clear reply text when toggling without username
    }
  };

  // Function to fetch replies for a comment
  const handleFetchReplies = async (commentId) => {
    try {
      const res = await fetchCommentReplies(commentId);
      if (res.success) {
        setCommentReplies(prev => ({
          ...prev,
          [commentId]: res.data
        }));
      }
    } catch (error) {
      console.error('Error fetching replies', error);
    }
  };

  // Function to submit a reply
  const handleSubmitReply = async (parentCommentId) => {
    if (!replyRef.current || !user?.id) return null;
    
    let data = {
      userId: user.id,
      text: replyRef.current,
      parentCommentId: parentCommentId
    };
    setRloading(true);
    try {
      let res = await createReply(data);
      if (res.success) {
        // Fetch updated replies
        await handleFetchReplies(parentCommentId);
        replyRef.current = ''; // Reset reply text reference
        setReplyText(''); // Reset visible input field
      } else {
        Alert.alert('Reply', res.msg || 'Something went wrong');
      }
    } catch (err) {
      Alert.alert('Reply', 'Something went wrong');
    } finally {
      setRloading(false);
    }
  };

  const renderCommentInput = () => (
    <View style={styles.inputContainer}>
      <Input
        inputRef={inputRef}
        placeholder="Type comment..."
        onChangeText={value => commentRef.current = value}
        placeholderTextColor={theme.colors.textLight}
        containerStyle={{flex: 1, height: hp(6.2), borderRadius: theme.radius.xl}}
      />
      {
        loading ? (
          <View style={styles.loading}>
            <FeedLoader size="small" color={theme.colors.primaryDark} />
          </View>
        ) : (
          <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
            <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
          </TouchableOpacity>
        )
      }
    </View>
  );

  // below code renders the set of comments
  const renderComments = () => (
    <View style={styles.commentsContainer}>
      {comments.length === 0 ? (
        <Text style={styles.noComments}>Be first to comment</Text>
      ) : (
        comments
          .filter(comment => !comment.parentCommentId)
          .map(comment => (
            <View key={comment?.id?.toString()}>
              <CommentItem
                item={comment}
                onDelete={onDeleteComment}
                highlight={highlightedCommentId === comment.id}
                canDelete={user.id === comment.userId || user.id === post.userId}
                onReplyPress={() => {
                  toggleReplyBox(comment.id);
                  if (!commentReplies[comment.id]) {
                    handleFetchReplies(comment.id);
                  }
                }}
                onShowProfile={openProfilePopup}
                router={router}
              />
              
              {/* Render replies when reply box is open */}
              {openReplyBox === comment.id && commentReplies[comment.id]?.map(reply => (
                <View key={reply.id} style={styles.replyContainer}>
                  <CommentItem
                    item={reply}
                    onDelete={onDeleteComment}
                    canDelete={user.id === reply.userId || user.id === post.userId}
                    onReplyPress={() => toggleReplyBox(comment.id, reply.user.name)}
                    onShowProfile={openProfilePopup}
                    router={router}
                  />
                </View>
              ))}
              
              {/* Reply input box */}
              {openReplyBox === comment.id && (
                <View style={styles.replyInputContainer}>
                  <Input
                    placeholder={`reply to @${comment.user.name}...`}
                    value={replyText} // Control input with state
                    onChangeText={value => {
                      setReplyText(value); // Update state
                      replyRef.current = value; // Update ref
                    }}
                    placeholderTextColor={theme.colors.textLight}
                    containerStyle={{
                      flex: 1,
                      height: hp(5),
                      borderRadius: theme.radius.sm
                    }}
                  />
                  {rloading ? (
                    <View style={styles.loading}>
                      <FeedLoader size="small" color={theme.colors.primaryDark} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.replySendIcon}
                      onPress={() => handleSubmitReply(comment.id)}
                    >
                      <Icon name="send" size={hp(3)} color={theme.colors.primaryDark} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderCommentInput()}
      {renderComments()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    //  backgroundColor: 'grey'
  },
  commentsContainer: {
    marginVertical: 15,
    gap: 17
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  loading: {
    height: hp(5.8),
    width: hp(5.8),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.3 }]
  },
  sendIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    height: hp(5.8),
    width: hp(5.8)
  },
  replySendIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    height: hp(4.8),
    width: hp(4.8)
  },
  replyContainer: {
    marginLeft: 50,
    marginTop: 5
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginHorizontal: 10,
    marginLeft: 50
  },
  noComments: {
    textAlign: 'center',
    paddingStart: wp(5),
    color: theme.colors.textLight
  }
});

export default CommentSection;