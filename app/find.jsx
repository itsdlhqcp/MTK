import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';
import Icon from '@/assets/icons';
import Avatar from '../components/Avatar';
import { friendRequestService } from '../services/requestService';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

const UserSearchTab = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendships, setFriendships] = useState({});
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (searchTerm.length > 0) {
        searchUsers();
      }
      return () => {
        if (debounceTimeout) clearTimeout(debounceTimeout);
      };
    }, [])
  );

  const searchUsers = async () => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user.id;

      // Search for users by name
      const { data, error } = await supabase
        .from('users')
        .select('id, name, image, bio')
        .ilike('name', `%${searchTerm}%`)
        .neq('id', currentUserId) // Don't include current user
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', error.message || 'Failed to search users');
        return;
      }

      setSearchResults(data || []);

      // Check friendship status for each user
      const friendshipData = {};
      for (const user of data || []) {
        const result = await friendRequestService.checkFriendship(user.id);
        if (result.success) {
          friendshipData[user.id] = result.status;
        }
      }
      setFriendships(friendshipData);
    } catch (error) {
      console.error('Error in searchUsers:', error);
      Alert.alert('Error', 'Something went wrong while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchTerm(text);
    
    // Debounce search to avoid too many requests
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchUsers();
    }, 500);
    
    setDebounceTimeout(timeout);
  };

  const handleSendRequest = async (userId) => {
    try {
      setLoading(true);
      const result = await friendRequestService.sendRequest(userId);
      
      if (result.success) {
        Alert.alert('Success', 'Friend request sent successfully');
        // Update friendship status
        setFriendships(prev => ({
          ...prev,
          [userId]: 'pending'
        }));
      } else {
        Alert.alert('Error', result.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => {
    // Determine button state based on friendship status
    let buttonText = 'Add Friend';
    let buttonStyle = styles.addButton;
    let buttonTextStyle = styles.addButtonText;
    let buttonDisabled = false;
    
    switch (friendships[item.id]) {
      case 'accepted':
        buttonText = 'Friends';
        buttonStyle = styles.friendsButton;
        buttonTextStyle = styles.friendsButtonText;
        buttonDisabled = true;
        break;
      case 'pending':
        buttonText = 'Pending';
        buttonStyle = styles.pendingButton;
        buttonTextStyle = styles.pendingButtonText;
        buttonDisabled = true;
        break;
      case 'rejected':
        buttonText = 'Add Friend';
        break;
      default:
        buttonText = 'Add Friend';
    }
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Avatar
            uri={item.image}
            size={hp(6)}
            rounded={theme.radius.xl}
          />
          <View style={styles.userText}>
            <Text style={styles.username}>{item.name}</Text>
            {item.bio && (
              <Text style={styles.userBio} numberOfLines={1} ellipsizeMode="tail">
                {item.bio}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.actionButton, buttonStyle]}
          onPress={() => handleSendRequest(item.id)}
          disabled={buttonDisabled}
        >
          <Text style={[styles.buttonText, buttonTextStyle]}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={hp(2.5)} color={theme.colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for users..."
          value={searchTerm}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={searchUsers}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              setSearchTerm('');
              setSearchResults([]);
            }}
          >
            <Icon name="close" size={hp(2)} color={theme.colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      
      {!loading && searchResults.length === 0 && searchTerm.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="user" size={hp(6)} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term
          </Text>
        </View>
      ) : !loading && searchTerm.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={hp(6)} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>Search for users</Text>
          <Text style={styles.emptySubtext}>
            Find friends by name and send them a friend request
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.usersList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 22,
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
    marginHorizontal: wp(4),
    height: hp(6),
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 22,
    color: theme.colors.text,
  },
  clearButton: {
    padding: wp(2),
  },
  usersList: {
    paddingHorizontal: wp(4),
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    marginLeft: wp(3),
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
  },
  userBio: {
    fontSize: 22,
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  actionButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  pendingButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  friendsButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '600',
  },
  addButtonText: {
    color: theme.colors.buttonText,
  },
  pendingButtonText: {
    color: theme.colors.textLight,
  },
  friendsButtonText: {
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(6),
  },
  emptyText: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: hp(2),
  },
  emptySubtext: {
    fontSize: 22,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(1),
  },
});

export default UserSearchTab;