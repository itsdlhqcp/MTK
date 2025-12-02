// import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput } from 'react-native';
// import React, { useState, useEffect } from 'react';
// import { hp, wp } from '@/helpers/common';
// import theme from '../../../constants/theme';
// import Icon from '@/assets/icons';
// import Avatar from '../../../components/Avatar';
// import { messageService } from '../../../services/messageService';
// import { useNavigation } from '@react-navigation/native';

// const ChatScreen = ({ route }) => {
//   const { conversationId, otherUser } = route?.params;
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [messageText, setMessageText] = useState('');
//   const [sending, setSending] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
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

// export default ChatScreen;

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../../../constants/theme';
import Icon from '@/assets/icons';
import Avatar from '../../../components/Avatar';
import { messageService } from '../../../services/messageService';
import { useNavigation, useRoute } from '@react-navigation/native';

const ChatScreen = () => {
  // Use useRoute hook to get route parameters
  const route = useRoute();
  const navigation = useNavigation();
  
  // Safe extraction with default values
  const { conversationId = null, otherUser = null } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Add debug logging
  useEffect(() => {
    console.log("ChatScreen mounted with params:", { conversationId, otherUser });
    
    if (!conversationId) {
      console.error("No conversationId provided!");
      Alert.alert(
        "Error", 
        "Could not load conversation. Please try again.",
        [{ text: "Go Back", onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    // Set up screen title with user's name
    if (otherUser?.name) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.chatHeader}>
            <Avatar
              uri={otherUser?.image}
              size={hp(4)}
              rounded={theme.radius.xl}
            />
            <Text style={styles.chatHeaderTitle}>{otherUser?.name}</Text>
          </View>
        ),
      });
    }
    
    // Fetch messages
    fetchMessages();
    
    // Subscribe to real-time updates
    let subscription = null;
    try {
      subscription = messageService.subscribeToConversation(
        conversationId,
        handleNewMessage
      );
    } catch (error) {
      console.error("Error subscribing to conversation:", error);
    }
    
    return () => {
      // Unsubscribe when component unmounts
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
      }
    };
  }, [conversationId, otherUser]);
  
  const fetchMessages = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      const res = await messageService.getMessages(conversationId);
      if (res.success) {
        setMessages(res.data);
      } else {
        Alert.alert('Error', res.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Something went wrong while fetching messages');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };
  
  const sendMessage = async () => {
    if (!messageText.trim() && !selectedFile) return;
    if (!conversationId) {
      Alert.alert('Error', 'Cannot send message - conversation not found');
      return;
    }
    
    setSending(true);
    try {
      const res = await messageService.sendMessage(
        conversationId,
        messageText.trim(),
        selectedFile
      );
      
      if (res.success) {
        setMessageText('');
        setSelectedFile(null);
      } else {
        Alert.alert('Error', res.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Something went wrong while sending your message');
    } finally {
      setSending(false);
    }
  };
  
  const pickImage = async () => {
    try {
      // This would use expo-image-picker in a real implementation
      Alert.alert('Feature coming soon', 'Image upload is not implemented in this demo');
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };
  
  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isFromMe ? styles.sentMessage : styles.receivedMessage
    ]}>
      {item.file && (
        <Image 
          source={{ uri: item.file }}
          style={styles.messageImage}
          resizeMode="cover"
        />
      )}
      {item.text && (
        <View style={[
          styles.messageBubble,
          item.isFromMe ? styles.sentBubble : styles.receivedBubble
        ]}>
          <Text style={[
            styles.messageText,
            item.isFromMe ? styles.sentMessageText : styles.receivedMessageText
          ]}>
            {item.text}
          </Text>
        </View>
      )}
      <Text style={[
        styles.messageTime,
        item.isFromMe ? styles.sentMessageTime : styles.receivedMessageTime
      ]}>
        {item.timestamp}
      </Text>
    </View>
  );
  
  // Fallback UI when conversationId is missing
  if (!conversationId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Conversation not found</Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.chatContainer}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          inverted={false}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={pickImage}
        >
          <Icon name="paperclip" size={hp(2.5)} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!messageText.trim() && !selectedFile) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={sending || (!messageText.trim() && !selectedFile)}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon name="send" size={hp(2.5)} color="white" />
          )}
        </TouchableOpacity>
      </View>
      
      {selectedFile && (
        <View style={styles.selectedFileContainer}>
          <Image 
            source={{ uri: selectedFile.uri }}
            style={styles.selectedFilePreview}
          />
          <TouchableOpacity 
            style={styles.removeFileButton}
            onPress={() => setSelectedFile(null)}
          >
            <Icon name="close" size={hp(2)} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ChatScreen;


const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  chatHeaderTitle: {
    marginLeft: wp(2),
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.text
  },
  messageList: {
    padding: hp(2)
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: hp(2)
  },
  sentMessage: {
    alignSelf: 'flex-end'
  },
  receivedMessage: {
    alignSelf: 'flex-start'
  },
  messageBubble: {
    padding: hp(1.5),
    borderRadius: theme.radius.lg
  },
  sentBubble: {
    backgroundColor: theme.colors.primary
  },
  receivedBubble: {
    backgroundColor: 'white'
  },
  messageText: {
    fontSize: hp(1.7)
  },
  sentMessageText: {
    color: 'white'
  },
  receivedMessageText: {
    color: theme.colors.text
  },
  messageTime: {
    fontSize: hp(1.2),
    marginTop: hp(0.5)
  },
  sentMessageTime: {
    color: theme.colors.textLight,
    alignSelf: 'flex-end'
  },
  receivedMessageTime: {
    color: theme.colors.textLight
  },
  messageImage: {
    width: wp(50),
    height: wp(50),
    borderRadius: theme.radius.lg,
    marginBottom: hp(1)
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1.5),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  attachButton: {
    padding: hp(1)
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(3),
    marginHorizontal: wp(2),
    maxHeight: hp(15)
  },
  textInput: {
    fontSize: hp(1.7),
    padding: hp(1),
    maxHeight: hp(15)
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    width: hp(4.5),
    height: hp(4.5),
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textLight
  },
  selectedFileContainer: {
    position: 'relative',
    height: hp(10),
    margin: hp(1),
    borderRadius: theme.radius.lg,
    overflow: 'hidden'
  },
  selectedFilePreview: {
    width: '100%',
    height: '100%'
  },
  removeFileButton: {
    position: 'absolute',
    top: hp(0.5),
    right: hp(0.5),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radius.full,
    width: hp(2.5),
    height: hp(2.5),
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

