import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { v4 as uuidv4 } from 'uuid';

export const messageService = {
  // Get conversations for current user
  getConversations: async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // Get conversations where user is either user1 or user2
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, 
          last_message,
          last_message_time,
          user1:user1_id(id, name, image),
          user2:user2_id(id, name, image)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_time', { ascending: false });
        
      if (error) {
        console.error('Error fetching conversations:', error);
        return { success: false, message: error.message };
      }
      
      // Format conversations for display
      const formattedConversations = data.map(conv => {
        // Determine which user is the other person in the conversation
        const otherUser = conv.user1.id === userId ? conv.user2 : conv.user1;
        
        return {
          id: conv.id,
          lastMessage: conv.last_message || '',
          lastMessageTime: conv.last_message_time ? new Date(conv.last_message_time) : new Date(conv.created_at),
          user: otherUser
        };
      });
      
      return { success: true, data: formattedConversations };
    } catch (error) {
      console.error('Error in getConversations:', error);
      return { success: false, message: 'Failed to fetch conversations' };
    }
  },
  
  // Get or create conversation with a specific user
  getOrCreateConversation: async (otherUserId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
        .maybeSingle();
        
      if (existingConv) {
        return { success: true, data: existingConv };
      }
      
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: userId,
          user2_id: otherUserId
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating conversation:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true, data: newConv };
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return { success: false, message: 'Failed to get or create conversation' };
    }
  },
  
  // Get messages for a specific conversation
  getMessages: async (conversationId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // First verify user is part of this conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('id', conversationId)
        .single();
        
      if (!conversation) {
        return { success: false, message: 'Conversation not found or not authorized' };
      }
      
      // Get messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching messages:', error);
        return { success: false, message: error.message };
      }
      
      // Format messages
      const formattedMessages = data.map(msg => ({
        id: msg.id.toString(),
        text: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromMe: msg.sender_id === userId,
        read: msg.read,
        file: msg.attachment
      }));
      
      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('read', false);
      
      return { success: true, data: formattedMessages };
    } catch (error) {
      console.error('Error in getMessages:', error);
      return { success: false, message: 'Failed to fetch messages' };
    }
  },
  
  // Upload attachment to Supabase storage
  uploadAttachment: async (file) => {
    try {
      if (!file || !file.uri) return { success: false, message: 'No file provided' };
      
      const fileExt = file.uri.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `message_attachments/${fileName}`;
      
      let fileData;
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileData = blob;
      } else {
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
        fileData = decode(base64);
      }
      
      const { error } = await supabase.storage
        .from('media')
        .upload(filePath, fileData, {
          contentType: file.type || 'image/jpeg'
        });
        
      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, message: error.message };
      }
      
      return { success: true, data: filePath };
    } catch (error) {
      console.error('Error in uploadAttachment:', error);
      return { success: false, message: 'Failed to upload attachment' };
    }
  },
  
  // Send a message
  sendMessage: async (conversationId, content, file = null) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      
      // Verify user is part of this conversation
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('id', conversationId)
        .single();
        
      if (!conversation) {
        return { success: false, message: 'Conversation not found or not authorized' };
      }
      
      // Upload attachment if present
      let attachmentPath = null;
      if (file) {
        const uploadResult = await this.uploadAttachment(file);
        if (uploadResult.success) {
          attachmentPath = uploadResult.data;
        } else {
          return uploadResult;
        }
      }
      
      // Create the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content || '',
          attachment: attachmentPath,
          read: false
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        return { success: false, message: error.message };
      }
      
      // Update the conversation with the last message
      await supabase
        .from('conversations')
        .update({
          last_message: content || 'Sent an attachment',
          last_message_time: new Date().toISOString()
        })
        .eq('id', conversationId);
      
      // Format message for UI
      const formattedMessage = {
        id: data.id.toString(),
        text: data.content,
        timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFromMe: true,
        read: false,
        file: data.attachment ? { uri: data.attachment, type: 'image' } : null
      };
      
      return { success: true, data: formattedMessage };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { success: false, message: 'Failed to send message' };
    }
  },
  
  // Set up real-time messaging
  subscribeToConversation: (conversationId, onNewMessage) => {
    const { data: userData } = supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    return supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, payload => {
        // Format the message for UI
        const message = {
          id: payload.new.id.toString(),
          text: payload.new.content,
          timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFromMe: payload.new.sender_id === userId,
          read: false,
          file: payload.new.attachment
        };
        
        onNewMessage(message);
      })
      .subscribe();
  }
};
