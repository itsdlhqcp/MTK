import {  Text,View, StyleSheet, TouchableOpacity, Image, Alert, Share } from 'react-native'
import React, { useEffect, useState } from 'react'
import theme from '../constants/theme'
import { wp, hp, stripHtmlTags } from '../helpers/common'
import Avatar from './Avatar'
import Icon from '../assets/icons'
import moment from 'moment/moment'
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { downloadFile, shareContent } from '../services/imageService'
import { getSupabaseFileUrl } from '../services/userProfileImage'
import { createPostLike, removePostLike } from '../services/postService'
import Loading from './Loading'

const textStyle = {
  color: theme.colors.dark, 
  fontSize: hp(1.75)
}

const tagsStyles = {
  div: textStyle,
  p: textStyle,
  ol: textStyle,
  h1: {
    color: theme.colors.dark,
  },
  h4: {
    color: theme.colors.dark
  }
}

const PostCard = ({
  item = {},  // Provide default empty object
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = false, 
  onDelete = () => {}, 
  onEdit = () => {}
}) => {
  const shadowStyle = {
    shadowOffset: {
      width: 0, height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 1
  }
  
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Add null checks for item
  const createdat = item?.created_at ? moment(item.created_at).format('MMM D') : '';
  const liked = likes?.filter(like => like?.userId === currentUser?.id)?.length > 0;

  useEffect(() => {
    // Add null check for postLikes
    setLikes(item?.postLikes || []);
  }, [item?.postLikes]);

  const openPostDetails = () => {
    if (!showMoreIcon || !item?.id) return null;
    router.push({pathname: 'postDetails', params: {postId: item.id}});
  }

  const onLike = async () => {
    if (!currentUser?.id || !item?.id) {
      Alert.alert('Error', 'Unable to like post');
      return;
    }

    try {
      if (liked) {
        const updatedLikes = likes.filter(like => like.userId !== currentUser.id);
        setLikes(updatedLikes);
        const res = await removePostLike(item.id, currentUser.id);
        if (!res.success) {
          Alert.alert('Post', 'Something went wrong');
          setLikes(likes); // Revert on error
        }
      } else {
        const newLike = {
          userId: currentUser.id,
          postId: item.id
        };
        setLikes([...likes, newLike]);
        const res = await createPostLike(newLike);
        if (!res.success) {
          Alert.alert('Post', 'Something went wrong');
          setLikes(likes); // Revert on error
        }
      }
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  }

  const onShare = async () => {
    try {
      setLoading(true);
      const content = {message: stripHtmlTags(item?.body || '')};
      if (item?.file) {
        const url = await downloadFile(getSupabaseFileUrl(item.file).uri);
        content.url = url;
      }
      await Share.share(content);
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Unable to share post');
    } finally {
      setLoading(false);
    }
  }

  // const handlePostDelete = async () => {
  //      Alert.alert('Confirm', 'Are you sure you want to delete this Post?', [
  //               {
  //                 text: 'Cancel',
  //                 style: 'cancel'
  //               },
  //               {
  //                 text: 'Delete',
  //                 style: 'destructive',
  //                 onPress: ()=> onDelete(item)
  //               }
  //             ]);
  // }

  const handlePostDelete = () => {
    if (typeof showDelete === 'function') {
              showDelete(item);
          }
      }

  if (!item) return null;

  return (
    <View style={[styles.container, hasShadow && shadowStyle]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar
            size={hp(4.5)}
            uri={item?.user?.image}
            rounded={theme.radius.lg}
          />
          <View style={{gap: 2}}>
            <Text style={styles.username}>{item?.user?.name || 'Anonymous'}</Text>
            <Text style={styles.username}>{createdat}</Text>
          </View>
        </View>

        {showMoreIcon && (
          <TouchableOpacity onPress={openPostDetails}>
            <Icon 
              name='threeDotsHorizontal'
              size={hp(3)}
              strokeWidth={3}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}

         {/* post edit components */}
        {
          showDelete && currentUser?.id === item?.userId && (
            <View style={styles.actions}>
                 <TouchableOpacity onPress={()=> onEdit(item)}>
                     <Icon 
                     name='edit'
                     size={hp(2.5)}
                     color={theme.colors.text}
                     ></Icon>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={handlePostDelete}>
                     <Icon 
                     name='delete'
                     size={hp(2.5)}
                     color={theme.colors.rose}
                     ></Icon>
                 </TouchableOpacity>
               
            </View>
          )
        }
      </View>

      <View style={styles.content}>
        <View style={styles.postBody}>
          {item?.body && (
            <RenderHtml
              contentWidth={wp(100)}
              source={{html: item.body}}
              tagsStyles={tagsStyles}
            />
          )}
        </View>
      </View>

      {item?.file?.includes('postImage') && (
        <Image
          source={getSupabaseFileUrl(item.file)} 
          transition={100}
          style={styles.postMedia}
          contentFit='cover'
        />
      )}
   
      {item?.file?.includes('postVideo') && (
        <Video
          style={styles.postMedia}
          source={getSupabaseFileUrl(item.file)}
          useNativeControls 
          resizeMode='cover'
          isLooping
        />
      )}

      <View style={styles.footer}>
        <View style={[styles.footerButton, { width: 60 }]}>
          <TouchableOpacity onPress={onLike}>
            <Icon 
              name='heart' 
              size={24} 
              fill={liked ? theme.colors.rose : 'transparent'} 
              strokeWidth={1.4} 
              color={liked ? theme.colors.blue : theme.colors.textDark}
            />
          </TouchableOpacity>
          <Text style={styles.count}>
            {likes?.length || 0}
          </Text>
        </View>
        <View style={[styles.footerButton, { width: 60 }]}>
          <TouchableOpacity onPress={openPostDetails}>
            <Icon name='comment' size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.count}>
            {item?.comments?.[0]?.count || 0}
          </Text>
        </View>
        <View style={[styles.footerButton, { width: 60 }]}>
          {loading ? (
            <Loading size="small" />
          ) : (
            <TouchableOpacity onPress={onShare}>
              <Icon name='share' size={24} strokeWidth={2}/>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

export default PostCard

const styles = StyleSheet.create({
  container:{
    gap: 10, 
    marginBottom: 15, 
    borderRadius: theme.radius.xxl*1.1,
    borderCurve: 'continuous', 
    padding: 10,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    shadowColor: '#000'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium
  },
  userInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  },
  postTime: {
    fontSize: hp(1.5), 
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium
  },
  content: {
   gap: 10,
   marginLeft: 12,
  },
  postMedia: {
    height: hp(40),
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
  },
  // postBody: {
  //   marginLeft: 1
  // },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    // Remove gap as we're using fixed widths
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    // Remove marginLeft as we're using fixed widths
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginRight: 7
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  }
 
})


