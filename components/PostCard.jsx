import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import theme from '../constants/theme'
import { wp, hp } from '../helpers/common'
import Avatar from './Avatar'
import Icon from '@/assets/icons'
import moment from 'moment/moment'
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { getSupabaseFileUrl } from '../services/imageService'

// here all the styling of text editor can be updated
// HTML STYLES

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
  item,
  currentUser,
  router,
  hasShadow = true
}) => {
  const shadowStyle ={
    shadowOffset: {
      width: 0, height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 1
  }
  console.log('post items', item);
  const createdat = moment(item?.created_at).format('MMM D');
  const likes = [];
  const liked = false;

  const openPostDetails = () => {

  }
  return (
    <View style={[styles.container, hasShadow && shadowStyle]}>
      <View style={styles.header}>
        {/* user info and post time */}
        <View style={styles.userInfo}>
          <Avatar
          size={hp(4.5)}
          uri={item?.user?.image}
          rounded={theme.radius.lg}
          />
          <View style={{gap: 2}}>
             <Text style={styles.username}>{item?.user?.name}</Text>
             <Text style={styles.username}>{createdat}</Text>
          </View>

        </View>


        <TouchableOpacity onPress={openPostDetails}>
            <Icon name='threeDotsHorizontal' size={hp(3)} strokeWidth={3} color={theme.colors.text}/>
          </TouchableOpacity>
      </View>


      {/* post body and media  */}
    <View style={styles.content}>
      <View style={styles.postBody}>
       {
        item?.body && (
          <RenderHtml
          contentWidth={wp(100)}
          source={{html: item?.body}}
          tagsStyles={tagsStyles}
          />
        )
       }
      </View>
    </View>


    {/* POST IMAGES ARE DISPLAYED HERE */}
    {
      item?.file && item?.file?.includes('postImage') && (
        <Image
          source={getSupabaseFileUrl(item?.file)} 
          transition={100}
          style={styles.postMedia}
          contentFit='cover'
        />
      )
    }
   
   {/* POST vedeos ARE DISPLAYED HERE */}
     {
      item?.file && item?.file?.includes('postVideo') && (
        <Video
         style={styles.postMedia}
         source={getSupabaseFileUrl(item?.file)}
         useNativeControls 
         resizeMode='cover'
         isLooping
        />
      )
     }


{/* // like  , comment and share */}
    <View style={styles.footer}>
      <View style={styles.footerButton}>
        <TouchableOpacity>
            <Icon name='heart' size={24} fill={!liked? theme.colors.rose : 'transparent'} strokeWidth={1.4} color={liked ? theme.colors.blue : theme.colors.textDark}/>
        </TouchableOpacity>
        <Text style={styles.count}>
          {
            likes?.length
          }
        </Text>
      </View>

      <View style={styles.footerButton}>
        <TouchableOpacity>
            <Icon name='comment' size={24} strokeWidth={2} color={liked ? theme.colors.rose : theme.colors.textDark}/>
        </TouchableOpacity>
        <Text style={styles.count}>
          {
            likes?.length
          }
        </Text>
      </View>

      <View style={styles.footerButton}>
        <TouchableOpacity>
            <Icon name='share' size={24} strokeWidth={2} color={liked ? theme.colors.rose : theme.colors.textDark}/>
        </TouchableOpacity>
        <Text style={styles.count}>
          {
            likes?.length
          }
        </Text>
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
    gap: 15,
    marginLeft: 12
  },
  footerButton: {
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  }
 
})