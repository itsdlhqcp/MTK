import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { fetchNotifications } from '../services/notificationService';
import { hp, wp } from '@/helpers/common';
import theme from '../constants/theme';
import { useRouter } from 'expo-router';

import Icon from '@/assets/icons';
import NotificationItem from './NotificationItem';

// Enhanced Instagram-like dark theme colors
const darkTheme = {
  background: '#121212', // Main background (darker)
  cardBackground: '#1F1F1F', // Card/component background
  itemBackground: '#262626', // Individual notification background
  textPrimary: '#FFFFFF', // Primary text
  textSecondary: '#8E8E8E', // Secondary text
  accent: '#0095F6', // Instagram blue accent
  border: '#363636', // Subtle borders (slightly lighter for visibility)
  error: '#ED4956', // Instagram red for errors
};

const NotificationsTab = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {user} = useAuth();
    const router = useRouter();

    useEffect(() => {
        getNotifications();
    }, []); 

    const getNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            let res = await fetchNotifications(user.id);
            if (res.success) {
                setNotifications(res.data);
            } else {
                setError('Failed to fetch notifications');
            }
        } catch (err) {
            setError('Something went wrong');
            console.error('Notification fetch error:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={darkTheme.accent} />
                <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (notifications.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Icon name="notsqr" size={hp(8)} color={darkTheme.textSecondary} />
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>
                    You'll see notifications about activity related to your account here
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.listStyle}
            >
                {notifications.map(item => (
                    <View style={styles.notificationItemContainer} key={item?.id}>
                        <NotificationItem
                            item={item}
                            router={router}
                        />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.background,
    },
    listStyle: {
        padding: wp(4),
        paddingBottom: hp(2),
        backgroundColor: darkTheme.background,
    },
    notificationItemContainer: {
        backgroundColor: darkTheme.itemBackground,
        borderRadius: 12,
        marginBottom: hp(1.5),
        padding: wp(3),
        borderWidth: 1,
        borderColor: darkTheme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: darkTheme.background,
    },
    loadingText: {
        marginTop: hp(2),
        fontSize: hp(1.8),
        color: darkTheme.textPrimary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: hp(4),
        backgroundColor: darkTheme.background,
    },
    emptyText: {
        fontSize: hp(2),
        fontWeight: '600',
        color: darkTheme.textPrimary,
        marginTop: hp(2)
    },
    emptySubtext: {
        fontSize: hp(1.6),
        color: darkTheme.textSecondary,
        textAlign: 'center',
        marginTop: hp(1)
    },
    errorText: {
        textAlign: 'center',
        color: darkTheme.error,
        fontSize: hp(1.8),
    }
});

export default NotificationsTab;