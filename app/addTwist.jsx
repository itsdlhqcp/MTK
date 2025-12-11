import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable, TextInput } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Header from '../components/Header'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { hp, wp } from '@/helpers/common'
import theme from '../constants/theme'
import Icon from '@/assets/icons'
import Avatar from '../components/Avatar'
import { useAuth } from '../contexts/AuthContext'
import RichTextEditor from '../components/RichTextEditor'
import Button from '@/components/Button'
import { getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av';
import { createOrUpdatePost } from '../services/homeService'
import { createOrUpdateEpisode, fetchEpisodeWithSections } from '../services/episodeService'
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { extractYouTubeID, getYouTubeThumbnail } from '../helpers/youtubeHelper';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../contexts/ToastContext'

// Dark theme colors
const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#FFFFFF',
    textLight: '#AAAAAA',
    primary: '#405DE6',
    secondary: 'rgba(64, 93, 230, 0.1)',
    border: '#2D2D2D',
    gray: '#2D2D2D',
    input: '#2D2D2D',
    dark: '#FFFFFF',
  },
};

const CreateFeed = () => {
  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [initialContentSet, setInitialContentSet] = useState(false);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const { showToast } = useToast();
  
  // Episode creation method state
  const [creationMethod, setCreationMethod] = useState('regular'); // 'regular', 'pdf', 'section_based'
  
  // Episode metadata
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeDescription, setEpisodeDescription] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  
  // Section-based creation state (works for both section_based and pdf methods)
  const [sections, setSections] = useState([
    { text_content: '', image_file: null, video_file: null, pdf_file: null }
  ]);
  
  // Section editor refs
  const sectionEditorRefs = useRef([]);
  
  // Predefined tags
  const predefinedTags = ['Common', 'Malayalam', 'Anime', 'Kdrama', 'Hollywod', 'Tamil', 'Kannada', 'Telugu', 'Hindi', 'English', 'Korean', 'Japanese'];

  useEffect(() => {
    if(post && post.id && !initialContentSet){
      bodyRef.current = post.body || ''; 
      
      // Load episode metadata if editing an episode
      if (post.episode_type) {
        setCreationMethod(post.episode_type);
        setEpisodeTitle(post.episode_title || '');
        setEpisodeDescription(post.description || '');
        setEpisodeNumber(post.episode_number?.toString() || '');
        if (post.cover_image) setCoverImage(post.cover_image);
        
        // Fetch sections if editing a section-based or pdf episode (only once)
        if ((post.episode_type === 'section_based' || post.episode_type === 'pdf') && post.id && !sectionsLoaded) {
          fetchSectionsForEdit(post.id);
        }
      }
      
      // Check if file is a YouTube link
      if (post.file && typeof post.file === 'string' && (post.file.includes('youtube.com') || post.file.includes('youtu.be'))) {
        setYoutubeLink(post.file);
        setFile(null);
      } else {
        setFile(post.file || null);
        setYoutubeLink('');
      }
      
      // Parse tags if they exist
      if (post.tags) {
        try {
          const parsedTags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
          setTags(Array.isArray(parsedTags) ? parsedTags : []);
        } catch (e) {
          console.error('Error parsing tags:', e);
          setTags([]);
        }
      }
      
      // Set initial content only once
      setTimeout(() => {
        if (editorRef?.current) {
          editorRef.current.setContentHTML(post.body || '');
          setInitialContentSet(true);
        }
      }, 300);
    }
  }, [post?.id, initialContentSet, sectionsLoaded]);

  // Fetch sections when editing an episode
  const fetchSectionsForEdit = async (episodeId) => {
    if (sectionsLoaded) {
      console.log('Sections already loaded, skipping fetch');
      return;
    }
    
    try {
      console.log('Fetching sections for episode:', episodeId);
      setSectionsLoaded(true); // Mark as loading to prevent duplicate calls
      
      const result = await fetchEpisodeWithSections(episodeId);
      
      if (result.success && result.data && result.data.sections) {
        // Sort sections by order
        const sortedSections = result.data.sections.sort((a, b) => 
          (a.section_order || 0) - (b.section_order || 0)
        );
        
        // Map sections to the format expected by the editor
        const formattedSections = sortedSections.map((section) => ({
          text_content: section.text_content || '',
          image_file: section.image_file || null,
          video_file: section.video_file || null,
          pdf_file: section.pdf_file || null,
        }));
        
        console.log('Loaded sections:', formattedSections.length);
        
        // Set sections only if we have data
        if (formattedSections.length > 0) {
          setSections(formattedSections);
          
          // Set content in section editors after they're mounted (with longer delay)
          setTimeout(() => {
            formattedSections.forEach((section, index) => {
              if (section.text_content && sectionEditorRefs.current[index]) {
                try {
                  // Only set if editor is empty or hasn't been set yet
                  const currentContent = sectionEditorRefs.current[index].getContentHTML?.();
                  if (!currentContent || currentContent.trim() === '' || currentContent === '<p><br></p>') {
                    sectionEditorRefs.current[index].setContentHTML(section.text_content);
                    console.log(`Set content for section ${index + 1}`);
                  }
                } catch (error) {
                  console.error(`Error setting content for section ${index + 1}:`, error);
                }
              }
            });
          }, 800);
        } else {
          setSections([{ text_content: '', image_file: null, video_file: null, pdf_file: null }]);
        }
      } else {
        console.log('No sections found, using default');
        setSections([{ text_content: '', image_file: null, video_file: null, pdf_file: null }]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSectionsLoaded(false); // Reset on error so it can retry
      // Keep default section on error
      setSections([{ text_content: '', image_file: null, video_file: null, pdf_file: null }]);
    }
  };

  // Pick image/video
  const onPick = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage ? ['images'] : ['videos'],
        allowsEditing: false,
        quality: 0.7,
        base64: false,
        exif: false
      };
  
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
      if (!result.canceled) {
        const asset = result.assets[0];
        const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'video');
        
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

  // Pick PDF file for a section
  const onPickPDF = async (sectionIndex) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        updateSection(sectionIndex, 'pdf_file', {
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
        });
      }
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', 'Failed to pick PDF file');
    }
  };

  // Pick cover image
  const onPickCoverImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setCoverImage({
          uri: asset.uri,
          type: 'image',
          name: asset.uri.split('/').pop()
        });
      }
    } catch (error) {
      console.error('Error picking cover image:', error);
      Alert.alert('Error', 'Failed to pick cover image');
    }
  };

  // Section management functions
  const addSection = () => {
    setSections([...sections, { text_content: '', image_file: null, video_file: null, pdf_file: null }]);
  };

  const removeSection = (index) => {
    if (sections.length > 1) {
      const newSections = sections.filter((_, i) => i !== index);
      setSections(newSections);
      // Remove corresponding editor ref
      sectionEditorRefs.current = sectionEditorRefs.current.filter((_, i) => i !== index);
    } else {
      Alert.alert('Error', 'At least one section is required');
    }
  };

  const updateSection = (index, field, value) => {
    setSections(prevSections => {
      const newSections = [...prevSections];
      if (newSections[index]) {
        newSections[index] = { ...newSections[index], [field]: value };
      }
      return newSections;
    });
  };

  const pickSectionMedia = async (sectionIndex, isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage ? ['images'] : ['videos'],
        allowsEditing: false,
        quality: 0.7,
        base64: false,
      };
  
      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
  
      if (!result.canceled) {
        const asset = result.assets[0];
        const fileType = asset.type || (asset.uri.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 'video');
        
        const field = isImage ? 'image_file' : 'video_file';
        updateSection(sectionIndex, field, {
          uri: asset.uri,
          type: fileType,
          name: asset.uri.split('/').pop()
        });
      }
    } catch (error) {
      console.error('Error picking section media:', error);
      Alert.alert('Error', 'Failed to pick media file');
    }
  };

  const isLocalFile = file => {
    if (!file) return null;
    if (typeof file === 'object') return true;
    return false;
  };
  
  const isYouTubeLink = file => {
    if (!file) return false;
    if (typeof file === 'string' && (file.includes('youtube.com') || file.includes('youtu.be'))) {
      return true;
    }
    return false;
  };
  
  const getFileType = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.type || 'image';
    }
    if (isYouTubeLink(file)) {
      return 'youtube';
    }
    return file.includes('postImage') ? 'image' : 'video';
  };
  
  const getFileUri = file => {
    if (!file) return null;
    if (isLocalFile(file)) {
      return file.uri;
    }
    if (isYouTubeLink(file)) {
      return getYouTubeThumbnail(extractYouTubeID(file));
    }
    return getSupabaseFileUrl(file)?.uri;
  };

  const addTag = () => {
    if (currentTag.trim() !== '') {
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const addPredefinedTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    } else {
      removeTag(tags.indexOf(tag));
    }
  };

  const removeTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  const handleSectionEditorChange = (index, content) => {
    updateSection(index, 'text_content', content);
  };

  const onSubmit = async () => {
    try {
      // Validation based on creation method
      if (creationMethod === 'regular') {
        if (!bodyRef.current && !file && !youtubeLink && tags.length === 0) {
          Alert.alert("Error", "Please write something in the post or add media.");
          return;
        }
      } else if (creationMethod === 'pdf' || creationMethod === 'section_based') {
        const hasContent = sections.some(section => 
          section.text_content?.trim() || section.image_file || section.video_file || section.pdf_file
        );
        if (!hasContent) {
          Alert.alert("Error", `Please add content to at least one section${creationMethod === 'pdf' ? ' (PDF file)' : ''}.`);
          return;
        }
        if (!episodeTitle.trim()) {
          Alert.alert("Error", "Please enter an episode title.");
          return;
        }
      }

      setLoading(true);

      let data = {
        userId: user?.id,
        tags: tags,
        episode_type: creationMethod,
      };

      // Add episode metadata
      if (creationMethod !== 'regular') {
        data.episode_title = episodeTitle;
        data.description = episodeDescription;
        data.episode_number = episodeNumber ? parseInt(episodeNumber) : null;
        if (coverImage) data.cover_image = coverImage;
      }

      // Handle based on creation method
      if (creationMethod === 'regular') {
        // Regular post
        data.body = bodyRef.current;
        data.tags = JSON.stringify(tags);
        
        if (file) {
          data.file = file;
          data.youtubeLink = null;
        } else if (youtubeLink) {
          data.file = null;
          data.youtubeLink = youtubeLink;
        } else {
          data.file = null;
          data.youtubeLink = null;
        }

        if (post && post.id) {
          data.id = post.id;
        }

        let res = await createOrUpdatePost(data);
        setLoading(false);
        
        if (res.success) {
          showToast('success', 'Post created successfully!');
          resetForm();
          router.back();
        } else {
          Alert.alert('Post Error', res.msg || 'Unknown error occurred');
        }
      } else {
        // Episode creation (PDF or Section-based) - both use sections
        // Get content from section editors
        const sectionsWithContent = sections.map((section, index) => {
          const editorContent = sectionEditorRefs.current[index]?.getContentHTML?.() || section.text_content;
          return {
            ...section,
            text_content: editorContent,
          };
        });
        data.sections = sectionsWithContent;
        data.body = episodeDescription || null;

        if (post && post.id) {
          data.id = post.id;
        }

        let res = await createOrUpdateEpisode(data);
        setLoading(false);
        
        if (res.success) {
          showToast('success', 'Episode created successfully!');
          resetForm();
          router.back();
        } else {
          Alert.alert('Episode Error', res.msg || 'Unknown error occurred');
        }
      }
    } catch (error) {
      setLoading(false);
      console.error('Exception in onSubmit:', error);
      Alert.alert('Error', 'An unexpected error occurred while submitting.');
    }
  };

  const resetForm = () => {
    setFile(null);
    bodyRef.current = '';
    editorRef.current?.setContentHTML('');
    setTags([]);
    setYoutubeLink('');
    setCreationMethod('regular');
    setEpisodeTitle('');
    setEpisodeDescription('');
    setEpisodeNumber('');
    setCoverImage(null);
    setSections([{ text_content: '', image_file: null, video_file: null, pdf_file: null }]);
    sectionEditorRefs.current = [];
  };

  return (
    <ScreenWrapper bg={darkTheme.colors.background}>
      <Header 
        title={post?.id ? "Edit Post" : "Plot Studio"}
        showBackButton={true} 
        textColor={darkTheme.colors.text}
        backgroundColor={darkTheme.colors.background}
      />
      <View style={[styles.container, { backgroundColor: darkTheme.colors.background }]}>
        <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 20 }}>
          <View style={styles.header}>
            <Avatar
              uri={user?.image}
              size={hp(6.5)}
              rounded={darkTheme.radius.xl}
            />
            <View style={{ gap: 2 }}>
              <Text style={[styles.username, { color: darkTheme.colors.text }]}>
                {user?.name}
              </Text>
              <Text style={[styles.publicText, { color: darkTheme.colors.textLight }]}>
                Public
              </Text>
            </View>
          </View>

          {/* Creation Method Selection */}
          <View style={[styles.methodSelector, { backgroundColor: darkTheme.colors.cardBackground }]}>
            <Text style={[styles.methodTitle, { color: darkTheme.colors.text }]}>Creation Method</Text>
            <View style={styles.methodButtons}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  creationMethod === 'regular' && styles.methodButtonActive,
                  { borderColor: darkTheme.colors.primary }
                ]}
                onPress={() => setCreationMethod('regular')}
              >
                <Text style={[
                  styles.methodButtonText,
                  { color: creationMethod === 'regular' ? darkTheme.colors.text : darkTheme.colors.textLight }
                ]}>
                  Regular Post
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  creationMethod === 'pdf' && styles.methodButtonActive,
                  { borderColor: darkTheme.colors.primary }
                ]}
                onPress={() => setCreationMethod('pdf')}
              >
                <Text style={[
                  styles.methodButtonText,
                  { color: creationMethod === 'pdf' ? darkTheme.colors.text : darkTheme.colors.textLight }
                ]}>
                  PDF Upload
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  creationMethod === 'section_based' && styles.methodButtonActive,
                  { borderColor: darkTheme.colors.primary }
                ]}
                onPress={() => setCreationMethod('section_based')}
              >
                <Text style={[
                  styles.methodButtonText,
                  { color: creationMethod === 'section_based' ? darkTheme.colors.text : darkTheme.colors.textLight }
                ]}>
                  Episode  Based
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Episode Metadata (for PDF and Section-based) */}
          {(creationMethod === 'pdf' || creationMethod === 'section_based') && (
            <View style={[styles.episodeMetadata, { backgroundColor: darkTheme.colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: darkTheme.colors.text }]}>Episode Information</Text>
              
              <TextInput
                style={[styles.input, { color: darkTheme.colors.text, borderColor: darkTheme.colors.gray }]}
                placeholder="Episode Title *"
                placeholderTextColor={darkTheme.colors.textLight}
                value={episodeTitle}
                onChangeText={setEpisodeTitle}
              />
              
              <TextInput
                style={[styles.input, styles.textArea, { color: darkTheme.colors.text, borderColor: darkTheme.colors.gray }]}
                placeholder="Description (Optional)"
                placeholderTextColor={darkTheme.colors.textLight}
                value={episodeDescription}
                onChangeText={setEpisodeDescription}
                multiline
                numberOfLines={3}
              />
              
              <TextInput
                style={[styles.input, { color: darkTheme.colors.text, borderColor: darkTheme.colors.gray }]}
                placeholder="Episode Number (Optional)"
                placeholderTextColor={darkTheme.colors.textLight}
                value={episodeNumber}
                onChangeText={setEpisodeNumber}
                keyboardType="numeric"
              />

              {/* Cover Image */}
              <TouchableOpacity
                style={[styles.coverImageButton, { borderColor: darkTheme.colors.gray }]}
                onPress={onPickCoverImage}
              >
                <Icon name="image" size={24} color={darkTheme.colors.primary} />
                <Text style={[styles.coverImageText, { color: darkTheme.colors.text }]}>
                  {coverImage ? 'Change Cover Image' : 'Add Cover Image (Optional)'}
                </Text>
              </TouchableOpacity>
              
              {coverImage && (
                <View style={styles.coverImagePreview}>
                  <Image
                    source={{ uri: isLocalFile(coverImage) ? coverImage.uri : getSupabaseFileUrl(coverImage)?.uri }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeCoverImage}
                    onPress={() => setCoverImage(null)}
                  >
                    <Icon name="close" size={20} color="#ff5555" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Regular Post Content */}
          {creationMethod === 'regular' && (
            <>
              <View style={{ backgroundColor: darkTheme.colors.cardBackground, borderRadius: darkTheme.radius.md, padding: 10 }}>
                <RichTextEditor 
                  editorRef={editorRef} 
                  onChange={handleEditorChange}
                  theme="dark"
                  textColor={darkTheme.colors.text}
                  backgroundColor={darkTheme.colors.cardBackground}
                  placeholder="What's on your mind?"
                />
              </View>

              {file && (
                <View style={[styles.file, { borderColor: darkTheme.colors.gray, backgroundColor: darkTheme.colors.cardBackground }]}>
                  {getFileType(file) === 'video' ? (
                    <Video
                      source={{ uri: getFileUri(file) }}
                      style={{ width: '100%', height: '122%' }}
                      resizeMode="cover"
                      borderRadius={7}
                      useNativeControls 
                      isLooping
                    />
                  ) : (
                    <Image
                      source={{ uri: getFileUri(file) }}
                      style={{ width: '100%', height: '122%' }}
                      resizeMode="cover"
                      borderRadius={6}
                    />
                  )}
                  <Pressable 
                    style={[styles.closeIcon]} 
                    onPress={() => setFile(null)}
                  >
                    <Icon name="delete" size={22} color="#ff5555" />
                  </Pressable>
                </View>
              )}

              <View style={[styles.media, { borderColor: darkTheme.colors.gray, backgroundColor: darkTheme.colors.cardBackground }]}>
                <Text style={[styles.addImageText, { color: darkTheme.colors.text }]}>Add Media</Text>
                <View style={styles.mediaIcons}>
                  <TouchableOpacity onPress={() => onPick(true)}>
                    <Icon name="image" size={30} color={darkTheme.colors.dark} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Section-Based Creation (for both PDF and Section-based methods) */}
          {(creationMethod === 'pdf' || creationMethod === 'section_based') && (
            <View style={styles.sectionsContainer}>
              <View style={styles.sectionsHeader}>
                <Text style={[styles.sectionTitle, { color: darkTheme.colors.text }]}>Sections</Text>
                <TouchableOpacity
                  style={[styles.addSectionButton, { backgroundColor: darkTheme.colors.primary }]}
                  onPress={addSection}
                >
                  <Icon name="plus" size={20} color="#fff" />
                  <Text style={styles.addSectionText}>Add Section</Text>
                </TouchableOpacity>
              </View>

              {sections.map((section, index) => (
                <View key={index} style={[styles.sectionCard, { backgroundColor: darkTheme.colors.cardBackground }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionNumber, { color: darkTheme.colors.text }]}>
                      Section {index + 1}
                    </Text>
                    {sections.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeSection(index)}
                        style={styles.removeSectionButton}
                      >
                        <Icon name="delete" size={20} color="#ff5555" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={[styles.sectionEditor, { backgroundColor: darkTheme.colors.input }]}>
                    <RichTextEditor
                      editorRef={(ref) => {
                        if (ref) sectionEditorRefs.current[index] = ref;
                      }}
                      onChange={(content) => handleSectionEditorChange(index, content)}
                      theme="dark"
                      textColor={darkTheme.colors.text}
                      backgroundColor={darkTheme.colors.input}
                      placeholder={`Section ${index + 1} content...`}
                    />
                  </View>

                  <View style={styles.sectionMediaButtons}>
                    {creationMethod === 'pdf' ? (
                      <TouchableOpacity
                        style={[styles.sectionMediaButton, { borderColor: darkTheme.colors.gray }]}
                        onPress={() => onPickPDF(index)}
                      >
                        <Icon name="file" size={20} color={darkTheme.colors.primary} />
                        <Text style={[styles.sectionMediaText, { color: darkTheme.colors.text }]}>
                          {section.pdf_file ? 'Change PDF' : 'Add PDF *'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.sectionMediaButton, { borderColor: darkTheme.colors.gray }]}
                          onPress={() => pickSectionMedia(index, true)}
                        >
                          <Icon name="image" size={20} color={darkTheme.colors.primary} />
                          <Text style={[styles.sectionMediaText, { color: darkTheme.colors.text }]}>
                            {section.image_file ? 'Change Image' : 'Add Image'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.sectionMediaButton, { borderColor: darkTheme.colors.gray }]}
                          onPress={() => pickSectionMedia(index, false)}
                        >
                          <Icon name="video" size={20} color={darkTheme.colors.primary} />
                          <Text style={[styles.sectionMediaText, { color: darkTheme.colors.text }]}>
                            {section.video_file ? 'Change Video' : 'Add Video'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {/* Section Media Preview */}
                  {(section.image_file || section.video_file || section.pdf_file) && (
                    <View style={styles.sectionMediaPreview}>
                      {section.pdf_file && (
                        <View style={styles.sectionMediaItem}>
                          <View style={[styles.pdfPreview, { backgroundColor: darkTheme.colors.input }]}>
                            <Icon name="file" size={48} color={darkTheme.colors.primary} />
                            <Text style={[styles.pdfFileName, { color: darkTheme.colors.text }]} numberOfLines={1}>
                              {section.pdf_file.name || 'PDF File'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeSectionMedia}
                            onPress={() => updateSection(index, 'pdf_file', null)}
                          >
                            <Icon name="close" size={16} color="#ff5555" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {section.image_file && (
                        <View style={styles.sectionMediaItem}>
                          <Image
                            source={{ uri: isLocalFile(section.image_file) ? section.image_file.uri : getSupabaseFileUrl(section.image_file)?.uri }}
                            style={styles.sectionMediaImage}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={styles.removeSectionMedia}
                            onPress={() => updateSection(index, 'image_file', null)}
                          >
                            <Icon name="close" size={16} color="#ff5555" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {section.video_file && (
                        <View style={styles.sectionMediaItem}>
                          <Video
                            source={{ uri: isLocalFile(section.video_file) ? section.video_file.uri : getSupabaseFileUrl(section.video_file)?.uri }}
                            style={styles.sectionMediaVideo}
                            resizeMode="cover"
                            useNativeControls
                          />
                          <TouchableOpacity
                            style={styles.removeSectionMedia}
                            onPress={() => updateSection(index, 'video_file', null)}
                          >
                            <Icon name="close" size={16} color="#ff5555" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Tags Section */}
          <View style={[styles.tagsSection, { backgroundColor: darkTheme.colors.cardBackground, borderRadius: darkTheme.radius.md, padding: 16 }]}>
            <Text style={[styles.tagsSectionTitle, { color: darkTheme.colors.text }]}>Add Tags</Text>
            
            <View style={styles.tagBubblesContainer}>
              {predefinedTags.map((tag, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.tagBubble,
                    tags.includes(tag) && styles.selectedTagBubble,
                    { borderColor: darkTheme.colors.primary }
                  ]}
                  onPress={() => addPredefinedTag(tag)}
                >
                  <Text style={[
                    styles.tagBubbleText,
                    tags.includes(tag) && styles.selectedTagBubbleText,
                    { color: tags.includes(tag) ? darkTheme.colors.text : darkTheme.colors.primary }
                  ]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={[styles.tagInputContainer, { borderColor: darkTheme.colors.gray, backgroundColor: darkTheme.colors.input }]}>
              <TextInput
                style={[styles.tagInput, { color: darkTheme.colors.text }]}
                value={currentTag}
                onChangeText={setCurrentTag}
                placeholder="Enter tag..."
                placeholderTextColor={darkTheme.colors.textLight}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity 
                style={styles.addTagButton}
                onPress={addTag}
                disabled={currentTag.trim() === ''}
              >
                <Icon name="plus" size={24} color={darkTheme.colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View 
                  key={index} 
                  style={[styles.tagPill, { 
                    borderColor: darkTheme.colors.border, 
                    backgroundColor: darkTheme.colors.secondary 
                  }]}
                >
                  <Text style={[styles.tagPillText, { color: darkTheme.colors.primary }]}>#{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)}>
                    <Icon name="close" size={16} color={darkTheme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <Button
          buttonStyle={{ 
            height: hp(6.2), 
            backgroundColor: darkTheme.colors.primary 
          }}
          textStyle={{ 
            color: darkTheme.colors.text 
          }}
          title={post?.id ? "Update" : creationMethod === 'regular' ? "Post" : creationMethod === 'pdf' ? "Create PDF Episode" : "Create Episode"}
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
  },
  methodSelector: {
    padding: 16,
    borderRadius: theme.radius.md,
    gap: 12,
  },
  methodTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  methodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  methodButtonText: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
  },
  episodeMetadata: {
    padding: 16,
    borderRadius: theme.radius.md,
    gap: 12,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: hp(1.8),
    backgroundColor: theme.colors.input,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coverImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    backgroundColor: theme.colors.input,
  },
  coverImageText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
  },
  coverImagePreview: {
    position: 'relative',
    width: '100%',
    height: hp(20),
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  removeCoverImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 6,
  },
  pdfSection: {
    padding: 16,
    borderRadius: theme.radius.md,
    gap: 12,
  },
  pdfUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: theme.radius.md,
    padding: 20,
    backgroundColor: theme.colors.input,
  },
  pdfUploadText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
  },
  pdfPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.input,
    position: 'relative',
  },
  pdfFileName: {
    flex: 1,
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
  },
  removePdf: {
    padding: 4,
  },
  sectionsContainer: {
    gap: 16,
  },
  sectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  addSectionText: {
    color: '#fff',
    fontSize: hp(1.6),
    fontWeight: theme.fonts.semibold,
  },
  sectionCard: {
    padding: 16,
    borderRadius: theme.radius.md,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionNumber: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
  },
  removeSectionButton: {
    padding: 4,
  },
  sectionEditor: {
    borderRadius: theme.radius.md,
    padding: 8,
    minHeight: 100,
  },
  sectionMediaButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionMediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    backgroundColor: theme.colors.input,
  },
  sectionMediaText: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
  },
  sectionMediaPreview: {
    gap: 8,
  },
  sectionMediaItem: {
    position: 'relative',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  sectionMediaImage: {
    width: '100%',
    height: hp(20),
  },
  sectionMediaVideo: {
    width: '100%',
    height: hp(20),
  },
  removeSectionMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 4,
  },
  file: {
    height: hp(32),
    width: '100%',
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 12,
    padding: 6,
    borderRadius: 50,
  },
  media: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    borderWidth: 1, 
    padding: 12, 
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
  },
  addImageText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  mediaIcons: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    marginLeft: 10
  },
  tagsSection: {
    marginVertical: hp(1),
  },
  tagsSectionTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    marginBottom: hp(1),
  },
  tagBubblesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, 
    marginBottom: hp(1.5),
  },
  tagBubble: {
    paddingHorizontal: 10, 
    paddingVertical: 6,  
    borderRadius: 16,      
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  selectedTagBubble: {
    backgroundColor: theme.colors.primary,
  },
  tagBubbleText: {
    fontSize: hp(1.3),   
    fontWeight: '500',
  },
  selectedTagBubbleText: {
    color: 'white',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  tagInput: {
    flex: 1,
    padding: hp(1.5),
    fontSize: hp(1.8),
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
    gap: 5,
  },
  tagPillText: {
    fontSize: hp(1.4),
    fontWeight: '600',
  },
});
