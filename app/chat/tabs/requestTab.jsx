import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { hp, wp, truncateUsername } from '@/helpers/common';
import theme from '../../../constants/theme';
import Icon from '@/assets/icons';
import Avatar from '../../../components/Avatar';
import { friendRequestService } from '../../../services/requestService';
import { useToast } from '../../../contexts/ToastContext';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Dark theme colors
const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#121212',
    cardBackground: '#1E1E1E',
    borderColor: '#333333',
    text: '#FFFFFF',
    textLight: '#AAAAAA',
    primary: '#4F8EF7', // Keeping the primary color vibrant for contrast
    buttonBackground: '#333333',
  }
};

const RequestTab = ({ initialTab }) => {
  const [loading, setLoading] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const { showToast } = useToast();
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Initialize activeSection from initialTab prop, params, or default to 'incoming'
  const [activeSection, setActiveSection] = useState(initialTab || params?.tab || 'incoming'); // 'incoming', 'outgoing', 'followers', 'following'
  
  useEffect(() => {
    fetchRequests();
    if (activeSection === 'followers') {
      fetchFollowers();
    } else if (activeSection === 'following') {
      fetchFollowing();
    }
  }, [activeSection]);
  
  // Handle navigation params and initialTab prop
  useEffect(() => {
    if (initialTab) {
      setActiveSection(initialTab);
    } else if (params?.tab) {
      setActiveSection(params.tab);
    }
  }, [initialTab, params?.tab]);
  
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await friendRequestService.getRequests();
      if (res.success) {
        setRequests(res.data);
      } else {
        showToast('success', 'Failed to fetch requests!! - Network Problem');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('success', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAccept = async (requestId) => {
    try {
      const res = await friendRequestService.acceptRequest(requestId);
      if (res.success) {
        showToast('success', 'Friend request accepted');
        fetchRequests();
      } else {
        showToast('success', res.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      showToast('success','Something went wrong');
    }
  };
  
  const handleReject = async (requestId) => {
    try {
      const res = await friendRequestService.rejectRequest(requestId);
      if (res.success) {
        showToast('success', 'Friend request rejected');
        fetchRequests();
      } else {
        showToast('success', res.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('success', 'Something went wrong');
    }
  };
  
  const fetchFollowers = async () => {
    setFollowersLoading(true);
    try {
      const res = await friendRequestService.getFollowers();
      if (res.success) {
        setFollowers(res.data || []);
      } else {
        showToast('success', 'Failed to fetch followers');
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      showToast('success', 'Something went wrong');
    } finally {
      setFollowersLoading(false);
    }
  };
  
  const fetchFollowing = async () => {
    setFollowingLoading(true);
    try {
      const res = await friendRequestService.getFollowing();
      if (res.success) {
        setFollowing(res.data || []);
      } else {
        showToast('success', 'Failed to fetch following');
      }
    } catch (error) {
      console.error('Error fetching following:', error);
      showToast('success', 'Something went wrong');
    } finally {
      setFollowingLoading(false);
    }
  };
  
  const renderFollowerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.requestItem}
      onPress={() => {
        if (item?.id) {
          router.push({
            pathname: '/xprofile',
            params: { userId: item.id }
          });
        }
      }}
    >
      <View style={styles.userInfo}>
        <Avatar
          uri={item?.image}
          size={hp(6)}
          rounded={theme.radius.xl}
        />
        <View style={styles.requestText}>
          <Text style={styles.username}>{truncateUsername(item?.name || '')}</Text>
          {item?.bio && (
            <Text style={styles.requestTime} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderFollowingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.requestItem}
      onPress={() => {
        if (item?.id) {
          router.push({
            pathname: '/xprofile',
            params: { userId: item.id }
          });
        }
      }}
    >
      <View style={styles.userInfo}>
        <Avatar
          uri={item?.image}
          size={hp(6)}
          rounded={theme.radius.xl}
        />
        <View style={styles.requestText}>
          <Text style={styles.username}>{truncateUsername(item?.name || '')}</Text>
          {item?.bio && (
            <Text style={styles.requestTime} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderIncomingRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <Avatar
          uri={item.sender?.image}
          size={hp(6)}
          rounded={theme.radius.xl}
        />
        <View style={styles.requestText}>
          <Text style={styles.username}>{truncateUsername(item.sender?.name || '')}</Text>
          <Text style={styles.requestTime}>
            Sent request {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAccept(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderOutgoingRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <Avatar
          uri={item.receiver?.image}
          size={hp(6)}
          rounded={theme.radius.xl}
        />
        <View style={styles.requestText}>
          <Text style={styles.username}>{item.receiver?.name}</Text>
          <Text style={styles.requestTime}>
            Sent {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.actionButton, styles.cancelButton]}
        onPress={() =>showToast('success', 'This feature is not yet implemented')}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
  
  const SectionTab = ({ title, isActive, onPress, count }) => (
    <TouchableOpacity 
      style={[styles.sectionTab, isActive && styles.activeSectionTab]}
      onPress={onPress}
    >
      <Text style={[styles.sectionTabText, isActive && styles.activeSectionTabText]}>
        {title} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  );
  
  const renderContent = () => {
    if (activeSection === 'incoming' || activeSection === 'outgoing') {
      if (loading && !requests.incoming.length && !requests.outgoing.length) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        );
      }
      
      if (!loading && !requests.incoming.length && !requests.outgoing.length) {
        return (
          <View style={styles.emptyContainer}>
            <Icon name="user" size={hp(8)} color={darkTheme.colors.textLight} />
            <Text style={styles.emptyText}>No friend requests yet</Text>
            <Text style={styles.emptySubtext}>
              When someone sends you a friend request, it will appear here
            </Text>
          </View>
        );
      }
      
      if (activeSection === 'incoming') {
        return (
          <FlatList
            data={requests.incoming}
            renderItem={renderIncomingRequest}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.requestsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No incoming requests</Text>
              </View>
            }
          />
        );
      } else {
        return (
          <FlatList
            data={requests.outgoing}
            renderItem={renderOutgoingRequest}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.requestsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No outgoing requests</Text>
              </View>
            }
          />
        );
      }
    } else if (activeSection === 'followers') {
      if (followersLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            <Text style={styles.loadingText}>Loading followers...</Text>
          </View>
        );
      }
      
      return (
        <FlatList
          data={followers}
          renderItem={renderFollowerItem}
          keyExtractor={item => item?.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.requestsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="user" size={hp(8)} color={darkTheme.colors.textLight} />
              <Text style={styles.emptyText}>No followers yet</Text>
              <Text style={styles.emptySubtext}>
                People who follow you will appear here
              </Text>
            </View>
          }
        />
      );
    } else if (activeSection === 'following') {
      if (followingLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={darkTheme.colors.primary} />
            <Text style={styles.loadingText}>Loading following...</Text>
          </View>
        );
      }
      
      return (
        <FlatList
          data={following}
          renderItem={renderFollowingItem}
          keyExtractor={item => item?.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.requestsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="user" size={hp(8)} color={darkTheme.colors.textLight} />
              <Text style={styles.emptyText}>Not following anyone yet</Text>
              <Text style={styles.emptySubtext}>
                People you follow will appear here
              </Text>
            </View>
          }
        />
      );
    }
    
    return null;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.sectionTabs}>
        <SectionTab 
          title="Incoming" 
          isActive={activeSection === 'incoming'} 
          onPress={() => setActiveSection('incoming')}
          count={requests.incoming.length}
        />
        <SectionTab 
          title="Outgoing" 
          isActive={activeSection === 'outgoing'} 
          onPress={() => setActiveSection('outgoing')}
          count={requests.outgoing.length}
        />
        <SectionTab 
          title="Followers" 
          isActive={activeSection === 'followers'} 
          onPress={() => setActiveSection('followers')}
          count={followers.length}
        />
        <SectionTab 
          title="Following" 
          isActive={activeSection === 'following'} 
          onPress={() => setActiveSection('following')}
          count={following.length}
        />
      </View>
      
      {renderContent()}
    </View>
  );
};

export default RequestTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background
  },
  sectionTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.borderColor,
    flexWrap: 'wrap'
  },
  sectionTab: {
    flex: 1,
    minWidth: wp(20),
    paddingVertical: hp(1.5),
    alignItems: 'center'
  },
  activeSectionTab: {
    borderBottomWidth: 2,
    borderBottomColor: darkTheme.colors.primary
  },
  sectionTabText: {
    fontSize: hp(1.8),
    color: darkTheme.colors.textLight
  },
  activeSectionTabText: {
    color: darkTheme.colors.primary,
    fontWeight: '600'
  },
  requestsList: {
    padding: hp(2)
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.borderColor,
    backgroundColor: darkTheme.colors.cardBackground,
    padding: hp(1.5),
    borderRadius: theme.radius.md
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  requestText: {
    marginLeft: wp(3)
  },
  username: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: darkTheme.colors.text
  },
  requestTime: {
    fontSize: hp(1.5),
    color: darkTheme.colors.textLight,
    marginTop: hp(0.5)
  },
  actionButtons: {
    flexDirection: 'row'
  },
  actionButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    marginLeft: wp(2)
  },
  acceptButton: {
    backgroundColor: darkTheme.colors.primary
  },
  rejectButton: {
    backgroundColor: darkTheme.colors.buttonBackground
  },
  cancelButton: {
    backgroundColor: darkTheme.colors.buttonBackground
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: hp(1.6)
  },
  rejectButtonText: {
    color: darkTheme.colors.text,
    fontSize: hp(1.6)
  },
  cancelButtonText: {
    color: darkTheme.colors.text,
    fontSize: hp(1.6)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    color: darkTheme.colors.text
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: hp(4),
    backgroundColor: darkTheme.colors.background
  },
  emptyText: {
    fontSize: hp(2),
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginTop: hp(2)
  },
  emptySubtext: {
    fontSize: hp(1.6),
    color: darkTheme.colors.textLight,
    textAlign: 'center',
    marginTop: hp(1)
  }
});