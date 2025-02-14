import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Avatar from './Avatar';
import theme from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Icon from '@/assets/icons';

const { width } = Dimensions.get('window');

const ProfilePopup = ({ user, visible, onClose, router }) => {
  if (!user) return null;

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

          <View style={styles.statsContainer}>
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
          </View>

          <TouchableOpacity 
            style={styles.viewProfileButton} 
            onPress={() => {
              router.push({ pathname: '/profile', params: { userId: user.id } });
              onClose();
            }}
          >
            <Text style={styles.viewProfileText}>View Full Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ProfilePopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: wp(85),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.radius.xl,
    padding: wp(5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: wp(4),
    right: wp(4),
    zIndex: 1,
  },
  avatarContainer: {
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    strokeWidth: 1.5
  },
  name: {
    fontSize: hp(2.7),
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: hp(1),
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
    backgroundColor: 'rgba(240,240,240,0.5)',
    borderRadius: theme.radius.lg,
    paddingVertical: hp(1.5),
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
  viewProfileButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: theme.radius.lg,
    width: '100%',
    alignItems: 'center',
  },
  viewProfileText: {
    color: theme.colors.textDark,
    fontWeight: 'bold',
    fontSize: hp(2),
  },
});