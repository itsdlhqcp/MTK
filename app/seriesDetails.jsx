import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import { fetchSeriesById } from '../services/seriesService';
import ScreenWrapper from '../components/ScreenWrapper';
import Icon from '../assets/icons';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabaseFileUrl } from '../services/userProfileImage';
import { supabaseUrl } from '../constants';
import RenderHtml from 'react-native-render-html';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// HTML tag styles for description
const textStyle = {
  color: '#CCCCCC', 
  fontSize: hp(1.8)
};

const tagsStyles = {
  div: textStyle,
  p: textStyle,
  ol: textStyle,
  ul: textStyle,
  li: textStyle,
  h1: { color: '#FFFFFF', fontSize: hp(2.5) },
  h2: { color: '#FFFFFF', fontSize: hp(2.2) },
  h3: { color: '#FFFFFF', fontSize: hp(2) },
  h4: { color: '#FFFFFF', fontSize: hp(1.8) },
  span: textStyle,
  strong: { ...textStyle, fontWeight: 'bold' },
  em: { ...textStyle, fontStyle: 'italic' },
};

// Helper function to get image URL - handles file paths correctly
const getSeriesImageUrl = (filePath) => {
  if (!filePath) return null;
  
  // Remove leading slash if present to avoid double slashes in URL
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // All files are stored in profileImage bucket
  return { uri: `${supabaseUrl}/storage/v1/object/public/profileImage/${cleanPath}` };
};

const SeriesDetails = () => {
  const { seriesId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (seriesId) {
      fetchSeriesData();
    }
  }, [seriesId]);

  const fetchSeriesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch series with images and episodes
      const result = await fetchSeriesById(seriesId);
      
      if (result.success) {
        setSeries(result.data);
      } else {
        setError(result.msg || 'Failed to fetch series');
      }
    } catch (err) {
      console.error('Error fetching series:', err);
      setError('An error occurred while fetching series');
    } finally {
      setLoading(false);
    }
  };

  // Render episode list item
  const renderEpisode = ({ item, index }) => {
    const releaseDate = item.release_date 
      ? moment(item.release_date).format('MMM D, YYYY')
      : 'TBA';
    
    return (
      <TouchableOpacity 
        style={styles.episodeListItem}
        activeOpacity={0.7}
      >
        <View style={styles.episodeListItemContent}>
          {/* Left side - Episode info */}
          <View style={styles.episodeListItemLeft}>
            <View style={styles.episodeNumberContainer}>
              <Text style={styles.episodeNumberText}>{item.episode_number}</Text>
            </View>
            <View style={styles.episodeTextContainer}>
              <Text style={styles.episodeListItemTitle} numberOfLines={1}>
                {item.episode_title || `Episode ${item.episode_number}`}
              </Text>
              {item.description && (
                <Text style={styles.episodeListItemDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
          
          {/* Right side - Date */}
          <View style={styles.episodeListItemRight}>
            <Text style={styles.episodeListItemDate}>{releaseDate}</Text>
            {item.duration && (
              <Text style={styles.episodeListItemDuration}>{item.duration}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  if (loading) {
    return (
      <ScreenWrapper bg="#121212">
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !series) {
    return (
      <ScreenWrapper bg="#121212">
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Series not found'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const coverImageUrl = series.images && series.images.length > 0 
    ? getSeriesImageUrl(series.images[0].image_path)
    : null;

  const sortedEpisodes = series.episodes 
    ? [...series.episodes].sort((a, b) => a.episode_number - b.episode_number)
    : [];

  return (
    <ScreenWrapper bg="#121212">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cover Image with Overlay Buttons */}
        {coverImageUrl && (
          <View style={styles.coverImageContainer}>
            <Image
              source={coverImageUrl}
              style={styles.coverImage}
              resizeMode="cover"
            />
            
            {/* Overlay Buttons */}
            <View style={styles.imageOverlay}>
              <TouchableOpacity onPress={() => router.back()} style={styles.overlayBackButton}>
                <Icon name="arrowLeft" size={hp(2.5)} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.overlayMenuButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <Icon name="threeDotsHorizontal" size={hp(3.5)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.coverGradient}
            />
          </View>
        )}

        {/* Menu Dropdown */}
        {showMenu && (
          <View style={styles.menuWrapper} pointerEvents="box-none">
            <TouchableOpacity 
              style={styles.menuBackdrop}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
            <View style={styles.menuContainer} pointerEvents="auto">
              {series && user && series.created_by === user.id ? (
                <Pressable 
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed
                  ]}
                  onPress={() => {
                    console.log('Edit button pressed - Series ID:', series.id);
                    setShowMenu(false);
                    router.push({
                      pathname: 'createSeries',
                      params: { id: series.id }
                    });
                  }}
                >
                  <Text style={styles.menuItemText}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}

        {/* Series Information */}
        <View style={styles.infoSection}>
          <Text style={styles.seriesTitle}>{series.name || 'Untitled Series'}</Text>
          
          {series.genre && (
            <View style={styles.genreContainer}>
              <Text style={styles.genreText}>{series.genre}</Text>
            </View>
          )}

          {series.description && (
            <View style={styles.description}>
              <RenderHtml
                contentWidth={SCREEN_WIDTH - wp(8)}
                source={{ html: series.description }}
                tagsStyles={tagsStyles}
              />
            </View>
          )}
        </View>

        {/* Episode Tab */}
        <View style={styles.tabsContainer}>
          <View style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>
              EPISODE
            </Text>
          </View>
        </View>

        {/* Episodes List */}
        <View style={styles.episodesContainer}>
          {sortedEpisodes.length > 0 ? (
            <FlatList
              data={sortedEpisodes}
              renderItem={renderEpisode}
              keyExtractor={(item) => `episode-${item.id}`}
              scrollEnabled={false}
              contentContainerStyle={styles.episodesList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No episodes available for this series.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default SeriesDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: hp(10),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: hp(2),
    textAlign: 'center',
  },
  coverImageContainer: {
    width: '100%',
    height: hp(40),
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    zIndex: 10,
  },
  overlayBackButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: hp(2.5),
    padding: hp(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayMenuButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: hp(2.5),
    padding: hp(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  infoSection: {
    padding: wp(4),
  },
  seriesTitle: {
    color: '#FFFFFF',
    fontSize: hp(3),
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  genreContainer: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.sm,
    marginBottom: hp(1.5),
  },
  genreText: {
    color: theme.colors.primary,
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  description: {
    marginBottom: hp(2),
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingHorizontal: wp(4),
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: '#888888',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  episodesContainer: {
    padding: wp(4),
  },
  episodesList: {
    gap: hp(0.5),
  },
  episodeListItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: theme.radius.md,
    marginBottom: hp(1),
    overflow: 'hidden',
  },
  episodeListItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
  },
  episodeListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(4),
  },
  episodeNumberContainer: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  episodeNumberText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  episodeTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  episodeListItemTitle: {
    color: '#FFFFFF',
    fontSize: hp(2),
    fontWeight: '600',
    marginBottom: hp(0.3),
  },
  episodeListItemDescription: {
    color: '#888888',
    fontSize: hp(1.5),
  },
  episodeListItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  episodeListItemDate: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '500',
    marginBottom: hp(0.3),
  },
  episodeListItemDuration: {
    color: '#888888',
    fontSize: hp(1.4),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(5),
  },
  emptyText: {
    color: '#888888',
    fontSize: hp(1.8),
    textAlign: 'center',
  },
  menuWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: hp(6),
    right: wp(4),
    backgroundColor: '#1E1E1E',
    borderRadius: theme.radius.md,
    minWidth: wp(30),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  menuItemPressed: {
    backgroundColor: '#2D2D2D',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '500',
  },
});

