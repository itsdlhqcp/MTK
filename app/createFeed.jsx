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
import { createOrUpdatePost } from '../services/postService'
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../contexts/ToastContext'

const CreateFeed = () => {

  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState(['official']);  
  const [currentTag, setCurrentTag] = useState('');
  const { showToast } = useToast();
  
  // Predefined tags for the bubble selector
  const predefinedTags = [ 'official', 'rumour','anime','kdrama'];
  
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

  const isLocalFile = file=>{
    if(!file) return null;
    if(typeof file === 'object') return true;
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
    if(!file) return null;
    if(isLocalFile(file)){
      return file.uri;
    }
    return getSupabaseFileUrl(file)?.uri;
  }

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

  const onSubmit = async () => {
    // Implement your submit logic here
  
    if(!bodyRef.current && !file) {
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
    }

    // when condition is updating post - include the post id to it
    if(post && post.id){
      data.id = post.id;
    }

    // create Post
    setLoading(true);
    let res = await createOrUpdatePost(data);
    setLoading(false);
    if(res.success){
      showToast('success', 'Spotlight updated success!!');
      setFile(null); 
      bodyRef.current = ''; 
      editorRef.current?.setContentHTML('');
      setTags([]); 
      router.back();
    }else{
      Alert.alert('Post', res.msg);
    }
    console.log('post res:', res);
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  return (
    <ScreenWrapper bg="white">
      <Header title={post?.id ? "Edit Feed" : "Create Feed"}
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

          {file && (
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
              ) : (
                <Image
                  source={{ uri: getFileUri(file) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={6}
                  onError={(error) => console.log('Image loading error:', error)}
                />
              )}
              <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                <Icon name="delete" size={22} color={"red"} />
              </Pressable>
            </View>
          )}

          {/* Tag Management Section */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Add Tags</Text>
            
            {/* Tag bubble selector - NEW COMPONENT */}
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

          <View style={styles.media}>
            <Text style={styles.addImageText}>Add new feed</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPick(false)}>
                <Icon name="video" size={37} color={theme.colors.dark} />
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
    fontWeight: theme.fonts.semibold,
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
    borderRadius: theme.radius.xl,
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
  // Tag management styles
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
  // New styles for tag bubbles
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
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  selectedTagBubble: {
    backgroundColor: theme.colors.primary,
  },
  tagBubbleText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.primary,
  },
  selectedTagBubbleText: {
    color: 'white',
  }
})