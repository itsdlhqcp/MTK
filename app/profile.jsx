import { View, StyleSheet, TouchableOpacity, Alert, Pressable, Text, ScrollView, useColorScheme, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import theme from '../constants/theme'
import ScreenWrapper from '../components/ScreenWrapper'
import { wp, hp } from '../helpers/common'
import Icon from '@/assets/icons'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import { fetchPosts } from '../services/postService'
import PostCard from '../components/PostCard'
import MLoading from '../components/MaterialLoader'
import FeedLoader from '../components/FeedLoader'

// Dark mode colors
var limit = 0;
const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#000000',
    cardBackground: '#121212',
    textDark: '#FFFFFF',
    textLight: '#A8A8A8',
    text: '#FFFFFF',
    border: '#262626',
    primary: '#0095F6',
    secondary: '#262626',
    rose: '#FF375F',
  }
}

const Profile = () => {
  const { user, setAuth } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const colorScheme = useColorScheme();
   const [loading, setLoading] = useState(false);
   const [page, setPage] = useState(1);
   const ITEMS_PER_PAGE = 4; // This was used in your Home component but missing here
   const activeTheme = colorScheme === 'dark' ? darkTheme : theme;
   const post = useLocalSearchParams();
   const [postCount, setPostCount] = useState(0);
   console.log('auth user profile cred', user);

  const onLogout = async () => {
    Alert.alert('Confirm', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (!error) {
            Alert.alert('Successfully logged out');
            setAuth(null);
            router.replace('/login');
          } else {
            Alert.alert('Error logging out');
          }
        }
      }
    ]);
  }

  const getPostCount = async () => {
    try {
      const { data, error, count } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('userId', user.id);

      if (!error) {
        setPostCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching post count:', error);
    }
  };

  useEffect(() => {
    getPosts(ITEMS_PER_PAGE, user.id);
}, []);

useEffect(() => {
  getPosts();
  getPostCount();
}, [user.id]);


  const FooterComponent = () => {
    // Only render if there are posts
    if (posts.length === 0) return null;

    return (
        <View style={{marginVertical: 0}} paddingBottom={16}>
            {loading && <MLoading  />}
            {!hasMore && posts.length > 0 && (
                <Text style={styles.noPosts}>No more feeds to load !!</Text>
            )}
        </View>
    );
};

    const getPosts = async () => {
      if (loading || !hasMore) return;
      
      try {
          setLoading(true);
          const res = await fetchPosts(page * ITEMS_PER_PAGE, user.id);
          
          if (res.success) {
              // Check if we've reached the end
              if (res.data.length === 0 || res.data.length < ITEMS_PER_PAGE) {
                  setHasMore(false);
              }
              
              // Append new posts, avoiding duplicates
              setPosts(prevPosts => {
                  const newPosts = res.data.filter(
                      newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
                  );
                  return [...prevPosts, ...newPosts];
              });
              
              setPage(prev => prev + 1);
          } else {
              Alert.alert('Error', 'Failed to fetch posts');
          }
      } catch (error) {
          console.error('Error fetching posts:', error);
          Alert.alert('Error', 'Something went wrong while fetching posts');
      } finally {
          setLoading(false);
      }
  }

  return (
    <ScreenWrapper bg={activeTheme.colors.background}>
        <FlatList
            data={posts}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
                <InstagramProfile 
                    user={user} 
                    router={router} 
                    handleLogout={onLogout} 
                    theme={activeTheme}
                    postCount={postCount}
                />
            )}
            contentContainerStyle={styles.listStyle}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <PostCard
                    item={item}
                    currentUser={user}
                    router={router}
                />
            )}
            onEndReached={() => {
                if (hasMore && !loading) {
                    getPosts();
                }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={FooterComponent}
            ListEmptyComponent={() => (
                <View style={styles.loadingContainer}>
                    <Text style={styles.noPosts}>
                        {loading ? <MLoading /> : "No feeds found!!"}
                    </Text>
                </View>
            )}
        />
    </ScreenWrapper>
);
}

const StatsItem = ({ label, value, theme }) => (
  <View style={styles.statsItem}>
    <Text style={[styles.statsValue, { color: theme.colors.textDark }]}>{value}</Text>
    <Text style={[styles.statsLabel, { color: theme.colors.textLight }]}>{label}</Text>
  </View>
);

const InstagramProfile = ({ user, router, handleLogout, theme, postCount}) => {
  const formattedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  let parsedTags = user.tags;
  if (typeof user.tags === 'string') {
    try {
      parsedTags = JSON.parse(user.tags);
    } catch (e) {
      parsedTags = [];
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.username, { color: theme.colors.textDark }]}>{user.name}</Text>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.colors.secondary }]} 
          onPress={handleLogout}
        >
          <Icon name="logout" color={theme.colors.rose} />
        </TouchableOpacity>
      </View>

      {/* Profile Info Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Avatar
            uri={user?.image}
            size={hp(12)}
            rounded={theme.radius.xxl * 1.4}
          />
          <Pressable 
            style={[styles.editIcon, { backgroundColor: theme.colors.cardBackground }]}
          >
            <Icon 
              name="edit" 
              strokeWidth={2.5} 
              color={theme.colors.textLight} 
              size={hp(3)} 
              onPress={() => router.push('editProfile')} 
            />
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
        {/* <StatsItem value={posts.length.toString()} label="Posts" theme={theme} /> */}
          <StatsItem value={postCount?.toString() || "0"} label="Posts" theme={theme} />  
          <StatsItem value="0" label="Followers" theme={theme} />
          <StatsItem value="0" label="Following" theme={theme} />
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <Text style={[styles.bioName, { color: theme.colors.textDark }]}>{user.name}</Text>
        {user.bio && <Text style={[styles.bio, { color: theme.colors.text }]}>{user.bio}</Text>}
        <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}>Joined {formattedDate}</Text>
        <Text style={[styles.joinedDate, { color: theme.colors.textLight }]}> {user.address}</Text>


       
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {Array.isArray(parsedTags) && parsedTags.map((tag, index) => (
          <View 
            key={index} 
            style={[styles.tagPill, { 
              backgroundColor: theme.colors.secondary,
              borderColor: theme.colors.border 
            }]}
          >
            <Text style={[styles.tagPillText, { color: theme.colors.primary }]}>#{tag}</Text>
          </View>
        ))}
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Icon name="mail" color={theme.colors.textLight} />
          <Text style={[styles.contactText, { color: theme.colors.textLight }]}>{user.email}</Text>
        </View>
        {user.phoneNumber && (
          <View style={styles.contactItem}>
            <Icon name="call" color={theme.colors.textLight} />
            <Text style={[styles.contactText, { color: theme.colors.textLight }]}>{user.phoneNumber}</Text>
          </View>
        )}
       
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity 
        style={[styles.editProfileButton, { backgroundColor: theme.colors.secondary }]}
        onPress={() => router.push('editProfile')}
      >
        <Text style={[styles.editProfileText, { color: theme.colors.textDark }]}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  username: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  avatarContainer: {
    position: 'relative',
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: wp(4),
  },
  statsItem: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: hp(1.6),
  },
  bioSection: {
    marginBottom: hp(2),
  },
  bioName: {
    fontSize: hp(1.8),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  bio: {
    fontSize: hp(1.6),
    marginBottom: hp(0.5),
  },
  joinedDate: {
    fontSize: hp(1.4),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: hp(2),
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: hp(1.4),
    fontWeight: '600',
  },
  contactInfo: {
    gap: hp(1.5),
    marginBottom: hp(3),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  contactText: {
    fontSize: hp(1.6),
  },
  editProfileButton: {
    padding: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
    borderRadius: theme.radius.sm,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    padding: 7,
    borderRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(78)
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center', 
    color: theme.colors.primary
  },
  listStyle: {
    paddingHorizontal: wp(2)
  }

})