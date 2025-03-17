// import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native'
// import React from 'react'
// import { hp, wp } from '@/helpers/common'
// import theme from '../../../constants/theme'
// import Icon from '@/assets/icons'
// import Avatar from '../../../components/Avatar'

// const ChatTab = ({ 
//   messages, 
//   conversation, 
//   flatListRef, 
//   attachmentFile, 
//   setAttachmentFile, 
//   currentMessage, 
//   setCurrentMessage, 
//   onPick, 
//   sendMessage,
//   getFileUri
// }) => {
//   const renderMessageItem = ({ item }) => (
//     <View style={[
//       styles.messageContainer,
//       item.isFromMe ? styles.messageContainerSent : styles.messageContainerReceived
//     ]}>
//       {!item.isFromMe && (
//         <Avatar
//           uri={conversation?.image}
//           size={hp(4)}
//           rounded={theme.radius.xl}
//           style={styles.messageAvatar}
//         />
//       )}
//       <View style={[
//         styles.messageBubble,
//         item.isFromMe ? styles.messageBubbleSent : styles.messageBubbleReceived
//       ]}>
//         {item.file && (
//           <Image
//             source={{ uri: getFileUri(item.file) }}
//             style={styles.messageImage}
//             resizeMode="cover"
//           />
//         )}
//         <Text style={[
//           styles.messageText,
//           item.isFromMe ? styles.messageTextSent : styles.messageTextReceived
//         ]}>
//           {item.text}
//         </Text>
//         <Text style={styles.messageTimestamp}>
//           {item.timestamp}
//           {item.isFromMe && (
//             <Text style={styles.readStatus}>
//               {item.read ? " • Read" : ""}
//             </Text>
//           )}
//         </Text>
//       </View>
//     </View>
//   );

//   return (
//     <>
//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         renderItem={renderMessageItem}
//         keyExtractor={item => item.id}
//         contentContainerStyle={styles.messagesContainer}
//         onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
//       />
      
//       {attachmentFile && (
//         <View style={styles.attachmentPreview}>
//           <Image
//             source={{ uri: getFileUri(attachmentFile) }}
//             style={styles.attachmentImage}
//             resizeMode="cover"
//           />
//           <TouchableOpacity 
//             style={styles.removeAttachmentButton}
//             onPress={() => setAttachmentFile(null)}
//           >
//             <Icon name="delete" size={20} color="white" />
//           </TouchableOpacity>
//         </View>
//       )}
      
//       <View style={styles.inputContainer}>
//         <TouchableOpacity style={styles.cameraButton} onPress={onPick}>
//           <Icon name="image" size={24} color={theme.colors.primary} />
//         </TouchableOpacity>
        
//         <TextInput
//           style={styles.messageInput}
//           value={currentMessage}
//           onChangeText={setCurrentMessage}
//           placeholder="Message..."
//           placeholderTextColor={theme.colors.textLight}
//           multiline
//         />
        
//         {currentMessage.trim() === '' && !attachmentFile ? (
//           <React.Fragment>
//             <TouchableOpacity style={styles.inputActionButton}>
//               <Icon name="send" size={24} color={theme.colors.primary} />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.inputActionButton}>
//               <Icon name="image" size={24} color={theme.colors.primary} />
//             </TouchableOpacity>
//           </React.Fragment>
//         ) : (
//           <TouchableOpacity 
//             style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
//             onPress={sendMessage}
//           >
//             <Text style={styles.sendButtonText}>Send</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </>
//   );
// };

// export default ChatTab;

// const styles = StyleSheet.create({
//   messagesContainer: {
//     padding: wp(4),
//     paddingBottom: hp(2),
//   },
//   messageContainer: {
//     flexDirection: 'row',
//     marginVertical: hp(0.8),
//     maxWidth: '80%',
//   },
//   messageContainerSent: {
//     alignSelf: 'flex-end',
//     justifyContent: 'flex-end',
//   },
//   messageContainerReceived: {
//     alignSelf: 'flex-start',
//   },
//   messageAvatar: {
//     marginRight: wp(1),
//     alignSelf: 'flex-end',
//     marginBottom: hp(0.5),
//   },
//   messageBubble: {
//     padding: hp(1.2),
//     borderRadius: theme.radius.lg,
//     maxWidth: '100%',
//   },
//   messageBubbleSent: {
//     backgroundColor: theme.colors.primary,
//     borderBottomRightRadius: theme.radius.sm,
//   },
//   messageBubbleReceived: {
//     backgroundColor: theme.colors.gray,
//     borderBottomLeftRadius: theme.radius.sm,
//   },
//   messageText: {
//     fontSize: hp(1.8),
//     marginBottom: hp(0.4),
//   },
//   messageTextSent: {
//     color: 'white',
//   },
//   messageTextReceived: {
//     color: theme.colors.text,
//   },
//   messageTimestamp: {
//     fontSize: hp(1.2),
//     color: 'rgba(255, 255, 255, 0.7)',
//     alignSelf: 'flex-end',
//   },
//   readStatus: {
//     fontSize: hp(1.2),
//     fontStyle: 'italic',
//   },
//   messageImage: {
//     width: wp(60),
//     height: wp(60),
//     borderRadius: theme.radius.md,
//     marginBottom: hp(1),
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: hp(1),
//     paddingHorizontal: wp(4),
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.gray,
//     backgroundColor: 'white',
//   },
//   cameraButton: {
//     marginRight: wp(2),
//   },
//   messageInput: {
//     flex: 1,
//     minHeight: hp(5),
//     maxHeight: hp(15),
//     backgroundColor: theme.colors.gray,
//     borderRadius: theme.radius.xl,
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(1),
//     fontSize: hp(1.8),
//     color: theme.colors.text,
//   },
//   inputActionButton: {
//     marginLeft: wp(2),
//   },
//   sendButton: {
//     marginLeft: wp(2),
//     paddingHorizontal: wp(3),
//     paddingVertical: hp(1),
//     borderRadius: theme.radius.xl,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   sendButtonText: {
//     color: 'white',
//     fontWeight: theme.fonts.semibold,
//     fontSize: hp(1.6),
//   },
//   attachmentPreview: {
//     margin: wp(4),
//     marginBottom: hp(1),
//     alignSelf: 'flex-start',
//     maxWidth: wp(40),
//     borderRadius: theme.radius.md,
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   attachmentImage: {
//     width: wp(40),
//     height: wp(40),
//   },
//   removeAttachmentButton: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     borderRadius: 15,
//     padding: 5,
//   },
// });

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useCallback } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../../../constants/theme';
import Icon from '@/assets/icons';
import Avatar from '../../../components/Avatar';
import { messageService } from '../../../services/messageService';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const MessageTab = () => {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const navigation = useNavigation();
  
  // Fetch conversations when the component mounts and when it comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );
  
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await messageService.getConversations();
      if (res.success) {
        setConversations(res.data);
      } else {
        Alert.alert('Error', res.message || 'Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChat = (conversationId, otherUser) => {
    navigation.navigate('chat/tabs/chatScreen', {
      conversationId, 
      otherUser
    });
  };

  const handleNewChat = () => {
    // Navigate to new conversation screen or contact list
    navigation.navigate('find');
  };
  
  const formatTimestamp = (dateTime) => {
    const now = new Date();
    const messageDate = new Date(dateTime);
    
    // If it's today, show only time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's within last 7 days, show day name
    const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  const renderConversation = ({ item }) => (
    <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => handleOpenChat(item.id, item.user)}
    >
      <Avatar
        uri={item.user?.image}
        size={hp(6.5)}
        rounded={theme.radius.xl}
      />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.username}>{item.user?.name}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.lastMessage && item.lastMessage.lastMessageTime)}</Text>
        </View>
        <Text 
          style={styles.lastMessage}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.lastMessage || "Start a conversation"}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  if (loading && !conversations.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }
  
  if (!loading && !conversations.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="messageCircle" size={hp(8)} color={theme.colors.textLight} />
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>
          When you start a conversation with a friend, it will appear here
        </Text>
        <TouchableOpacity 
          style={styles.findFriendsButton}
          onPress={() => navigation.navigate('find')}
        >
          <Text style={styles.findFriendsButtonText}>Find Friends</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.conversationsList}
        refreshing={loading}
        onRefresh={fetchConversations}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleNewChat}
        activeOpacity={0.8}
      >
        <Icon name="plus" size={hp(3)} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default MessageTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  conversationsList: {
    padding: hp(1)
  },
  conversationItem: {
    flexDirection: 'row',
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1),
    backgroundColor: '#f9f9f9'
  },
  conversationContent: {
    flex: 1,
    marginLeft: wp(3),
    justifyContent: 'center'
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5)
  },
  username: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text
  },
  timestamp: {
    fontSize: hp(1.4),
    color: theme.colors.textLight
  },
  lastMessage: {
    fontSize: hp(1.6),
    color: theme.colors.textLight
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    color: theme.colors.text
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: hp(4)
  },
  emptyText: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: hp(2)
  },
  emptySubtext: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(1),
    marginBottom: hp(3)
  },
  findFriendsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(5),
    borderRadius: theme.radius.xl
  },
  findFriendsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: hp(1.6)
  },
  // Floating action button styles
  floatingButton: {
    position: 'absolute',
    bottom: hp(2.5),
    right: wp(4),
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    backgroundColor: '#00a884', // WhatsApp green color
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  }
});

// import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// import React, { useState, useCallback } from 'react';
// import { hp, wp } from '@/helpers/common';
// import theme from '../../../constants/theme';
// import Icon from '@/assets/icons';
// import Avatar from '../../../components/Avatar';
// import { messageService } from '../../../services/messageService';
// import { useNavigation } from '@react-navigation/native';
// import { useFocusEffect } from '@react-navigation/native';

// const MessageTab = () => {
//   const [loading, setLoading] = useState(false);
//   const [conversations, setConversations] = useState([]);
//   const navigation = useNavigation();
  
//   // Fetch conversations when the component mounts and when it comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       fetchConversations();
//     }, [])
//   );
  
//   const fetchConversations = async () => {
//     setLoading(true);
//     try {
//       const res = await messageService.getConversations();
//       if (res.success) {
//         setConversations(res.data);
//       } else {
//         Alert.alert('Error', res.message || 'Failed to fetch conversations');
//       }
//     } catch (error) {
//       console.error('Error fetching conversations:', error);
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const handleOpenChat = (conversationId, otherUser) => {
//     navigation.navigate('chat/tabs/chatScreen', {
//       conversationId, 
//       otherUser
//     });
//   };
  
//   const formatTimestamp = (dateTime) => {
//     const now = new Date();
//     const messageDate = new Date(dateTime);
    
//     // If it's today, show only time
//     if (messageDate.toDateString() === now.toDateString()) {
//       return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     }
    
//     // If it's within last 7 days, show day name
//     const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
//     if (diffDays < 7) {
//       return messageDate.toLocaleDateString([], { weekday: 'short' });
//     }
    
//     // Otherwise show date
//     return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
//   };
  
//   const renderConversation = ({ item }) => (
//     <TouchableOpacity 
//       style={styles.conversationItem}
//       onPress={() => handleOpenChat(item.id, item.user)}
//     >
//       <Avatar
//         uri={item.user?.image}
//         size={hp(6.5)}
//         rounded={theme.radius.xl}
//       />
//       <View style={styles.conversationContent}>
//         <View style={styles.conversationHeader}>
//           <Text style={styles.username}>{item.user?.name}</Text>
//           <Text style={styles.timestamp}>{formatTimestamp(item.lastMessage && item.lastMessage.lastMessageTime)}</Text>
//         </View>
//         <Text 
//           style={styles.lastMessage}
//           numberOfLines={1}
//           ellipsizeMode="tail"
//         >
//           {item.lastMessage || "Start a conversation"}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
  
//   if (loading && !conversations.length) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//         <Text style={styles.loadingText}>Loading conversations...</Text>
//       </View>
//     );
//   }
  
//   if (!loading && !conversations.length) {
//     return (
//       <View style={styles.emptyContainer}>
//         <Icon name="messageCircle" size={hp(8)} color={theme.colors.textLight} />
//         <Text style={styles.emptyText}>No messages yet</Text>
//         <Text style={styles.emptySubtext}>
//           When you start a conversation with a friend, it will appear here
//         </Text>
//         <TouchableOpacity 
//           style={styles.findFriendsButton}
//           onPress={() => navigation.navigate('find')}
//         >
//           <Text style={styles.findFriendsButtonText}>Find Friends</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }
  
//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={conversations}
//         renderItem={renderConversation}
//         keyExtractor={item => item.id.toString()}
//         contentContainerStyle={styles.conversationsList}
//         refreshing={loading}
//         onRefresh={fetchConversations}
//       />
//     </View>
//   );
// };

// export default MessageTab;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'white'
//   },
//   conversationsList: {
//     padding: hp(1)
//   },
//   conversationItem: {
//     flexDirection: 'row',
//     padding: hp(1.5),
//     borderRadius: theme.radius.lg,
//     marginBottom: hp(1),
//     backgroundColor: '#f9f9f9'
//   },
//   conversationContent: {
//     flex: 1,
//     marginLeft: wp(3),
//     justifyContent: 'center'
//   },
//   conversationHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: hp(0.5)
//   },
//   username: {
//     fontSize: hp(1.8),
//     fontWeight: '600',
//     color: theme.colors.text
//   },
//   timestamp: {
//     fontSize: hp(1.4),
//     color: theme.colors.textLight
//   },
//   lastMessage: {
//     fontSize: hp(1.6),
//     color: theme.colors.textLight
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   loadingText: {
//     marginTop: hp(2),
//     fontSize: hp(1.8),
//     color: theme.colors.text
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: hp(4)
//   },
//   emptyText: {
//     fontSize: hp(2),
//     fontWeight: '600',
//     color: theme.colors.text,
//     marginTop: hp(2)
//   },
//   emptySubtext: {
//     fontSize: hp(1.6),
//     color: theme.colors.textLight,
//     textAlign: 'center',
//     marginTop: hp(1),
//     marginBottom: hp(3)
//   },
//   findFriendsButton: {
//     backgroundColor: theme.colors.primary,
//     paddingVertical: hp(1.2),
//     paddingHorizontal: wp(5),
//     borderRadius: theme.radius.xl
//   },
//   findFriendsButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: hp(1.6)
//   }
// });





// import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
// import React, { useState, useEffect, useCallback } from 'react';
// import { hp, wp } from '@/helpers/common';
// import theme from '../../../constants/theme';
// import Icon from '@/assets/icons';
// import { TextInput } from 'react-native';
// import Avatar from '../../../components/Avatar';
// import { messageService } from '../../../services/messageService';
// import { useNavigation } from '@react-navigation/native';
// import { useFocusEffect } from '@react-navigation/native';

// const MessageTab = () => {
//   const [loading, setLoading] = useState(false);
//   const [conversations, setConversations] = useState([]);
//   const navigation = useNavigation();
  
//   // Fetch conversations when the component mounts and when it comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       fetchConversations();
//     }, [])
//   );
  
//   const fetchConversations = async () => {
//     setLoading(true);
//     try {
//       const res = await messageService.getConversations();
//       if (res.success) {
//         setConversations(res.data);
//       } else {
//         Alert.alert('Error', res.message || 'Failed to fetch conversations');
//       }
//     } catch (error) {
//       console.error('Error fetching conversations:', error);
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const handleOpenChat = (conversationId, otherUser) => {
//     navigation.navigate('ChatScreen', { 
//       conversationId, 
//       otherUser
//     });
//   };
  
//   const formatTimestamp = (dateTime) => {
//     const now = new Date();
//     const messageDate = new Date(dateTime);
    
//     // If it's today, show only time
//     if (messageDate.toDateString() === now.toDateString()) {
//       return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     }
    
//     // If it's within last 7 days, show day name
//     const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
//     if (diffDays < 7) {
//       return messageDate.toLocaleDateString([], { weekday: 'short' });
//     }
    
//     // Otherwise show date
//     return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
//   };
  
//   const renderConversation = ({ item }) => (
//     <TouchableOpacity 
//       style={styles.conversationItem}
//       onPress={() => handleOpenChat(item.id, item.user)}
//     >
//       <Avatar
//         uri={item.user?.image}
//         size={hp(6.5)}
//         rounded={theme.radius.xl}
//       />
//       <View style={styles.conversationContent}>
//         <View style={styles.conversationHeader}>
//           <Text style={styles.username}>{item.user?.name}</Text>
//      <Text style={styles.timestamp}>{formatTimestamp(item.lastMessage && item.lastMessage.lastMessageTime)}</Text>
//         </View>
//         <Text 
//           style={styles.lastMessage}
//           numberOfLines={1}
//           ellipsizeMode="tail"
//         >
//           {item.lastMessage || "Start a conversation"}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
  
//   if (loading && !conversations.length) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//         <Text style={styles.loadingText}>Loading conversations...</Text>
//       </View>
//     );
//   }
  
//   if (!loading && !conversations.length) {
//     return (
//       <View style={styles.emptyContainer}>
//         <Icon name="messageCircle" size={hp(8)} color={theme.colors.textLight} />
//         <Text style={styles.emptyText}>No messages yet</Text>
//         <Text style={styles.emptySubtext}>
//           When you start a conversation with a friend, it will appear here
//         </Text>
//         <TouchableOpacity 
//           style={styles.findFriendsButton}
//           onPress={() => navigation.navigate('find')}
//         >
//           <Text style={styles.findFriendsButtonText}>Find Friends</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }
  
//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={conversations}
//         renderItem={renderConversation}
//         keyExtractor={item => item.id.toString()}
//         contentContainerStyle={styles.conversationsList}
//         refreshing={loading}
//         onRefresh={fetchConversations}
//       />
//     </View>
//   );
// };

// // Chat screen component
// const ChatScreen = ({ route }) => {
//   const { conversationId, otherUser } = route.params;
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [messageText, setMessageText] = useState('');
//   const [sending, setSending] = useState(false);
//   const navigation = useNavigation();
  
//   useEffect(() => {
//     // Set up screen title with user's name
//     navigation.setOptions({
//       headerTitle: () => (
//         <View style={styles.chatHeader}>
//           <Avatar
//             uri={otherUser?.image}
//             size={hp(4)}
//             rounded={theme.radius.xl}
//           />
//           <Text style={styles.chatHeaderTitle}>{otherUser?.name}</Text>
//         </View>
//       ),
//     });
    
//     // Fetch messages
//     fetchMessages();
    
//     // Subscribe to real-time updates
//     const subscription = messageService.subscribeToConversation(
//       conversationId,
//       handleNewMessage
//     );
    
//     return () => {
//       // Unsubscribe when component unmounts
//       if (subscription) {
//         subscription.unsubscribe();
//       }
//     };
//   }, [conversationId]);
  
//   const fetchMessages = async () => {
//     setLoading(true);
//     try {
//       const res = await messageService.getMessages(conversationId);
//       if (res.success) {
//         setMessages(res.data);
//       } else {
//         Alert.alert('Error', res.message || 'Failed to fetch messages');
//       }
//     } catch (error) {
//       console.error('Error fetching messages:', error);
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   const handleNewMessage = (message) => {
//     setMessages(prevMessages => [...prevMessages, message]);
//   };
  
//   const sendMessage = async () => {
//     if (!messageText.trim() && !selectedFile) return;
    
//     setSending(true);
//     try {
//       const res = await messageService.sendMessage(
//         conversationId,
//         messageText.trim(),
//         selectedFile
//       );
      
//       if (res.success) {
//         setMessageText('');
//         setSelectedFile(null);
//       } else {
//         Alert.alert('Error', res.message || 'Failed to send message');
//       }
//     } catch (error) {
//       console.error('Error sending message:', error);
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setSending(false);
//     }
//   };
  
//   const [selectedFile, setSelectedFile] = useState(null);
  
//   const pickImage = async () => {
//     try {
//       // This would use expo-image-picker in a real implementation
//       Alert.alert('Feature coming soon', 'Image upload is not implemented in this demo');
//     } catch (error) {
//       console.error('Error picking image:', error);
//     }
//   };
  
//   const renderMessage = ({ item }) => (
//     <View style={[
//       styles.messageContainer,
//       item.isFromMe ? styles.sentMessage : styles.receivedMessage
//     ]}>
//       {item.file && (
//         <Image 
//           source={{ uri: item.file }}
//           style={styles.messageImage}
//           resizeMode="cover"
//         />
//       )}
//       {item.text && (
//         <View style={[
//           styles.messageBubble,
//           item.isFromMe ? styles.sentBubble : styles.receivedBubble
//         ]}>
//           <Text style={[
//             styles.messageText,
//             item.isFromMe ? styles.sentMessageText : styles.receivedMessageText
//           ]}>
//             {item.text}
//           </Text>
//         </View>
//       )}
//       <Text style={[
//         styles.messageTime,
//         item.isFromMe ? styles.sentMessageTime : styles.receivedMessageTime
//       ]}>
//         {item.timestamp}
//       </Text>
//     </View>
//   );
  
//   return (
//     <View style={styles.chatContainer}>
//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={theme.colors.primary} />
//         </View>
//       ) : (
//         <FlatList
//           data={messages}
//           renderItem={renderMessage}
//           keyExtractor={item => item.id}
//           contentContainerStyle={styles.messageList}
//           inverted={false}
//         />
//       )}
      
//       <View style={styles.inputContainer}>
//         <TouchableOpacity 
//           style={styles.attachButton}
//           onPress={pickImage}
//         >
//           <Icon name="paperclip" size={hp(2.5)} color={theme.colors.text} />
//         </TouchableOpacity>
        
//         <View style={styles.textInputContainer}>
//           <TextInput
//             style={styles.textInput}
//             placeholder="Type a message..."
//             value={messageText}
//             onChangeText={setMessageText}
//             multiline
//           />
//         </View>
        
//         <TouchableOpacity 
//           style={[
//             styles.sendButton,
//             (!messageText.trim() && !selectedFile) && styles.sendButtonDisabled
//           ]}
//           onPress={sendMessage}
//           disabled={sending || (!messageText.trim() && !selectedFile)}
//         >
//           {sending ? (
//             <ActivityIndicator size="small" color="white" />
//           ) : (
//             <Icon name="send" size={hp(2.5)} color="white" />
//           )}
//         </TouchableOpacity>
//       </View>
      
//       {selectedFile && (
//         <View style={styles.selectedFileContainer}>
//           <Image 
//             source={{ uri: selectedFile.uri }}
//             style={styles.selectedFilePreview}
//           />
//           <TouchableOpacity 
//             style={styles.removeFileButton}
//             onPress={() => setSelectedFile(null)}
//           >
//             <Icon name="close" size={hp(2)} color="white" />
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// };

// export { MessageTab, ChatScreen };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'white'
//   },
//   conversationsList: {
//     padding: hp(1)
//   },
//   conversationItem: {
//     flexDirection: 'row',
//     padding: hp(1.5),
//     borderRadius: theme.radius.lg,
//     marginBottom: hp(1),
//     backgroundColor: '#f9f9f9'
//   },
//   conversationContent: {
//     flex: 1,
//     marginLeft: wp(3),
//     justifyContent: 'center'
//   },
//   conversationHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: hp(0.5)
//   },
//   username: {
//     fontSize: hp(1.8),
//     fontWeight: '600',
//     color: theme.colors.text
//   },
//   timestamp: {
//     fontSize: hp(1.4),
//     color: theme.colors.textLight
//   },
//   lastMessage: {
//     fontSize: hp(1.6),
//     color: theme.colors.textLight
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   loadingText: {
//     marginTop: hp(2),
//     fontSize: hp(1.8),
//     color: theme.colors.text
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: hp(4)
//   },
//   emptyText: {
//     fontSize: hp(2),
//     fontWeight: '600',
//     color: theme.colors.text,
//     marginTop: hp(2)
//   },
//   emptySubtext: {
//     fontSize: hp(1.6),
//     color: theme.colors.textLight,
//     textAlign: 'center',
//     marginTop: hp(1),
//     marginBottom: hp(3)
//   },
//   findFriendsButton: {
//     backgroundColor: theme.colors.primary,
//     paddingVertical: hp(1.2),
//     paddingHorizontal: wp(5),
//     borderRadius: theme.radius.xl
//   },
//   findFriendsButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: hp(1.6)
//   },
//   chatContainer: {
//     flex: 1,
//     backgroundColor: '#f5f5f5'
//   },
//   chatHeader: {
//     flexDirection: 'row',
//     alignItems: 'center'
//   },
//   chatHeaderTitle: {
//     marginLeft: wp(2),
//     fontSize: hp(1.8),
//     fontWeight: '600',
//     color: theme.colors.text
//   },
//   messageList: {
//     padding: hp(2)
//   },
//   messageContainer: {
//     maxWidth: '80%',
//     marginBottom: hp(2)
//   },
//   sentMessage: {
//     alignSelf: 'flex-end'
//   },
//   receivedMessage: {
//     alignSelf: 'flex-start'
//   },
//   messageBubble: {
//     padding: hp(1.5),
//     borderRadius: theme.radius.lg
//   },
//   sentBubble: {
//     backgroundColor: theme.colors.primary
//   },
//   receivedBubble: {
//     backgroundColor: 'white'
//   },
//   messageText: {
//     fontSize: hp(1.7)
//   },
//   sentMessageText: {
//     color: 'white'
//   },
//   receivedMessageText: {
//     color: theme.colors.text
//   },
//   messageTime: {
//     fontSize: hp(1.2),
//     marginTop: hp(0.5)
//   },
//   sentMessageTime: {
//     color: theme.colors.textLight,
//     alignSelf: 'flex-end'
//   },
//   receivedMessageTime: {
//     color: theme.colors.textLight
//   },
//   messageImage: {
//     width: wp(50),
//     height: wp(50),
//     borderRadius: theme.radius.lg,
//     marginBottom: hp(1)
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: hp(1.5),
//     backgroundColor: 'white',
//     borderTopWidth: 1,
//     borderTopColor: '#eee'
//   },
//   attachButton: {
//     padding: hp(1)
//   },
//   textInputContainer: {
//     flex: 1,
//     backgroundColor: '#f0f0f0',
//     borderRadius: theme.radius.xl,
//     paddingHorizontal: wp(3),
//     marginHorizontal: wp(2),
//     maxHeight: hp(15)
//   },
//   textInput: {
//     fontSize: hp(1.7),
//     padding: hp(1),
//     maxHeight: hp(15)
//   },
//   sendButton: {
//     backgroundColor: theme.colors.primary,
//     borderRadius: theme.radius.full,
//     width: hp(4.5),
//     height: hp(4.5),
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   sendButtonDisabled: {
//     backgroundColor: theme.colors.textLight
//   },
//   selectedFileContainer: {
//     position: 'relative',
//     height: hp(10),
//     margin: hp(1),
//     borderRadius: theme.radius.lg,
//     overflow: 'hidden'
//   },
//   selectedFilePreview: {
//     width: '100%',
//     height: '100%'
//   },
//   removeFileButton: {
//     position: 'absolute',
//     top: hp(0.5),
//     right: hp(0.5),
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: theme.radius.full,
//     width: hp(2.5),
//     height: hp(2.5),
//     justifyContent: 'center',
//     alignItems: 'center'
//   }
// });

