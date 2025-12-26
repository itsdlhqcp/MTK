import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable, FlatList } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { hp, wp, truncateUsername } from '@/helpers/common'
import theme from '../constants/theme'
import Icon from '@/assets/icons'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import RichTextEditor from '../components/RichTextEditor'
import Button from '@/components/Button'
import * as ImagePicker from 'expo-image-picker';
import DatePicker from '../components/DatePicker'
import { TextInput } from 'react-native'
import { createSeries, uploadSeriesImages, createSeriesEpisodes, updateSeries, fetchSeriesById } from '../services/seriesService'
import { uploadProfileImage } from '../services/imageService'
import { supabaseUrl } from '../constants'

const CreateSeries = () => {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [seriesId, setSeriesId] = useState(null);
  const [initialContentSet, setInitialContentSet] = useState(false);
  const isSubmittingRef = useRef(false); // Ref to prevent double submission
  
  // Series basic info
  const [seriesName, setSeriesName] = useState('');
  const [genre, setGenre] = useState('');
  
  // Multiple images for series
  const [seriesImages, setSeriesImages] = useState([]);
  const [existingSeriesImages, setExistingSeriesImages] = useState([]);
  
  // Tile image for series
  const [tileImage, setTileImage] = useState(null);
  const [existingTileImage, setExistingTileImage] = useState(null);
  
  // Episodes
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisodeNumber, setCurrentEpisodeNumber] = useState(1);
  const [currentEpisodeTitle, setCurrentEpisodeTitle] = useState('');
  const [currentEpisodeDate, setCurrentEpisodeDate] = useState(null);
  const [currentEpisodeDescription, setCurrentEpisodeDescription] = useState('');

  // Pick multiple images for series (one at a time)
  const onPickSeriesImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image',
          name: asset.uri.split('/').pop(),
        }));
        setSeriesImages([...seriesImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Remove image from series images
  const removeSeriesImage = (index) => {
    const newImages = seriesImages.filter((_, i) => i !== index);
    setSeriesImages(newImages);
  };

  // Pick tile image for series
  const onPickTileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setTileImage({
          uri: asset.uri,
          type: 'image',
          name: asset.uri.split('/').pop(),
        });
      }
    } catch (error) {
      console.error('Error picking tile image:', error);
      Alert.alert('Error', 'Failed to pick tile image');
    }
  };

  // Add episode to list
  const addEpisode = () => {
    if (!currentEpisodeDate) {
      Alert.alert('Error', 'Please select a release date for the episode');
      return;
    }

    const newEpisode = {
      episode_number: currentEpisodeNumber,
      episode_title: currentEpisodeTitle || `Episode ${currentEpisodeNumber}`,
      description: currentEpisodeDescription,
      release_date: currentEpisodeDate,
    };

    setEpisodes([...episodes, newEpisode]);
    
    // Reset episode form
    setCurrentEpisodeNumber(currentEpisodeNumber + 1);
    setCurrentEpisodeTitle('');
    setCurrentEpisodeDate(null);
    setCurrentEpisodeDescription('');
    
    Alert.alert('Success', 'Episode added successfully');
  };

  // Remove episode from list
  const removeEpisode = (index) => {
    const newEpisodes = episodes.filter((_, i) => i !== index);
    setEpisodes(newEpisodes);
    
    // Update episode numbers
    const updatedEpisodes = newEpisodes.map((ep, idx) => ({
      ...ep,
      episode_number: idx + 1
    }));
    setEpisodes(updatedEpisodes);
    setCurrentEpisodeNumber(updatedEpisodes.length + 1);
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  const handleDateSelect = (date) => {
    setCurrentEpisodeDate(date);
  };

  const getFileUri = (file) => {
    if (!file) return null;
    if (typeof file === 'object') return file.uri;
    return file;
  };

  // Helper function to get image URL from Supabase
  const getSupabaseImageUrl = (filePath) => {
    if (!filePath) return null;
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return { uri: `${supabaseUrl}/storage/v1/object/public/profileImage/${cleanPath}` };
  };

  // Load series data for editing
  useEffect(() => {
    const loadSeriesData = async () => {
      // Check if we have an id in params
      const id = params?.id;
      
      if (id && !initialContentSet) {
        setIsEditMode(true);
        // Convert to number if it's a string
        const seriesIdNum = typeof id === 'string' ? parseInt(id, 10) : id;
        setSeriesId(seriesIdNum);
        
        try {
          // Fetch full series data to ensure we have all nested data
          const result = await fetchSeriesById(seriesIdNum);
          
          if (result.success && result.data) {
            const seriesData = result.data;
            
            // Load series name
            if (seriesData.name) {
              setSeriesName(seriesData.name);
            }
            
            // Load genre
            if (seriesData.genre) {
              setGenre(seriesData.genre);
            }
            
            // Load description
            if (seriesData.description) {
              bodyRef.current = seriesData.description;
              if (editorRef.current?.setContentHTML) {
                setTimeout(() => {
                  editorRef.current?.setContentHTML(seriesData.description);
                  setInitialContentSet(true);
                }, 300);
              } else {
                setInitialContentSet(true);
              }
            } else {
              setInitialContentSet(true);
            }
            
            // Load tile image
            if (seriesData.tile_image) {
              setExistingTileImage(seriesData.tile_image);
              setTileImage(getSupabaseImageUrl(seriesData.tile_image));
            }
            
            // Load series images
            if (seriesData.images && Array.isArray(seriesData.images) && seriesData.images.length > 0) {
              const imageUrls = seriesData.images.map(img => {
                const imagePath = img.image_path || img;
                return getSupabaseImageUrl(imagePath);
              });
              setExistingSeriesImages(seriesData.images);
              setSeriesImages(imageUrls);
            }
            
            // Load episodes
            if (seriesData.episodes && Array.isArray(seriesData.episodes) && seriesData.episodes.length > 0) {
              const formattedEpisodes = seriesData.episodes.map(ep => ({
                id: ep.id,
                episode_number: ep.episode_number,
                episode_title: ep.episode_title || '',
                description: ep.description || '',
                release_date: ep.release_date ? new Date(ep.release_date) : null,
              }));
              setEpisodes(formattedEpisodes);
              setCurrentEpisodeNumber(seriesData.episodes.length + 1);
            }
          } else {
            Alert.alert('Error', result.msg || 'Failed to load series data');
            setInitialContentSet(true);
          }
        } catch (error) {
          console.error('Error loading series data:', error);
          Alert.alert('Error', 'Failed to load series data for editing');
          setInitialContentSet(true);
        }
      }
    };
    
    loadSeriesData();
  }, [params?.id]);

  const onSubmit = async () => {
    // Prevent double submission
    if (isSubmittingRef.current || loading) {
      return;
    }

    if (!seriesName.trim()) {
      Alert.alert('Error', 'Please enter series name');
      return;
    }

    if (seriesImages.length === 0 && existingSeriesImages.length === 0) {
      Alert.alert('Error', 'Please add at least one image for the series');
      return;
    }

    // Set submission flag immediately
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      if (isEditMode && seriesId) {
        // UPDATE MODE
        // 1. Update series record
        const updateData = {
          name: seriesName,
          description: bodyRef.current,
          genre: genre || null,
        };

        const updateResult = await updateSeries(seriesId, updateData);

        if (!updateResult.success) {
          Alert.alert('Error', updateResult.msg || 'Failed to update series');
          setLoading(false);
          return;
        }

        // 2. Upload new tile image if changed (if it's a new file object)
        if (tileImage && typeof tileImage === 'object' && tileImage.uri && !tileImage.uri.includes('supabase')) {
          const tileImageResult = await uploadProfileImage('postImage', tileImage.uri, true);
          if (tileImageResult.success) {
            await updateSeries(seriesId, { tile_image: tileImageResult.data });
          }
        }

        // 3. Upload new series images (only new ones that are file objects)
        const newImages = seriesImages.filter(img => 
          typeof img === 'object' && img.uri && !img.uri.includes('supabase')
        );
        
        if (newImages.length > 0) {
          const imagesResult = await uploadSeriesImages(
            newImages,
            seriesId,
            'poster'
          );
          if (!imagesResult.success) {
            console.error('Error uploading new images:', imagesResult);
          }
        }

        // 4. Update episodes (for now, we'll just create new ones if added)
        // Note: Full episode update/delete would require additional service methods
        const newEpisodes = episodes.filter(ep => !ep.id);
        if (newEpisodes.length > 0) {
          const episodesData = newEpisodes.map(ep => ({
            series_id: seriesId,
            episode_number: ep.episode_number,
            episode_title: ep.episode_title,
            description: ep.description,
            release_date: ep.release_date,
          }));

          const episodesResult = await createSeriesEpisodes(episodesData);
          if (!episodesResult.success) {
            console.error('Error creating new episodes:', episodesResult);
          }
        }

        Alert.alert('Success', 'Series updated successfully!');
        router.back();
      } else {
        // CREATE MODE
        // 1. Create series record
        const seriesData = {
          name: seriesName,
          description: bodyRef.current,
          genre: genre || null,
          created_by: user?.id,
          status: 'active'
        };

        const seriesResult = await createSeries(seriesData);

        if (!seriesResult.success) {
          Alert.alert('Error', seriesResult.msg || 'Failed to create series');
          setLoading(false);
          return;
        }

        const createdSeries = seriesResult.data;

        // 2. Upload tile image if provided
        let tileImagePath = null;
        if (tileImage && typeof tileImage === 'object' && tileImage.uri) {
          const tileImageResult = await uploadProfileImage('postImage', tileImage.uri, true);
          if (tileImageResult.success) {
            tileImagePath = tileImageResult.data;
            // Update series with tile_image
            await updateSeries(createdSeries.id, { tile_image: tileImagePath });
          } else {
            console.error('Error uploading tile image:', tileImageResult);
          }
        }

        // 3. Upload series images (only new file objects)
        const newImages = seriesImages.filter(img => 
          typeof img === 'object' && img.uri && !img.uri.includes('supabase')
        );
        
        if (newImages.length > 0) {
          const imagesResult = await uploadSeriesImages(
            newImages,
            createdSeries.id,
            'poster'
          );

          if (!imagesResult.success) {
            console.error('Error uploading images:', imagesResult);
          }
        }

        // 4. Create episodes
        if (episodes.length > 0) {
          const episodesData = episodes.map(ep => ({
            series_id: createdSeries.id,
            episode_number: ep.episode_number,
            episode_title: ep.episode_title,
            description: ep.description,
            release_date: ep.release_date,
          }));

          const episodesResult = await createSeriesEpisodes(episodesData);

          if (!episodesResult.success) {
            console.error('Error creating episodes:', episodesResult);
          }
        }

        Alert.alert('Success', 'Series created successfully!');
        
        // Reset form
        setSeriesName('');
        bodyRef.current = '';
        editorRef.current?.setContentHTML('');
        setGenre('');
        setTileImage(null);
        setSeriesImages([]);
        setEpisodes([]);
        setCurrentEpisodeNumber(1);
        setCurrentEpisodeTitle('');
        setCurrentEpisodeDate(null);
        setCurrentEpisodeDescription('');
        
        router.back();
      }
    } catch (error) {
      console.error('Error saving series:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} series. Please try again.`);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false; // Reset submission flag
    }
  };

  return (
    <ScreenWrapper bg="#121212">
      <Header title={isEditMode ? "Edit Series" : "Create Series"} showBackButton={true} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Avatar
              uri={user?.image}
              size={hp(6.5)}
              rounded={theme.radius.xl}
            />
            <View style={{ gap: 2 }}>
              <Text style={styles.username}>
                {truncateUsername(user?.name || '')}
              </Text>
              <Text style={styles.publicText}>
                Public
              </Text>
            </View>
          </View>

          {/* Series Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Series Name *</Text>
            <TextInput
              style={styles.input}
              value={seriesName}
              onChangeText={setSeriesName}
              placeholder="Enter series name"
            />
          </View>

          {/* Description */}
          <View>
            <Text style={styles.inputLabel}>Description</Text>
            <RichTextEditor 
              editorRef={editorRef} 
              onChange={handleEditorChange}
              initialHeight={136}
              placeholder="Enter series description..."
            />
          </View>

          {/* Genre */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Genre</Text>
            <TextInput
              style={styles.input}
              value={genre}
              onChangeText={setGenre}
              placeholder="e.g., Drama, Action, Comedy"
            />
          </View>

          {/* Tile Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tile Image</Text>
            <Text style={styles.sectionSubtitle}>Upload a tile image for the series</Text>
            
            {tileImage && (
              <View style={styles.tileImageContainer}>
                <Image
                  source={{ uri: getFileUri(tileImage) }}
                  style={styles.tileImagePreview}
                  resizeMode="cover"
                />
                <Pressable 
                  style={styles.removeTileImageButton}
                  onPress={() => setTileImage(null)}
                >
                  <Icon name="delete" size={20} color="red" />
                </Pressable>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={onPickTileImage}
            >
              <Icon name="image" size={24} color={theme.colors.primary} />
              <Text style={styles.addImageButtonText}>
                {tileImage ? 'Change Tile Image' : 'Add Tile Image'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Series Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Series Images *</Text>
            <Text style={styles.sectionSubtitle}>Add multiple images for the series</Text>
            
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={onPickSeriesImages}
            >
              <Icon name="image" size={24} color={theme.colors.primary} />
              <Text style={styles.addImageButtonText}>Add Images</Text>
            </TouchableOpacity>

            {seriesImages.length > 0 && (
              <View style={styles.imagesGrid}>
                {seriesImages.map((image, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image
                      source={{ uri: getFileUri(image) }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <Pressable 
                      style={styles.removeImageButton}
                      onPress={() => removeSeriesImage(index)}
                    >
                      <Icon name="delete" size={20} color="red" />
                    </Pressable>
                    <Text style={styles.imageOrderText}>{index + 1}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Episodes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episodes</Text>
            <Text style={styles.sectionSubtitle}>Add episodes with release dates</Text>

            <View style={styles.episodeForm}>
              <View style={styles.episodeFormRow}>
                <View style={[styles.inputContainer, { flex: 0.3 }]}>
                  <Text style={styles.inputLabel}>Episode #</Text>
                  <TextInput
                    style={styles.input}
                    value={currentEpisodeNumber.toString()}
                    onChangeText={(text) => setCurrentEpisodeNumber(parseInt(text) || 1)}
                    keyboardType="number-pad"
                    editable={false}
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 0.7 }]}>
                  <Text style={styles.inputLabel}>Episode Title</Text>
                  <TextInput
                    style={styles.input}
                    value={currentEpisodeTitle}
                    onChangeText={setCurrentEpisodeTitle}
                    placeholder="Episode title (optional)"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Release Date *</Text>
                <DatePicker 
                  onDateSelect={handleDateSelect}
                  initialDate={currentEpisodeDate}
                  label="Select Episode Release Date"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={currentEpisodeDescription}
                  onChangeText={setCurrentEpisodeDescription}
                  placeholder="Episode description (optional)"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity 
                style={styles.addEpisodeButton}
                onPress={addEpisode}
              >
                <Icon name="plus" size={20} color="#fff" />
                <Text style={styles.addEpisodeButtonText}>Add Episode</Text>
              </TouchableOpacity>
            </View>

            {episodes.length > 0 && (
              <View style={styles.episodesList}>
                <Text style={styles.episodesListTitle}>Added Episodes ({episodes.length})</Text>
                {episodes.map((episode, index) => (
                  <View key={index} style={styles.episodeCard}>
                    <View style={styles.episodeCardContent}>
                      <Text style={styles.episodeCardNumber}>Episode {episode.episode_number}</Text>
                      <Text style={styles.episodeCardTitle}>{episode.episode_title}</Text>
                      {episode.release_date && (
                        <Text style={styles.episodeCardDate}>
                          {new Date(episode.release_date).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.removeEpisodeButton}
                      onPress={() => removeEpisode(index)}
                    >
                      <Icon name="delete" size={18} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Button
          buttonStyle={{ height: hp(6.2) }}
          title={isEditMode ? "Update Series" : "Create Series"}
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default CreateSeries;

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: wp(4), 
    gap: 15,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: '#B3B3B3',
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: hp(1.8),
    color: '#FFFFFF',
    backgroundColor: '#181818',
  },
  multilineInput: {
    minHeight: hp(8),
    textAlignVertical: 'top',
  },
  section: {
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.md,
    backgroundColor: '#181818',
  },
  sectionTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: hp(1.6),
    color: '#B3B3B3',
    marginBottom: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    marginBottom: 15,
  },
  addImageButtonText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.primary,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageItem: {
    width: wp(30),
    height: hp(20),
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 5,
  },
  imageOrderText: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: theme.colors.primary,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: hp(1.4),
    fontWeight: 'bold',
  },
  episodeForm: {
    marginBottom: 15,
  },
  episodeFormRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addEpisodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: theme.radius.md,
    marginTop: 10,
  },
  addEpisodeButtonText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
    color: '#fff',
  },
  episodesList: {
    marginTop: 15,
  },
  episodesListTitle: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginBottom: 10,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: theme.radius.sm,
    marginBottom: 8,
  },
  episodeCardContent: {
    flex: 1,
  },
  episodeCardNumber: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
  },
  episodeCardTitle: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    marginTop: 2,
  },
  episodeCardDate: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    marginTop: 4,
  },
  removeEpisodeButton: {
    padding: 8,
  },
  tileImageContainer: {
    width: '100%',
    height: hp(25),
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  tileImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeTileImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
});

