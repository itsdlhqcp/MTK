// import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native'
// import React from 'react'
// import { hp, wp } from '@/helpers/common'
// import theme from '../../../constants/theme'
// import Icon from '@/assets/icons'

// const MediaTab = ({ messages, getFileUri }) => {
//   // Filter messages to get only those with media files
//   const mediaMessages = messages.filter(msg => msg.file);
  
//   if (mediaMessages.length === 0) {
//     return (
//       <View style={styles.emptyStateContainer}>
//         <Icon name="image" size={50} color={theme.colors.textLight} />
//         <Text style={styles.emptyStateText}>No media shared yet</Text>
//       </View>
//     );
//   }
  
//   return (
//     <FlatList
//       data={mediaMessages}
//       renderItem={({ item }) => (
//         <TouchableOpacity style={styles.mediaItem}>
//           <Image
//             source={{ uri: getFileUri(item.file) }}
//             style={styles.mediaItemImage}
//             resizeMode="cover"
//           />
//           <Text style={styles.mediaItemTimestamp}>{item.timestamp}</Text>
//         </TouchableOpacity>
//       )}
//       keyExtractor={item => `media-${item.id}`}
//       contentContainerStyle={styles.mediaGrid}
//       numColumns={3}
//     />
//   );
// };

// export default MediaTab;

// const styles = StyleSheet.create({
//   mediaGrid: {
//     padding: wp(1),
//   },
//   mediaItem: {
//     width: wp(33) - wp(2),
//     height: wp(33) - wp(2),
//     margin: wp(1),
//     borderRadius: theme.radius.sm,
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   mediaItemImage: {
//     width: '100%',
//     height: '100%',
//   },
//   mediaItemTimestamp: {
//     position: 'absolute',
//     bottom: 5,
//     right: 5,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     color: 'white',
//     fontSize: hp(1.2),
//     paddingHorizontal: 5,
//     paddingVertical: 2,
//     borderRadius: theme.radius.sm,
//   },
//   emptyStateContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: hp(4),
//   },
//   emptyStateText: {
//     marginTop: hp(2),
//     fontSize: hp(1.8),
//     color: theme.colors.textLight,
//     textAlign: 'center',
//   },
// });




import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { hp, wp } from '@/helpers/common';
import theme from '../../../constants/theme';
import Icon from '@/assets/icons';
import Avatar from '../../../components/Avatar';
import { friendRequestService } from '../../../services/requestService';

const RequestTab = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [activeSection, setActiveSection] = useState('incoming'); // 'incoming' or 'outgoing'
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await friendRequestService.getRequests();
      if (res.success) {
        setRequests(res.data);
      } else {
        Alert.alert('Error', res.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAccept = async (requestId) => {
    try {
      const res = await friendRequestService.acceptRequest(requestId);
      if (res.success) {
        Alert.alert('Success', 'Friend request accepted');
        fetchRequests();
      } else {
        Alert.alert('Error', res.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };
  
  const handleReject = async (requestId) => {
    try {
      const res = await friendRequestService.rejectRequest(requestId);
      if (res.success) {
        Alert.alert('Success', 'Friend request rejected');
        fetchRequests();
      } else {
        Alert.alert('Error', res.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };
  
  const renderIncomingRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <Avatar
          uri={item.sender?.image}
          size={hp(6)}
          rounded={theme.radius.xl}
        />
        <View style={styles.requestText}>
          <Text style={styles.username}>{item.sender?.name}</Text>
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
        onPress={() => Alert.alert('Coming Soon', 'This feature is not yet implemented')}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
  
  const SectionTab = ({ title, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.sectionTab, isActive && styles.activeSectionTab]}
      onPress={onPress}
    >
      <Text style={[styles.sectionTabText, isActive && styles.activeSectionTabText]}>
        {title} {title === 'Incoming' ? `(${requests.incoming.length})` : `(${requests.outgoing.length})`}
      </Text>
    </TouchableOpacity>
  );
  
  if (loading && !requests.incoming.length && !requests.outgoing.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }
  
  if (!loading && !requests.incoming.length && !requests.outgoing.length) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="user" size={hp(8)} color={theme.colors.textLight} />
        <Text style={styles.emptyText}>No friend requests yet</Text>
        <Text style={styles.emptySubtext}>
          When someone sends you a friend request, it will appear here
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.sectionTabs}>
        <SectionTab 
          title="Incoming" 
          isActive={activeSection === 'incoming'} 
          onPress={() => setActiveSection('incoming')}
        />
        <SectionTab 
          title="Outgoing" 
          isActive={activeSection === 'outgoing'} 
          onPress={() => setActiveSection('outgoing')}
        />
      </View>
      
      {activeSection === 'incoming' ? (
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
      ) : (
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
      )}
    </View>
  );
};

export default RequestTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  sectionTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  sectionTab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center'
  },
  activeSectionTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary
  },
  sectionTabText: {
    fontSize: hp(1.8),
    color: theme.colors.textLight
  },
  activeSectionTabText: {
    color: theme.colors.primary,
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
    borderBottomColor: '#f0f0f0'
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
    color: theme.colors.text
  },
  requestTime: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
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
    backgroundColor: theme.colors.primary
  },
  rejectButton: {
    backgroundColor: '#f0f0f0'
  },
  cancelButton: {
    backgroundColor: '#f0f0f0'
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: hp(1.6)
  },
  rejectButtonText: {
    color: theme.colors.text,
    fontSize: hp(1.6)
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: hp(1.6)
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
    marginTop: hp(1)
  }
});


