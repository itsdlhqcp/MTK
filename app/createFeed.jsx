import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable, TextInput } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp, truncateUsername } from '@/helpers/common'
import theme from '../constants/theme'
import Icon from '@/assets/icons'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import RichTextEditor from '../components/RichTextEditor'
import Button from '@/components/Button'
import { getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av';
import { createOrUpdatePost } from '../services/postService'
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../contexts/ToastContext'

const CreateFeed = () => {

  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const videoRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState(['official']);  
  const [currentTag, setCurrentTag] = useState('');
  const [filter, setFilter] = useState(''); // Changed to single string value
  const [uploadProgress, setUploadProgress] = useState(null); // Progress tracking for uploads
  const { showToast } = useToast();
  
  // Define helper functions first
  const isLocalFile = file => {
    if (!file) return null;
    if (typeof file === 'object') return true;
    return false;
  }

  const getFileType = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.type || 'image'; // Provide a default type
    }
    // For remote files
    return file.includes('postImage') ? 'image' : 'video';
  };

  const getFileUri = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.uri;
    }
    return getSupabaseFileUrl(file)?.uri;
  }

  
  // Predefined tags for the bubble selector
  const predefinedTags = ['official', 'rumour'];
  
  // Predefined filter tags with their corresponding codes
  const predefinedFilters = [
    { label: 'Malayalam', code: 'ml' },
    { label: 'Anime', code: 'am' },
    { label: 'Kdrama', code: 'kd' },
    { label: 'Tamil', code: 'tl' },
    { label: 'Kannada', code: 'kn' }, // Fixed: was 'kd', changed to 'kn'
    { label: 'Telugu', code: 'te' }, // Fixed: was 'tl', changed to 'te'
    { label: 'Hindi', code: 'hi' },
    { label: 'English', code: 'en' },
    { label: 'Korean', code: 'kr' },
    { label: 'Japanese', code: 'jp' }
  ];
  
  useEffect(() => {
    if(post && post.id) {
      // Set initial loading state to prevent multiple re-renders
      setLoading(true);
      
      // Handle body content
      if (post.body) {
        bodyRef.current = post.body;
      }
      
      // Handle file
      if (post.file) {
        setFile(post.file);
      }
      
      // Handle tags with safer parsing
      if (post.tags) {
        try {
          const parsedTags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
          setTags(Array.isArray(parsedTags) ? parsedTags : ['official']);
        } catch (e) {
          console.error('Error parsing tags:', e);
          setTags(['official']);
        }
      }

      // Handle filter tag - now expects a single string value
      if (post.filter) {
        try {
          const parsedFilter = typeof post.filter === 'string' ? post.filter : '';
          setFilter(parsedFilter);
        } catch (e) {
          console.error('Error parsing filter tag:', e);
          setFilter('');
        }
      }
      
      // Set editor content with a better approach
      // Use a slightly longer timeout to ensure the editor is fully mounted
      const editorInitTimer = setTimeout(() => {
        if (editorRef?.current && post.body) {
          editorRef.current.setContentHTML(post.body);
        }
        // End loading state after editor is initialized
        setLoading(false);
      }, 500);
      
      // Cleanup function to prevent memory leaks
      return () => {
        clearTimeout(editorInitTimer);
      };
    }
  }, []);

  // Cleanup video when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(console.error);
      }
    };
  }, [file]); 


  const onPick = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ['images']
          : ['videos'],
        allowsEditing: false,
        quality: 1,
        base64: false,
        exif: false
      };
  
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
      if (!result.canceled) {
        const asset = result.assets[0];
        // Add better type checking
        const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) 
          ? 'image' 
          : 'video');
        
        setFile({
          uri: asset.uri,
          type: fileType,
          name: asset.uri.split('/').pop()
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media file');
    }
  };

  const addTag = () => {
    if (currentTag.trim() !== '') {
      // Don't add duplicate tags
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  // Add a tag from the predefined list
  const addPredefinedTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  // Set a single filter from the predefined list
  const setPredefinedFilter = (filterItem) => {
    // If the same filter is selected, deselect it (set to empty)
    if (filter === filterItem.code) {
      setFilter('');
    } else {
      // Set the new filter code
      setFilter(filterItem.code);
    }
  };

  // Get the display label for the current filter
  const getFilterDisplayLabel = (code) => {
    const filterItem = predefinedFilters.find(item => item.code === code);
    return filterItem ? filterItem.label : code;
  };

  const onSubmit = async () => {
    // Implement your submit logic here
  
    if(!file) {
      Alert.alert(
        "Error",
        "Please write something in the post.",
        [{ text: "OK" }]
      );
      return;
    }

    let data = {
      file, 
      body: bodyRef.current,
      userId: user?.id,
      tags: JSON.stringify(tags),
      filter: filter, // Now sending single string value instead of JSON
    }

    if(post && post.id){
      data.id = post.id;
    }

    // create Post
    setLoading(true);
    // Reset progress when starting upload
    if (file && typeof file === 'object') {
      setUploadProgress({ percentage: 0, step: 0, message: "Preparing upload...", totalSteps: 2 });
    }
    
    // Progress callback for tracking upload progress
    const handleProgress = (progress) => {
      setUploadProgress(progress);
    };
    
    try {
      let res = await createOrUpdatePost(data, handleProgress);
      setLoading(false);
      setUploadProgress(null); // Clear progress on completion
      if(res.success){
        showToast('success', 'PlotTwist updated success!!');
        setFile(null); 
        bodyRef.current = ''; 
        editorRef.current?.setContentHTML('');
        setTags(['official']); 
        setFilter(''); // Reset filter to empty string
        router.back();
      }else{
        setUploadProgress(null); // Clear progress on error
        Alert.alert('Post', res.msg);
      }
      console.log('post res:', res);
    } catch (error) {
      setLoading(false);
      setUploadProgress(null); // Clear progress on error
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  return (
    <ScreenWrapper bg="#121212">
      <Header title={post?.id ? "Edit Feed" : "Create PlotTwist Feed"}
         showBackButton={true} />
      <View style={styles.container}>
        <ScrollView
         contentContainerStyle={{ gap: 20 }}
         showsVerticalScrollIndicator={false}
         >
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

          <View >
            <RichTextEditor 
              editorRef={editorRef} 
              onChange={handleEditorChange}
            />
          </View>

          {file && (
            <View style={styles.file}>
              {getFileType(file) === 'video' ? (
                <Video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', borderRadius: 7 }}
                  source={{ uri: getFileUri(file) }}
                  useNativeControls
                  resizeMode="contain"
                  isLooping={false}
                />
              ) : (
                <Image
                  source={{ uri: getFileUri(file) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={6}
                  onError={(error) => console.log('Image loading error:', error)}
                />
              )}
              <Pressable style={styles.closeIcon} onPress={() => {
                if (videoRef.current) {
                  videoRef.current.unloadAsync();
                }
                setFile(null);
              }}>
                <Icon name="delete" size={22} color={"red"} />
              </Pressable>
            </View>
          )}

          {/* Tag Management Section */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Add Tags</Text>
            
            {/* Tag bubble selector */}
            <View style={styles.tagBubblesContainer}>
              {predefinedTags.map((tag, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.tagBubble,
                    tags.includes(tag) && styles.selectedTagBubble
                  ]}
                  onPress={() => addPredefinedTag(tag)}
                >
                  <Text style={[
                    styles.tagBubbleText,
                    tags.includes(tag) && styles.selectedTagBubbleText
                  ]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={currentTag}
                onChangeText={setCurrentTag}
                placeholder="Enter tag..."
                placeholderTextColor={theme.colors.textLight}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity 
                style={styles.addTagButton}
                onPress={addTag}
                disabled={currentTag.trim() === ''}
              >
                <Icon name="add" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Tags Display */}
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View 
                  key={index} 
                  style={styles.tagPill}
                >
                  <Text style={styles.tagPillText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)}>
                    <Icon name="close" size={4} color='red' />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Filter Management Section - Modified for single selection */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Add Filter Tag (Select One)</Text>
            
            {/* Filter bubble selector - only one can be selected */}
            <View style={styles.tagBubblesContainer}>
              {predefinedFilters.map((filterItem, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.tagBubble,
                    styles.filterTagBubble,
                    filter === filterItem.code && styles.selectedFilterBubble
                  ]}
                  onPress={() => setPredefinedFilter(filterItem)}
                >
                  <Text style={[
                    styles.tagBubbleText,
                    styles.filterTagBubbleText,
                    filter === filterItem.code && styles.selectedFilterBubbleText
                  ]}>
                    #{filterItem.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Display selected filter */}
            {filter && (
              <View style={styles.selectedFilterContainer}>
                <Text style={styles.selectedFilterLabel}>Selected Filter:</Text>
                <View style={[styles.tagPill, styles.selectedFilterPill]}>
                  <Text style={[styles.tagPillText, styles.selectedFilterPillText]}>
                    #{getFilterDisplayLabel(filter)} ({filter})
                  </Text>
                  <TouchableOpacity onPress={() => setFilter('')}>
                    <Icon name="close" size={4} color='red' />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.media}>
            <Text style={styles.addImageText}>Add new feed</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={"#FFFFFF"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPick(false)}>
                <Icon name="video" size={37} color={"#FFFFFF"} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title={post?.id ? "Edit" : "Post"}
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
        {/* Progress Bar for Post Upload */}
        {uploadProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{uploadProgress.message}</Text>
              <Text style={styles.progressPercentage}>{Math.round(uploadProgress.percentage)}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${uploadProgress.percentage}%` }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default CreateFeed

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: wp(4), 
    gap: 15,
    backgroundColor: '#121212',
  },
  file: {
    height: hp(32),
    width: '100%',
    overflow: 'hidden',
    borderCurve: 'continuous',
    paddingVertical: wp(8),
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.md,
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  media: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    borderWidth: 1, 
    padding: 12, 
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md, 
    borderCurve: 'continuous', 
    borderColor: '#333333',
    backgroundColor: '#181818',
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
    textAlign: 'center'
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
  mediaIcons: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    marginLeft: 10
  },
  addImageText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
  },
  avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: '#B3B3B3',
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 12,
    padding: 6,
    borderRadius: 50,
    backgroundColor: 'rgba(97, 35, 35, 0.14)'
  },
  // Tag management styles
  tagsSection: {
    marginVertical: hp(1),
  },
  tagsSectionTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: '#FFFFFF',
    marginBottom: hp(1),
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  tagInput: {
    flex: 1,
    padding: hp(1.5),
    fontSize: hp(1.8),
    color: '#FFFFFF',
    backgroundColor: '#181818',
  },
  addTagButton: {
    padding: hp(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: hp(1.5),
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#262626',
    gap: 5,
  },
  tagPillText: {
    fontSize: hp(1.4),
    fontWeight: '600',
    color: '#E0E0E0',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tagBubblesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: hp(1.5),
  },
  tagBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444444',
    backgroundColor: '#181818',
  },
  selectedTagBubble: {
    backgroundColor: theme.colors.primary,
  },
  tagBubbleText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: '#E0E0E0',
  },
  selectedTagBubbleText: {
    color: 'white',
  },
  // Filter-specific styles
  filterTagBubble: {
    borderColor: '#FF8C00',
  },
  filterTagBubbleText: {
    color: '#FF8C00',
  },
  selectedFilterBubble: {
    backgroundColor: '#FF8C00',
  },
  selectedFilterBubbleText: {
    color: 'white',
  },
  selectedFilterContainer: {
    marginTop: hp(1),
  },
  selectedFilterLabel: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    marginBottom: hp(0.5),
  },
  selectedFilterPill: {
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderColor: '#FF8C00',
  },
  selectedFilterPillText: {
    color: '#FF8C00',
  },
  // Progress bar styles
  progressContainer: {
    marginTop: hp(1.5),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  progressText: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    flex: 1,
  },
  progressPercentage: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary,
    marginLeft: wp(2),
  },
  progressBarBackground: {
    height: hp(0.6),
    backgroundColor: '#333333',
    borderRadius: hp(0.3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: hp(0.3),
    transition: 'width 0.3s ease',
  },
})