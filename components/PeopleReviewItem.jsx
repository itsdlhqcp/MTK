// import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React, { useEffect, useState } from 'react'
// import theme from '../constants/theme'
// import { wp, hp, stripHtmlTags } from '../helpers/common'
// import Avatar from './Avatar'
// import Icon from '@/assets/icons'
// import moment from 'moment'
// import { createPeopleReviewDownvote, createPeopleReviewUpvote, fetchPeopleReviewReplies, removePeopleReviewDownvote, removePeopleReviewUpvote } from '../services/releaseService'
// import RatingStars from './RatingStars'
// import LikeButton from './AnimatedUpVoteButton'
// import { useAuth } from '../contexts/AuthContext'

// const PeoplesReviewItem = ({
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

//   const {user} = useAuth();

//   // console.log('item', item);

//   // fetching all upvotes here 

  

//   useEffect(() => {
//     if (!isReply) {
//       fetchReplyCount()
//     }
//   }, [item.id])

//   const fetchReplyCount = async () => {
//     if (!item.id) return
    
//     setIsLoading(true)
//     try {
//       const res = await fetchPeopleReviewReplies(item.id)
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
//                 onPress={() => {
//                   onShowProfile({ name: username })
//                 }}
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

//   const [upvotes, setUpvotes] = useState([]);

//     useEffect(() =>{
//       setUpvotes(item?.threviewupvote || []);
//     },[])

//   const onDownvote = async () => {
//     if(upvoted){
//       let updatedUpvotes = upvotes.filter(upvote => upvote.userId !== user?.id);
//       setUpvotes([...updatedUpvotes]);
//       const res = await removePeopleReviewUpvote(item?.id, user?.id);
//       // console.log('post liked respose', res);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
//     }else{
//       let data = {
//         userId: user?.id,
//         peoplesReviewId: item?.id
//       }
//       setUpvotes([...upvotes, data]);
//       const res = await createPeopleReviewUpvote(data);
//       // console.log('post liked respose', res);
//       if(!res.success){
//         Alert.alert('Error', res.msg || 'Something went wrong');
//       }
//     }
   
//   }

//   const upvoted = upvotes?.filter(upvote => upvote?.userId === user?.id)[0]? true: false;

//   const [downvotes, setDownvotes] = useState([]);

//   useEffect(() =>{
//     setDownvotes(item?.threviewdownvote || []);
//   },[])

// const onUpvote = async () => {
//   if(downvoted){
//     let updatedUpvotes = downvotes.filter(upvote => upvote.userId !== user?.id);
//     setDownvotes([...updatedUpvotes]);
//     const res = await removePeopleReviewDownvote(item?.id, user?.id);
//     // console.log('post liked respose', res);
//     if(!res.success){
//       Alert.alert('Error', res.msg || 'Something went wrong');
//     }
//   }else{
//     let data = {
//       userId: user?.id,
//       peoplesReviewId: item?.id
//     }
//     setDownvotes([...downvotes, data]);
//     const res = await createPeopleReviewDownvote(data);
//     // console.log('post liked respose', res);
//     if(!res.success){
//       Alert.alert('Error', res.msg || 'Something went wrong');
//     }
//   }
// }

// const downvoted = downvotes?.filter(upvote => upvote?.userId === user?.id)[0]? true: false;

//   return (
//     <View style={styles.container}>
//       <Avatar
//         uri={item?.user?.image}
//         onPress={handleUsernamePress}
//       />
//       <View style={[styles.content, highlight && styles.highlight]}>
//         <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
//           <View style={styles.nameContainer}>
//             <TouchableOpacity onPress={handleUsernamePress}>
//               <Text style={styles.text}>
//                 {item?.user?.name}
//               </Text>
//             </TouchableOpacity>
//             <Text style={styles.text}>•</Text>
//             <Text style={[styles.text, {color: theme.colors.textLight}]}>
//               {createdAt}
//             </Text>
//           </View>

//             <View style={styles.replySection}>
//                     {isReply && (
//                       // Correct JSX Comment
//                       <>
//                         <TouchableOpacity onPress={onUpvote} style={styles.buttonContainer}>
//                           <Icon name="rocket" size={hp(2.4)} color="orange" />
//                           <Text style={styles.count}>4</Text>
//                         </TouchableOpacity>
//                       </>
//                     )}
//              </View>
           
//           <View style={styles.replySection}>
//             {!isReply && (
//               <>

//                {/* <TouchableOpacity 
//                   onPress={() => onReplyReviewPress(item.id)} 
//                   style={styles.replyIcon}
//                 >
//                   <Icon name="rocket" size={hp(2.5)} color="orange" />
//                 </TouchableOpacity>
//                 {replyCount > 0 && (
//                   <Text style={styles.replyCount}>{replyCount}</Text>
//                 )} */}

                


//                  {/* upvoter */}
//                 <TouchableOpacity onPress={onUpvote}>
//                   <Icon name="heart" size={hp(2.4)} fill={downvoted?  theme.colors.rose : 'transparent'} color={downvoted ? theme.colors.rose : theme.colors.textLight} />
//                 </TouchableOpacity>
//                 <Text style={styles.count}>{downvotes?.length}</Text>

//                   {/* downvoter */}
//                 <TouchableOpacity onPress={onDownvote}>
//                   <Icon name="heart" size={hp(2.4)} fill={upvoted?  theme.colors.rose : 'transparent'} color={upvoted ? theme.colors.rose : theme.colors.textLight} />
//                 </TouchableOpacity>
//                 <Text style={styles.count}>{upvotes?.length}</Text>
//                        {/* <LikeButton
//                           item={item} 
//                           currentUser={user} 
//                          //   updatePost={updatePost} 
//                         /> */}

//                 <TouchableOpacity 
//                   onPress={() => onReplyReviewPress(item.id)} 
//                   style={styles.replyIcon}
//                 >
//                   <Icon name="bubbleChatReply" size={hp(2.5)} color={theme.colors.primary} />
//                 </TouchableOpacity>
//                 {replyCount > 0 && (
//                   <Text style={styles.replyCount}>{replyCount}</Text>
//                 )}
//               </>
//             )}
//           </View>

//           {canDelete && (
//             <TouchableOpacity onPress={handleDelete}>
//               <Icon name="delete" size={20} color={theme.colors.rose} />
//             </TouchableOpacity>
//           )}
//         </View>
        
//         {/* Rating and Popcorn section */}
//         {!isReply && item?.userRating > 0 && (
//           <View style={styles.ratingContainer}>
//             <RatingStars 
//               rating={item.userRating} 
//               showRatingText={true} 
//               starSize={hp(1.8)}
//               textStyle={{color: theme.colors.text}}
//             />
//             {item?.popCorn && (
//               <View style={styles.popcornContainer}>
//                 <Icon name="popcorn" size={hp(2)} color="#FFD700" />
//               </View>
//             )}
//           </View>
//         )}
        
//         <Text style={[styles.text, {fontWeight: 'normal'}]}>
//           {renderTextWithTags(item?.text)}
//         </Text>
        
//         {/* Cup of Tea indicator */}
//         {!isReply && item?.cupOfTea && (
//           <View style={styles.cupOfTeaContainer}>
//             <Icon name="cup" size={hp(1.8)} color={theme.colors.primary} />
//             <Text style={styles.cupOfTeaText}>Not Everyone's Cup</Text>
//           </View>
//         )}
//       </View>
//     </View>
//   )
// }

// export default PeoplesReviewItem

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: 7,
//   },
//   content: {
//     backgroundColor: '#121212', // Black theme background
//     flex: 1,
//     gap: 5, 
//     paddingHorizontal: 14, 
//     paddingVertical: 10, 
//     borderRadius: theme.radius.md, 
//     borderCurve: 'continuous', 
//     borderWidth: 0.5,
//     borderColor: '#333',
//     shadowColor: '#000'
//   },
//   nameContainer: {
//     flexDirection: 'row',
//     gap: 3,
//     alignItems: 'center'
//   },
//   text: {
//     fontSize: hp(1.5),
//     color: '#ffffff', // Text color for dark theme
//     fontWeight: theme.fonts.textDark,
//   },
//   highlight: {
//     borderWidth: 0.2,
//     borderColor: '#444',
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
//     gap: 5,
//   },
//   replyCount: {
//     fontSize: hp(1.4),
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   replyIcon: {
//     padding: 2,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 5,
//     gap: 8,
//   },
//   popcornContainer: {
//     marginLeft: 5,
//   },
//   cupOfTeaContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 5,
//     gap: 5,
//   },
//   cupOfTeaText: {
//     fontSize: hp(1.3),
//     color: '#aaa',
//     fontStyle: 'italic'
//   },
//   count: {
//     color: theme.colors.text,
//     fontSize: hp(1.8),
//     fontWeight: theme.fonts.medium
//   }
// })


import { Alert, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import theme from '../constants/theme'
import { wp, hp, stripHtmlTags } from '../helpers/common'
import Avatar from './Avatar'
import Icon from '@/assets/icons'
import moment from 'moment'
import { createPeopleReviewDownvote, createPeopleReviewReplyLike, createPeopleReviewUpvote, fetchPeopleReviewReplies, removePeopleReviewDownvote, removePeopleReviewReplyLike, removePeopleReviewUpvote } from '../services/releaseService'
import RatingStars from './RatingStars'
import LikeButton from './AnimatedUpVoteButton'
import { useAuth } from '../contexts/AuthContext'
import PratingStars from './pRatingStars'

const PeoplesReviewItem = ({
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
  const rocketScale = useRef(new Animated.Value(1)).current
  const rocketOpacity = useRef(new Animated.Value(1)).current

  const {user} = useAuth();

  useEffect(() => {
    if (!isReply) {
      fetchReplyCount()
    }
  }, [item.id])

  const fetchReplyCount = async () => {
    if (!item.id) return
    
    setIsLoading(true)
    try {
      const res = await fetchPeopleReviewReplies(item.id)
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
                onPress={() => {
                  onShowProfile({ name: username })
                }}
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

  const [upvotes, setUpvotes] = useState([]);

  useEffect(() => {
    setUpvotes(item?.threviewupvote || []);
  }, [])

  const onDownvote = async () => {
    if(upvoted){
      let updatedUpvotes = upvotes.filter(upvote => upvote.userId !== user?.id);
      setUpvotes([...updatedUpvotes]);
      const res = await removePeopleReviewUpvote(item?.id, user?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      let data = {
        userId: user?.id,
        peoplesReviewId: item?.id
      }
      setUpvotes([...upvotes, data]);
      const res = await createPeopleReviewUpvote(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    }
  }

  const upvoted = upvotes?.filter(upvote => upvote?.userId === user?.id)[0] ? true : false;

  const [downvotes, setDownvotes] = useState([]);

  useEffect(() => {
    setDownvotes(item?.threviewdownvote || []);
  }, [])

  const onUpvote = async () => {
    if(downvoted) {
      let updatedUpvotes = downvotes.filter(upvote => upvote.userId !== user?.id);
      setDownvotes([...updatedUpvotes]);
      const res = await removePeopleReviewDownvote(item?.id, user?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      let data = {
        userId: user?.id,
        peoplesReviewId: item?.id
      }
      setDownvotes([...downvotes, data]);
      const res = await createPeopleReviewDownvote(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    }
  }

  const downvoted = downvotes?.filter(upvote => upvote?.userId === user?.id)[0] ? true : false;

  // below is the set of code which control the rocket animation 


  const [likes, setLikes] = useState([]);

  useEffect(() => {
    setLikes(item?.pepreplylikes || []);
  }, [])

  const handleRocketPress = async () => {
    if(liked) {
      let updatedUpvotes = likes.filter(upvote => upvote.userId !== user?.id);
      setLikes([...updatedUpvotes]);
      const res = await removePeopleReviewReplyLike(item?.id, user?.id);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    } else {
      let data = {
        userId: user?.id,
        peoplesReviewReplyId: item?.id
      }
      setLikes([...likes, data]);
      const res = await createPeopleReviewReplyLike(data);
      if(!res.success){
        Alert.alert('Error', res.msg || 'Something went wrong');
      }
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(rocketScale, {
          toValue: 1.5,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(rocketOpacity, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(rocketScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(rocketOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ])
    ]).start();
  }

  const liked = likes?.filter(upvote => upvote?.userId === user?.id)[0] ? true : false;

  // const [rocketCount, setRocketCount] = useState(4)
  // const [hasRocketed, setHasRocketed] = useState(false)

  // const handleRocketPress = () => {
  //   setHasRocketed(!hasRocketed);
  //   setRocketCount(hasRocketed ? rocketCount - 1 : rocketCount + 1);
    
  //   // Animation sequence
  
  // };

  return (
    <View style={styles.container}>
      <Avatar
  uri={item?.user?.image}
  onPress={handleUsernamePress}
  addings={item?.addings} // Pass the emoji here
/>
      <View style={[styles.content, highlight && styles.highlight]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={styles.nameContainer}>
            <TouchableOpacity onPress={handleUsernamePress}>
              <Text style={styles.text}>
                {item?.user?.name}
              </Text>
            </TouchableOpacity>
            <Text style={styles.text}>•</Text>
            <Text style={[styles.text, {color: theme.colors.textLight}]}>
              {createdAt}
            </Text>
          </View>
    
          <View style={styles.replySection}>
            {!isReply && (
              <>
                <TouchableOpacity onPress={onUpvote}>
                  <Icon name="up" size={hp(2.4)} fill={downvoted ? theme.colors.rose : 'transparent'} color={downvoted ? theme.colors.rose : theme.colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.count}>{downvotes?.length}</Text>

                <TouchableOpacity onPress={onDownvote}>
                  <Icon name="down" size={hp(2.4)} fill={upvoted ? theme.colors.rose : 'transparent'} color={upvoted ? theme.colors.rose : theme.colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.count}>{upvotes?.length}</Text>

                <TouchableOpacity 
                  onPress={() => onReplyReviewPress(item.id)} 
                  style={styles.replyIcon}
                >
                  <Icon name="bubbleChatReply" size={hp(2.5)} color={theme.colors.primary} />
                </TouchableOpacity>
                {replyCount > 0 && (
                  <Text style={styles.replyCount}>{item?.replyPeopleReviews?.[0]?.count || 0}</Text>
                )}
              </>
            )}
          </View>

          {canDelete && (
            <TouchableOpacity onPress={handleDelete}>
              <Icon name="delete" size={20} color={theme.colors.rose} />
            </TouchableOpacity>
          )}

     <View style={styles.replySection}>
            {isReply && (
              <TouchableOpacity 
                onPress={handleRocketPress}
                style={styles.rocketButtonContainer}
                activeOpacity={0.7}
              >
                <View style={styles.rocketWrapper}>
                  <Animated.View
                    style={[
                      styles.rocketIconContainer,
                      { 
                        transform: [{ scale: rocketScale }],
                        opacity: rocketOpacity,
                        // backgroundColor: liked ? 'rgba(255, 140, 0, 0.15)' : 'transparent'
                      }
                    ]}
                  >
                    <Icon 
                      name="thumbsup" 
                      size={hp(1.7)} 
                      color={liked ? "#0066ff" : "#CCCCCC"} 
                    //  color={liked ? "#FF8C00" : "#CCCCCC"} 
                    />
                  </Animated.View>
                  <Text style={[
                    styles.rocketCount, 
                    liked && styles.activeRocketCount
                  ]}>
                    {likes?.length}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Rating and Popcorn section */}
        {!isReply && item?.userRating > 0 && (
          <View style={styles.ratingContainer}>
            <PratingStars 
              rating={item.userRating} 
              showRatingText={true} 
              starSize={hp(1.8)}
              textStyle={{color: "#BDBDBD"}}
            />
            {item?.popCorn && (
              <View style={styles.popcornContainer}>
                <Icon name="popcorn" size={hp(2)} color="#FFD700" />
              </View>
            )}
          </View>
        )}
        
        <Text style={[styles.text, {fontWeight: 'normal'}]}>
          {renderTextWithTags(item?.text)}
        </Text>
        
        {/* Cup of Tea indicator */}
        {!isReply && item?.cupOfTea && (
          <View style={styles.cupOfTeaContainer}>
            <Icon name="cup" size={hp(1.8)} color={theme.colors.primary} />
            <Text style={styles.cupOfTeaText}>Not Everyone's Cup</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default PeoplesReviewItem

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  content: {
    backgroundColor: '#121212', // Black theme background
    flex: 1,
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderWidth: 0.5,
    borderColor: '#333',
    shadowColor: '#000'
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center'
  },
  text: {
    fontSize: hp(1.5),
    color: '#ffffff', // Text color for dark theme
    fontWeight: theme.fonts.textDark,
  },
  highlight: {
    borderWidth: 0.2,
    borderColor: '#444',
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
    gap: 5,
  },
  replyCount: {
    fontSize: hp(1.4),
    color: '#fff',
    fontWeight: 'bold',
  },
  replyIcon: {
    padding: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    gap: 8,
  },
  popcornContainer: {
    marginLeft: 5,
  },
  cupOfTeaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 5,
  },
  cupOfTeaText: {
    fontSize: hp(1.3),
    color: '#aaa',
    fontStyle: 'italic'
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium
  },
  // New styles for rocket button
  rocketButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  rocketWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rocketIconContainer: {
    padding: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rocketCount: {
    color: '#CCCCCC',
    fontSize: hp(1.5),
    fontWeight: '600',
    marginLeft: 2,
  },
  activeRocketCount: {
    color: '#0066ff',
  },
})