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
import * as ImagePicker from 'expo-image-picker';
import { extractYouTubeID, getYouTubeThumbnail } from '../helpers/youtubeHelper';
import * as Clipboard from 'expo-clipboard';

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

  useEffect(() => {
    if(post && post.id){
      bodyRef.current = post.body; 
      setFile(post.file || null);
      
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
      
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      },300)
    }
  }, [post])

  const onPick = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ['images']
          : ['videos'],
        allowsEditing: false,
        quality: 0.7,
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
          return file.type || 'image'; // Provide a default type
        }
        // For YouTube links
        if (isYouTubeLink(file)) {
          return 'youtube';
        }
        // For remote files
        return file.includes('postImage') ? 'image' : 'video';
      };
      
      const getFileUri = file => {
        if (!file) return null;
        if (isLocalFile(file)) {
          return file.uri;
        }
        // For YouTube links, return the thumbnail
        if (isYouTubeLink(file)) {
          return getYouTubeThumbnail(extractYouTubeID(file));
        }
        return getSupabaseFileUrl(file)?.uri;
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
    
      const removeTag = (index) => {
        const newTags = [...tags];
        newTags.splice(index, 1);
        setTags(newTags);
      };

const onSubmit = async () => {
  try {
    if (!bodyRef.current && !file && !youtubeLink) {
      Alert.alert(
        "Error",
        "Please write something in the post or add media.",
        [{ text: "OK" }]
      );
      return;
    }

    let data = {
      body: bodyRef.current,
      userId: user?.id,
      tags: JSON.stringify(tags),
    };
    
    // Handle file and youtubeLink
    if (file) {
      data.file = file;
      data.youtubeLink = null; // Clear YouTube link if file is present
    } else if (youtubeLink) {
      data.file = null; // We'll set the file in the service
      data.youtubeLink = youtubeLink;
    } else {
      data.file = null;
      data.youtubeLink = null;
    }

    // When updating an existing post - include the post id
    if (post && post.id) {
      data.id = post.id;
    }

    console.log("Sending data:", data);
    
    // Create/update post
    setLoading(true);
    let res = await createOrUpdatePost(data);
    setLoading(false);
    
    console.log('Post response:', res);
    
    if (res.success) {
      setFile(null); 
      bodyRef.current = ''; 
      editorRef.current?.setContentHTML('');
      setTags([]);
      setYoutubeLink(''); 
      router.back();
    } else {
      Alert.alert('Post Error', res.msg || 'Unknown error occurred', [
        { text: 'OK' }
      ]);
    }
  } catch (error) {
    setLoading(false);
    console.error('Exception in onSubmit:', error);
    Alert.alert('Error', 'An unexpected error occurred while submitting your post.');
  }
};

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };


  // Add this validation function
const validateYoutubeLink = (link) => {
  const videoId = extractYouTubeID(link);
  return !!videoId;
};

// Add this function to handle YouTube link input
const addYoutubeLink = async () => {
  try {
    // Get clipboard content
    const clipboardContent = await Clipboard.getStringAsync();
    
    if (clipboardContent && validateYoutubeLink(clipboardContent)) {
      // Clear any existing file
      setFile(null);
      // Set the YouTube link
      setYoutubeLink(clipboardContent);
    } else {
      // Show input dialog only if clipboard doesn't have a valid YouTube link
      Alert.prompt(
        "Add YouTube Link",
        "Paste a YouTube video link",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Add",
            onPress: (inputText) => {
              if (!inputText || !validateYoutubeLink(inputText)) {
                Alert.alert("Invalid Link", "Please enter a valid YouTube URL");
                return;
              }
              
              // Clear any existing file
              setFile(null);
              // Set the YouTube link
              setYoutubeLink(inputText);
            }
          }
        ],
        "plain-text",
        clipboardContent // Pre-fill with clipboard if it contains text
      );
    }
  } catch (error) {
    console.error('Error accessing clipboard:', error);
    Alert.alert("Error", "Could not access clipboard");
  }
};

useEffect(() => {
  if (post && post.id) {
    bodyRef.current = post.body; 
    
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
    
    setTimeout(() => {
      editorRef?.current?.setContentHTML(post.body);
    }, 300);
  }
}, [post]);

  return (
    <ScreenWrapper bg="white">
      <Header title={post?.id ? "Edit Twist" : "Create Twist"}
         showBackButton={true} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: 20 }}>
          <View style={styles.header}>
            <Avatar
              uri={user?.image}
              size={hp(6.5)}
              rounded={theme.radius.xl}
            />
            <View style={{ gap: 2 }}>
              <Text style={styles.username}>
                {user?.name}
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

{file ? (
  <View style={styles.file}>
    {getFileType(file) === 'video' ? (
      <Video
        source={{ uri: getFileUri(file) }}
        style={{ width: '100%', height: '122%' }}
        resizeMode="cover"
        borderRadius={7}
        onError={(error) => console.log('Video loading error:', error)}
        useNativeControls 
        positionMillis
        isLooping
        audioPan
      />
    ) : getFileType(file) === 'youtube' ? (
      // YouTube Preview
      <View style={styles.youtubePreview}>
        <Image
          source={{ uri: getYouTubeThumbnail(extractYouTubeID(file)) }}
          style={{ width: '100%', height: '122%' }}
          resizeMode="cover"
          borderRadius={6}
        />
        <View style={styles.youtubeOverlay}>
          <Icon name="video" size={30} color="#fff" />
          <Text style={styles.youtubeText}>YouTube</Text>
        </View>
      </View>
    ) : (
      <Image
        source={{ uri: getFileUri(file) }}
        style={{ width: '100%', height: '122%' }}
        resizeMode="cover"
        borderRadius={6}
        onError={(error) => console.log('Image loading error:', error)}
      />
    )}
    <Pressable 
      style={styles.closeIcon} 
      onPress={() => {
        setFile(null);
        setYoutubeLink('');
      }}
    >
      <Icon name="delete" size={22} color={"red"} />
    </Pressable>
  </View>
) : youtubeLink ? (
  // YouTube Preview from youtubeLink state
  <View style={styles.file}>
    <View style={styles.youtubePreview}>
      <Image
        source={{ uri: getYouTubeThumbnail(extractYouTubeID(youtubeLink)) }}
        style={{ width: '100%', height: '122%' }}
        resizeMode="cover"
        borderRadius={6}
      />
      <View style={styles.youtubeOverlay}>
        <Icon name="video" size={30} color="#fff" />
        <Text style={styles.youtubeText}>YouTube</Text>
      </View>
    </View>
    <Pressable 
      style={styles.closeIcon} 
      onPress={() => {
        setFile(null);
        setYoutubeLink('');
      }}
    >
      <Icon name="delete" size={22} color={"red"} />
    </Pressable>
  </View>
) : null}


            {/* Tag Management Section */}
            <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Add Tags</Text>
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
                <Icon name="send" size={24} color={theme.colors.primary} />
                {/* <Text style={styles.addButtonText}>Add</Text> */}
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
                    <Icon name="send" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

      <View style={styles.media}>
        <Text style={styles.addImageText}>Add new feed</Text>
        <View style={styles.mediaIcons}>
          <TouchableOpacity onPress={() => onPick(true)}>
            <Icon name="image" size={30} color={theme.colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onPick(false)}>
            <Icon name="video" size={37} color={theme.colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={addYoutubeLink}>
            <Icon name="youtube" size={37} color={theme.colors.dark} />
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
  file: {
    height: hp(32),
    width: '100%',
    overflow: 'hidden',
    borderCurve: 'continuous',
    paddingVertical: wp(8),
    // Add these properties to make it visible
    borderWidth: 1,
    borderColor: theme.colors.gray,
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
    borderColor: theme.colors.gray
  },
  title: {
    // marginBottom: 10,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center'
    },
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    },
    username: {
    fontSize: hp(2.2),
    fontWeight: theme. fonts. semibold,
    color: theme.colors.text,
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
      color: theme.colors.text,
    },
    avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme. radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
    },
    publicText: {
      fontSize: hp(1.7),
      fontWeight: theme.fonts.medium,
      color: theme.colors.textLight,
      },
      closeIcon: {
        position: 'absolute',
        top: 16,
        right: 12,
        padding: 6,
        borderRadius: 50,
        backgroundColor: 'rgba(97, 35, 35, 0.14)'
      },
      // New styles for tag management
      tagsSection: {
        marginVertical: hp(1),
      },
      tagsSectionTitle: {
        fontSize: hp(2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        marginBottom: hp(1),
      },
      tagInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
      },
      tagInput: {
        flex: 1,
        padding: hp(1.5),
        fontSize: hp(1.8),
        color: theme.colors.text,
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
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.secondary,
        gap: 5,
      },
      tagPillText: {
        fontSize: hp(1.4),
        fontWeight: '600',
        color: theme.colors.primary,
      },
      addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
      },
      youtubePreview: {
        width: '100%',
        height: '122%',
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden'
      },
      youtubeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
      },
      youtubeText: {
        color: '#fff',
        fontSize: hp(1.8),
        fontWeight: 'bold',
      }
})