import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import theme from '../constants/theme'
import { wp, hp, stripHtmlTags } from '../helpers/common'
import Avatar from './Avatar'
import Icon from '@/assets/icons'
import moment from 'moment'
import { router } from 'expo-router'

const CommentItem = ({
  item, 
  canDelete=false,
  onDelete = () => {},
  highlight = false,
  onReplyPress,  // New prop to handle reply press
  onShowProfile,
  router
}) => {
  const createdAt = moment(item?.created_at).format('MMM ddd, h:mm a');

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



    // const renderTextWithTags = (text) => {
    //   const tagRegex = /@(\w+)/g;
    //   const parts = text.split(tagRegex);
      
    //   return parts.map((part, index) => {
    //     if (index % 2 === 1) { // This is a username tag
    //       return (
    //         <Text 
    //           key={index} 
    //           style={styles.usernameTag}
    //           onPress={() => handleUsernamePress()}
    //         >
    //           @{part}
    //         </Text>
    //       );
    //     }
    //     return <Text key={index}>{part}</Text>;
    //   });
    // }


    // const renderTextWithTags = (text) => {
    //   if (!text) return null;
    
    //   const tagRegex = /(@\w+)/g;
    //   const parts = text.split(tagRegex);
      
    //   return (
    //     <Text style={[styles.text, {fontWeight: 'normal'}]}>
    //       {parts.map((part, index) => {
    //         if (tagRegex.test(part)) {
    //           return (
    //             <Text 
    //               key={index} 
    //               style={styles.usernameTag}
    //               onPress={() => handleUsernamePress()}
    //             >
    //               {part}
    //             </Text>
    //           );
    //         }
    //         return <Text key={index}>{part}</Text>;
    //       })}
    //     </Text>
    //   );
    // }

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
                  onPress={() => {
                    // Open profile popup for the tagged username
                    onShowProfile({ name: username });
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

  return (
    <View style={styles.container}>
      <Avatar
       uri={item?.user?.image}
       onPress={handleUsernamePress}
      />
      {/* user profile tab */}
      <View style={[styles.content, highlight && styles.highlight]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
           <View style={styles.nameContainer}>
           <TouchableOpacity onPress={handleUsernamePress}>
            <Text style={styles.text}>
            {
                item?.user?.name
               }
            </Text>
            </TouchableOpacity>
            <Text>*</Text>
            <Text style={[styles.text, {color: theme.colors.textLight}]}>
            {
                createdAt
               }
            </Text>
           </View>
            {/* Reply icon */}
            <TouchableOpacity onPress={onReplyPress} style={styles.replyIcon}>
                <Icon name="send" size={hp(2.5)} color={theme.colors.text} />
            </TouchableOpacity>
           {
            canDelete && (
              <TouchableOpacity onPress={handleDelete}>
             <Icon name="delete" size={20} color={theme.colors.rose} />
           </TouchableOpacity>
            )
           }
        </View>
        <Text style={[styles.text, {fontWeight: 'normal'}]}>
        {renderTextWithTags(item?.text)}
        </Text>
      </View>
    </View>
  )
}

export default CommentItem

const styles = StyleSheet.create({

  container: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    flex: 1,
    gap: 5, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderWidth: 0.5,
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
    color: theme.colors.text,
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
  }
})






// swapping logic is implemented in below code

// import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
// import React from 'react'
// import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// import Animated, { 
//   useAnimatedStyle, 
//   useSharedValue, 
//   withTiming
// } from 'react-native-reanimated';
// import theme from '../constants/theme'
// import { wp, hp, stripHtmlTags } from '../helpers/common'
// import Avatar from './Avatar'
// import Icon from '@/assets/icons'
// import moment from 'moment'
// import { router } from 'expo-router'

// const CommentItem = ({
//   item, 
//   canDelete=false,
//   onDelete = () => {},
//   highlight = false,
//   onReplyPress,  // New prop to handle reply press
//   onShowProfile,
//   router,
//   onSwipeReply,
//   isReply = false
// }) => {
//   const createdAt = moment(item?.created_at).format('MMM ddd, h:mm a');

//   // swipping logic is made at this place 
//   const translateX = useSharedValue(0);
//   const context = useSharedValue({ x: 0 });

//   // const gesture = Gesture.Pan()
//   //   .onStart(() => {
//   //     context.value = { x: translateX.value };
//   //   })
//   //   .onUpdate((event) => {
//   //     // Only allow swiping right (to reply)
//   //     if (event.translationX > 0) {
//   //       translateX.value = context.value.x + event.translationX;
//   //     }
//   //   })
//   //   .onEnd(() => {
//   //     // If swiped more than 50 pixels, trigger reply
//   //     if (translateX.value > 50) {
//   //       onSwipeReply && onSwipeReply(`@${item.user.name}`);
//   //       translateX.value = withTiming(0);
//   //     } else {
//   //       // Otherwise, snap back
//   //       translateX.value = withTiming(0);
//   //     }
//   //   });

//   // const animatedStyle = useAnimatedStyle(() => {
//   //   return {
//   //     transform: [{ translateX: translateX.value }]
//   //   };
//   // });

//   const gesture = isReply 
//   ? Gesture.Pan()
//     .onStart(() => {
//       context.value = { x: translateX.value };
//     })
//     .onUpdate((event) => {
//       // Only allow swiping right (to reply)
//       if (event.translationX > 0) {
//         translateX.value = context.value.x + event.translationX;
//       }
//     })
//     .onEnd(() => {
//       // If swiped more than 50 pixels, trigger reply
//       if (translateX.value > 50) {
//         onSwipeReply && onSwipeReply(`@${item.user.name}`);
//         translateX.value = withTiming(0);
//       } else {
//         // Otherwise, snap back
//         translateX.value = withTiming(0);
//       }
//     })
//   : Gesture.Pan(); // No-op gesture for non-reply comments

// const animatedStyle = useAnimatedStyle(() => {
//   return {
//     transform: [{ translateX: translateX.value }]
//   };
// });

//   // swipping logic is executed at this place

//   const handleDelete = () => {
//     Alert.alert('Confirm', 'Are you sure you want to delete this comment?', [
//           {
//             text: 'Cancel',
//             style: 'cancel'
//           },
//           {
//             text: 'Delete',
//             style: 'destructive',
//             onPress: ()=> onDelete(item)
//           }
//         ]);
//   }

//     // Function to handle username press
//     const handleUsernamePress = () => {
//       // Either use onShowProfile or navigate directly to profile
//       if (onShowProfile) {
//         onShowProfile(item?.user);
//       } else if (router) {
//         router.push({ 
//           pathname: '/profile', 
//           params: { userId: item?.user?.id } 
//         });
//       }
//     }



//     // const renderTextWithTags = (text) => {
//     //   const tagRegex = /@(\w+)/g;
//     //   const parts = text.split(tagRegex);
      
//     //   return parts.map((part, index) => {
//     //     if (index % 2 === 1) { // This is a username tag
//     //       return (
//     //         <Text 
//     //           key={index} 
//     //           style={styles.usernameTag}
//     //           onPress={() => handleUsernamePress()}
//     //         >
//     //           @{part}
//     //         </Text>
//     //       );
//     //     }
//     //     return <Text key={index}>{part}</Text>;
//     //   });
//     // }


//     // const renderTextWithTags = (text) => {
//     //   if (!text) return null;
    
//     //   const tagRegex = /(@\w+)/g;
//     //   const parts = text.split(tagRegex);
      
//     //   return (
//     //     <Text style={[styles.text, {fontWeight: 'normal'}]}>
//     //       {parts.map((part, index) => {
//     //         if (tagRegex.test(part)) {
//     //           return (
//     //             <Text 
//     //               key={index} 
//     //               style={styles.usernameTag}
//     //               onPress={() => handleUsernamePress()}
//     //             >
//     //               {part}
//     //             </Text>
//     //           );
//     //         }
//     //         return <Text key={index}>{part}</Text>;
//     //       })}
//     //     </Text>
//     //   );
//     // }

//     const renderTextWithTags = (text) => {
//       if (!text) return null;
    
//       const tagRegex = /(@\w+)/g;
//       const parts = text.split(tagRegex);
      
//       return (
//         <Text style={[styles.text, {fontWeight: 'normal'}]}>
//           {parts.map((part, index) => {
//             if (tagRegex.test(part)) {
//               // Extract the username without the '@' symbol
//               const username = part.slice(1);
//               return (
//                 <Text 
//                   key={index} 
//                   style={styles.usernameTag}
//                   onPress={() => {
//                     // Open profile popup for the tagged username
//                     onShowProfile({ name: username });
//                   }}
//                 >
//                   {part}
//                 </Text>
//               );
//             }
//             return <Text key={index}>{part}</Text>;
//           })}
//         </Text>
//       );
//     }

//     return (
//       <GestureDetector gesture={gesture}>
//         <Animated.View style={[styles.container, animatedStyle]}>
//           <View style={styles.container}>
//             <Avatar
//               uri={item?.user?.image}
//               onPress={handleUsernamePress}
//             />
//             {/* User profile tab */}
//             <View style={[styles.content, highlight && styles.highlight]}>
//               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <View style={styles.nameContainer}>
//                   <TouchableOpacity onPress={handleUsernamePress}>
//                     <Text style={styles.text}>
//                       {item?.user?.name}
//                     </Text>
//                   </TouchableOpacity>
//                   <Text>*</Text>
//                   <Text style={[styles.text, { color: theme.colors.textLight }]}>
//                     {createdAt}
//                   </Text>
//                 </View>
//                 {/* Reply icon */}
//                 <TouchableOpacity onPress={onReplyPress} style={styles.replyIcon}>
//                   <Icon name="send" size={hp(2.5)} color={theme.colors.text} />
//                 </TouchableOpacity>
//                 {canDelete && (
//                   <TouchableOpacity onPress={handleDelete}>
//                     <Icon name="delete" size={20} color={theme.colors.rose} />
//                   </TouchableOpacity>
//                 )}
//               </View>
//               <Text style={[styles.text, { fontWeight: 'normal' }]}>
//                 {renderTextWithTags(item?.text)}
//               </Text>
//             </View>
//           </View>
//         </Animated.View>
//       </GestureDetector>
//     );
// }

// export default CommentItem

// const styles = StyleSheet.create({

//   container: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: 7,
//   },
//   content: {
//     backgroundColor: 'rgba(0,0,0,0.06)',
//     flex: 1,
//     gap: 5, 
//     paddingHorizontal: 14, 
//     paddingVertical: 10, 
//     borderRadius: theme.radius.md, 
//     borderCurve: 'continuous', 
//     borderWidth: 0.5,
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
//     color: theme.colors.text,
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
//   }
// })