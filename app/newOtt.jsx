import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Pressable } from 'react-native'
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
import * as ImagePicker from 'expo-image-picker';
import DatePicker from '../components/DatePicker'
import RatingInput from '../components/RatingInput'
import UserRatingImpact from '../components/userRatingImpact'
import { createOrUpdateOtt } from '../services/ottService'
import TagInput from '../components/OttTagInput'

const NewOtt = () => {

  const post = useLocalSearchParams();
  const { user } = useAuth();
  const bodyRef = useRef(''); 
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [file, setFile] = useState(null);
  const [filel, setFilel] = useState(null); // Added second file state
  const [rating, setRating] = useState(null);
  const [userRatingImpact, setUserRatingImpact] = useState(0);
  const [tags, setTags] = useState([]);
  
  // Available OTT platforms
  const ottPlatforms = [
    'netflix', 'prime', 'disney', 'hbo', 'hulu', 'amc', 'zee5', 'sonyliv', 
    'paramountplus', 'appletvplus', 'hotstar', 'voot', 'aha', 'sunnxt', 
    'appletv', 'paramountx', 'peacocktv'
  ];

  const handleDateSelect = (date) => {
    console.log('Selected date:', date);
    setSelectedDate(date); // This will now properly store the date
  };

  useEffect(() => {
    if(post && post.id){
      bodyRef.current = post.body; 
      setFile(post.file || null);
      setFilel(post.filel || null); // Added to handle existing second image
      setTags(post.tags || []);
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      },300)
    }
  }, [post])


  // use zoom function for image picker here
  const onPick = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        editable: 'true',
        aspect: [4, 3],
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

  // Added second image picker function
  const onPickSecond = async (isImage) => {
    try {
      let mediaConfig = {
        mediaTypes: isImage 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
        aspect: [4, 3],
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
        
        setFilel({
          uri: asset.uri,
          type: fileType,
          name: asset.uri.split('/').pop()
        });
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick second media file');
    }
  };

  const isLocalFile = file => {
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

  const handleRatingChange = (value) => {
    console.log('Rating changed:', value);
    setRating(value);
  };

  const handleuserRatingImpactChange = (value) => {
    console.log('Impact Rating changed:', value);
    setUserRatingImpact(value);
  };

  // Function to add a platform tag
  const addPlatformTag = (platform) => {
    if (!tags.includes(platform)) {
      setTags([...tags, platform]);
    }
  };

  const onSubmit = async () => {
    if (!selectedDate && !file && filel && !bodyRef.current && !tags.length && !rating) {
      Alert.alert('Error', 'Enter Title, post img and release date');
      return;
    }
    if (!rating) {
      Alert.alert('Error', 'Please enter Rating of release');
      return;
    }

    let data = {
      file, 
      filel, // Added second file to submission data
      body: bodyRef.current,
      userId: user?.id,
      rDate: selectedDate,
      defRating: rating,
      userRatImpact: userRatingImpact,
      tags: tags
    }

    // CREATING A NEW RELEASE 
    setLoading(true);
    let res = await createOrUpdateOtt(data);
    setLoading(false);
    if(res.success){
      setFile(null);
      setFilel(null); // Clear second file on success
      bodyRef.current = ''; 
      editorRef.current?.setContentHTML('');
      setTags([]);
      Alert.alert('Stream uploaded successfully');
      router.push('/upcoming');
    }else{
      Alert.alert('Release', res.msg);
    }
  };

  const handleEditorChange = (body) => {
    bodyRef.current = body;
  };

  return (
    <ScreenWrapper bg="white">
      <Header title={post?.id ? "Edit Ott Stream" : "Create Ott Stream"}
         showBackButton={true} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: 20 }}  showsVerticalScrollIndicator={false}>
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
          
        <View>
          <RichTextEditor 
            editorRef={editorRef} 
            onChange={handleEditorChange}
            initialHeight={136}
            placeholder="Enter Film Title here @author ## write film name in a line ## please don't use any text alignment for this session and use default text font size ==>> like film name = Interstellar"  />
        </View>

          {file && (
            <View style={styles.file}>
              {getFileType(file) === 'video' ? (
                 <Text>Video not allowed</Text>
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

          <View style={styles.media}>
            <Text style={styles.addImageText}>Stick Digital Tile Post HERE</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Added second image preview */}
          {filel && (
            <View style={styles.file}>
              {getFileType(filel) === 'video' ? (
                <Text>Error: video not allowed</Text>
              ) : (
                <Image
                  source={{ uri: getFileUri(filel) }}
                  style={{ width: '100%', height: '122%' }}
                  resizeMode="cover"
                  borderRadius={6}
                  onError={(error) => console.log('Image loading error:', error)}
                />
              )}
              <Pressable style={styles.closeIcon} onPress={() => setFilel(null)}>
                <Icon name="delete" size={22} color={"red"} />
              </Pressable>
            </View>
          )}

          {/* Added second image picker */}
          <View style={styles.media}>
            <Text style={styles.addImageText}>Add Digital list poster image</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPickSecond(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>

          <View>
          <DatePicker 
            // onDateSelect={handleDateSelect}
            onDateSelect={(date) => handleDateSelect(date)}
            initialDate={selectedDate}
          />
          </View>

          {/* Platform Pills Section */}
          <View style={styles.platformsContainer}>
            <Text style={styles.platformsTitle}>Available Platforms</Text>
            <View style={styles.platformsScrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.platformPills}>
                  {ottPlatforms.map((platform, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        styles.platformPill,
                        tags.includes(platform) && styles.platformPillSelected
                      ]}
                      onPress={() => addPlatformTag(platform)}
                    >
                      <Text 
                        style={[
                          styles.platformPillText,
                          tags.includes(platform) && styles.platformPillTextSelected
                        ]}
                      >
                        {platform}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          
          <TagInput tags={tags} setTags={setTags} />

          <RatingInput
            onRatingChange={handleRatingChange}
            initialValue={post?.rating}
          />

         <UserRatingImpact
            onRatingChange={handleuserRatingImpactChange}
            initialValue={post?.rating}
          />

        </ScrollView>
        <Button
          buttonStyle={{ height: hp(6.2) }}
          title={post?.id ? "Edit" : "Post New Release"}
          loading={loading}
          onPress={onSubmit}
          hasShadow={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default NewOtt;

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
    backgroundColor: 'rgba(97, 35, 35, 0.14)',
  },
  label: {
    fontSize: hp(2),
    fontWeight: hp(4.5),
    paddingStart: 10,
    color: theme.colors.text,
    paddingBottom: 5
  },
  dateInput: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    marginTop: 10,
  },
  // New styles for platform pills
  platformsContainer: {
    marginVertical: 5
  },
  platformsTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginBottom: 10
  },
  platformsScrollContainer: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    padding: 10,
    borderCurve: 'continuous',
  },
  platformPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 5,
  },
  platformPill: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  platformPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  platformPillText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  platformPillTextSelected: {
    color: '#ffffff',
  },
})