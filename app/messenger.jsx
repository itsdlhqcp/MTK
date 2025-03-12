import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '../constants/theme'
import Icon from '@/assets/icons'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import { getSupabaseFileUrl } from '../services/imageService'
import * as ImagePicker from 'expo-image-picker';
import Button from '@/components/Button'

const Messenger = () => {
  const router = useRouter();
  const { user } = useAuth();
  const conversationParams = useLocalSearchParams();
  const flatListRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  
  // Mock conversation data
  useEffect(() => {
    if (conversationParams && conversationParams.id) {
      // In a real app, you would fetch conversation details from an API
      setConversation({
        id: conversationParams.id,
        name: conversationParams.name || 'User',
        image: conversationParams.image,
        lastActive: '10m ago',
        isOnline: true
      });
      
      // Mock messages data
      setMessages([
        {
          id: '1',
          text: 'Hey, how are you?',
          timestamp: '10:30 AM',
          isFromMe: false,
          read: true
        },
        {
          id: '2',
          text: 'I\'m good! Just working on some React Native code. How about you?',
          timestamp: '10:32 AM',
          isFromMe: true,
          read: true
        },
        {
          id: '3',
          text: 'Same here! This Instagram UI clone is looking good.',
          timestamp: '10:34 AM',
          isFromMe: false,
          read: true
        },
        {
          id: '4',
          text: 'Thanks! I think the messaging part is the most complex.',
          timestamp: '10:36 AM',
          isFromMe: true,
          read: true
        }
      ]);
    }
  }, [conversationParams]);

  const onPick = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: false,
        exif: false
      });
  
      if (!result.canceled) {
        const asset = result.assets[0];
        const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) 
          ? 'image' 
          : 'video');
        
        setAttachmentFile({
          uri: asset.uri,
          type: fileType,
          name: asset.uri.split('/').pop()
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media file');
    }
  };

  const isLocalFile = file => {
    if (!file) return null;
    if (typeof file === 'object') return true;
    return false;
  };

  const getFileType = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.type || 'image';
    }
    return file.includes('postImage') ? 'image' : 'video';
  };

  const getFileUri = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.uri;
    }
    return getSupabaseFileUrl(file)?.uri;
  };

  const sendMessage = () => {
    if (currentMessage.trim() === '' && !attachmentFile) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromMe: true,
      read: false,
      file: attachmentFile
    };
    
    setMessages([...messages, newMessage]);
    setCurrentMessage('');
    setAttachmentFile(null);
    
    // Scroll to the bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessageItem = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isFromMe ? styles.messageContainerSent : styles.messageContainerReceived
    ]}>
      {!item.isFromMe && (
        <Avatar
          uri={conversation?.image}
          size={hp(4)}
          rounded={theme.radius.xl}
          style={styles.messageAvatar}
        />
      )}
      <View style={[
        styles.messageBubble,
        item.isFromMe ? styles.messageBubbleSent : styles.messageBubbleReceived
      ]}>
        {item.file && (
          <Image
            source={{ uri: getFileUri(item.file) }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        <Text style={[
          styles.messageText,
          item.isFromMe ? styles.messageTextSent : styles.messageTextReceived
        ]}>
          {item.text}
        </Text>
        <Text style={styles.messageTimestamp}>
          {item.timestamp}
          {item.isFromMe && (
            <Text style={styles.readStatus}>
              {item.read ? " • Read" : ""}
            </Text>
          )}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.conversationHeader}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Icon name="back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.userInfoContainer}
        onPress={() => {
          // Navigate to user profile or conversation details
        }}
      >
        <Avatar
          uri={conversation?.image}
          size={hp(5)}
          rounded={theme.radius.xl}
        />
        <View style={styles.userTextContainer}>
          <Text style={styles.username}>{conversation?.name}</Text>
          <Text style={styles.userStatus}>
            {conversation?.isOnline ? 'Active now' : conversation?.lastActive}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="video" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Icon name="send" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper bg="white">
      {renderHeader()}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        
        {attachmentFile && (
          <View style={styles.attachmentPreview}>
            <Image
              source={{ uri: getFileUri(attachmentFile) }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeAttachmentButton}
              onPress={() => setAttachmentFile(null)}
            >
              <Icon name="delete" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={onPick}>
            <Icon name="image" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            value={currentMessage}
            onChangeText={setCurrentMessage}
            placeholder="Message..."
            placeholderTextColor={theme.colors.textLight}
            multiline
          />
          
          {currentMessage.trim() === '' && !attachmentFile ? (
            <React.Fragment>
              <TouchableOpacity style={styles.inputActionButton}>
                <Icon name="send" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.inputActionButton}>
                <Icon name="image" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </React.Fragment>
          ) : (
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
              onPress={sendMessage}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Messenger;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 5,
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(2),
  },
  userTextContainer: {
    marginLeft: wp(2),
  },
  username: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  userStatus: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 8,
    marginLeft: 5,
  },
  messagesContainer: {
    padding: wp(4),
    paddingBottom: hp(2),
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: hp(0.8),
    maxWidth: '80%',
  },
  messageContainerSent: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageContainerReceived: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: wp(1),
    alignSelf: 'flex-end',
    marginBottom: hp(0.5),
  },
  messageBubble: {
    padding: hp(1.2),
    borderRadius: theme.radius.lg,
    maxWidth: '100%',
  },
  messageBubbleSent: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.sm,
  },
  messageBubbleReceived: {
    backgroundColor: theme.colors.gray,
    borderBottomLeftRadius: theme.radius.sm,
  },
  messageText: {
    fontSize: hp(1.8),
    marginBottom: hp(0.4),
  },
  messageTextSent: {
    color: 'white',
  },
  messageTextReceived: {
    color: theme.colors.text,
  },
  messageTimestamp: {
    fontSize: hp(1.2),
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  readStatus: {
    fontSize: hp(1.2),
    fontStyle: 'italic',
  },
  messageImage: {
    width: wp(60),
    height: wp(60),
    borderRadius: theme.radius.md,
    marginBottom: hp(1),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1),
    paddingHorizontal: wp(4),
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray,
    backgroundColor: 'white',
  },
  cameraButton: {
    marginRight: wp(2),
  },
  messageInput: {
    flex: 1,
    minHeight: hp(5),
    maxHeight: hp(15),
    backgroundColor: theme.colors.gray,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: hp(1.8),
    color: theme.colors.text,
  },
  inputActionButton: {
    marginLeft: wp(2),
  },
  sendButton: {
    marginLeft: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: theme.fonts.semibold,
    fontSize: hp(1.6),
  },
  attachmentPreview: {
    margin: wp(4),
    marginBottom: hp(1),
    alignSelf: 'flex-start',
    maxWidth: wp(40),
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentImage: {
    width: wp(40),
    height: wp(40),
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 5,
  },
});