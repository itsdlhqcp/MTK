import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import theme from '../../constants/theme'
import { wp, hp, stripHtmlTags } from '../../helpers/common'
import Avatar from '../Avatar'
import Icon from '@/assets/icons'
import moment from 'moment'
import { getUserData } from '../../services/userServices';
import { router } from 'expo-router'
import { userService } from '../../services/helperService'
import { createCommentLike, removeCommentLike ,createCommentUnlike, removeCommentUnlike, createCommentReplylike, removeCommentReplyunlike } from '../../services/homeService'
  
import { useAuth } from '../../contexts/AuthContext'

const TcommentItem = ({
  item, 
  canDelete=false,
  onDelete = () => {},
  highlight = false,
  onReplyPress,  // New prop to handle reply press
  onShowProfile,
  router
}) => {
  const createdAt = moment(item?.created_at).format('MMM D');
  const {user} = useAuth();

  const handleDelete = () => {
    Alert.alert('Confirm', 'Are you sure you want to delete this comment?', [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: ()=> onDelete(item)
          }
        ]);
  }

  // Function to handle username press
  const handleUsernamePress = () => {
    // Either use onShowProfile or navigate directly to profile
    if (onShowProfile) {
      onShowProfile(item?.user);
    } else if (router) {
      router.push({ 
        pathname: '/profile', 
        params: { userId: item?.user?.id } 
      });
    }
  }

  const renderTextWithTags = (text) => {
    if (!text) return null;
  
    const tagRegex = /(@\w+)/g;
    const parts = text.split(tagRegex);
    
    return (
      <Text style={[styles.text, {fontWeight: 'normal'}]}>
        {parts.map((part, index) => {
          if (tagRegex.test(part)) {
            // Extract the username without the '@' symbol
            const username = part.slice(1);
            return (
              <Text 
                key={index} 
                style={styles.usernameTag}
                onPress={async () => {
                  // Try to get the full user data for the tagged username
                  const userData = await userService.getUserByName(username);
                  
                  // Open profile popup for the tagged username with complete data if found
                  if (userData) {
                    onShowProfile && onShowProfile(userData);
                  } else {
                    // Fallback to just the name if user data not found
                    Alert.alert('Error', 'User under this username not exists');
                  }
                }}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  }

  // Code for comment likes
  const [cmtlikes, setCmtlikes] = useState([]);
  
  useEffect(() => {
    setCmtlikes(item?.ctwistLikes || []);
  }, [])
  
  const handleCommentLike = async () => {
    if(cmtliked) {
      let updatedCmtLikes = cmtlikes?.filter(upvote => upvote.userId !== user?.id);
      setCmtlikes([...updatedCmtLikes]);
      const res = await removeCommentLike(item?.id, user?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      let data = {
        userId: user?.id,
        tcommentId: item?.id
      }
      setCmtlikes([...cmtlikes, data]);
      const res = await createCommentLike(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    }
  }
  
  const cmtliked = cmtlikes?.filter(cmtlike => cmtlike?.userId === user?.id)[0] ? true : false;

  // Code for comment unlikes
  const [cmtunlikes, setCmtunlikes] = useState([]);
  
  useEffect(() => {
    setCmtunlikes(item?.ctwistUnlikes || []);
  }, [])
  
  const handleCommentUnlike = async () => {
    if(cmtunliked) {
      let updatedCmtUnlikes = cmtunlikes?.filter(unlike => unlike.userId !== user?.id);
      setCmtunlikes([...updatedCmtUnlikes]);
      const res = await removeCommentUnlike(item?.id, user?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      let data = {
        userId: user?.id,
        tcommentId: item?.id
      }
      setCmtunlikes([...cmtunlikes, data]);
      const res = await createCommentUnlike(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    }
  }
  
  const cmtunliked = cmtunlikes?.filter(cmtunlike => cmtunlike?.userId === user?.id)[0] ? true : false;

  // Code for comment reply likes
  const [cmtreplylikes, setCmtreplylikes] = useState([]);
  
  useEffect(() => {
    setCmtreplylikes(item?.treplyLikes || []); 
  }, [])
  
  const handleCommentReplylike = async () => {
    if(cmtreplyliked) {
      let updatedCmtReplylikes = cmtreplylikes?.filter(replylike => replylike.userId !== user?.id);
      setCmtreplylikes([...updatedCmtReplylikes]);
      const res = await removeCommentReplyunlike(item?.id, user?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      let data = {
        userId: user?.id,
        treplyId: item?.id
      }
      setCmtreplylikes([...cmtreplylikes, data]);
      const res = await createCommentReplylike(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    }
  }
  
  const cmtreplyliked = cmtreplylikes?.filter(cmtreplylike => cmtreplylike?.userId === user?.id)[0] ? true : false;

  // Determine if the item is a comment or reply
  const isReply = Boolean(item?.treply);
//  console.log('usernae##??', item);
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleUsernamePress}>
        <Avatar
          uri={item?.user?.image}
        />
      </TouchableOpacity>
    
      {/* user profile tab */}
      <View style={[styles.content, highlight && styles.highlight]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={styles.nameContainer}>
            <TouchableOpacity onPress={handleUsernamePress}>
              <Text style={styles.text}>
                {item?.user?.name}
              </Text>
            </TouchableOpacity>
            <Text>*</Text>
            <Text style={[styles.text, {color: theme.colors.textLight}]}>
              {createdAt}
            </Text>
          </View>

          {canDelete && (
            <TouchableOpacity onPress={handleDelete}>
              <Icon name="delete" size={18} color={theme.colors.rose} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.text, {fontWeight: 'normal'}]}>
          {renderTextWithTags(item?.text)}
        </Text>
        
        {/* Icons moved to bottom of content */}
        <View style={styles.interactionContainer}>
          {/* Render different like button based on whether it's a reply or comment */}
          {!isReply ? (
            // Reply like button
            <>
              <TouchableOpacity 
                onPress={handleCommentReplylike}
                style={styles.iconButton}
              >
                <Icon        
                  name="commentlike"
                  size={hp(2.5)} 
                  color={cmtreplyliked ? "#0066ff" : "#CCCCCC"} 
                  fill={cmtreplyliked ? theme.colors.rose : 'transparent'}
                />
                <Text style={styles.count}>
                  {cmtreplylikes.length}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Comment like button
            <>
              <TouchableOpacity 
                onPress={handleCommentLike}
                style={styles.iconButton}
              >
                <Icon        
                  name="commentlike"
                  size={hp(2.5)} 
                  color={cmtliked ? "#0066ff" : "#CCCCCC"} 
                  fill={cmtliked ? theme.colors.rose : 'transparent'}
                />
                <Text style={styles.count}>
                  {cmtlikes.length}  
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Only render unlike button for comments, not replies */}
          {isReply && (
            <>
              <TouchableOpacity 
                onPress={handleCommentUnlike}
                style={styles.iconButton}
              >
                <Icon 
                  name="commentunlike"
                  size={hp(2.5)} 
                  color={cmtunliked ? "#0066ff" : "#CCCCCC"} 
                  fill={cmtunliked ? theme.colors.rose : 'transparent'}
                />
                <Text style={styles.count}>
                  {cmtunlikes.length}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Reply button with different icon based on type */}
          <TouchableOpacity 
            onPress={() => onReplyPress && onReplyPress(item?.user?.name)} 
            style={styles.iconButton}
          >
            <Icon 
              name={isReply ? "bubbleChatReply" : "replycmt"}
              size={hp(2.5)}
              color={theme.colors.primary}  
            /> 
            <Text style={styles.count}>
              {item?.treply?.length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default TcommentItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  content: {
    backgroundColor: '#161B21',   
    flex: 1,
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 5, 
    borderCurve: 'continuous', 
    borderWidth: 0.5,
    // borderColor: theme.colors.gray,
    shadowColor: '#000'
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  text: {
    fontSize: hp(1.5),
    color: '#ffffff',
    fontWeight: theme.fonts.textDark,
  },
  highlight: {
    borderWidth: 0.2,
    borderColor: 'white',
    borderColor: theme.colors.dark,
    shadowColor: theme.colors.dark, 
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  usernameTag: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
  },
  // New container for interaction icons
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  // Style for each icon and its count
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    color: '#CCCCCC',
    fontSize: hp(1.5),
    fontWeight: theme.fonts.medium,
  }
})