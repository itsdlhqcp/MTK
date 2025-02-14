import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { wp, hp } from '@/helpers/common'
import theme from '../constants/theme'
import moment from 'moment/moment'
import Avatar from './Avatar'
import Icon from '../assets/icons'
import RenderHtml from 'react-native-render-html';
import { getSupabaseFileUrl } from '../services/userProfileImage'

const OttCard = ({
    item,
    currentUser,
    router, 
    hasShadow = true,
}) => {
    const shadowStyle = {
        shadowOffset: {
            width: 0, height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 1
    }

    const createdAt = item?.created_at ? moment(item.created_at).format('MMM D') : '';

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

    const openPostDetails = () => {
        if (!showMoreIcon || !item?.id) return null;
        router.push({pathname: 'postDetails', params: {postId: item.id}});
      }
  return (
    <View style={[styles.container, hasShadow && shadowStyle]}>
      <View style={styles.header}>
        {/* Header  user info and post time*/}
        <View style={styles.userInfo}>
          <Avatar
            uri={item?.user?.image}
            size={hp(4.5)}
            rounded={theme.radius.lg}
          />
          <View style={{gap: 2}}>
            <Text style={styles.username}>{item?.user?.name || 'Anonymous'}</Text>
            <Text style={styles.username}>{createdAt}</Text>
          </View>
        </View>


      <TouchableOpacity onPress={openPostDetails}>
            <Icon 
            name='threeDotsHorizontal'
            size={hp(3.8)}
            strokeWidth={3}
            color={theme.colors.text}
            />
        </TouchableOpacity> 
      </View>


      {/* release body and details */}

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
       
      {/* post image is shown hre */}
         {item?.file?.includes('postImage') && (
               <Image
                 source={getSupabaseFileUrl(item.file)} 
                 transition={100}
                 style={styles.postMedia}
                 contentFit='cover'
               />
             )}
    </View>
  )
}

export default OttCard

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
      paddingHorizontal: wp(1.4),
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
  