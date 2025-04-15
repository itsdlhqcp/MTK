import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import theme from '../constants/theme'
import { wp, hp, stripHtmlTags } from '../helpers/common'
import Avatar from './Avatar'
import Icon from '@/assets/icons'
import moment from 'moment'
import { fetchReviewReplies } from '../services/ottService'

const ReviewItem = ({
  item, 
  canDelete = false,
  onDelete = () => {},
  highlight = false,
  onReplyReviewPress,
  onShowProfile,
  router,
  isReply = false
}) => {
  const [replyCount, setReplyCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isReply) {
      fetchReplyCount()
    }
  }, [item.id])

  const fetchReplyCount = async () => {
    if (!item.id) return
    
    setIsLoading(true)
    try {
      const res = await fetchReviewReplies(item.id)
      if (res.success) {
        setReplyCount(res.data.length)
      }
    } catch (error) {
      console.error('Error fetching reply count:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createdAt = moment(item?.created_at).format('MMM ddd, h:mm a')

  const handleDelete = () => {
    Alert.alert('Confirm', 'Are you sure you want to do this?', [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(item)
      }
    ])
  }

  const handleUsernamePress = () => {
    if (onShowProfile) {
      onShowProfile(item?.user)
    } else if (router) {
      router.push({ 
        pathname: '/profile', 
        params: { userId: item?.user?.id } 
      })
    }
  }

  const renderTextWithTags = (text) => {
    if (!text) return null
  
    const tagRegex = /(@\w+)/g
    const parts = text.split(tagRegex)
    
    return (
      <Text style={[styles.text, {fontWeight: 'normal'}]}>
        {parts.map((part, index) => {
          if (tagRegex.test(part)) {
            const username = part.slice(1)
            return (
              <Text 
                key={index} 
                style={styles.usernameTag}
                // onPress={() => {
                //   onShowProfile({ name: username })
                // }}
              >
                {part}
              </Text>
            )
          }
          return <Text key={index}>{part}</Text>
        })}
      </Text>
    )
  }

  return (
    <View style={styles.container}>
      {/* <Avatar
        uri={item?.user?.image}
        // onPress={handleUsernamePress}
      /> */}
      <View style={[styles.content, highlight && styles.highlight]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={styles.nameContainer}>
            <TouchableOpacity
            //  onPress={handleUsernamePress}
             >
              <Text style={styles.text}>
                {item?.user?.name}
              </Text>
            </TouchableOpacity>
            <Text>*</Text>
            <Text style={[styles.text, {color: theme.colors.textLight}]}>
              {createdAt}
            </Text>
          </View>
           
          <View style={styles.replySection}>
            {!isReply && (
              <>
                <TouchableOpacity 
                  onPress={() => onReplyReviewPress(item.id)} 
                  style={styles.replyIcon}
                >
                  <Icon name="bubbleChatReply" size={hp(2.5)} color={theme.colors.text} />
                </TouchableOpacity>
               
                  {/* <Text style={styles.replyCount}>{replyCount || 0}</Text> replyReviews */}
                  <Text style={styles.replyCount}>{item?.replyReviews?.length}</Text>
                
              </>
            )}
          </View>

          {/* {canDelete && (
            <TouchableOpacity onPress={handleDelete}>
              <Icon name="delete" size={20} color={theme.colors.rose} />
            </TouchableOpacity>
          )} */}
        </View>
        <Text style={[styles.text, {fontWeight: 'normal'}]}>
          {renderTextWithTags(item?.text)}
        </Text>
      </View>
    </View>
  )
}

export default ReviewItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    flex: 1,
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderWidth: 0.1,
    borderColor: theme.colors.gray,
    shadowColor: '#000'
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  text: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
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
  replySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 2,
    gap: 5,
  },
  replyCount: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  replyIcon: {
    padding: 2,
  },
  replyCount: {
    fontSize: hp(1.4),
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  replyIcon: {
    padding: 2,
  }
})