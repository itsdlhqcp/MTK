// import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useEffect, useState } from 'react'
// import theme from '../constants/theme'
// import { wp, hp, stripHtmlTags } from '../helpers/common'
// import Avatar from './Avatar'
// import Icon from '@/assets/icons'
// import moment from 'moment'
// import { fetchReviewReplies } from '../services/ottService'

// const ReviewItem = ({
//   item, 
//   canDelete = false,
//   onDelete = () => {},
//   highlight = false,
//   onReplyReviewPress,
//   onShowProfile,
//   router,
//   isReply = false
// }) => {
//   const [replyCount, setReplyCount] = useState(0)
//   const [isLoading, setIsLoading] = useState(false)

//   useEffect(() => {
//     if (!isReply) {
//       fetchReplyCount()
//     }
//   }, [item.id])

//   const fetchReplyCount = async () => {
//     if (!item.id) return
    
//     setIsLoading(true)
//     try {
//       const res = await fetchReviewReplies(item.id)
//       if (res.success) {
//         setReplyCount(res.data.length)
//       }
//     } catch (error) {
//       console.error('Error fetching reply count:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const createdAt = moment(item?.created_at).format('MMM ddd, h:mm a')

//   const handleDelete = () => {
//     Alert.alert('Confirm', 'Are you sure you want to do this?', [
//       {
//         text: 'Cancel',
//         style: 'cancel'
//       },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: () => onDelete(item)
//       }
//     ])
//   }

//   const handleUsernamePress = () => {
//     if (onShowProfile) {
//       onShowProfile(item?.user)
//     } else if (router) {
//       router.push({ 
//         pathname: '/profile', 
//         params: { userId: item?.user?.id } 
//       })
//     }
//   }

//   const renderTextWithTags = (text) => {
//     if (!text) return null
  
//     const tagRegex = /(@\w+)/g
//     const parts = text.split(tagRegex)
    
//     return (
//       <Text style={[styles.text, {fontWeight: 'normal'}]}>
//         {parts.map((part, index) => {
//           if (tagRegex.test(part)) {
//             const username = part.slice(1)
//             return (
//               <Text 
//                 key={index} 
//                 style={styles.usernameTag}
//                 // onPress={() => {
//                 //   onShowProfile({ name: username })
//                 // }}
//               >
//                 {part}
//               </Text>
//             )
//           }
//           return <Text key={index}>{part}</Text>
//         })}
//       </Text>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       {/* <Avatar
//         uri={item?.user?.image}
//         // onPress={handleUsernamePress}
//       /> */}
//       <View style={[styles.content, highlight && styles.highlight]}>
//         <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
//           <View style={styles.nameContainer}>
//             <TouchableOpacity
//             //  onPress={handleUsernamePress}
//              >
//               <Text style={styles.text}>
//                 {item?.user?.name}
//               </Text>
//             </TouchableOpacity>
//             <Text>*</Text>
//             <Text style={[styles.text, {color: theme.colors.textLight}]}>
//               {createdAt}
//             </Text>
//           </View>
           
//           <View style={styles.replySection}>
//             {!isReply && (
//               <>
//                 <TouchableOpacity 
//                   onPress={() => onReplyReviewPress(item.id)} 
//                   style={styles.replyIcon}
//                 >
//                   <Icon name="bubbleChatReply" size={hp(2.5)} color={theme.colors.text} />
//                 </TouchableOpacity>
               
//                   {/* <Text style={styles.replyCount}>{replyCount || 0}</Text> replyReviews */}
//                   <Text style={styles.replyCount}>{item?.replyReviews?.length}</Text>
                
//               </>
//             )}
//           </View>

//           {/* {canDelete && (
//             <TouchableOpacity onPress={handleDelete}>
//               <Icon name="delete" size={20} color={theme.colors.rose} />
//             </TouchableOpacity>
//           )} */}
//         </View>
//         <Text style={[styles.text, {fontWeight: 'normal'}]}>
//           {renderTextWithTags(item?.text)}
//         </Text>
//       </View>
//     </View>
//   )
// }

// export default ReviewItem

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: 'row',
//   },
//   content: {
//     backgroundColor: 'rgba(0,0,0,0.06)',
//     flex: 1,
//     gap: 5, 
//     paddingHorizontal: 14, 
//     paddingVertical: 10, 
//     borderRadius: theme.radius.md, 
//     borderCurve: 'continuous', 
//     borderWidth: 0.1,
//     borderColor: theme.colors.gray,
//     shadowColor: '#000'
//   },
//   nameContainer: {
//     flexDirection: 'row',
//     gap: 3,
//     alignItems: 'center'
//   },
//   text: {
//     fontSize: hp(1.5),
//     color: 'white',
//     fontWeight: theme.fonts.textDark,
//   },
//   highlight: {
//     borderWidth: 0.2,
//     borderColor: 'white',
//     borderColor: theme.colors.dark,
//     shadowColor: theme.colors.dark, 
//     shadowOffset: {
//       width: 0,
//       height: 2
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5
//   },
//   usernameTag: {
//     color: theme.colors.primaryDark,
//     fontWeight: 'bold',
//   },
//   replySection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 2,
//     gap: 5,
//   },
//   replyCount: {
//     fontSize: hp(1.4),
//     color: theme.colors.text,
//     fontWeight: 'bold',
//   },
//   replyIcon: {
//     padding: 2,
//   },
//   replyCount: {
//     fontSize: hp(1.4),
//     color: theme.colors.text,
//     fontWeight: 'bold',
//   },
//   replyIcon: {
//     padding: 2,
//   }
// })










import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import theme from '../constants/theme'
import { hp } from '../helpers/common'
import Icon from '@/assets/icons'
import moment from 'moment'
import { fetchReviewReplies } from '../services/ottService'
import { LinearGradient } from 'expo-linear-gradient'

const ReviewItem = ({
  item, 
  onDelete = () => {},
  highlight = false,
  onReplyReviewPress,
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

  const renderTextWithTags = (text) => {
    if (!text) return null
  
    const tagRegex = /(@\w+)/g
    const parts = text.split(tagRegex)
    
    return parts.map((part, index) => {
      if (tagRegex.test(part)) {
        const username = part.slice(1)
        return (
          <Text 
            key={index} 
            style={styles.usernameTag}
          >
            {part}
          </Text>
        )
      }
      return <Text key={index} style={styles.textContent}>{part}</Text>
    })
  }


  return (
    <View style={styles.container}>
      {highlight ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
          style={[styles.content, styles.highlight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        <View style={styles.content}>
          {renderContent()}
        </View>
      )}
    </View>
  )

  function renderContent() {
    return (
      <>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.dateText}>
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
                  <Icon name="bubbleChatReply" size={hp(2.5)} color={theme.colors.gray} />
                </TouchableOpacity>
                <Text style={styles.replyCount}>{item?.replyReviews?.length || replyCount}</Text>
              </>
            )}
            
            {/* {isAdmin && canDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Icon name="delete" size={hp(2)} color={theme.colors.rose} />
              </TouchableOpacity>
            )} */}
          </View>
        </View>

        <View style={styles.textContainer}>
          {renderTextWithTags(item?.text)}
        </View>
        
        {highlight && (
          <View style={styles.highlightIndicator} />
        )}
      </>
    )
  }
}

export default ReviewItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: hp(0.5),
  },
  content: {
    backgroundColor: 'rgba(30,30,30,0.6)',
    flex: 1,
    gap: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: theme.radius.sm, 
    borderCurve: 'continuous', 
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  dateText: {
    fontSize: hp(1.4),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  textContent: {
    fontSize: hp(1.6),
    color: 'white',
    lineHeight: hp(2.2),
    color: '#FAFAFA'
  },
  highlight: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  highlightIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    height: '70%',
    width: 3,
    backgroundColor: theme.colors.bmw,
    borderRadius: 4,
    transform: [{ translateY: -hp(1.5) }],
  },
  usernameTag: {
    color: theme.colors.bmw || '#4a90e2',
    fontWeight: 'bold',
    fontSize: hp(1.6),
    lineHeight: hp(2.2),
  },
  replySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 10,
  },
  replyCount: {
    fontSize: hp(1.4),
    color: 'rgba(191, 188, 188, 0.6)',
    fontWeight: 'bold',
  },
  replyIcon: {
    padding: 2,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  }
})