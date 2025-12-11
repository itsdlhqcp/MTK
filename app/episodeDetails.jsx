import React, { useState, useEffect, useCallback } from 'react';
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
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { wp, hp } from '../helpers/common';
import theme from '../constants/theme';
import { getSupabaseFileUrl } from '../services/imageService';
import { fetchEpisodeWithSections } from '../services/episodeService';
import { fetchPostDetails, removePost } from '../services/homeService';
import ScreenWrapper from '../components/ScreenWrapper';
import Icon from '../assets/icons';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import * as WebBrowser from 'expo-web-browser';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EpisodeDetails = () => {
  const { episodeId, postId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = episodeId || postId;
  
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Section');
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEpisodeData();
    }
  }, [id]);

  const fetchEpisodeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch episode with sections
      const result = await fetchEpisodeWithSections(id);
      
      if (result.success) {
        setEpisode(result.data);
        
        // If episode is part of a story/series, fetch other episodes
        if (result.data.story_id) {
          fetchSeriesEpisodes(result.data.story_id, id);
        } else {
          // If no story_id, fetch episodes with same title/author
          fetchRelatedEpisodes(result.data);
        }
      } else {
        setError(result.msg || 'Failed to fetch episode');
      }
    } catch (err) {
      console.error('Error fetching episode:', err);
      setError('An error occurred while fetching episode');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeriesEpisodes = async (storyId, currentEpisodeId) => {
    try {
      setLoadingEpisodes(true);
      const { data, error } = await supabase
        .from('twists')
        .select('*, user: users(id, name, image)')
        .eq('story_id', storyId)
        .not('cover_image', 'is', null)
        .order('episode_number', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setAllEpisodes(data.filter(ep => ep.id.toString() !== currentEpisodeId.toString()));
      }
    } catch (err) {
      console.error('Error fetching series episodes:', err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const fetchRelatedEpisodes = async (currentEpisode) => {
    try {
      setLoadingEpisodes(true);
      // Fetch episodes by same author/user
      const { data, error } = await supabase
        .from('twists')
        .select('*, user: users(id, name, image)')
        .eq('userId', currentEpisode.userId)
        .in('episode_type', ['pdf', 'section_based'])
        .not('cover_image', 'is', null)
        .neq('id', currentEpisode.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setAllEpisodes(data);
      }
    } catch (err) {
      console.error('Error fetching related episodes:', err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleEpisodePress = (ep) => {
    router.push({
      pathname: '/episodeDetails',
      params: { episodeId: ep.id }
    });
  };

  const handleDeleteEpisode = () => {
    if (!episode) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteEpisode = async () => {
    if (!episode) return;
    
    try {
      setShowDeleteModal(false);
      setLoading(true);
      const result = await removePost(episode.id);
      
      if (result.success) {
        Alert.alert('Success', 'Episode deleted successfully', [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]);
      } else {
        Alert.alert('Error', result.msg || 'Failed to delete episode');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error deleting episode:', error);
      Alert.alert('Error', 'An error occurred while deleting the episode');
      setLoading(false);
    }
  };

  // Helper function to get section file URL (uses profileImage bucket like other files)
  const getSectionFileUrl = (filePath) => {
    if (!filePath) return null;
    const urlObj = getSupabaseFileUrl(filePath);
    return urlObj ? urlObj.uri : null;
  };

  // Handle PDF open
  const handleOpenPDF = async (pdfPath) => {
    try {
      const pdfUrl = getSectionFileUrl(pdfPath);
      if (pdfUrl) {
        await WebBrowser.openBrowserAsync(pdfUrl);
      } else {
        Alert.alert('Error', 'PDF file not found.');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF.');
    }
  };

  // Render a single section
  const renderSection = (section, index) => {
    const textContent = section?.text_content || '';
    const imageFile = section?.image_file;
    const videoFile = section?.video_file;
    const pdfFile = section?.pdf_file;

    const textStyle = {
      color: '#CCCCCC',
      fontSize: hp(1.7)
    };

    const tagsStyles = {
      div: textStyle,
      p: textStyle,
      ol: textStyle,
      h1: { color: '#FFFFFF' },
      h4: { color: '#FFFFFF' }
    };

    return (
      <View key={section?.id || index} style={styles.sectionItem}>
        {/* Section Order Badge */}
        <View style={styles.sectionOrderBadge}>
          <Text style={styles.sectionOrderText}>{section?.section_order || index + 1} Section</Text>
        </View>

        {/* Text Content */}
        {textContent && (
          <View style={styles.sectionTextContainer}>
            <RenderHtml
              contentWidth={SCREEN_WIDTH - wp(8)}
              source={{ html: textContent }}
              tagsStyles={tagsStyles}
            />
          </View>
        )}

        {/* Image File */}
        {imageFile && (
          <View style={styles.sectionMediaContainer}>
            <Image
              source={{ uri: getSectionFileUrl(imageFile) }}
              style={styles.sectionImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Video File */}
        {videoFile && (
          <View style={styles.sectionMediaContainer}>
            <Video
              source={{ uri: getSectionFileUrl(videoFile) }}
              style={styles.sectionVideo}
              useNativeControls
              resizeMode="contain"
            />
          </View>
        )}

        {/* PDF File */}
        {pdfFile && (
          <TouchableOpacity
            style={styles.pdfContainer}
            onPress={() => handleOpenPDF(pdfFile)}
            activeOpacity={0.8}
          >
            <View style={styles.pdfButton}>
              <Icon name="paperclip" size={hp(3)} color={theme.colors.primary} />
              <Text style={styles.pdfButtonText}>View PDF</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper bg="#121212">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !episode) {
    return (
      <ScreenWrapper bg="#121212">
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Episode not found'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const coverImageUrl = episode.cover_image 
    ? getSupabaseFileUrl(episode.cover_image)?.uri 
    : null;

  const parsedTags = typeof episode.tags === 'string' 
    ? JSON.parse(episode.tags || '[]') 
    : episode.tags || [];

  return (
    <ScreenWrapper bg="#121212">
      <Stack.Screen options={{ headerShown: false }} />

      {showMenu && (
        <View style={styles.menuWrapper} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => {
              console.log('Backdrop pressed, closing menu');
              setShowMenu(false);
            }}
          />
          <View style={styles.menuContainer} pointerEvents="auto">
            {episode && user && episode.userId === user.id ? (
              <>
                <Pressable 
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed
                  ]}
                  onPress={() => {
                    console.log('Edit button pressed - Episode ID:', episode.id);
                    setShowMenu(false);
                    
                    // Navigate exactly like twistDetails.jsx does
                    router.push({
                      pathname: 'addTwist',
                      params: {
                        ...episode,
                        id: episode.id.toString(),
                        tags: typeof episode.tags === 'string' ? episode.tags : JSON.stringify(episode.tags || []),
                      }
                    });
                  }}
                >
                  <Text style={styles.menuItemText}>Edit</Text>
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [
                    styles.menuItem,
                    styles.menuItemDelete,
                    pressed && styles.menuItemPressed
                  ]}
                  onPress={() => {
                    setShowMenu(false);
                    handleDeleteEpisode();
                  }}
                >
                  <Text style={[styles.menuItemText, styles.menuItemDeleteText]}>Delete</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.menuItem}>
                <Text style={[styles.menuItemText, { color: '#888', fontSize: hp(1.2) }]}>
                  Debug: {!episode ? 'No episode' : !user ? 'Not logged in' : `User ${user.id} != Episode ${episode.userId}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Episode</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this episode? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmDeleteEpisode}
              >
                <Text style={styles.modalButtonDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => setShowMenu(false)}
      >
        {/* Cover Image */}
        {coverImageUrl && (
          <View style={styles.coverImageContainer}>
            {/* Back Button and 3 Dots above image */}
            <View style={styles.imageHeaderButtons}>
              <TouchableOpacity onPress={() => router.back()} style={styles.imageBackButton}>
                <Icon name="arrowLeft" size={hp(2.5)} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.imageMenuButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <Icon name="threeDotsHorizontal" size={hp(3.5)} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Image
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            {episode.episode_title && (
              <View style={styles.titleOverlay}>
                <Text style={styles.coverTitle}>{episode.episode_title}</Text>
              </View>
            )}
          </View>
        )}

        {/* Episode Information */}
        <View style={styles.infoSection}>
          {episode.description && (
            <Text style={styles.description} numberOfLines={4}>
              {episode.description}
            </Text>
          )}

          {/* Genre Tags */}
          {parsedTags.length > 0 && (
            <View style={styles.tagsContainer}>
              {parsedTags.slice(0, 5).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Preview' && styles.activeTab]}
            onPress={() => setActiveTab('Preview')}
          >
            <Text style={[styles.tabText, activeTab === 'Preview' && styles.activeTabText]}>
              Preview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Section' && styles.activeTab]}
            onPress={() => setActiveTab('Section')}
          >
            <Text style={[styles.tabText, activeTab === 'Section' && styles.activeTabText]}>
              Section
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Readers Also Like' && styles.activeTab]}
            onPress={() => setActiveTab('Readers Also Like')}
          >
            <Text style={[styles.tabText, activeTab === 'Readers Also Like' && styles.activeTabText]}>
              Readers Also Like
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'Section' && (
          <View style={styles.sectionsContainer}>
            {episode?.sections && episode.sections.length > 0 ? (
              <>
                <Text style={styles.sectionsTitle}>
                  {episode.sections.length} {episode.sections.length === 1 ? 'Section' : 'Sections'}
                </Text>
                {episode.sections.map((section, index) => renderSection(section, index))}
              </>
            ) : (
              <View style={styles.emptySectionsContainer}>
                <Text style={styles.emptySectionsText}>No sections available for this episode.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Preview' && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Preview</Text>
            {episode.description && (
              <Text style={styles.previewText}>{episode.description}</Text>
            )}
            {/* Add preview content here */}
          </View>
        )}

        {activeTab === 'Readers Also Like' && (
          <View style={styles.readersAlsoLikeSection}>
            <Text style={styles.sectionTitle}>Readers Also Like</Text>
            {/* Add recommendations here */}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default EpisodeDetails;

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
  },
  coverImageContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.7,
    position: 'relative',
  },
  imageHeaderButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    zIndex: 10,
  },
  imageBackButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageMenuButton: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: hp(7),
    right: wp(4),
    backgroundColor: '#1E1E1E',
    borderRadius: theme.radius.md,
    paddingVertical: hp(0.5),
    minWidth: wp(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  menuItem: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    minHeight: hp(4),
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  menuItemDelete: {
    borderBottomWidth: 0,
  },
  menuItemPressed: {
    backgroundColor: '#2D2D2D',
  },
  menuItemDeleteText: {
    color: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: theme.radius.lg,
    padding: wp(6),
    width: '100%',
    maxWidth: wp(85),
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: hp(2.5),
    fontWeight: 'bold',
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  modalMessage: {
    color: '#CCCCCC',
    fontSize: hp(1.8),
    lineHeight: hp(2.5),
    marginBottom: hp(3),
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(3),
  },
  modalButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2D2D2D',
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  modalButtonCancelText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  modalButtonDelete: {
    backgroundColor: '#FF3B30',
  },
  modalButtonDeleteText: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '500',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  coverTitle: {
    color: '#FFFFFF',
    fontSize: hp(2.5),
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  infoSection: {
    padding: wp(4),
    backgroundColor: '#1E1E1E',
  },
  episodeTitle: {
    color: '#FFFFFF',
    fontSize: hp(2.8),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  author: {
    color: '#AAAAAA',
    fontSize: hp(1.8),
    marginBottom: hp(1.5),
  },
  description: {
    color: '#CCCCCC',
    fontSize: hp(1.7),
    lineHeight: hp(2.5),
    marginBottom: hp(1.5),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1),
  },
  tag: {
    backgroundColor: '#2D2D2D',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: theme.radius.sm,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: hp(1.4),
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    paddingHorizontal: wp(4),
  },
  tab: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    marginRight: wp(4),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    color: '#888888',
    fontSize: hp(1.7),
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  episodesSection: {
    padding: wp(4),
  },
  episodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  episodesCount: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  sortText: {
    color: '#AAAAAA',
    fontSize: hp(1.6),
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    gap: wp(3),
  },
  episodeThumbnail: {
    width: wp(20),
    height: hp(12),
    borderRadius: theme.radius.sm,
    backgroundColor: '#2D2D2D',
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888888',
    fontSize: hp(1.4),
  },
  episodeInfo: {
    flex: 1,
  },
  episodeItemTitle: {
    color: '#FFFFFF',
    fontSize: hp(1.8),
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  newBadge: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  episodeDate: {
    color: '#AAAAAA',
    fontSize: hp(1.5),
  },
  readButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: theme.radius.sm,
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.8),
  },
  readButtonText: {
    color: '#FFFFFF',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  loader: {
    marginVertical: hp(2),
  },
  previewSection: {
    padding: wp(4),
  },
  readersAlsoLikeSection: {
    padding: wp(4),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: hp(2.2),
    fontWeight: 'bold',
    marginBottom: hp(2),
  },
  previewText: {
    color: '#CCCCCC',
    fontSize: hp(1.7),
    lineHeight: hp(2.5),
  },
  sectionsContainer: {
    padding: wp(4),
  },
  sectionsTitle: {
    color: '#FFFFFF',
    fontSize: hp(2),
    fontWeight: 'bold',
    marginBottom: hp(2),
  },
  sectionItem: {
    marginBottom: hp(3),
    paddingBottom: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  sectionOrderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    marginBottom: hp(1.5),
  },
  sectionOrderText: {
    color: '#FFFFFF',
    fontSize: hp(1.4),
    fontWeight: '600',
  },
  sectionTextContainer: {
    marginBottom: hp(1.5),
  },
  sectionMediaContainer: {
    marginVertical: hp(1.5),
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: '#2D2D2D',
  },
  sectionImage: {
    width: '100%',
    minHeight: hp(20),
    maxHeight: hp(40),
  },
  sectionVideo: {
    width: '100%',
    height: hp(25),
  },
  pdfContainer: {
    marginVertical: hp(1.5),
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: theme.radius.md,
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    gap: wp(2),
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pdfButtonText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  emptySectionsContainer: {
    paddingVertical: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionsText: {
    color: '#888888',
    fontSize: hp(1.8),
    textAlign: 'center',
  },
});

