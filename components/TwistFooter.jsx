import { Text, View, StyleSheet, TouchableOpacity, Animated, Share } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import Icon from '../assets/icons'
import theme from '../constants/theme'
import { hp, stripHtmlTags } from '../helpers/common'
import { createPostLike, removePostLike } from '../services/postService'
import { usePost } from '../contexts/PostContext';
import { createTwistLikes, createTwistUnlikes, removeTwistLikes, removeTwistUnlikes } from '../services/homeService'
import { getSupabaseFileUrl, homeContentDownload } from '../services/imageService'

const TwistFooter = ({
  item,
  currentUser,
  router,
  showMoreIcon = true,
}) => {
  const { activePosts = {}, updatePost = () => {} } = usePost() || {};
 // console.log('item', item);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // const [likes, setLikes] = useState([]);
  
  // useEffect(() => {
  //   setLikes(item?.postLikes || []);
  // }, [item?.postLikes]);
  
  // useEffect(() => {
  //   if (activePosts && item?.id && activePosts[item.id]?.postLikes) {
  //     setLikes(activePosts[item.id].postLikes);
  //   }
  // }, [activePosts, item?.id]);
  
  // const liked = true;
  
  const openPostDetails = () => {
    if (!showMoreIcon || !item?.id) return null;
    router.push({pathname: 'twistDetails', params: {postId: item.id}});
  };
  
  const animateHeart = (isLiking) => {
    if (isLiking) {
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
  
  // const onLike = async () => {
  //   // Original like functionality kept intact
  //   // Code omitted for brevity
  // };
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  // below is the code to handle twist likes  

  const [twistlikes, setTwistlikes] = useState([]);

  useEffect(() => {
    setTwistlikes(item?.twistLikes || []);
  }, [])

  const onLike = async () => {
    if(twistliked) {
      let updatedUpvotes = twistlikes.filter(upvote => upvote.userId !== currentUser?.id);
      setTwistlikes([...updatedUpvotes]);
      const res = await removeTwistLikes(item?.id, currentUser?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      let data = {
        userId: currentUser?.id,
        twistId: item?.id
      }
      setTwistlikes([...twistlikes, data]);
      const res = await createTwistLikes(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    }
  }

  const twistliked = twistlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

    // below is the code to handle twist unlikes  

    const [twistunlikes, setTwistunlikes] = useState([]);

    useEffect(() => {
      setTwistunlikes(item?.twistUnlikes || []);
    }, [])
  
    const onunLike = async () => {
      if(twistunliked) {
        let updatedUpvotes = twistunlikes.filter(upvote => upvote.userId !== currentUser?.id);
        setTwistunlikes([...updatedUpvotes]);
        const res = await removeTwistUnlikes(item?.id, currentUser?.id);
        if(!res.success){
          Alert.alert('Error', res.msg || 'Something went wrong');
        }
      } else {
        let data = {
          userId: currentUser?.id,
          twistId: item?.id
        }
        setTwistunlikes([...twistunlikes, data]);
        const res = await createTwistUnlikes(data);
        if(!res.success){
          Alert.alert('Error', res.msg || 'Something went wrong');
        }
      }
    }
  
    const twistunliked = twistunlikes?.filter(upvote => upvote?.userId === currentUser?.id)[0] ? true : false;

    /// below is the code to share items 

      const onShare = async () => {
         let content = {message: stripHtmlTags(item?.body)};
         if(item?.file){
          let url = await homeContentDownload(getSupabaseFileUrl(item?.file).uri);
          content.url = url;
         }
         Share.share(content);
      };
  
  return (
    <View style={styles.footer}>
      {/* Left side interaction buttons */}
      <View style={styles.leftButtons}>
        {/* Like button */}
        {/* <View style={styles.footerButton}>
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
                color={liked ? theme.colors.rose : theme.colors.light || '#E0E0E0'}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.count}>
            {likes?.length || 0}
          </Text>
        </View> */}
  {/* thumbsup button here */}
        <View style={styles.footerButton}>
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
                name='thumbsup'
                size={24} 
                fill={twistliked ? "" : 'transparent'} 
                strokeWidth={1.4} 
                color={twistliked ? '#00BCD4' : theme.colors.light || '#E0E0E0'}
              />  

            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.count}>
            {twistlikes?.length || 0}
          </Text>
        </View>

        {/* thums down button here */}

        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onunLike} activeOpacity={0.7}>
            <Animated.View
              style={{
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotate }
                ]
              }}
            >

              <Icon 
                name='thumbsdown'
                size={24} 
                fill={twistunliked ? '' : 'transparent'} 
                strokeWidth={1.4} 
                color={twistunliked ? '#F44336' : theme.colors.light || '#E0E0E0'}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.count}>
            {twistunlikes?.length || 0}
          </Text>
        </View>
        
        {/* Comment button */}
          <View style={styles.footerButton}>
            <TouchableOpacity onPress={openPostDetails}>
              <Icon name='comment' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
            </TouchableOpacity>
            <Text style={styles.count}>
              {item?.tcomments?.[0]?.count || 0}
            </Text>
          </View>

          {/* Share button */}
          {/* <View style={styles.footerButton}>
            <TouchableOpacity onPress={onShare}>
              <Icon name='share' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
            </TouchableOpacity>
            <Text style={styles.count}>
              {item?.comments?.[0]?.count || 0}
            </Text>
          </View> */}
        
        {/* Share button */}
        {/* <TouchableOpacity style={styles.footerButton}>
          <Icon name='send' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
        </TouchableOpacity> */}
      </View>
      
      {/* Right side save button */}
          <TouchableOpacity>
            <Icon name='bookmark' size={24} strokeWidth={1.4} color={theme.colors.light || '#E0E0E0'} />
          </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 16,
  },
  count: {
    color: theme.colors.light || '#E0E0E0',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  }
});

export default TwistFooter;