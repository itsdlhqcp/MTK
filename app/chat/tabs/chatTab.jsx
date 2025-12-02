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
