// import React, { useState, useEffect } from 'react';
// import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
// import Avatar from './Avatar';
// import theme from '../constants/theme';
// import { hp, wp } from '../helpers/common';
// import Icon from '@/assets/icons';
// import { friendRequestService } from '../services/requestService';

// const { width } = Dimensions.get('window');

// const ProfilePopup = ({ user, visible, onClose, router }) => {
//   const [friendshipStatus, setFriendshipStatus] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (user && visible) {
//       checkFriendshipStatus();
//     }
//   }, [user, visible]);

//   const checkFriendshipStatus = async () => {
//     if (!user) return;
    
//     try {
//       setLoading(true);
//       const result = await friendRequestService.checkFriendship(user.id);
//       if (result.success) {
//         setFriendshipStatus(result.status);
//       }
//     } catch (error) {
//       console.error('Error checking friendship status:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendRequest = async () => {
//     try {
//       setLoading(true);
//       const result = await friendRequestService.sendRequest(user.id);
      
//       if (result.success) {
//         Alert.alert('Success', 'Friend request sent successfully');
//         setFriendshipStatus('pending');
//       } else {
//         Alert.alert('Error', result.message || 'Failed to send friend request');
//       }
//     } catch (error) {
//       console.error('Error sending friend request:', error);
//       Alert.alert('Error', 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!user) return null;

//   // Determine button state based on friendship status
//   let buttonText = 'Add Friend';
//   let buttonStyle = styles.addButton;
//   let buttonTextStyle = styles.addButtonText;
//   let buttonDisabled = false;
  
//   switch (friendshipStatus) {
//     case 'accepted':
//       buttonText = 'Friends';
//       buttonStyle = styles.friendsButton;
//       buttonTextStyle = styles.friendsButtonText;
//       buttonDisabled = true;
//       break;
//     case 'pending':
//       buttonText = 'Request Sent';
//       buttonStyle = styles.pendingButton;
//       buttonTextStyle = styles.pendingButtonText;
//       buttonDisabled = true;
//       break;
//     case 'rejected':
//       buttonText = 'Add Friend';
//       break;
//     default:
//       buttonText = 'Add Friend';
//   }

//   return (
//     <Modal
//       transparent={true}
//       visible={visible}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.overlay}>
//         <View style={styles.container}>
//           <TouchableOpacity style={styles.closeButton} onPress={onClose} >
//             <Icon name="close" size={hp(4)} strokeWidth={2} color={theme.colors.textDark} />
//           </TouchableOpacity>

//           <View style={styles.avatarContainer}>
//             <Avatar 
//               uri={user?.image} 
//               size={hp(15)} 
//               rounded={theme.radius.xxl * 2} 
//             />
//           </View>

//           <Text style={styles.name}>{user.name}</Text>
//           {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

//           <View style={styles.statsContainer}>
//             {[
//               { label: 'Posts', value: '0' },
//               { label: 'Followers', value: '0' },
//               { label: 'Following', value: '0' }
//             ].map((stat, index) => (
//               <View key={index} style={styles.statItem}>
//                 <Text style={styles.statValue}>{stat.value}</Text>
//                 <Text style={styles.statLabel}>{stat.label}</Text>
//               </View>
//             ))}
//           </View>

//           <View style={styles.buttonContainer}>
//             <TouchableOpacity 
//               style={styles.viewProfileButton} 
//               onPress={() => {
//                 router.push({ pathname: isCurrentUser ? '/profile' : '/friendProfile', params: { userId: user.id } });
//                 onClose();
//               }}
//             >
//               <Text style={styles.viewProfileText}>View Full Profile</Text>
//             </TouchableOpacity>

//             {loading ? (
//               <ActivityIndicator size="small" color={theme.colors.primary} style={styles.activityIndicator} />
//             ) : (
//               <TouchableOpacity 
//                 style={[styles.friendRequestButton, buttonStyle]}
//                 onPress={handleSendRequest}
//                 disabled={buttonDisabled}
//               >
//                 <Text style={[styles.friendRequestText, buttonTextStyle]}>{buttonText}</Text>
//               </TouchableOpacity>
//             )}
//           </View>

//           <View style={styles.decorativeElement}></View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// export default ProfilePopup;


import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import Avatar from './Avatar';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';
import { friendRequestService } from '../services/requestService';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const ProfilePopup = ({ user, visible, onClose, router }) => {
  const { user: currentUser } = useAuth(); // Get current authenticated user
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Check if the profile being viewed belongs to the current user
  const isCurrentUser = currentUser && user && currentUser.name === user.name;

  useEffect(() => {
    if (user && visible && !isCurrentUser) {
      checkFriendshipStatus();
    }
  }, [user, visible, isCurrentUser]);

  const checkFriendshipStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const result = await friendRequestService.checkFriendship(user.id);
      if (result.success) {
        setFriendshipStatus(result.status);
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      const result = await friendRequestService.sendRequest(user.id);
      
      if (result.success) {
        Alert.alert('Success', 'Friend request sent successfully');
        setFriendshipStatus('pending');
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

  if (!user) return null;

  // Determine button state based on friendship status
  let buttonText = 'Add Friend';
  let buttonStyle = styles.addButton;
  let buttonTextStyle = styles.addButtonText;
  let buttonDisabled = false;
  
  switch (friendshipStatus) {
    case 'accepted':
      buttonText = 'I am a friend';
      buttonStyle = styles.friendsButton;
      buttonTextStyle = styles.friendsButtonText;
      buttonDisabled = true;
      break;
    case 'pending':
      buttonText = 'Request Sent';
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
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} >
            <Icon name="close" size={hp(4)} strokeWidth={2} color={theme.colors.textDark} />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <Avatar 
              uri={user?.image} 
              size={hp(15)} 
              rounded={theme.radius.xxl * 2} 
            />
          </View>

          <Text style={styles.name}>{user.name}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* <View style={styles.statsContainer}>
            {[
              { label: 'Posts', value: '0' },
              { label: 'Followers', value: '0' },
              { label: 'Following', value: '0' }
            ].map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View> */}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.viewProfileButton} 
              onPress={() => {
                router.push({ 
                  pathname: isCurrentUser ? '/profile' : '/xprofile', 
                  params: { userId: user.id } 
                });
                onClose();
              }}
            >
              <Text style={styles.viewProfileText}>View Full Profile</Text>
            </TouchableOpacity>

            {!isCurrentUser && (
              loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={styles.activityIndicator} />
              ) : (
                <TouchableOpacity 
                  style={[styles.friendRequestButton, buttonStyle]}
                  onPress={handleSendRequest}
                  disabled={buttonDisabled}
                >
                  <Text style={[styles.friendRequestText, buttonTextStyle]}>{buttonText}</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <View style={styles.decorativeElement}></View>
        </View>
      </View>
    </Modal>
  );
};

export default ProfilePopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: wp(85),
    backgroundColor: 'rgba(255,245,240,0.95)',
    borderRadius: theme.radius.xl,
    padding: wp(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.3)',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: wp(4),
    right: wp(4),
    zIndex: 1,
  },
  avatarContainer: {
    marginBottom: hp(2),
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: 'rgba(255,140,0,0.5)',
    borderRadius: theme.radius.xxl * 2,
    padding: 2,
  },
  name: {
    fontSize: hp(2.7),
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: hp(1),
    fontFamily: 'System',
  },
  bio: {
    color: theme.colors.text,
    marginBottom: hp(2),
    textAlign: 'center',
    paddingHorizontal: wp(3),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: hp(2),
    backgroundColor: 'rgba(255,200,160,0.2)',
    borderRadius: theme.radius.lg,
    paddingVertical: hp(1.5),
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.2)',
  },
  statItem: {
    alignItems: 'center',
    width: wp(20),
  },
  statValue: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  statLabel: {
    color: theme.colors.textLight,
    fontSize: hp(1.6),
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: hp(1),
  },
  viewProfileButton: {
    backgroundColor: 'rgba(255,160,80,0.8)',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    flex: 1,
    marginRight: wp(2),
    alignItems: 'center',
  },
  viewProfileText: {
    color: theme.colors.textDark,
    fontWeight: 'bold',
    fontSize: hp(1.8),
  },
  friendRequestButton: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    flex: 1,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  pendingButton: {
    backgroundColor: 'rgba(200,200,200,0.5)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  friendsButton: {
    backgroundColor: 'rgba(100,200,100,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(100,200,100,0.5)',
  },
  friendRequestText: {
    fontWeight: 'bold',
    fontSize: hp(1.8),
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
  activityIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
  decorativeElement: {
    position: 'absolute',
    bottom: -wp(1),
    width: wp(60),
    height: wp(1),
    backgroundColor: 'rgba(255,140,0,0.4)',
    borderRadius: theme.radius.full,
  },
});