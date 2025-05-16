import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, Dimensions, StatusBar } from 'react-native';
import React, { useState, useCallback } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';
import Icon from '@/assets/icons';
import Avatar from '../components/Avatar';
import { friendRequestService } from '../services/requestService';
import { supabase } from '../lib/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';

const instaTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#000000',
    card: '#121212',
    text: '#FFFFFF',
    textLight: '#8E8E8E',
    primary: '#0095F6', 
    border: '#262626',
    buttonText: '#FFFFFF',
  },
};

const UserSearchTab = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendships, setFriendships] = useState({});
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();

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

      const { data, error } = await supabase
        .from('users')
        .select('id, name, image, bio')
        .ilike('name', `%${searchTerm}%`)
        .neq('id', currentUserId)
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

  const handleUsernamePress = (userId) => {
    if (!isNavigating && navigation) {
      const isCurrentUser = currentUser && userId === currentUser.id;
      setIsNavigating(true);
      navigation.navigate(
        isCurrentUser ? 'Profile' : 'xprofile',
        { userId: userId }
      );
      setIsNavigating(false);
    }
  };

  const renderUserItem = ({ item }) => {
    // Determine button state based on friendship status
    let buttonText = 'Follow';
    let buttonStyle = styles.addButton;
    let buttonTextStyle = styles.addButtonText;
    let buttonDisabled = false;
    
    switch (friendships[item.id]) {
      case 'accepted':
        buttonText = 'Following';
        buttonStyle = styles.friendsButton;
        buttonTextStyle = styles.friendsButtonText;
        buttonDisabled = true;
        break;
      case 'pending':
        buttonText = 'Requested';
        buttonStyle = styles.pendingButton;
        buttonTextStyle = styles.pendingButtonText;
        buttonDisabled = true;
        break;
      case 'rejected':
        buttonText = 'Follow';
        break;
      default:
        buttonText = 'Follow';
    }
    
    return (
      <View style={styles.userCard}>
        <TouchableOpacity 
          style={styles.userInfoContainer}
          onPress={() => handleUsernamePress(item.id)}
        >
          <Avatar
            uri={item.image}
            size={hp(7)}
            rounded={hp(7) / 2} 
          />
          <View style={styles.userText}>
            <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
            {item.bio && (
              <Text style={styles.userBio} numberOfLines={1} ellipsizeMode="tail">
                {item.bio}
              </Text>
            )}
          </View>
        </TouchableOpacity>
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
    <ScreenWrapper bg="#121212">
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <View style={styles.searchContainer}>
        <Icon name="search" size={hp(2.5)} color={theme.colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={instaTheme.colors.textLight}
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
            {loading ? (
              <ActivityIndicator size="small" color={instaTheme.colors.primary} />
            ) : (
              <Icon name="close" size={hp(2)} color={instaTheme.colors.textLight} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {!loading && searchResults.length === 0 && searchTerm.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="user" size={hp(6)} color={instaTheme.colors.textLight} />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term
          </Text>
        </View>
      ) : !loading && searchTerm.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={hp(6)} color={instaTheme.colors.textLight} />
          <Text style={styles.emptyText}>Search</Text>
          <Text style={styles.emptySubtext}>
            Find people to follow
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.emptyContainer}>
          {/* <ActivityIndicator size="large" color={instaTheme.colors.primary} /> */}
          <Text style={styles.emptyText}>Searching user...</Text>
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
    </ScreenWrapper>
  );
};

export default UserSearchTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626', 
    borderRadius: 10,
    paddingHorizontal: wp(4),
    marginVertical: hp(2),
    marginHorizontal: wp(4),
    height: hp(5),
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#FFFFFF',
  },
  clearButton: {
    padding: wp(2),
  },
  usersList: {
    padding: wp(2),
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    marginLeft: wp(3),
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userBio: {
    fontSize: 13,
    color: '#8E8E8E', 
    marginTop: hp(0.3),
  },
  actionButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#0095F6', 
  },
  pendingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#262626', 
  },
  friendsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#262626', 
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addButtonText: {
    color: '#FFFFFF',
  },
  pendingButtonText: {
    color: '#FFFFFF',
  },
  friendsButtonText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(6),
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: hp(2),
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E8E', 
    textAlign: 'center',
    marginTop: hp(1),
  },
});

